import { supabase } from './supabaseClient';

export interface Caminhao {
  id?: number;
  placa: string;
  modelo: string;
  tipo: string;
  ano: number;
  cor: string;
  combustivel: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export const caminhaoService = {
  // Buscar todos os caminhões
  async getAll(): Promise<Caminhao[]> {
    const { data, error } = await supabase
      .from('caminhoes')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  },

  // Criar um novo caminhão
  async create(caminhao: Omit<Caminhao, 'id' | 'created_at' | 'updated_at'>): Promise<Caminhao> {
    const { data, error } = await supabase
      .from('caminhoes')
      .insert([caminhao])
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Atualizar um caminhão
  async update(id: number, caminhao: Partial<Caminhao>): Promise<Caminhao> {
    const { data, error } = await supabase
      .from('caminhoes')
      .update(caminhao)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Deletar um caminhão
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('caminhoes')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
  }
}; 