import { supabase } from './supabaseClient';

export interface Abastecimento {
  id?: number;
  data_abastecimento: string;
  mes?: string;
  combustivel: string;
  quantidade_litros: number;
  posto_tanque?: string;
  caminhao_id: number;
  motorista_id: number;
  km_rodado?: number;
  numero_ticket?: string;
  preco_por_litro?: number; // Preço unitário (R$/L)
  preco_total?: number; // Preço total calculado
  created_at?: string;
  updated_at?: string;
  tanque_cheio?: boolean;
  // Dados relacionados (joins)
  caminhao?: {
    placa: string;
    tipo: string;
    modelo: string;
  };
  motorista?: {
    nome: string;
    tipo_motorista: string;
  };
}

export interface ConsumoRelatorio {
  equipamento: string;
  prefixo: string;
  qnt_abastecimentos: number;
  qnt_litros: number;
  km_inicial?: number;
  km_final?: number;
  km_rodado: number;
  consumo_medio: number; // KM/L
}

export const abastecimentoService = {
  // Buscar todos os abastecimentos com dados relacionados
  async getAll(): Promise<Abastecimento[]> {
    const { data, error } = await supabase
      .from('abastecimentos')
      .select(`
        *,
        caminhao:caminhoes(placa, tipo, modelo),
        motorista:motoristas(nome, tipo_motorista)
      `)
      .order('data_abastecimento', { ascending: true });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  },

  // Buscar abastecimento por ID
  async getById(id: number): Promise<Abastecimento | null> {
    const { data, error } = await supabase
      .from('abastecimentos')
      .select(`
        *,
        caminhao:caminhoes(placa, tipo, modelo),
        motorista:motoristas(nome, tipo_motorista)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Criar um novo abastecimento
  async create(abastecimento: Omit<Abastecimento, 'id' | 'created_at' | 'updated_at'>): Promise<Abastecimento> {
    const { data, error } = await supabase
      .from('abastecimentos')
      .insert([abastecimento])
      .select(`
        *,
        caminhao:caminhoes(placa, tipo, modelo),
        motorista:motoristas(nome, tipo_motorista)
      `)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Atualizar um abastecimento
  async update(id: number, abastecimento: Partial<Abastecimento>): Promise<Abastecimento> {
    const { data, error } = await supabase
      .from('abastecimentos')
      .update(abastecimento)
      .eq('id', id)
      .select(`
        *,
        caminhao:caminhoes(placa, tipo, modelo),
        motorista:motoristas(nome, tipo_motorista)
      `)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Deletar um abastecimento
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('abastecimentos')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // Buscar abastecimentos por período
  async getByPeriodo(dataInicio: string, dataFim: string): Promise<Abastecimento[]> {
    const { data, error } = await supabase
      .from('abastecimentos')
      .select(`
        *,
        caminhao:caminhoes(placa, tipo, modelo),
        motorista:motoristas(nome, tipo_motorista)
      `)
      .gte('data_abastecimento', dataInicio)
      .lte('data_abastecimento', dataFim)
      .order('data_abastecimento', { ascending: true });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  },

  // Buscar abastecimentos por caminhão
  async getByCaminhao(caminhaoId: number): Promise<Abastecimento[]> {
    const { data, error } = await supabase
      .from('abastecimentos')
      .select(`
        *,
        caminhao:caminhoes(placa, tipo, modelo),
        motorista:motoristas(nome, tipo_motorista)
      `)
      .eq('caminhao_id', caminhaoId)
      .order('data_abastecimento', { ascending: true });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  },

  // Buscar abastecimentos por motorista
  async getByMotorista(motoristaId: number): Promise<Abastecimento[]> {
    const { data, error } = await supabase
      .from('abastecimentos')
      .select(`
        *,
        caminhao:caminhoes(placa, tipo, modelo),
        motorista:motoristas(nome, tipo_motorista)
      `)
      .eq('motorista_id', motoristaId)
      .order('data_abastecimento', { ascending: true });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  },

  // Gerar relatório de consumo por equipamento
  async getRelatorioConsumo(dataInicio?: string, dataFim?: string): Promise<ConsumoRelatorio[]> {
    let query = supabase
      .from('abastecimentos')
      .select(`
        *,
        caminhao:caminhoes(placa, tipo, modelo)
      `);

    if (dataInicio && dataFim) {
      query = query
        .gte('data_abastecimento', dataInicio)
        .lte('data_abastecimento', dataFim);
    }

    const { data, error } = await query.order('caminhao_id, data_abastecimento');
    
    if (error) {
      throw new Error(error.message);
    }

    // Agrupar por caminhão e calcular consumo
    const consumoPorCaminhao: {[key: number]: ConsumoRelatorio} = {};

    data?.forEach(abastecimento => {
      const caminhaoId = abastecimento.caminhao_id;
      
      if (!consumoPorCaminhao[caminhaoId]) {
        consumoPorCaminhao[caminhaoId] = {
          equipamento: abastecimento.caminhao?.tipo || '',
          prefixo: abastecimento.caminhao?.placa || '',
          qnt_abastecimentos: 0,
          qnt_litros: 0,
          km_inicial: abastecimento.km_rodado,
          km_final: abastecimento.km_rodado,
          km_rodado: 0,
          consumo_medio: 0
        };
      }

      const consumo = consumoPorCaminhao[caminhaoId];
      consumo.qnt_abastecimentos++;
      consumo.qnt_litros += abastecimento.quantidade_litros || 0;
      
      if (abastecimento.km_rodado) {
        if (!consumo.km_inicial || abastecimento.km_rodado < consumo.km_inicial) {
          consumo.km_inicial = abastecimento.km_rodado;
        }
        if (!consumo.km_final || abastecimento.km_rodado > consumo.km_final) {
          consumo.km_final = abastecimento.km_rodado;
        }
      }
    });

    // Calcular KM rodado e consumo médio
    Object.values(consumoPorCaminhao).forEach(consumo => {
      if (consumo.km_inicial && consumo.km_final) {
        consumo.km_rodado = consumo.km_final - consumo.km_inicial;
        if (consumo.qnt_litros > 0) {
          consumo.consumo_medio = consumo.km_rodado / consumo.qnt_litros;
        }
      }
    });

    return Object.values(consumoPorCaminhao);
  },

  // Calcular totais por combustível
  async getTotaisPorCombustivel(): Promise<{[key: string]: {quantidade: number, valor: number}}> {
    const { data, error } = await supabase
      .from('abastecimentos')
      .select('combustivel, quantidade_litros, preco_total');
    
    if (error) {
      throw new Error(error.message);
    }
    
    const totais: {[key: string]: {quantidade: number, valor: number}} = {};
    
    data?.forEach(abastecimento => {
      if (!totais[abastecimento.combustivel]) {
        totais[abastecimento.combustivel] = { quantidade: 0, valor: 0 };
      }
      totais[abastecimento.combustivel].quantidade += abastecimento.quantidade_litros || 0;
      totais[abastecimento.combustivel].valor += abastecimento.preco_total || 0;
    });
    
    return totais;
  },

  // Buscar último abastecimento por caminhão (para calcular consumo)
  async getUltimoAbastecimentoPorCaminhao(caminhaoId: number): Promise<Abastecimento | null> {
    const { data, error } = await supabase
      .from('abastecimentos')
      .select('*')
      .eq('caminhao_id', caminhaoId)
      .order('data_abastecimento', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(error.message);
    }
    
    return data || null;
  }
}; 