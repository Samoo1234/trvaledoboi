import { Reboque } from '../../../services/reboqueService';
import { FreteCaminhao } from '../../../services/freteCaminhaoService';
import { formatDisplayDate } from '../../../services/dateUtils';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (dateString: string) => {
  return formatDisplayDate(dateString);
};

export const calcularValoresPorCaminhao = (
  freteId: number,
  vinculosCaminhoes: { [freteId: number]: FreteCaminhao[] },
  reboques: Reboque[]
) => {
  const vinculos = vinculosCaminhoes[freteId];
  if (!vinculos || vinculos.length === 0) {
    return { valoresIndividuais: [], total: 0 };
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

  return { valoresIndividuais, total };
};

export const addLogo = async (doc: any, x: number, y: number, width: number, height: number): Promise<void> => {
  try {
    const response = await fetch('/assets/images/logo.png');
    if (response.ok) {
      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve) => {
        reader.onload = function (e) {
          if (e.target?.result) {
            try {
              doc.addImage(e.target.result as string, 'PNG', x, y, width, height);
            } catch (error) {
              console.log('Erro ao adicionar logo no PDF:', error);
            }
          }
          resolve();
        };
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.log('Logo não encontrada, continuando sem logo:', error);
  }
};
