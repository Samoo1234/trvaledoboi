import { formatDisplayDate } from '../../services/dateUtils';

export const formatarMesAno = (data: string): string => {
  if (!data) return '';
  const date = new Date(data + 'T00:00:00'); 
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${meses[date.getMonth()]}/${date.getFullYear()}`;
};

export const formatarData = (data: string) => {
  return formatDisplayDate(data);
};

export const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};

export const calcularPrecoTotal = (quantidade: number | undefined, precoPorLitro: number | undefined): number | undefined => {
  if (quantidade && precoPorLitro && quantidade > 0 && precoPorLitro > 0) {
    return parseFloat((quantidade * precoPorLitro).toFixed(2));
  }
  return undefined;
};
