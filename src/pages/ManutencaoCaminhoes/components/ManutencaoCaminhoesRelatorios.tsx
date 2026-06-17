import React from 'react';
import { formatCurrency, getTipoColor } from '../utils';
import { RelatorioManutencao } from '../../../services/manutencaoService';
import { formatDisplayDate } from '../../../services/dateUtils';
import { Printer } from 'lucide-react';

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
  relatorioCaminhaoData: RelatorioManutencao | null;
  periodoNome?: string;
  onImprimirConsolidado: () => void;
  onImprimirCaminhao: () => void;
}

export const ManutencaoCaminhoesRelatorios: React.FC<ManutencaoCaminhoesRelatoriosProps> = ({
  relatorioData,
  relatorioCaminhaoData,
  periodoNome,
  onImprimirConsolidado,
  onImprimirCaminhao
}) => {
  if (!relatorioData && !relatorioCaminhaoData) {
    return (
      <div className="relatorio-section" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Selecione os filtros desejados e clique no botão <strong>Relatório</strong> para carregar os dados.
        </p>
      </div>
    );
  }

  // Renderiza o relatório por caminhão se houver dados
  if (relatorioCaminhaoData) {
    return (
      <div className="relatorio-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0 }}>Relatório de Manutenções por Caminhão {periodoNome ? `- ${periodoNome}` : ''}</h3>
          <button className="btn-secondary" onClick={onImprimirCaminhao} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={18} />
            Exportar PDF
          </button>
        </div>

        <div className="resumo-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card">
            <h3>Placa / Modelo</h3>
            <p className="valor-destaque" style={{ fontSize: '1.4rem', lineHeight: '1.2' }}>
              {relatorioCaminhaoData.caminhao.placa}
            </p>
            <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              {relatorioCaminhaoData.caminhao.modelo} ({relatorioCaminhaoData.caminhao.tipo})
            </span>
          </div>
          <div className="card">
            <h3>Total de Manutenções</h3>
            <p className="valor-destaque">{relatorioCaminhaoData.totalManutencoes}</p>
          </div>
          <div className="card">
            <h3>Valor Total Gasto</h3>
            <p className="valor-destaque" style={{ color: '#b22222' }}>{formatCurrency(relatorioCaminhaoData.valorTotal)}</p>
          </div>
          <div className="card">
            <h3>Última Manutenção</h3>
            <p className="valor-destaque" style={{ fontSize: '1.15rem', paddingTop: '0.2rem' }}>
              {relatorioCaminhaoData.ultimaManutencao ? formatDisplayDate(relatorioCaminhaoData.ultimaManutencao) : 'Sem registro'}
            </p>
          </div>
        </div>

        <div className="relatorio-card">
          <h4 style={{ marginBottom: '1rem', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            Histórico de Manutenções do Veículo
          </h4>
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="relatorio-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Data</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Tipo</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Descrição do Serviço</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>KM</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Oficina</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {relatorioCaminhaoData.manutencoes.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      Nenhuma manutenção registrada para este veículo no período selecionado.
                    </td>
                  </tr>
                ) : (
                  relatorioCaminhaoData.manutencoes.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f1f1' }}>
                      <td style={{ padding: '0.75rem' }}>{formatDisplayDate(item.data_manutencao)}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span 
                          className="tipo-badge"
                          style={{ 
                            backgroundColor: getTipoColor(item.tipo_manutencao),
                            color: '#white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {item.tipo_manutencao}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>{item.descricao_servico}</td>
                      <td style={{ padding: '0.75rem' }}>{item.km_caminhao ? `${item.km_caminhao.toLocaleString('pt-BR')} km` : '-'}</td>
                      <td style={{ padding: '0.75rem' }}>{item.oficina_responsavel || '-'}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#444' }}>
                        {formatCurrency(item.valor_servico)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Renderiza o relatório consolidado
  if (!relatorioData) return null;

  return (
    <div className="relatorio-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0 }}>Relatório Consolidado {periodoNome ? `- ${periodoNome}` : ''}</h3>
        <button className="btn-secondary" onClick={onImprimirConsolidado} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Printer size={18} />
          Exportar PDF
        </button>
      </div>
      
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
