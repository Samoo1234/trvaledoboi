export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const getTipoColor = (tipo: string) => {
  switch (tipo) {
    case 'Preventiva': return '#28a745';
    case 'Corretiva': return '#dc3545';
    case 'Emergencial': return '#ff6b35';
    default: return '#6c757d';
  }
};

export const gerarPeriodos = () => {
  const periodos = [];
  const hoje = new Date();
  
  for (let i = 0; i < 12; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const ano = data.getFullYear();
    const valor = `${mes}/${ano}`;
    const nome = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    periodos.push({ valor, nome: nome.charAt(0).toUpperCase() + nome.slice(1) });
  }
  
  return periodos;
};
