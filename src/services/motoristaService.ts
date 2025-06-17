import { supabase } from './supabaseClient';

export interface Motorista {
  id?: number;
  nome: string;
  cpf: string;
  rg: string;
  cnh: string;
  categoria_cnh: string;
  vencimento_cnh: string;
  telefone: string;
  email?: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  data_nascimento: string;
  tipo_motorista: string;
  status: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export const motoristaService = {
  // Buscar todos os motoristas
  async getAll(): Promise<Motorista[]> {
    const { data, error } = await supabase
      .from('motoristas')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  },

  // Buscar motorista por ID
  async getById(id: number): Promise<Motorista | null> {
    const { data, error } = await supabase
      .from('motoristas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Criar um novo motorista
  async create(motorista: Omit<Motorista, 'id' | 'created_at' | 'updated_at'>): Promise<Motorista> {
    const { data, error } = await supabase
      .from('motoristas')
      .insert([motorista])
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Atualizar um motorista
  async update(id: number, motorista: Partial<Motorista>): Promise<Motorista> {
    const { data, error } = await supabase
      .from('motoristas')
      .update(motorista)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Deletar um motorista
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('motoristas')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // Buscar motoristas por tipo (Funcionário/Terceiro)
  async getByTipo(tipo: string): Promise<Motorista[]> {
    const { data, error } = await supabase
      .from('motoristas')
      .select('*')
      .eq('tipo_motorista', tipo)
      .eq('status', 'Ativo')
      .order('nome');
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  },

  // Verificar se CPF já existe
  async checkCpfExists(cpf: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('motoristas')
      .select('id')
      .eq('cpf', cpf);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(error.message);
    }
    
    return (data && data.length > 0);
  },

  // Verificar se CNH já existe
  async checkCnhExists(cnh: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('motoristas')
      .select('id')
      .eq('cnh', cnh);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(error.message);
    }
    
    return (data && data.length > 0);
  }
}; 