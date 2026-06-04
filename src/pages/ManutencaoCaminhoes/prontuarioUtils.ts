import { Manutencao } from '../../services/manutencaoService';
import { Abastecimento } from '../../services/abastecimentoService';

export interface HealthStatus {
  lastDate: string | null;
  lastKm: number | null;
  kmSinceLast: number;
  percentage: number;
  status: 'ok' | 'warning' | 'danger';
  label: string;
}

export interface TruckHealthReport {
  caminhaoId: number;
  placa: string;
  modelo: string;
  kmAtual: number;
  statusGeral: 'ok' | 'warning' | 'danger';
  alertasCount: number;
  oleo: HealthStatus;
  freios: HealthStatus;
  pneus: HealthStatus;
}

// Helper to sanitize strings for search
const containsTerm = (text: string | undefined, terms: string[]): boolean => {
  if (!text) return false;
  const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return terms.some(term => normalized.includes(term.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
};

// Calculate estimated current KM
export const obterKmAtual = (
  caminhaoId: number,
  manutencoes: Manutencao[],
  abastecimentos: Abastecimento[]
): number => {
  const kmsManutencao = manutencoes
    .filter(m => m.caminhao_id === caminhaoId && m.km_caminhao)
    .map(m => m.km_caminhao as number);

  const kmsAbastecimento = abastecimentos
    .filter(a => a.caminhao_id === caminhaoId && a.km_rodado)
    .map(a => a.km_rodado as number);

  const todosKms = [...kmsManutencao, ...kmsAbastecimento];
  return todosKms.length > 0 ? Math.max(...todosKms) : 0;
};

// Generate health report for a specific truck
export const calcularProntuarioVeiculo = (
  caminhaoId: number,
  placa: string,
  modelo: string,
  manutencoes: Manutencao[],
  abastecimentos: Abastecimento[]
): TruckHealthReport => {
  const manutencoesDoVeiculo = manutencoes.filter(m => m.caminhao_id === caminhaoId);
  const kmAtual = obterKmAtual(caminhaoId, manutencoes, abastecimentos);

  // Helper for computing status
  const computeHealth = (
    terms: string[],
    limitKm: number,
    labelSingular: string
  ): HealthStatus => {
    // Find latest maintenance containing terms
    const matchingManutencoes = manutencoesDoVeiculo
      .filter(m => containsTerm(m.descricao_servico, terms) || containsTerm(m.observacoes, terms))
      .sort((a, b) => new Date(b.data_manutencao).getTime() - new Date(a.data_manutencao).getTime());

    const last = matchingManutencoes[0] || null;
    const lastDate = last ? last.data_manutencao : null;
    const lastKm = last ? last.km_caminhao || null : null;

    let kmSinceLast = 0;
    if (lastKm !== null && kmAtual >= lastKm) {
      kmSinceLast = kmAtual - lastKm;
    } else if (lastKm === null && kmAtual > 0) {
      // If we don't have a record of when it was done, assume it's never done
      kmSinceLast = kmAtual;
    }

    const percentage = Math.min(100, Math.round((kmSinceLast / limitKm) * 100));
    
    let status: 'ok' | 'warning' | 'danger' = 'ok';
    let label = 'OK';

    if (!last) {
      status = 'danger';
      label = 'Sem registro';
    } else if (kmSinceLast >= limitKm) {
      status = 'danger';
      label = 'Vencido';
    } else if (kmSinceLast >= limitKm * 0.85) {
      status = 'warning';
      label = 'Próximo do limite';
    }

    return {
      lastDate,
      lastKm,
      kmSinceLast,
      percentage,
      status,
      label
    };
  };

  // Define terms & thresholds
  const oleo = computeHealth(['oleo', 'óleo', 'lubrif'], 20000, 'Troca de Óleo');
  const freios = computeHealth(['freio', 'pastilha', 'lona', 'disco', 'sapata'], 40000, 'Revisão de Freios');
  const pneus = computeHealth(['pneu', 'alinhamento', 'balanceamento', 'rodizio', 'rodízio', 'cambagem'], 10000, 'Pneus e Alinhamento');

  // Overall status is the worst of the three
  let statusGeral: 'ok' | 'warning' | 'danger' = 'ok';
  let alertasCount = 0;

  [oleo, freios, pneus].forEach(item => {
    if (item.status === 'danger') {
      statusGeral = 'danger';
      alertasCount++;
    } else if (item.status === 'warning' && statusGeral !== 'danger') {
      statusGeral = 'warning';
      alertasCount++;
    }
  });

  return {
    caminhaoId,
    placa,
    modelo,
    kmAtual,
    statusGeral,
    alertasCount,
    oleo,
    freios,
    pneus
  };
};
