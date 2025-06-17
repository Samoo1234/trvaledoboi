import { supabase } from './supabaseClient';

export interface Vale {
  id?: number;
  motorista_id: number;
  data_vale: string;
  valor: number;
  descricao?: string;
  periodo: string; // MM/YYYY
  created_at?: string;
  updated_at?: string;
  // Dados relacionados
  motorista?: {
    id: number;
    nome: string;
    tipo_motorista: string;
  };
}

export interface ValeCreateData {
  motorista_id: number;
  data_vale: string;
  valor: number;
  descricao?: string;
}

class ValeService {
  // Buscar todos os vales
  async getAll(): Promise<Vale[]> {
    const { data, error } = await supabase
      .from('vales_motoristas')
      .select(`
        *,
        motorista:motoristas(id, nome, tipo_motorista)
      `)
      .order('data_vale', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  }

  // Buscar vales por período
  async getByPeriodo(periodo: string): Promise<Vale[]> {
    const { data, error } = await supabase
      .from('vales_motoristas')
      .select(`
        *,
        motorista:motoristas(id, nome, tipo_motorista)
      `)
      .eq('periodo', periodo)
      .order('data_vale', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  }

  // Buscar vales por motorista e período
  async getByMotoristaAndPeriodo(motoristaId: number, periodo: string): Promise<Vale[]> {
    const { data, error } = await supabase
      .from('vales_motoristas')
      .select(`
        *,
        motorista:motoristas(id, nome, tipo_motorista)
      `)
      .eq('motorista_id', motoristaId)
      .eq('periodo', periodo)
      .order('data_vale', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  }

  // Calcular total de vales por motorista e período
  async getTotalByMotoristaAndPeriodo(motoristaId: number, periodo: string): Promise<number> {
    const { data, error } = await supabase
      .from('vales_motoristas')
      .select('valor')
      .eq('motorista_id', motoristaId)
      .eq('periodo', periodo);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data?.reduce((total, vale) => total + (parseFloat(vale.valor) || 0), 0) || 0;
  }

  // Criar um novo vale
  async create(valeData: ValeCreateData): Promise<Vale> {
    // Extrair período da data
    const dataVale = new Date(valeData.data_vale);
    const periodo = `${(dataVale.getMonth() + 1).toString().padStart(2, '0')}/${dataVale.getFullYear()}`;
    
    const { data, error } = await supabase
      .from('vales_motoristas')
      .insert([{
        ...valeData,
        periodo
      }])
      .select(`
        *,
        motorista:motoristas(id, nome, tipo_motorista)
      `)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }

  // Atualizar um vale
  async update(id: number, valeData: Partial<ValeCreateData>): Promise<Vale> {
    let updateData: any = { ...valeData };
    
    // Se a data foi alterada, recalcular o período
    if (valeData.data_vale) {
      const dataVale = new Date(valeData.data_vale);
      updateData.periodo = `${(dataVale.getMonth() + 1).toString().padStart(2, '0')}/${dataVale.getFullYear()}`;
    }
    
    const { data, error } = await supabase
      .from('vales_motoristas')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        motorista:motoristas(id, nome, tipo_motorista)
      `)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }

  // Deletar um vale
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('vales_motoristas')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
  }

  // Buscar vale por ID
  async getById(id: number): Promise<Vale | null> {
    const { data, error } = await supabase
      .from('vales_motoristas')
      .select(`
        *,
        motorista:motoristas(id, nome, tipo_motorista)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }

  // Gerar relatório de vales por período
  async getRelatorioByPeriodo(periodo: string): Promise<{
    totalVales: number;
    totalValor: number;
    valesPorMotorista: Array<{
      motorista: string;
      tipo: string;
      totalVales: number;
      valorTotal: number;
    }>;
  }> {
    const vales = await this.getByPeriodo(periodo);
    
    const totalVales = vales.length;
    const totalValor = vales.reduce((sum, vale) => sum + (parseFloat(vale.valor.toString()) || 0), 0);
    
    // Agrupar por motorista
    const valesPorMotoristaMap = new Map();
    
    vales.forEach(vale => {
      const key = vale.motorista_id;
      if (!valesPorMotoristaMap.has(key)) {
        valesPorMotoristaMap.set(key, {
          motorista: vale.motorista?.nome || 'Nome não encontrado',
          tipo: vale.motorista?.tipo_motorista || 'N/A',
          totalVales: 0,
          valorTotal: 0
        });
      }
      
      const grupo = valesPorMotoristaMap.get(key);
      grupo.totalVales++;
      grupo.valorTotal += parseFloat(vale.valor.toString()) || 0;
    });
    
    const valesPorMotorista = Array.from(valesPorMotoristaMap.values());
    
    return {
      totalVales,
      totalValor,
      valesPorMotorista
    };
  }
}

export const valeService = new ValeService(); 