import { supabase } from './supabaseClient';

export interface FreteMotorista {
  id?: number;
  frete_id: number;
  motorista_id: number;
  caminhao_id: number | null; // Adicionar campo caminhao_id
}

export const freteMotoristaService = {
  // Buscar todos os vínculos de motorista (com paginação automática)
  async getAll(): Promise<FreteMotorista[]> {
    let allData: FreteMotorista[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('frete_motorista')
        .select('*')
        .range(from, to);
      if (error) throw new Error(error.message);
      if (data && data.length > 0) {
        allData = allData.concat(data);
        if (data.length < pageSize) hasMore = false;
        else page++;
      } else {
        hasMore = false;
      }
    }
    return allData;
  },

  // Buscar todos os motoristas de um frete
  async getByFreteId(frete_id: number): Promise<FreteMotorista[]> {
    const { data, error } = await supabase
      .from('frete_motorista')
      .select('*')
      .eq('frete_id', frete_id)
      .order('id', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Inserir um novo vínculo
  async create(freteMotorista: Omit<FreteMotorista, 'id'>): Promise<FreteMotorista> {
    const { data, error } = await supabase
      .from('frete_motorista')
      .insert([freteMotorista])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // Deletar vínculo por id
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('frete_motorista')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Deletar todos os vínculos de um frete
  async deleteByFreteId(frete_id: number): Promise<void> {
    const { error } = await supabase
      .from('frete_motorista')
      .delete()
      .eq('frete_id', frete_id);
    if (error) throw new Error(error.message);
  }
}; 