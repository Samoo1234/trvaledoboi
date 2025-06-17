import { supabase } from './supabaseClient';
import { extractPeriod } from '../services/dateUtils';

export interface Manutencao {
  id?: number;
  caminhao_id: number;
  data_manutencao: string;
  tipo_manutencao: 'Preventiva' | 'Corretiva' | 'Emergencial';
  descricao_servico: string;
  valor_servico: number;
  oficina_responsavel?: string;
  km_caminhao?: number;
  observacoes?: string;
  periodo: string; // MM/YYYY
  created_at?: string;
  updated_at?: string;
  // Dados relacionados
  caminhao?: {
    id: number;
    placa: string;
    modelo: string;
    tipo: string;
    status: string;
  };
}

export interface ManutencaoCreateData {
  caminhao_id: number;
  data_manutencao: string;
  tipo_manutencao: 'Preventiva' | 'Corretiva' | 'Emergencial';
  descricao_servico: string;
  valor_servico: number;
  oficina_responsavel?: string;
  km_caminhao?: number;
  observacoes?: string;
}

export interface RelatorioManutencao {
  caminhao: {
    id: number;
    placa: string;
    modelo: string;
    tipo: string;
  };
  totalManutencoes: number;
  valorTotal: number;
  ultimaManutencao: string;
  manutencoes: Manutencao[];
}

class ManutencaoService {
  // Buscar todas as manutenções
  async getAll(): Promise<Manutencao[]> {
    const { data, error } = await supabase
      .from('manutencoes_caminhoes')
      .select(`
        *,
        caminhao:caminhoes(id, placa, modelo, tipo, status)
      `)
      .order('data_manutencao', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  }

  // Buscar manutenções por período
  async getByPeriodo(periodo: string): Promise<Manutencao[]> {
    const { data, error } = await supabase
      .from('manutencoes_caminhoes')
      .select(`
        *,
        caminhao:caminhoes(id, placa, modelo, tipo, status)
      `)
      .eq('periodo', periodo)
      .order('data_manutencao', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  }

  // Buscar manutenções por caminhão
  async getByCaminhao(caminhaoId: number): Promise<Manutencao[]> {
    const { data, error } = await supabase
      .from('manutencoes_caminhoes')
      .select(`
        *,
        caminhao:caminhoes(id, placa, modelo, tipo, status)
      `)
      .eq('caminhao_id', caminhaoId)
      .order('data_manutencao', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  }

  // Buscar manutenções por caminhão e período
  async getByCaminhaoAndPeriodo(caminhaoId: number, periodo: string): Promise<Manutencao[]> {
    const { data, error } = await supabase
      .from('manutencoes_caminhoes')
      .select(`
        *,
        caminhao:caminhoes(id, placa, modelo, tipo, status)
      `)
      .eq('caminhao_id', caminhaoId)
      .eq('periodo', periodo)
      .order('data_manutencao', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  }

  // Criar nova manutenção
  async create(manutencaoData: ManutencaoCreateData): Promise<Manutencao> {
    // Extrair período da data
    const periodo = extractPeriod(manutencaoData.data_manutencao);
    
    console.log(`[MANUTENÇÃO SERVICE] Criando manutenção:`);
    console.log(`  Data: ${manutencaoData.data_manutencao}`);
    console.log(`  Período: ${periodo}`);
    console.log(`  Valor: R$ ${manutencaoData.valor_servico}`);
    
    const { data, error } = await supabase
      .from('manutencoes_caminhoes')
      .insert([{
        ...manutencaoData,
        periodo
      }])
      .select(`
        *,
        caminhao:caminhoes(id, placa, modelo, tipo, status)
      `)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }

  // Atualizar manutenção
  async update(id: number, manutencaoData: Partial<ManutencaoCreateData>): Promise<Manutencao> {
    let updateData: any = { ...manutencaoData };
    
    // Se a data foi alterada, recalcular o período
    if (manutencaoData.data_manutencao) {
      updateData.periodo = extractPeriod(manutencaoData.data_manutencao);
      
      console.log(`[MANUTENÇÃO SERVICE] Atualizando manutenção ID ${id}:`);
      console.log(`  Nova data: ${manutencaoData.data_manutencao}`);
      console.log(`  Novo período: ${updateData.periodo}`);
    }
    
    const { data, error } = await supabase
      .from('manutencoes_caminhoes')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        caminhao:caminhoes(id, placa, modelo, tipo, status)
      `)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }

  // Deletar manutenção
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('manutencoes_caminhoes')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
  }

  // Buscar manutenção por ID
  async getById(id: number): Promise<Manutencao | null> {
    const { data, error } = await supabase
      .from('manutencoes_caminhoes')
      .select(`
        *,
        caminhao:caminhoes(id, placa, modelo, tipo, status)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }

  // Calcular total de manutenções por caminhão
  async getTotalByCaminhao(caminhaoId: number): Promise<number> {
    const { data, error } = await supabase
      .from('manutencoes_caminhoes')
      .select('valor_servico')
      .eq('caminhao_id', caminhaoId);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data?.reduce((total, manutencao) => total + (parseFloat(manutencao.valor_servico.toString()) || 0), 0) || 0;
  }

  // Gerar relatório por caminhão
  async getRelatorioByCaminhao(caminhaoId: number, periodo?: string): Promise<RelatorioManutencao | null> {
    // Buscar dados do caminhão
    const { data: caminhao, error: caminhaoError } = await supabase
      .from('caminhoes')
      .select('id, placa, modelo, tipo')
      .eq('id', caminhaoId)
      .single();
    
    if (caminhaoError) {
      throw new Error(caminhaoError.message);
    }
    
    if (!caminhao) return null;
    
    // Buscar manutenções
    let manutencoes: Manutencao[];
    if (periodo) {
      manutencoes = await this.getByCaminhaoAndPeriodo(caminhaoId, periodo);
    } else {
      manutencoes = await this.getByCaminhao(caminhaoId);
    }
    
    // Calcular estatísticas
    const totalManutencoes = manutencoes.length;
    const valorTotal = manutencoes.reduce((sum, manutencao) => sum + (parseFloat(manutencao.valor_servico.toString()) || 0), 0);
    const ultimaManutencao = manutencoes.length > 0 ? manutencoes[0].data_manutencao : '';
    
    return {
      caminhao,
      totalManutencoes,
      valorTotal,
      ultimaManutencao,
      manutencoes
    };
  }

  // Gerar relatório consolidado por período
  async getRelatorioConsolidado(periodo: string): Promise<{
    totalManutencoes: number;
    valorTotal: number;
    manutencoesPorTipo: Array<{
      tipo: string;
      quantidade: number;
      valorTotal: number;
    }>;
    manutencoesPorCaminhao: Array<{
      caminhao: string;
      placa: string;
      totalManutencoes: number;
      valorTotal: number;
    }>;
  }> {
    const manutencoes = await this.getByPeriodo(periodo);
    
    const totalManutencoes = manutencoes.length;
    const valorTotal = manutencoes.reduce((sum, manutencao) => sum + (parseFloat(manutencao.valor_servico.toString()) || 0), 0);
    
    // Agrupar por tipo
    const tiposMap = new Map();
    manutencoes.forEach(manutencao => {
      const tipo = manutencao.tipo_manutencao;
      if (!tiposMap.has(tipo)) {
        tiposMap.set(tipo, { quantidade: 0, valorTotal: 0 });
      }
      const grupo = tiposMap.get(tipo);
      grupo.quantidade++;
      grupo.valorTotal += parseFloat(manutencao.valor_servico.toString()) || 0;
    });
    
    const manutencoesPorTipo = Array.from(tiposMap.entries()).map(([tipo, dados]) => ({
      tipo,
      quantidade: dados.quantidade,
      valorTotal: dados.valorTotal
    }));
    
    // Agrupar por caminhão
    const caminhoesMap = new Map();
    manutencoes.forEach(manutencao => {
      const caminhaoId = manutencao.caminhao_id;
      if (!caminhoesMap.has(caminhaoId)) {
        caminhoesMap.set(caminhaoId, {
          caminhao: manutencao.caminhao?.modelo || 'N/A',
          placa: manutencao.caminhao?.placa || 'N/A',
          totalManutencoes: 0,
          valorTotal: 0
        });
      }
      const grupo = caminhoesMap.get(caminhaoId);
      grupo.totalManutencoes++;
      grupo.valorTotal += parseFloat(manutencao.valor_servico.toString()) || 0;
    });
    
    const manutencoesPorCaminhao = Array.from(caminhoesMap.values());
    
    return {
      totalManutencoes,
      valorTotal,
      manutencoesPorTipo,
      manutencoesPorCaminhao
    };
  }
}

export const manutencaoService = new ManutencaoService(); 