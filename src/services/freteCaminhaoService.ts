import { supabase } from './supabaseClient';

export interface FreteCaminhao {
  id?: number;
  frete_id: number;
  caminhao_id: number;
  configuracao: 'Toco' | 'Truck' | 'Julieta' | 'Carreta Baixa' | 'Carreta 2 Pisos';
  reboque_id?: number | null;
  valor_frete?: number | null;
}

export const freteCaminhaoService = {
  // Buscar todos os vínculos de caminhão (com paginação automática)
  async getAll(): Promise<FreteCaminhao[]> {
    let allData: FreteCaminhao[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('frete_caminhao')
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