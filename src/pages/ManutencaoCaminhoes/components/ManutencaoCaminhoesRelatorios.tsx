import React from 'react';
import { formatCurrency, getTipoColor } from '../utils';

interface RelatorioManutencaoPorTipo {
  tipo: string;
  quantidade: number;
  valorTotal: number;
}

interface RelatorioManutencaoPorCaminhao {
  placa: string;
  caminhao: string;
  totalManutencoes: number;
  valorTotal: number;
}

interface RelatorioConsolidado {
  totalManutencoes: number;
  valorTotal: number;
  manutencoesPorTipo: RelatorioManutencaoPorTipo[];
  manutencoesPorCaminhao: RelatorioManutencaoPorCaminhao[];
}

interface ManutencaoCaminhoesRelatoriosProps {
  relatorioData: RelatorioConsolidado | null;
  periodoNome?: string;
}

export const ManutencaoCaminhoesRelatorios: React.FC<ManutencaoCaminhoesRelatoriosProps> = ({
  relatorioData,
  periodoNome
}) => {
  if (!relatorioData) return null;

  return (
    <div className="relatorio-section">
      <h3>Relatório Consolidado {periodoNome ? `- ${periodoNome}` : ''}</h3>
      
      <div className="resumo-cards">
        <div className="card">
          <h3>Total de Manutenções</h3>
          <p className="valor-destaque">{relatorioData.totalManutencoes}</p>
        </div>
        <div className="card">
          <h3>Valor Total Gasto</h3>
          <p className="valor-destaque">{formatCurrency(relatorioData.valorTotal)}</p>
        </div>
      </div>

      <div className="relatorio-grid">
        <div className="relatorio-card">
          <h4>Manutenções por Tipo</h4>
          <table className="relatorio-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {relatorioData.manutencoesPorTipo.map((item, index) => (
                <tr key={index}>
                  <td>
                    <span 
                      className="tipo-badge"
                      style={{ backgroundColor: getTipoColor(item.tipo) }}
                    >
                      {item.tipo}
                    </span>
                  </td>
                  <td>{item.quantidade}</td>
                  <td>{formatCurrency(item.valorTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="relatorio-card">
          <h4>Manutenções por Caminhão</h4>
          <table className="relatorio-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Modelo</th>
                <th>Quantidade</th>
                <th>Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {relatorioData.manutencoesPorCaminhao.map((item, index) => (
                <tr key={index}>
                  <td><strong>{item.placa}</strong></td>
                  <td>{item.caminhao}</td>
                  <td>{item.totalManutencoes}</td>
                  <td>{formatCurrency(item.valorTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
