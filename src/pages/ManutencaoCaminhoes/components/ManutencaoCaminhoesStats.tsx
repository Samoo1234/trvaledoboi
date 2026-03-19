import React from 'react';
import { formatCurrency } from '../utils';

interface ManutencaoCaminhoesStatsProps {
  totalManutencoes: number;
  valorTotal: number;
  mediaValor: number;
}

export const ManutencaoCaminhoesStats: React.FC<ManutencaoCaminhoesStatsProps> = ({
  totalManutencoes,
  valorTotal,
  mediaValor
}) => {
  return (
    <div className="resumo-cards">
      <div className="card">
        <h3>Total de Manutenções</h3>
        <p className="valor-destaque">{totalManutencoes}</p>
      </div>
      <div className="card">
        <h3>Valor Total</h3>
        <p className="valor-destaque">{formatCurrency(valorTotal)}</p>
      </div>
      <div className="card">
        <h3>Valor Médio</h3>
        <p className="valor-destaque">{formatCurrency(mediaValor)}</p>
      </div>
    </div>
  );
};
