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
  saldo_receber?: number;
  situacao: string;
  tipo_pagamento?: string | null;
  data_pagamento?: string | null;
  created_at?: string;
  updated_at?: string;
  arquivado_em?: string; // Timestamp de arquivamento (usado na tabela de histórico)
  arquivado_por?: string; // Usuário que arquivou (usado na tabela de histórico)
  // Dados relacionados (joins)
  caminhao?: {
    placa: string;
    tipo: string;
  };
  motorista?: {
    nome: string;
  };
}

export const freteService = {
  // Buscar todos os fretes com dados relacionados (apenas ativos)
  async getAll(): Promise<Frete[]> {
    const { data, error } = await supabase
      .from('fretes')
      .select('*')
      .order('data_emissao', { ascending: true });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
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
      .select('*')
      .eq('motorista_id', motoristaId)
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
      .from('fretes_historico')
      .select('*');

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

    const { data, error } = await query.order('data_emissao', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  // Arquivar um frete (mover para tabela de histórico)
  async arquivar(id: number): Promise<void> {
    // Buscar o frete original
    const { data: frete, error: fetchError } = await supabase
      .from('fretes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    // Criar objeto para histórico sem o campo id original
    const { id: originalId, ...freteParaHistorico } = frete;
    
    // Inserir na tabela de histórico
    const { error: insertError } = await supabase
      .from('fretes_historico')
      .insert([{
        ...freteParaHistorico,
        frete_id: originalId,
        arquivado_em: new Date().toISOString()
      }]);

    if (insertError) {
      throw new Error(insertError.message);
    }

    // Remover da tabela original
    const { error: deleteError } = await supabase
      .from('fretes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  },

  // Reabrir um frete arquivado (mover de volta para tabela ativa)
  async reabrir(freteId: number): Promise<void> {
    // Buscar o frete no histórico
    const { data: freteHistorico, error: fetchError } = await supabase
      .from('fretes_historico')
      .select('*')
      .eq('frete_id', freteId)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    // Remover campos específicos do histórico que não existem na tabela ativa
    const { 
      id: historicoId, 
      frete_id, 
      arquivado_em, 
      arquivado_por, 
      ...freteParaAtiva 
    } = freteHistorico;

    // Inserir de volta na tabela ativa com o ID original
    const { error: insertError } = await supabase
      .from('fretes')
      .insert([{
        ...freteParaAtiva,
        id: frete_id // Usar o ID original do frete
      }]);

    if (insertError) {
      throw new Error(insertError.message);
    }

    // Remover do histórico
    const { error: deleteError } = await supabase
      .from('fretes_historico')
      .delete()
      .eq('frete_id', freteId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }
}; 