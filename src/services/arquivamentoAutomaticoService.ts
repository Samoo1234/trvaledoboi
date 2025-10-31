import { freteService } from './freteService';
import { supabase } from './supabaseClient';

/**
 * Serviço de Arquivamento Automático de Fretes
 * 
 * Arquiva automaticamente fretes antigos após o dia 10 de cada mês.
 * Arquiva todos os fretes com data_emissao do mês anterior ou anteriores.
 */

const STORAGE_KEY = 'ultimo_arquivamento_automatico';
const DIA_ARQUIVAMENTO = 10; // Dia do mês para executar o arquivamento

interface UltimoArquivamento {
  data: string;
  periodo: string; // MM/YYYY do período arquivado
  quantidade: number;
}

export const arquivamentoAutomaticoService = {
  /**
   * Verifica se deve executar o arquivamento automático
   * Retorna true se estamos após o dia 10 do mês E ainda não arquivamos este mês
   */
  deveExecutarArquivamento(): boolean {
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    const periodoAtual = `${mesAtual.toString().padStart(2, '0')}/${anoAtual}`;

    // Só executa após o dia 10
    if (diaAtual < DIA_ARQUIVAMENTO) {
      return false;
    }

    // Verificar se já arquivou neste período
    const ultimo = this.getUltimoArquivamento();
    if (ultimo && ultimo.periodo === periodoAtual) {
      console.log(`✅ Arquivamento automático já executado para ${periodoAtual}`);
      return false;
    }

    return true;
  },

  /**
   * Obtém informações do último arquivamento automático
   */
  getUltimoArquivamento(): UltimoArquivamento | null {
    try {
      const dados = localStorage.getItem(STORAGE_KEY);
      return dados ? JSON.parse(dados) : null;
    } catch (error) {
      console.error('Erro ao ler último arquivamento:', error);
      return null;
    }
  },

  /**
   * Registra a execução do arquivamento automático
   */
  registrarArquivamento(quantidade: number): void {
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    const periodoAtual = `${mesAtual.toString().padStart(2, '0')}/${anoAtual}`;

    const registro: UltimoArquivamento = {
      data: hoje.toISOString(),
      periodo: periodoAtual,
      quantidade
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(registro));
    console.log(`✅ Arquivamento automático registrado: ${quantidade} fretes em ${periodoAtual}`);
  },

  /**
   * Calcula a data limite para arquivamento
   * Retorna o último dia do mês anterior
   */
  getDataLimiteArquivamento(): string {
    const hoje = new Date();
    // Primeiro dia do mês atual
    const primeiroDiaMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    // Último dia do mês anterior (um dia antes do primeiro dia do mês atual)
    const ultimoDiaMesAnterior = new Date(primeiroDiaMesAtual.getTime() - 1);
    
    // Formatar como YYYY-MM-DD
    return ultimoDiaMesAnterior.toISOString().split('T')[0];
  },

  /**
   * Busca todos os fretes que devem ser arquivados
   * (fretes PAGOS com data_emissao até o último dia do mês anterior)
   */
  async buscarFretesParaArquivar(): Promise<number[]> {
    try {
      const dataLimite = this.getDataLimiteArquivamento();
      
      console.log(`🔍 Buscando fretes PAGOS para arquivar (data_emissao <= ${dataLimite})...`);

      const { data, error } = await supabase
        .from('fretes')
        .select('id, situacao')
        .lte('data_emissao', dataLimite)
        .or('arquivado.is.null,arquivado.eq.false') // Apenas não arquivados
        .order('data_emissao', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      // Filtrar apenas fretes pagos (case-insensitive) e EXCLUIR FRIGORÍFICO
      const fretesPagos = (data || []).filter(f => 
        f.situacao?.toLowerCase() === 'pago' && 
        f.situacao?.toUpperCase() !== 'FRIGORÍFICO'
      );

      const ids = fretesPagos.map(f => f.id).filter((id): id is number => typeof id === 'number');
      console.log(`📦 Encontrados ${ids.length} fretes PAGOS para arquivar`);
      
      return ids;
    } catch (error) {
      console.error('❌ Erro ao buscar fretes para arquivar:', error);
      throw error;
    }
  },

  /**
   * Executa o arquivamento automático
   * Retorna a quantidade de fretes arquivados
   */
  async executarArquivamentoAutomatico(): Promise<number> {
    try {
      console.log('🚀 Iniciando arquivamento automático...');

      // Buscar fretes para arquivar
      const idsParaArquivar = await this.buscarFretesParaArquivar();

      if (idsParaArquivar.length === 0) {
        console.log('✅ Nenhum frete para arquivar');
        this.registrarArquivamento(0);
        return 0;
      }

      // Arquivar cada frete
      let arquivados = 0;
      let erros = 0;

      for (const id of idsParaArquivar) {
        try {
          await freteService.arquivar(id);
          arquivados++;
          
          // Log a cada 10 fretes arquivados
          if (arquivados % 10 === 0) {
            console.log(`📦 Progresso: ${arquivados}/${idsParaArquivar.length} fretes arquivados`);
          }
        } catch (error) {
          console.error(`❌ Erro ao arquivar frete ${id}:`, error);
          erros++;
        }
      }

      console.log(`✅ Arquivamento automático concluído: ${arquivados} fretes arquivados, ${erros} erros`);
      
      // Registrar execução
      this.registrarArquivamento(arquivados);

      return arquivados;
    } catch (error) {
      console.error('❌ Erro ao executar arquivamento automático:', error);
      throw error;
    }
  },

  /**
   * Verifica e executa o arquivamento automático se necessário
   * Esta função deve ser chamada quando o sistema carrega
   */
  async verificarEExecutar(): Promise<{ executado: boolean; quantidade: number }> {
    try {
      if (!this.deveExecutarArquivamento()) {
        return { executado: false, quantidade: 0 };
      }

      console.log('⏰ Hora de executar o arquivamento automático!');
      const quantidade = await this.executarArquivamentoAutomatico();

      return { executado: true, quantidade };
    } catch (error) {
      console.error('❌ Erro na verificação de arquivamento automático:', error);
      return { executado: false, quantidade: 0 };
    }
  },

  /**
   * Força a execução do arquivamento (útil para testes)
   */
  async forcarArquivamento(): Promise<number> {
    console.log('⚠️ Forçando arquivamento automático (modo manual)...');
    return await this.executarArquivamentoAutomatico();
  },

  /**
   * Limpa o registro de último arquivamento (útil para testes)
   */
  limparRegistro(): void {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Registro de arquivamento automático limpo');
  }
};

