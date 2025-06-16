import { supabase } from './supabaseClient';

export interface AquisicaoCombustivel {
  id?: number;
  data_emissao: string;
  numero_nota?: string;
  fornecedor_id: number;
  combustivel: string;
  origem?: string;
  destino?: string;
  quantidade: number;
  preco_unitario: number;
  desconto?: number;
  subtotal: number;
  created_at?: string;
  updated_at?: string;
  // Dados relacionados (joins)
  fornecedor?: {
    nome: string;
    tipo: string;
  };
}

export const aquisicaoService = {
  // Buscar todas as aquisições com dados relacionados
  async getAll(): Promise<AquisicaoCombustivel[]> {
    const { data, error } = await supabase
      .from('aquisicoes_combustivel')
      .select(`
        *,
        fornecedor:fornecedores(nome, tipo)
      `)
      .order('data_emissao', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  },

  // Buscar aquisição por ID
  async getById(id: number): Promise<AquisicaoCombustivel | null> {
    const { data, error } = await supabase
      .from('aquisicoes_combustivel')
      .select(`
        *,
        fornecedor:fornecedores(nome, tipo)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Criar uma nova aquisição
  async create(aquisicao: Omit<AquisicaoCombustivel, 'id' | 'created_at' | 'updated_at'>): Promise<AquisicaoCombustivel> {
    const { data, error } = await supabase
      .from('aquisicoes_combustivel')
      .insert([aquisicao])
      .select(`
        *,
        fornecedor:fornecedores(nome, tipo)
      `)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Atualizar uma aquisição
  async update(id: number, aquisicao: Partial<AquisicaoCombustivel>): Promise<AquisicaoCombustivel> {
    const { data, error } = await supabase
      .from('aquisicoes_combustivel')
      .update(aquisicao)
      .eq('id', id)
      .select(`
        *,
        fornecedor:fornecedores(nome, tipo)
      `)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Deletar uma aquisição
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('aquisicoes_combustivel')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // Buscar aquisições por período
  async getByPeriodo(dataInicio: string, dataFim: string): Promise<AquisicaoCombustivel[]> {
    const { data, error } = await supabase
      .from('aquisicoes_combustivel')
      .select(`
        *,
        fornecedor:fornecedores(nome, tipo)
      `)
      .gte('data_emissao', dataInicio)
      .lte('data_emissao', dataFim)
      .order('data_emissao', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  },

  // Buscar aquisições por fornecedor
  async getByFornecedor(fornecedorId: number): Promise<AquisicaoCombustivel[]> {
    const { data, error } = await supabase
      .from('aquisicoes_combustivel')
      .select(`
        *,
        fornecedor:fornecedores(nome, tipo)
      `)
      .eq('fornecedor_id', fornecedorId)
      .order('data_emissao', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  },

  // Calcular totais por combustível
  async getTotaisPorCombustivel(): Promise<{[key: string]: {quantidade: number, valor: number}}> {
    const { data, error } = await supabase
      .from('aquisicoes_combustivel')
      .select('combustivel, quantidade, subtotal');
    
    if (error) {
      throw new Error(error.message);
    }
    
    const totais: {[key: string]: {quantidade: number, valor: number}} = {};
    
    data?.forEach(aquisicao => {
      if (!totais[aquisicao.combustivel]) {
        totais[aquisicao.combustivel] = { quantidade: 0, valor: 0 };
      }
      totais[aquisicao.combustivel].quantidade += aquisicao.quantidade || 0;
      totais[aquisicao.combustivel].valor += aquisicao.subtotal || 0;
    });
    
    return totais;
  }
}; 