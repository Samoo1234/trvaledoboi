import { supabase } from './supabaseClient';

export interface Fornecedor {
  id?: number;
  nome: string;
  tipo: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export const fornecedorService = {
  // Buscar todos os fornecedores
  async getAll(): Promise<Fornecedor[]> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .order('nome');
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  },

  // Buscar fornecedor por ID
  async getById(id: number): Promise<Fornecedor | null> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Criar um novo fornecedor
  async create(fornecedor: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at'>): Promise<Fornecedor> {
    const { data, error } = await supabase
      .from('fornecedores')
      .insert([fornecedor])
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Atualizar um fornecedor
  async update(id: number, fornecedor: Partial<Fornecedor>): Promise<Fornecedor> {
    const { data, error } = await supabase
      .from('fornecedores')
      .update(fornecedor)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Deletar um fornecedor
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('fornecedores')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // Buscar fornecedores por tipo
  async getByTipo(tipo: string): Promise<Fornecedor[]> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('tipo', tipo)
      .eq('status', 'Ativo')
      .order('nome');
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  },

  // Buscar fornecedores ativos
  async getAtivos(): Promise<Fornecedor[]> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('status', 'Ativo')
      .order('nome');
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  }
}; 