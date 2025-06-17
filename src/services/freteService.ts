import { supabase } from './supabaseClient';

export interface Frete {
  id?: number;
  data_emissao: string;
  pecuarista: string;
  origem: string;
  destino: string;
  numero_minuta?: string;
  numero_cte?: string;
  cliente?: string;
  observacoes?: string;
  caminhao_id: number;
  motorista_id: number;
  faixa?: string;
  total_km?: number;
  valor_frete: number;
  saldo_receber?: number;
  situacao: string;
  tipo_pagamento?: string;
  data_pagamento?: string;
  created_at?: string;
  updated_at?: string;
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
  // Buscar todos os fretes com dados relacionados
  async getAll(): Promise<Frete[]> {
    const { data, error } = await supabase
      .from('fretes')
      .select(`
        *,
        caminhao:caminhoes(placa, tipo),
        motorista:motoristas(nome)
      `)
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
      .select(`
        *,
        caminhao:caminhoes(placa, tipo),
        motorista:motoristas(nome)
      `)
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
      .select(`
        *,
        caminhao:caminhoes(placa, tipo),
        motorista:motoristas(nome)
      `)
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
      .select(`
        *,
        caminhao:caminhoes(placa, tipo),
        motorista:motoristas(nome)
      `)
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
      .select(`
        *,
        caminhao:caminhoes(placa, tipo),
        motorista:motoristas(nome)
      `)
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
      .select(`
        *,
        caminhao:caminhoes(placa, tipo),
        motorista:motoristas(nome)
      `)
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
        caminhao:caminhoes(placa, tipo),
        motorista:motoristas(nome)
      `)
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
  }
}; 