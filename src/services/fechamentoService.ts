import { supabase } from './supabaseClient';
import { valeService } from './valeService';

export interface FechamentoMotorista {
  id?: number;
  fechamento_id?: number; // ID do fechamento original (usado na tabela de histórico)
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
  arquivado_em?: string; // Timestamp de arquivamento (usado na tabela de histórico)
  arquivado_por?: string; // Usuário que arquivou (usado na tabela de histórico)
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
    pecuarista?: string;
    caminhao?: {
      placa: string;
      tipo: string;
    };
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

    // Buscar fretes através da tabela frete_motorista
    const { data: fretes, error: fretesError } = await supabase
      .from('frete_motorista')
      .select(`
        frete:fretes(
          id, data_emissao, origem, destino, valor_frete, total_km, pecuarista,
          caminhao:caminhoes(placa, tipo)
        )
      `)
      .eq('motorista_id', data.motorista_id);

    if (fretesError) throw fretesError;

    // Filtrar fretes por período no código JavaScript
    const fretesFiltrados = (fretes || []).filter(freteRelacao => {
      const frete = freteRelacao.frete;
      if (!frete) return false;
      
      const dataEmissao = (frete as any).data_emissao;
      return dataEmissao >= inicioMes && dataEmissao <= fimMes;
    });

    // Ordenar por data de emissão
    fretesFiltrados.sort((a, b) => {
      const dataA = (a.frete as any)?.data_emissao || '';
      const dataB = (b.frete as any)?.data_emissao || '';
      return dataA.localeCompare(dataB);
    });

    // Calcular comissão por frete usando porcentagem personalizada
    const porcentagemComissao = this.calcularPorcentagemComissao(data.motorista);
    const fretesComComissao = [];
    
    for (const freteRelacao of fretesFiltrados) {
      const frete = freteRelacao.frete;
      if (!frete) continue;
      
      // Verificar se o motorista está neste frete
      const { data: motoristasFrete, error: motoristasError } = await supabase
        .from('frete_motorista')
        .select('motorista_id')
        .eq('frete_id', (frete as any).id);
      
      let valorIndividual = 0;
      
      if (motoristasError) {
        console.warn(`Erro ao buscar motoristas do frete ${(frete as any).id}:`, motoristasError);
        valorIndividual = parseFloat((frete as any).valor_frete) || 0;
      } else {
        const motoristaEstaNoFrete = motoristasFrete?.some(m => m.motorista_id === data.motorista_id);
        
        if (motoristaEstaNoFrete) {
          // Dividir igualmente entre os motoristas
          const totalMotoristas = motoristasFrete?.length || 1;
          valorIndividual = (parseFloat((frete as any).valor_frete) || 0) / totalMotoristas;
          console.log(`[DEBUG PDF] Frete ${(frete as any).id}: ${totalMotoristas} motoristas, valor individual R$ ${valorIndividual}`);
        } else {
          console.warn(`[DEBUG PDF] Motorista ${data.motorista_id} não está no frete ${(frete as any).id}`);
          valorIndividual = 0;
        }
      }
      
      fretesComComissao.push({
        ...frete,
        valor_individual_motorista: valorIndividual,
        valor_comissao: valorIndividual * porcentagemComissao
      });
    }

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
      .select(`
        id,
        valor_frete,
        data_emissao,
        origem,
        destino,
        pecuarista,
        frete_motorista!inner(motorista_id)
      `)
      .eq('frete_motorista.motorista_id', motoristaId)
      .gte('data_emissao', inicioMes)
      .lte('data_emissao', fimMes);

    if (fretesError) {
      throw new Error(`Erro ao buscar fretes: ${fretesError.message}`);
    }

    // Buscar total de vales do período
    console.log(`[DEBUG] Buscando vales para motorista ${motoristaId} no período ${periodo}`);
    const totalVales = await valeService.getTotalByMotoristaAndPeriodo(motoristaId, periodo);
    console.log(`[DEBUG] Total de vales encontrados: R$ ${totalVales}`);

    // Para motoristas terceiros, buscar abastecimentos também
    let totalAbastecimentos = 0;
    if (motorista.tipo_motorista === 'Terceiro') {
      try {
        const [mes, ano] = periodo.split('/');
        const inicioMes = `${ano}-${mes.padStart(2, '0')}-01`;
        const ultimoDiaMes = new Date(parseInt(ano), parseInt(mes), 0).getDate();
        const fimMes = `${ano}-${mes.padStart(2, '0')}-${ultimoDiaMes.toString().padStart(2, '0')}`;

        console.log(`[DEBUG ABASTECIMENTOS] Buscando abastecimentos para motorista ${motoristaId} de ${inicioMes} a ${fimMes}`);

        const { data: abastecimentos, error: abastecimentosError } = await supabase
          .from('abastecimentos')
          .select('preco_total, data_abastecimento, posto_tanque')
          .eq('motorista_id', motoristaId)
          .gte('data_abastecimento', inicioMes)
          .lte('data_abastecimento', fimMes);

        if (!abastecimentosError && abastecimentos) {
          console.log(`[DEBUG ABASTECIMENTOS] Abastecimentos encontrados:`, abastecimentos);
          totalAbastecimentos = abastecimentos.reduce((sum, abast) => sum + (parseFloat(abast.preco_total) || 0), 0);
          console.log(`[DEBUG ABASTECIMENTOS] Total calculado: R$ ${totalAbastecimentos}`);
        } else {
          console.log(`[DEBUG ABASTECIMENTOS] Nenhum abastecimento encontrado ou erro:`, abastecimentosError);
        }
      } catch (error) {
        console.warn(`[DEBUG] Erro ao buscar abastecimentos:`, error);
      }
    }

    // Calcular valores individuais por motorista
    let valorBruto = 0;
    const totalFretes = fretes?.length || 0;

    for (const frete of fretes || []) {
      const freteId = (frete as any).id;
      console.log(`[DEBUG DETALHADO] Processando frete ID: ${freteId}, valor total: R$ ${frete.valor_frete}`);

      const { data: motoristasFrete, error: motoristasError } = await supabase
        .from('frete_motorista')
        .select('motorista_id')
        .eq('frete_id', freteId);

      if (motoristasError) {
        console.warn(`Erro ao buscar motoristas do frete ${freteId}:`, motoristasError);
        continue;
      }

      const totalMotoristas = motoristasFrete?.length || 1;
      const valorIndividual = (parseFloat(frete.valor_frete) || 0) / totalMotoristas;

      console.log(`[DEBUG DETALHADO] Frete ${freteId}: Valor total R$ ${frete.valor_frete}, ${totalMotoristas} motoristas, valor individual R$ ${valorIndividual}`);
      console.log(`[DEBUG DETALHADO] Motoristas encontrados:`, motoristasFrete);

      valorBruto += valorIndividual;
    }
    console.log(`[DEBUG FINAL] Valor bruto total calculado para ${motorista.nome}: R$ ${valorBruto}`);
    
    // Usar porcentagem personalizada ou padrão
    const porcentagemComissao = this.calcularPorcentagemComissao(motorista);
    const valorComissao = valorBruto * porcentagemComissao;
    
    // Calcular descontos e valor líquido diferenciado por tipo
    let descontos: number;
    let valorLiquido: number;
    const bonus = 0; // Bônus inicia como 0, pode ser editado depois
    
    if (motorista.tipo_motorista === 'Terceiro') {
      // Para terceiros: descontos = apenas abastecimentos, vales são linha separada
      descontos = totalAbastecimentos;
      valorLiquido = valorComissao - totalAbastecimentos - totalVales + bonus;
      
      // DEBUG MATEMÁTICO DETALHADO
      console.log(`[MATH DEBUG] === VERIFICAÇÃO MATEMÁTICA ===`);
      console.log(`[MATH DEBUG] Valor bruto: ${valorBruto}`);
      console.log(`[MATH DEBUG] Porcentagem: ${(porcentagemComissao * 100).toFixed(0)}%`);
      console.log(`[MATH DEBUG] Comissão calculada: ${valorBruto} * ${porcentagemComissao} = ${valorComissao}`);
      console.log(`[MATH DEBUG] Abastecimentos: ${totalAbastecimentos}`);
      console.log(`[MATH DEBUG] Vales: ${totalVales}`);
      console.log(`[MATH DEBUG] Bônus: ${bonus}`);
      console.log(`[MATH DEBUG] Fórmula: ${valorComissao} - ${totalAbastecimentos} - ${totalVales} + ${bonus}`);
      console.log(`[MATH DEBUG] Resultado: ${valorLiquido}`);
      console.log(`[MATH DEBUG] Conferência manual: ${valorComissao - totalAbastecimentos - totalVales + bonus}`);
    } else {
      // Para funcionários: descontos = vales (como antes)
      descontos = totalVales;
      valorLiquido = valorComissao - totalVales + bonus;
    }

    console.log(`[DEBUG] === RESUMO DO FECHAMENTO PARA ${motorista.nome} ===`);
    console.log(`  Tipo: ${motorista.tipo_motorista}`);
    console.log(`  Período: ${periodo}`);
    console.log(`  Total de fretes: ${totalFretes}`);
    console.log(`  Valor bruto: R$ ${valorBruto}`);
    console.log(`  Comissão (${(porcentagemComissao * 100).toFixed(0)}%): R$ ${valorComissao}`);
    console.log(`  ----------------------------------------`);
    if (motorista.tipo_motorista === 'Terceiro') {
      console.log(`  DESCONTOS (campo fechamento.descontos):`);
      console.log(`    Apenas abastecimentos: R$ ${totalAbastecimentos}`);
      console.log(`  VALES (separado, não incluído em descontos):`);
      console.log(`    Total de vales: R$ ${totalVales}`);
      console.log(`  CÁLCULO VALOR LÍQUIDO:`);
      console.log(`    R$ ${valorComissao} - R$ ${totalAbastecimentos} - R$ ${totalVales} + R$ ${bonus} = R$ ${valorLiquido}`);
    } else {
      console.log(`  DESCONTOS (campo fechamento.descontos):`);
      console.log(`    Vales/Adiantamentos: R$ ${totalVales}`);
      console.log(`  CÁLCULO VALOR LÍQUIDO:`);
      console.log(`    R$ ${valorComissao} - R$ ${totalVales} + R$ ${bonus} = R$ ${valorLiquido}`);
    }
    console.log(`  ----------------------------------------`);
    console.log(`  VALOR LÍQUIDO FINAL: R$ ${valorLiquido}`);

    // Sempre usar a data atual real
    const dataAtual = new Date();
    const dataFechamentoAtual = `${dataAtual.getFullYear()}-${(dataAtual.getMonth() + 1).toString().padStart(2, '0')}-${dataAtual.getDate().toString().padStart(2, '0')}`;
    console.log(`[FECHAMENTO DEBUG] Data do fechamento criado: ${dataFechamentoAtual}`);
    
    return {
      motorista_id: motoristaId,
      periodo,
      data_fechamento: dataFechamentoAtual, // Data atual real em formato YYYY-MM-DD
      total_fretes: totalFretes,
      valor_bruto: valorBruto,
      valor_comissao: valorComissao,
      descontos: descontos,
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
          .select(`
            id,
            valor_frete,
            data_emissao,
            origem,
            destino,
            pecuarista,
            frete_motorista!inner(motorista_id)
          `)
          .eq('frete_motorista.motorista_id', motorista.id)
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
            .from('vales_motoristas')
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

        // Calcular valores individuais por motorista
        let valorBruto = 0;
        const totalFretes = fretes.length;

        for (const frete of fretes) {
          const freteId = (frete as any).id;
          console.log(`[DEBUG PERIODO] Processando frete ID: ${freteId}, valor total: R$ ${frete.valor_frete}`);

          const { data: motoristasFrete, error: motoristasError } = await supabase
            .from('frete_motorista')
            .select('motorista_id')
            .eq('frete_id', freteId);

          if (motoristasError) {
            console.warn(`Erro ao buscar motoristas do frete ${freteId}:`, motoristasError);
            continue;
          }

          const totalMotoristas = motoristasFrete?.length || 1;
          const valorIndividual = (parseFloat(frete.valor_frete) || 0) / totalMotoristas;

          console.log(`[DEBUG PERIODO] Frete ${freteId}: Valor total R$ ${frete.valor_frete}, ${totalMotoristas} motoristas, valor individual R$ ${valorIndividual}`);

          valorBruto += valorIndividual;
        }
        console.log(`[DEBUG PERIODO] Valor bruto total calculado para ${motorista.nome}: R$ ${valorBruto}`);
        
        // Usar porcentagem personalizada ou padrão
        const porcentagemComissao = this.calcularPorcentagemComissao(motorista);
        const valorComissao = valorBruto * porcentagemComissao;
        
        // Valor líquido = comissão - vales (sem bônus inicial)
        const valorLiquido = valorComissao - totalVales;

        // Usar data atual para fechamentos de período customizado
        const dataAtualCustomizado = new Date();
        const dataFechamentoCustomizado = `${dataAtualCustomizado.getFullYear()}-${(dataAtualCustomizado.getMonth() + 1).toString().padStart(2, '0')}-${dataAtualCustomizado.getDate().toString().padStart(2, '0')}`;

        fechamentos.push({
          motorista_id: motorista.id,
          periodo: `${dataInicio} a ${dataFim}`, // Formato especial para período customizado
          data_fechamento: dataFechamentoCustomizado, // Data atual real
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

  // Novo método para buscar histórico completo de um motorista específico
  async getHistoricoCompleto(motoristaId: number): Promise<FechamentoMotorista[]> {
    const { data, error } = await supabase
      .from('fechamentos_motoristas')
      .select(`
        *,
        motorista:motoristas(id, nome, tipo_motorista, porcentagem_comissao)
      `)
      .eq('motorista_id', motoristaId)
      .order('data_fechamento', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Novo método para buscar histórico detalhado de um motorista (para relatório consolidado)
  async getHistoricoDetalhado(motoristaId: number, dataInicio?: string, dataFim?: string): Promise<FechamentoDetalhado | null> {
    // Buscar motorista
    const { data: motorista, error: motoristaError } = await supabase
      .from('motoristas')
      .select('id, nome, tipo_motorista, porcentagem_comissao')
      .eq('id', motoristaId)
      .single();

    if (motoristaError) throw motoristaError;

    // Buscar fretes do motorista (com filtro de data opcional)
    let fretesQuery = supabase
      .from('fretes')
      .select(`
        id, data_emissao, origem, destino, valor_frete, total_km, pecuarista,
        caminhao:caminhoes(placa, tipo)
      `)
      .eq('motorista_id', motoristaId);
    
    // Aplicar filtros de data se fornecidos
    if (dataInicio) {
      fretesQuery = fretesQuery.gte('data_emissao', dataInicio);
    }
    if (dataFim) {
      fretesQuery = fretesQuery.lte('data_emissao', dataFim);
    }
    
    const { data: fretes, error: fretesError } = await fretesQuery.order('data_emissao', { ascending: true });

    if (fretesError) throw fretesError;

    // Calcular comissão por frete usando porcentagem personalizada
    const porcentagemComissao = this.calcularPorcentagemComissao(motorista);
    const fretesComComissao = fretes?.map(frete => {
      const caminhaoInfo = Array.isArray(frete.caminhao) ? frete.caminhao[0] : frete.caminhao;
      return {
        id: frete.id,
        data_emissao: frete.data_emissao,
        origem: frete.origem,
        destino: frete.destino,
        valor_frete: frete.valor_frete,
        valor_comissao: frete.valor_frete * porcentagemComissao,
        total_km: frete.total_km,
        pecuarista: frete.pecuarista, // Campo cliente estava faltando!
        caminhao: caminhaoInfo ? {
          placa: caminhaoInfo.placa,
          tipo: caminhaoInfo.tipo
        } : undefined
      };
    }) || [];

    // Buscar abastecimentos se for motorista terceiro (com filtro de data opcional)
    let abastecimentos: any[] = [];
    if (motorista?.tipo_motorista === 'Terceiro') {
      let abastecimentosQuery = supabase
        .from('abastecimentos')
        .select('id, data_abastecimento, posto_tanque, combustivel, quantidade_litros, preco_total')
        .eq('motorista_id', motoristaId);
      
      // Aplicar filtros de data se fornecidos
      if (dataInicio) {
        abastecimentosQuery = abastecimentosQuery.gte('data_abastecimento', dataInicio);
      }
      if (dataFim) {
        abastecimentosQuery = abastecimentosQuery.lte('data_abastecimento', dataFim);
      }
      
      const { data: abastecimentosData, error: abastecimentosError } = await abastecimentosQuery.order('data_abastecimento', { ascending: true });

      if (abastecimentosError) {
        console.warn('Erro ao buscar abastecimentos:', abastecimentosError);
      } else {
        abastecimentos = abastecimentosData || [];
      }
    }

    // Calcular valores consolidados
    const totalFretes = fretes?.length || 0;
    const valorBruto = fretes?.reduce((sum, f) => sum + (parseFloat(f.valor_frete) || 0), 0) || 0;
    const valorComissao = valorBruto * porcentagemComissao;

    // Buscar total de vales (com filtro de data opcional)
    let totalVales = 0;
    try {
      let valesQuery = supabase
        .from('vales_motoristas')
        .select('valor')
        .eq('motorista_id', motoristaId);
      
      // Aplicar filtros de data se fornecidos
      if (dataInicio) {
        valesQuery = valesQuery.gte('data_vale', dataInicio);
      }
      if (dataFim) {
        valesQuery = valesQuery.lte('data_vale', dataFim);
      }
      
      const { data: vales, error: valesError } = await valesQuery;

      if (valesError) {
        console.warn('Erro ao buscar vales:', valesError);
      } else {
        totalVales = vales?.reduce((sum, vale) => sum + (parseFloat(vale.valor) || 0), 0) || 0;
      }
    } catch (error) {
      console.warn('Erro ao processar vales:', error);
    }

    // Calcular total de abastecimentos para terceiros (para campo descontos)
    let totalAbastecimentos = 0;
    if (motorista?.tipo_motorista === 'Terceiro' && abastecimentos.length > 0) {
      totalAbastecimentos = abastecimentos.reduce((sum, abast) => sum + (parseFloat(abast.preco_total) || 0), 0);
      console.log(`[DEBUG] Total de abastecimentos calculado: R$ ${totalAbastecimentos}`);
    }

    // Buscar total de bônus históricos
    const fechamentosHistoricos = await this.getHistoricoCompleto(motoristaId);
    const totalBonus = fechamentosHistoricos.reduce((sum, f) => sum + (f.bonus || 0), 0);

    const valorLiquido = valorComissao - totalVales + totalBonus;

    // Data atual
    const dataAtual = new Date();
    const dataFechamento = `${dataAtual.getFullYear()}-${(dataAtual.getMonth() + 1).toString().padStart(2, '0')}-${dataAtual.getDate().toString().padStart(2, '0')}`;

    // Determinar período e status baseado nos filtros
    const periodo = (dataInicio && dataFim) 
      ? `${dataInicio} a ${dataFim}` 
      : 'Histórico Completo';
    
    const status = (dataInicio && dataFim) 
      ? 'Período Específico' 
      : 'Consolidado';

    // Definir descontos corretos baseado no tipo de motorista
    let descontos: number;
    if (motorista?.tipo_motorista === 'Terceiro') {
      // Para terceiros: descontos = abastecimentos
      descontos = totalAbastecimentos;
    } else {
      // Para funcionários: descontos = vales
      descontos = totalVales;
    }

    console.log(`[DEBUG] === VALORES FINAIS ===`);
    console.log(`[DEBUG] Motorista: ${motorista?.nome} (${motorista?.tipo_motorista})`);
    console.log(`[DEBUG] Período: ${periodo}`);
    console.log(`[DEBUG] Total Vales: R$ ${totalVales}`);
    console.log(`[DEBUG] Total Abastecimentos: R$ ${totalAbastecimentos}`);
    console.log(`[DEBUG] Descontos (campo): R$ ${descontos}`);
    console.log(`[DEBUG] Porcentagem Comissão: ${porcentagemComissao * 100}%`);

    return {
      id: 0, // ID fictício para histórico consolidado
      motorista_id: motoristaId,
      periodo,
      data_fechamento: dataFechamento,
      total_fretes: totalFretes,
      valor_bruto: valorBruto,
      valor_comissao: valorComissao,
      descontos,
      bonus: totalBonus,
      valor_liquido: valorLiquido,
      status,
      motorista,
      fretes: fretesComComissao,
      abastecimentos: abastecimentos.length > 0 ? abastecimentos : undefined
    };
  }

  // Buscar fechamentos arquivados com filtros (agora da tabela de histórico)
  async getArquivados(filtros: {
    dataInicio?: string;
    dataFim?: string;
    motorista?: string;
    tipoMotorista?: string;
    periodo?: string;
    buscarTexto?: string;
  }): Promise<FechamentoMotorista[]> {
    let query = supabase
      .from('fechamentos_motoristas_historico')
      .select(`
        *,
        motorista:motoristas(id, nome, tipo_motorista, porcentagem_comissao)
      `);

    // Aplicar filtros
    if (filtros.dataInicio) {
      query = query.gte('data_fechamento', filtros.dataInicio);
    }
    if (filtros.dataFim) {
      query = query.lte('data_fechamento', filtros.dataFim);
    }
    if (filtros.motorista) {
      query = query.eq('motorista_id', parseInt(filtros.motorista));
    }
    if (filtros.periodo) {
      query = query.eq('periodo', filtros.periodo);
    }
    if (filtros.buscarTexto) {
      query = query.or(`observacoes.ilike.%${filtros.buscarTexto}%`);
    }

    const { data, error } = await query.order('data_fechamento', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  // Arquivar um fechamento (mover para tabela de histórico)
  async arquivar(id: number): Promise<void> {
    // Buscar o fechamento original
    const { data: fechamento, error: fetchError } = await supabase
      .from('fechamentos_motoristas')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    // Criar objeto para histórico sem o campo id original
    const { id: originalId, ...fechamentoParaHistorico } = fechamento;
    
    // Inserir na tabela de histórico
    const { error: insertError } = await supabase
      .from('fechamentos_motoristas_historico')
      .insert([{
        ...fechamentoParaHistorico,
        fechamento_id: originalId,
        arquivado_em: new Date().toISOString()
      }]);

    if (insertError) {
      throw new Error(insertError.message);
    }

    // Remover da tabela original
    const { error: deleteError } = await supabase
      .from('fechamentos_motoristas')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }

  // Reabrir um fechamento arquivado (mover de volta para tabela ativa)
  async reabrir(fechamentoId: number): Promise<void> {
    // Buscar o fechamento no histórico
    const { data: fechamentoHistorico, error: fetchError } = await supabase
      .from('fechamentos_motoristas_historico')
      .select('*')
      .eq('fechamento_id', fechamentoId)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    // Remover campos específicos do histórico que não existem na tabela ativa
    const { 
      id: historicoId, 
      fechamento_id, 
      arquivado_em, 
      arquivado_por, 
      ...fechamentoParaAtiva 
    } = fechamentoHistorico;

    // Inserir de volta na tabela ativa com o ID original
    const { error: insertError } = await supabase
      .from('fechamentos_motoristas')
      .insert([{
        ...fechamentoParaAtiva,
        id: fechamento_id // Usar o ID original do fechamento
      }]);

    if (insertError) {
      throw new Error(insertError.message);
    }

    // Remover do histórico
    const { error: deleteError } = await supabase
      .from('fechamentos_motoristas_historico')
      .delete()
      .eq('fechamento_id', fechamentoId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }
}

export const fechamentoService = new FechamentoService(); 