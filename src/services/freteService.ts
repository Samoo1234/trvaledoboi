import { supabase } from './supabaseClient';

export interface Frete {
  id?: number;
  frete_id?: number; // ID do frete original (usado na tabela de histórico)
  data_emissao: string;
  pecuarista: string;
  origem: string;
  destino: string;
  numero_minuta?: string;
  numero_cb?: string;
  cliente?: string;
  observacoes?: string;
  faixa?: string;
  total_km?: number;
  valor_frete: number;
  situacao: string;
  tipo_pagamento?: string | null;
  data_pagamento?: string | null;
  created_at?: string;
  updated_at?: string;
  arquivado?: boolean; // Indica se o frete está arquivado
  arquivado_em?: string; // Timestamp de arquivamento
  arquivado_por?: string; // Usuário que arquivou
  // Dados relacionados (joins)
  caminhao?: {
    placa: string;
    tipo: string;
  };
  motorista?: {
    nome: string;
  };
  // Dados de configuração do caminhão no frete
  configuracao?: string;

}

export const freteService = {
  // Buscar todos os fretes com dados relacionados (apenas ativos, não arquivados)
  async getAll(): Promise<Frete[]> {
    const { data, error } = await supabase
      .from('fretes')
      .select(`
        *,
        frete_caminhao(
          caminhao_id,
          configuracao,
          reboque_id,
          caminhoes(placa, tipo)
        )
      `)
      .or('arquivado.is.null,arquivado.eq.false') // Buscar apenas não arquivados
      .order('data_emissao', { ascending: false }); // Mais recentes primeiro
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Processar os dados para incluir informações de caminhão
    const fretesProcessados = data?.map(frete => {
      const caminhaoInfo = frete.frete_caminhao?.[0]?.caminhoes;
      const configuracao = frete.frete_caminhao?.[0]?.configuracao;
      return {
        ...frete,
        caminhao: caminhaoInfo ? {
          placa: caminhaoInfo.placa,
          tipo: caminhaoInfo.tipo
        } : undefined,
        configuracao: configuracao
      };
    }) || [];
    
    return fretesProcessados;
  },

  // Buscar frete por ID
  async getById(id: number): Promise<Frete | null> {
    const { data, error } = await supabase
      .from('fretes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Criar um novo frete
  async create(frete: Omit<Frete, 'id' | 'created_at' | 'updated_at'>): Promise<Frete> {
    const { data, error } = await supabase
      .from('fretes')
      .insert([frete])
      .select('*')
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Atualizar um frete
  async update(id: number, frete: Partial<Frete>): Promise<Frete> {
    const { data, error } = await supabase
      .from('fretes')
      .update(frete)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Deletar um frete
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('fretes')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // Buscar fretes por situação
  async getBySituacao(situacao: string): Promise<Frete[]> {
    const { data, error } = await supabase
      .from('fretes')
      .select('*')
      .eq('situacao', situacao)
      .order('data_emissao', { ascending: true });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  },

  // Buscar fretes por período
  async getByPeriodo(dataInicio: string, dataFim: string): Promise<Frete[]> {
    const { data, error } = await supabase
      .from('fretes')
      .select('*')
      .gte('data_emissao', dataInicio)
      .lte('data_emissao', dataFim)
      .order('data_emissao', { ascending: true });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  },

  // Buscar fretes por motorista
  async getByMotorista(motoristaId: number): Promise<Frete[]> {
    const { data, error } = await supabase
      .from('fretes')
      .select(`
        *,
        frete_motorista!inner(motorista_id)
      `)
      .eq('frete_motorista.motorista_id', motoristaId)
      .order('data_emissao', { ascending: true });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  },

  // Calcular totais por situação
  async getTotaisPorSituacao(): Promise<{[key: string]: {quantidade: number, valor: number}}> {
    const { data, error } = await supabase
      .from('fretes')
      .select('situacao, valor_frete');
    
    if (error) {
      throw new Error(error.message);
    }
    
    const totais: {[key: string]: {quantidade: number, valor: number}} = {};
    
    data?.forEach(frete => {
      if (!totais[frete.situacao]) {
        totais[frete.situacao] = { quantidade: 0, valor: 0 };
      }
      totais[frete.situacao].quantidade++;
      totais[frete.situacao].valor += frete.valor_frete || 0;
    });
    
    return totais;
  },

  // Buscar fretes arquivados com filtros (agora da tabela de histórico)
  async getArquivados(filtros: {
    dataInicio?: string;
    dataFim?: string;
    motorista?: string;
    cliente?: string;
    tipoPagamento?: string;
    buscarTexto?: string;
  }): Promise<Frete[]> {
    let query = supabase
      .from('fretes')
      .select('*')
      .eq('arquivado', true); // Buscar apenas fretes arquivados

    // Aplicar filtros
    if (filtros.dataInicio) {
      query = query.gte('data_emissao', filtros.dataInicio);
    }
    if (filtros.dataFim) {
      query = query.lte('data_emissao', filtros.dataFim);
    }
    if (filtros.motorista) {
      query = query.eq('motorista_id', parseInt(filtros.motorista));
    }
    if (filtros.cliente) {
      query = query.eq('cliente', filtros.cliente);
    }
    if (filtros.tipoPagamento) {
      query = query.eq('tipo_pagamento', filtros.tipoPagamento);
    }
    if (filtros.buscarTexto) {
      query = query.or(`numero_minuta.ilike.%${filtros.buscarTexto}%,numero_cb.ilike.%${filtros.buscarTexto}%,origem.ilike.%${filtros.buscarTexto}%,destino.ilike.%${filtros.buscarTexto}%`);
    }

    const { data, error } = await query.order('arquivado_em', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  // Arquivar um frete (marcar como arquivado, NÃO deletar)
  async arquivar(id: number): Promise<void> {
    const { error } = await supabase
      .from('fretes')
      .update({
        arquivado: true,
        arquivado_em: new Date().toISOString(),
        arquivado_por: null // Pode adicionar lógica de usuário aqui
      })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  // Reabrir um frete arquivado (desmarcar como arquivado)
  async reabrir(freteId: number): Promise<void> {
    const { error } = await supabase
      .from('fretes')
      .update({
        arquivado: false,
        arquivado_em: null,
        arquivado_por: null
      })
      .eq('id', freteId);

    if (error) {
      throw new Error(error.message);
    }
  }
}; 