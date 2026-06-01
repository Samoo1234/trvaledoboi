import React from 'react';
import { Archive, Eye, FileText, RotateCcw } from 'lucide-react';
import { Frete } from '../../../services/freteService';
import { FechamentoMotorista } from '../../../services/fechamentoService';
import { formatDisplayDate } from '../../../services/dateUtils';

interface HistoricoTableProps {
  activeTab: 'fretes' | 'fechamentos';
  fretesArquivados: Frete[];
  fechamentosArquivados: FechamentoMotorista[];
  formatCurrency: (value: number) => string;
  setFreteDetalhes: (frete: Frete | null) => void;
  setFechamentoDetalhes: (fechamento: FechamentoMotorista | null) => void;
  reabrirFrete: (id: number) => void;
  reabrirFechamento: (id: number) => void;
  handleGerarReciboFrete: (frete: Frete) => void;
}

const HistoricoTable: React.FC<HistoricoTableProps> = ({
  activeTab,
  fretesArquivados,
  fechamentosArquivados,
  formatCurrency,
  setFreteDetalhes,
  setFechamentoDetalhes,
  reabrirFrete,
  reabrirFechamento,
  handleGerarReciboFrete
}) => {
  return (
    <div className="tab-content">
      {activeTab === 'fretes' ? (
        <div className="fretes-arquivados">
          <div className="results-header">
            <h3>Fretes Arquivados ({fretesArquivados.length})</h3>
          </div>
          
          {fretesArquivados.length === 0 ? (
            <div className="no-results">
              <Archive size={48} />
              <p>Nenhum frete arquivado encontrado</p>
              <span>Use os filtros acima para buscar registros</span>
            </div>
          ) : (
            <div className="table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Motorista</th>
                    <th>Cliente</th>
                    <th>Origem → Destino</th>
                    <th>Valor</th>
                    <th>Pago em</th>
                    <th>Tipo Pagamento</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {fretesArquivados.map(frete => (
                    <tr key={frete.id}>
                      <td>{formatDisplayDate(frete.data_emissao)}</td>
                      <td>{frete.motorista?.nome}</td>
                      <td>{frete.clienteData?.razao_social || frete.cliente || '-'}</td>
                      <td>{frete.origem} → {frete.destino}</td>
                      <td className="valor">{formatCurrency(frete.valor_frete)}</td>
                      <td>{frete.data_pagamento ? formatDisplayDate(frete.data_pagamento) : '-'}</td>
                      <td>{frete.tipo_pagamento || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="view-btn"
                            title="Visualizar detalhes"
                            onClick={() => setFreteDetalhes(frete)}
                          >
                            <Eye size={16} />
                          </button>
                          {frete.situacao === 'Pago' && (
                            <button
                              className="view-btn"
                              title="Gerar Recibo"
                              onClick={() => handleGerarReciboFrete(frete)}
                              style={{ color: '#8b0000', borderColor: '#ebcccc' }}
                            >
                              <FileText size={16} />
                            </button>
                          )}
                          <button
                            className="reopen-btn"
                            title="Reabrir para correção"
                            onClick={() => reabrirFrete(frete.id!)}
                          >
                            <RotateCcw size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="fechamentos-arquivados">
          <div className="results-header">
            <h3>Fechamentos Arquivados ({fechamentosArquivados.length})</h3>
          </div>
          
          {fechamentosArquivados.length === 0 ? (
            <div className="no-results">
              <Archive size={48} />
              <p>Nenhum fechamento arquivado encontrado</p>
              <span>Use os filtros acima para buscar registros</span>
            </div>
          ) : (
            <div className="table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Motorista</th>
                    <th>Tipo</th>
                    <th>Total Fretes</th>
                    <th>Valor Bruto</th>
                    <th>Valor Líquido</th>
                    <th>Data Fechamento</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {fechamentosArquivados.map(fechamento => (
                    <tr key={fechamento.id}>
                      <td>{fechamento.periodo}</td>
                      <td>{fechamento.motorista?.nome}</td>
                      <td>
                        <span className={`tipo-badge ${fechamento.motorista?.tipo_motorista?.toLowerCase()}`}>
                          {fechamento.motorista?.tipo_motorista}
                        </span>
                      </td>
                      <td>{fechamento.total_fretes}</td>
                      <td className="valor">{formatCurrency(fechamento.valor_bruto)}</td>
                      <td className="valor">{formatCurrency(fechamento.valor_liquido)}</td>
                      <td>{fechamento.data_fechamento ? formatDisplayDate(fechamento.data_fechamento) : '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="view-btn"
                            title="Visualizar detalhes"
                            onClick={() => setFechamentoDetalhes(fechamento)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="pdf-btn"
                            title="Gerar PDF"
                            onClick={() => alert('Funcionalidade de PDF em desenvolvimento')}
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            className="reopen-btn"
                            title="Reabrir para correção"
                            onClick={() => reabrirFechamento(fechamento.id!)}
                          >
                            <RotateCcw size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoricoTable;
