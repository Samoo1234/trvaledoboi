import { supabase } from './supabaseClient';

export interface Reboque {
  id?: number;
  caminhao_id: number | null;
  placa: string;
  conjunto: string;
  created_at?: string;
}

export const reboqueService = {
  // Buscar todos os reboques
  async getAll(): Promise<Reboque[]> {
    const { data, error } = await supabase
      .from('reboque')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Buscar todos os reboques de um caminhão
  async getByCaminhaoId(caminhao_id: number | null): Promise<Reboque[]> {
    if (caminhao_id == null) return [];
    const { data, error } = await supabase
      .from('reboque')
      .select('*')
      .eq('caminhao_id', caminhao_id)
      .order('id', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Criar um novo reboque
  async create(reboque: Omit<Reboque, 'id' | 'created_at'>): Promise<Reboque> {
    const { data, error } = await supabase
      .from('reboque')
      .insert([reboque])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // Deletar um reboque
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('reboque')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
}; 