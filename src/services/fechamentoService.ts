import { supabase } from './supabaseClient';
import { valeService } from './valeService';

export interface FechamentoMotorista {
  id?: number;
  motorista_id: number;
  periodo: string; // MM/YYYY
  data_fechamento?: string;
  total_fretes: number;
  valor_bruto: number;
  valor_comissao: number; // 90% para terceiros, 10% para funcionários
  descontos: number;
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
      .select('id, data_emissao, origem, destino, valor_frete')
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

    return {
      ...data,
      fretes: fretesComComissao
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
    const totalVales = await valeService.getTotalByMotoristaAndPeriodo(motoristaId, periodo);

    // Calcular valores
    const totalFretes = fretes?.length || 0;
    const valorBruto = fretes?.reduce((sum, f) => sum + (parseFloat(f.valor_frete) || 0), 0) || 0;
    
    // Usar porcentagem personalizada ou padrão
    const porcentagemComissao = this.calcularPorcentagemComissao(motorista);
    const valorComissao = valorBruto * porcentagemComissao;
    
    // Calcular valor líquido (comissão - vales)
    const valorLiquido = valorComissao - totalVales;

    return {
      motorista_id: motoristaId,
      periodo,
      data_fechamento: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
      total_fretes: totalFretes,
      valor_bruto: valorBruto,
      valor_comissao: valorComissao,
      descontos: totalVales,
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
        updated_at: new Date().toISOString()
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
}

export const fechamentoService = new FechamentoService(); 