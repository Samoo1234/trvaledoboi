import React from 'react';
import { formatarMoeda } from '../utils';

interface MediaCaminhao {
  placa: string;
  modelo: string;
  totalLitros: number;
  totalKm: number;
  media: number;
}

interface ControleAbastecimentoStatsProps {
  totalLitros: number;
  totalValor: number;
  mediaPreco: number;
  temFiltroPeriodo: boolean;
  dataInicio?: string;
  dataFim?: string;
  mediasPorCaminhao: MediaCaminhao[];
}

export const ControleAbastecimentoStats: React.FC<ControleAbastecimentoStatsProps> = ({
  totalLitros,
  totalValor,
  mediaPreco,
  temFiltroPeriodo,
  dataInicio,
  dataFim,
  mediasPorCaminhao
}) => {
  return (
    <>
      {temFiltroPeriodo && dataInicio && dataFim && (
        <div style={{
          backgroundColor: '#fff3e0', 
          border: '1px solid #ffb74d', 
          borderRadius: '4px', 
          padding: '8px 12px', 
          margin: '10px 0',
          fontSize: '14px',
          color: '#e65100'
        }}>
          📊 Exibindo estatísticas do período: {new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a {new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}
        </div>
      )}
      
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-info">
            <h3>{totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L</h3>
            <p>Total de Litros</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-info">
            <h3>{formatarMoeda(totalValor)}</h3>
            <p>Gasto Total</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-info">
            <h3>{formatarMoeda(mediaPreco)}</h3>
            <p>Preço Médio/Litro</p>
          </div>
        </div>
      </div>

      {mediasPorCaminhao.length > 0 && (
        <div className="table-container" style={{marginBottom: 30, marginTop: 0}}>
          <div style={{margin: '16px', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <h3 style={{color: '#8B0000', margin: 0}}>Média de Consumo por Caminhão (km/litro)</h3>
            {temFiltroPeriodo && dataInicio && dataFim && (
              <span style={{
                backgroundColor: '#e3f2fd', 
                color: '#1976d2', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                fontSize: '12px', 
                fontWeight: 'bold'
              }}>
                Período: {new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a {new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Modelo</th>
                <th>Total Litros</th>
                <th>Total KM</th>
                <th>Média (km/litro)</th>
              </tr>
            </thead>
            <tbody>
              {mediasPorCaminhao.map((item, idx) => (
                <tr key={item.placa + idx}>
                  <td>{item.placa}</td>
                  <td>{item.modelo}</td>
                  <td>{item.totalLitros.toLocaleString('pt-BR', {maximumFractionDigits: 2})}</td>
                  <td>{item.totalKm.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</td>
                  <td>{item.media > 0 ? item.media.toLocaleString('pt-BR', {maximumFractionDigits: 2}) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};
