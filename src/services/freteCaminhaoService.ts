import { supabase } from './supabaseClient';

export interface FreteCaminhao {
  id?: number;
  frete_id: number;
  caminhao_id: number;
}

export const freteCaminhaoService = {
  // Buscar todos os caminhões de um frete
  async getByFreteId(frete_id: number): Promise<FreteCaminhao[]> {
    const { data, error } = await supabase
      .from('frete_caminhao')
      .select('*')
      .eq('frete_id', frete_id)
      .order('id', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Inserir um novo vínculo
  async create(freteCaminhao: Omit<FreteCaminhao, 'id'>): Promise<FreteCaminhao> {
    const { data, error } = await supabase
      .from('frete_caminhao')
      .insert([freteCaminhao])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // Deletar vínculo por id
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('frete_caminhao')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Deletar todos os vínculos de um frete
  async deleteByFreteId(frete_id: number): Promise<void> {
    const { error } = await supabase
      .from('frete_caminhao')
      .delete()
      .eq('frete_id', frete_id);
    if (error) throw new Error(error.message);
  }
}; 