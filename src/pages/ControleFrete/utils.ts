import { formatDisplayDate } from '../../services/dateUtils';
import { FreteCaminhao } from '../../services/freteCaminhaoService';
import { Reboque } from '../../services/reboqueService';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (dateString: string) => {
  return formatDisplayDate(dateString);
};

export const getSituacaoClass = (situacao: string) => {
  switch (situacao.toLowerCase()) {
    case 'pendente': return 'pendente';
    case 'em andamento': return 'em-andamento';
    case 'concluído': case 'concluido': return 'concluido';
    case 'frigorífico': return 'frigorifico';
    case 'pago': return 'pago';
    default: return 'pendente';
  }
};

export const calcularValoresPorCaminhao = (
  freteId: number,
  vinculosCaminhoes: { [freteId: number]: FreteCaminhao[] },
  reboques: Reboque[]
) => {
  const vinculos = vinculosCaminhoes[freteId];
  if (!vinculos || vinculos.length === 0) {
    return {
      valoresIndividuais: [],
      total: 0
    };
  }

  const valoresIndividuais = vinculos.map(vinculo => {
    const configuracao = vinculo.configuracao;
    const reboqueId = vinculo.reboque_id;

    const descricaoConfiguracao = configuracao === 'Truck'
      ? 'Truck'
      : `${configuracao}${reboqueId ? ` (${reboques.find(r => r.id === reboqueId)?.placa || ''})` : ''}`;

    return {
      valor: vinculo.valor_frete || 0,
      descricao: descricaoConfiguracao
    };
  });

  const total = valoresIndividuais.reduce((sum, item) => sum + item.valor, 0);

  return {
    valoresIndividuais,
    total
  };
};
