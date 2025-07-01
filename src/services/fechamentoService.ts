import { supabase } from './supabaseClient';
import { valeService } from './valeService';
import { getCurrentDate } from './dateUtils';

export interface FechamentoMotorista {
  id?: number;
  motorista_id: number;
  periodo: string; // MM/YYYY
  data_fechamento?: string;
  total_fretes: number;
  valor_bruto: number;
  valor_comissao: number; // 90% para terceiros, 10% para funcionários
  descontos: number;
  bonus: number;
  valor_liquido: number;
  status: string; // Pendente, Pago, Atrasado
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  // Dados relacionados
  motorista?: {
    id: number;
    nome: string;
    tipo_motorista: string;
    porcentagem_comissao?: number;
  };
}

export interface FechamentoDetalhado extends FechamentoMotorista {
  fretes: Array<{
    id: number;
    data_emissao: string;
    origem: string;
    destino: string;
    valor_frete: number;
    valor_comissao: number;
    total_km?: number;
  }>;
  abastecimentos?: Array<{
    id: number;
    data_abastecimento: string;
    posto_tanque: string;
    combustivel: string;
    quantidade_litros: number;
    preco_total: number;
  }>;
}

class FechamentoService {
  // Calcular porcentagem de comissão baseada no tipo e configuração personalizada
  private calcularPorcentagemComissao(motorista: any): number {
    // Se tem porcentagem personalizada, usar ela
    if (motorista.porcentagem_comissao && motorista.porcentagem_comissao > 0) {
      return motorista.porcentagem_comissao / 100; // Converter % para decimal
    }
    
    // Usar padrão baseado no tipo
    return motorista.tipo_motorista === 'Terceiro' ? 0.90 : 0.10;
  }
  async getAll(): Promise<FechamentoMotorista[]> {
    const { data, error } = await supabase
      .from('fechamentos_motoristas')
      .select(`
        *,
        motorista:motoristas(id, nome, tipo_motorista, porcentagem_comissao)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getByPeriodo(periodo: string): Promise<FechamentoMotorista[]> {
    const { data, error } = await supabase
      .from('fechamentos_motoristas')
      .select(`
        *,
        motorista:motoristas(id, nome, tipo_motorista, porcentagem_comissao)
      `)
      .eq('periodo', periodo)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Novo método para buscar por período customizado (data início e fim)
  async getByPeriodoCustomizado(dataInicio: string, dataFim: string): Promise<FechamentoMotorista[]> {
    const { data, error } = await supabase
      .from('fechamentos_motoristas')
      .select(`
        *,
        motorista:motoristas(id, nome, tipo_motorista, porcentagem_comissao)
      `)
      .gte('data_fechamento', dataInicio)
      .lte('data_fechamento', dataFim)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getById(id: number): Promise<FechamentoDetalhado | null> {
    const { data, error } = await supabase
      .from('fechamentos_motoristas')
      .select(`
        *,
        motorista:motoristas(id, nome, tipo_motorista, porcentagem_comissao)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Buscar fretes do período
    const [ano, mes] = data.periodo.split('/').reverse();
    const inicioMes = `${ano}-${mes.padStart(2, '0')}-01`;
    // Calcular último dia do mês corretamente
    const ultimoDiaMes = new Date(parseInt(ano), parseInt(mes), 0).getDate();
    const fimMes = `${ano}-${mes.padStart(2, '0')}-${ultimoDiaMes.toString().padStart(2, '0')}`;

    const { data: fretes, error: fretesError } = await supabase
      .from('fretes')
      .select('id, data_emissao, origem, destino, valor_frete, total_km')
      .eq('motorista_id', data.motorista_id)
      .gte('data_emissao', inicioMes)
      .lte('data_emissao', fimMes)
      .order('data_emissao', { ascending: true });

    if (fretesError) throw fretesError;

    // Calcular comissão por frete usando porcentagem personalizada
    const porcentagemComissao = this.calcularPorcentagemComissao(data.motorista);
    const fretesComComissao = fretes?.map(frete => ({
      ...frete,
      valor_comissao: frete.valor_frete * porcentagemComissao
    })) || [];

    // Buscar abastecimentos se for motorista terceiro
    let abastecimentos: any[] = [];
    if (data.motorista?.tipo_motorista === 'Terceiro') {
      const { data: abastecimentosData, error: abastecimentosError } = await supabase
        .from('abastecimentos')
        .select('id, data_abastecimento, posto_tanque, combustivel, quantidade_litros, preco_total')
        .eq('motorista_id', data.motorista_id)
        .gte('data_abastecimento', inicioMes)
        .lte('data_abastecimento', fimMes)
        .order('data_abastecimento', { ascending: true });

      if (abastecimentosError) {
        console.warn('Erro ao buscar abastecimentos:', abastecimentosError);
      } else {
        abastecimentos = abastecimentosData || [];
      }
    }

    return {
      ...data,
      fretes: fretesComComissao,
      abastecimentos: abastecimentos.length > 0 ? abastecimentos : undefined
    };
  }

  async calcularFechamento(motoristaId: number, periodo: string): Promise<FechamentoMotorista> {
    // Buscar motorista com porcentagem de comissão
    const { data: motorista, error: motoristaError } = await supabase
      .from('motoristas')
      .select('id, nome, tipo_motorista, status, porcentagem_comissao')
      .eq('id', motoristaId)
      .single();

    if (motoristaError) {
      throw new Error(`Motorista com ID ${motoristaId} não encontrado: ${motoristaError.message}`);
    }

    // Buscar fretes do período
    const [mes, ano] = periodo.split('/');
    const inicioMes = `${ano}-${mes.padStart(2, '0')}-01`;
    // Calcular último dia do mês corretamente
    const ultimoDiaMes = new Date(parseInt(ano), parseInt(mes), 0).getDate();
    const fimMes = `${ano}-${mes.padStart(2, '0')}-${ultimoDiaMes.toString().padStart(2, '0')}`;

    const { data: fretes, error: fretesError } = await supabase
      .from('fretes')
      .select('valor_frete, data_emissao, origem, destino')
      .eq('motorista_id', motoristaId)
      .gte('data_emissao', inicioMes)
      .lte('data_emissao', fimMes);

    if (fretesError) {
      throw new Error(`Erro ao buscar fretes: ${fretesError.message}`);
    }

    // Buscar total de vales do período
    console.log(`[DEBUG] Buscando vales para motorista ${motoristaId} no período ${periodo}`);
    const totalVales = await valeService.getTotalByMotoristaAndPeriodo(motoristaId, periodo);
    console.log(`[DEBUG] Total de vales encontrados: R$ ${totalVales}`);

    // Calcular valores
    const totalFretes = fretes?.length || 0;
    const valorBruto = fretes?.reduce((sum, f) => sum + (parseFloat(f.valor_frete) || 0), 0) || 0;
    
    // Usar porcentagem personalizada ou padrão
    const porcentagemComissao = this.calcularPorcentagemComissao(motorista);
    const valorComissao = valorBruto * porcentagemComissao;
    
    // Calcular valor líquido (comissão - vales + bonus)
    const bonus = 0; // Bônus inicia como 0, pode ser editado depois
    const valorLiquido = valorComissao - totalVales + bonus;

    console.log(`[DEBUG] Cálculo final para ${motorista.nome}:`);
    console.log(`  Valor bruto: R$ ${valorBruto}`);
    console.log(`  Comissão (${(porcentagemComissao * 100).toFixed(0)}%): R$ ${valorComissao}`);
    console.log(`  Descontos (vales): R$ ${totalVales}`);
    console.log(`  Bônus: R$ ${bonus}`);
    console.log(`  Valor líquido: R$ ${valorLiquido}`);

    return {
      motorista_id: motoristaId,
      periodo,
      data_fechamento: getCurrentDate(), // CORREÇÃO: Data sem problema de fuso horário
      total_fretes: totalFretes,
      valor_bruto: valorBruto,
      valor_comissao: valorComissao,
      descontos: totalVales,
      bonus: bonus,
      valor_liquido: valorLiquido,
      status: 'Pendente',
      observacoes: undefined,
      motorista
    };
  }

  async create(fechamento: Omit<FechamentoMotorista, 'id' | 'created_at' | 'updated_at'>): Promise<FechamentoMotorista> {
    console.log('[Service] Tentando criar fechamento no banco:', fechamento);
    
    // Remover campos que não devem ir para o banco
    const { motorista, ...fechamentoParaBanco } = fechamento;
    
    console.log('[Service] Dados limpos para inserir:', fechamentoParaBanco);
    
    const { data, error } = await supabase
      .from('fechamentos_motoristas')
      .insert([fechamentoParaBanco])
      .select(`
        *,
        motorista:motoristas(id, nome, tipo_motorista, porcentagem_comissao)
      `)
      .single();

    if (error) {
      console.error('[Service] ERRO AO INSERIR no banco:', error);
      console.error('[Service] Detalhes do erro:', error.details);
      console.error('[Service] Mensagem:', error.message);
      console.error('[Service] Código:', error.code);
      throw error;
    }
    
    console.log('[Service] Fechamento salvo com sucesso:', data);
    return data;
  }

  async update(id: number, fechamento: Partial<FechamentoMotorista>): Promise<FechamentoMotorista> {
    const { data, error } = await supabase
      .from('fechamentos_motoristas')
      .update({
        ...fechamento,
        updated_at: new Date().toISOString() // Usar timestamp completo ISO
      })
      .eq('id', id)
      .select(`
        *,
        motorista:motoristas(id, nome, tipo_motorista, porcentagem_comissao)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('fechamentos_motoristas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async calcularFechamentoCompleto(periodo: string): Promise<FechamentoMotorista[]> {
    // Buscar todos os motoristas ativos (terceiros e funcionários)
    // Incluir também motoristas sem status definido (considerá-los como ativos)
    const { data: motoristas, error: motoristasError } = await supabase
      .from('motoristas')
      .select('id, nome, tipo_motorista, status, porcentagem_comissao')
      .or('status.eq.Ativo,status.is.null');

    if (motoristasError) {
      throw new Error(`Erro ao buscar motoristas: ${motoristasError.message}`);
    }

    const fechamentos: FechamentoMotorista[] = [];

    for (const motorista of motoristas || []) {
      try {
        const fechamento = await this.calcularFechamento(motorista.id, periodo);
        
        if (fechamento.total_fretes > 0) {
          fechamentos.push(fechamento);
        }
      } catch (error) {
        // Continuar com os outros motoristas mesmo se um der erro
        console.error(`Erro ao calcular fechamento para ${motorista.nome}:`, error);
      }
    }

    return fechamentos;
  }

  // Método para calcular fechamento em tempo real por período customizado
  async calcularFechamentoPorPeriodo(dataInicio: string, dataFim: string): Promise<FechamentoMotorista[]> {
    // Buscar todos os motoristas ativos
    const { data: motoristas, error: motoristasError } = await supabase
      .from('motoristas')
      .select('id, nome, tipo_motorista, status, porcentagem_comissao')
      .or('status.eq.Ativo,status.is.null');

    if (motoristasError) {
      throw new Error(`Erro ao buscar motoristas: ${motoristasError.message}`);
    }

    const fechamentos: FechamentoMotorista[] = [];

    for (const motorista of motoristas || []) {
      try {
        // Buscar fretes do período customizado
        const { data: fretes, error: fretesError } = await supabase
          .from('fretes')
          .select('valor_frete, data_emissao, origem, destino')
          .eq('motorista_id', motorista.id)
          .gte('data_emissao', dataInicio)
          .lte('data_emissao', dataFim);

        if (fretesError) {
          console.error(`Erro ao buscar fretes para ${motorista.nome}:`, fretesError);
          continue;
        }

        if (!fretes || fretes.length === 0) continue;

        // Buscar vales do período (usando service de vales por data)
        let totalVales = 0;
        try {
          const { data: vales, error: valesError } = await supabase
            .from('vales')
            .select('valor')
            .eq('motorista_id', motorista.id)
            .gte('data_vale', dataInicio)
            .lte('data_vale', dataFim);

          if (valesError) {
            console.warn(`Erro ao buscar vales para ${motorista.nome}:`, valesError);
          } else {
            totalVales = vales?.reduce((sum, vale) => sum + (parseFloat(vale.valor) || 0), 0) || 0;
          }
        } catch (error) {
          console.warn(`Erro ao processar vales para ${motorista.nome}:`, error);
        }

        // Calcular valores
        const totalFretes = fretes.length;
        const valorBruto = fretes.reduce((sum, f) => sum + (parseFloat(f.valor_frete) || 0), 0);
        
        // Usar porcentagem personalizada ou padrão
        const porcentagemComissao = this.calcularPorcentagemComissao(motorista);
        const valorComissao = valorBruto * porcentagemComissao;
        
        // Valor líquido = comissão - vales (sem bônus inicial)
        const valorLiquido = valorComissao - totalVales;

        fechamentos.push({
          motorista_id: motorista.id,
          periodo: `${dataInicio} a ${dataFim}`, // Formato especial para período customizado
          data_fechamento: dataFim,
          total_fretes: totalFretes,
          valor_bruto: valorBruto,
          valor_comissao: valorComissao,
          descontos: totalVales,
          bonus: 0, // Inicia zerado
          valor_liquido: valorLiquido,
          status: 'Calculado', // Status especial para indicar que é cálculo em tempo real
          motorista
        });

      } catch (error) {
        console.error(`Erro ao calcular fechamento para ${motorista.nome}:`, error);
      }
    }

    return fechamentos;
  }
}

export const fechamentoService = new FechamentoService(); 