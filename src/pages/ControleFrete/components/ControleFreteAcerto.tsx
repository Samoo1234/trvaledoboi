import React from 'react';
import { Filter, Download } from 'lucide-react';
import { Frete } from '../../../services/freteService';
import { Caminhao } from '../../../services/caminhaoService';
import { Reboque } from '../../../services/reboqueService';
import { FreteCaminhao } from '../../../services/freteCaminhaoService';
import { formatCurrency, formatDate, getSituacaoClass, calcularValoresPorCaminhao } from '../utils';

interface ControleFreteAcertoProps {
  clienteSelecionado: string;
  setClienteSelecionado: (v: string) => void;
  dataInicioAcerto: string;
  setDataInicioAcerto: (v: string) => void;
  dataFimAcerto: string;
  setDataFimAcerto: (v: string) => void;
  fretesAcerto: Frete[];
  clientesUnicos: string[];
  vinculosCaminhoes: { [freteId: number]: FreteCaminhao[] };
  caminhoes: Caminhao[];
  reboques: Reboque[];
  onFiltrar: () => void;
  onGerarPDF: () => void;
}

export const ControleFreteAcerto: React.FC<ControleFreteAcertoProps> = ({
  clienteSelecionado,
  setClienteSelecionado,
  dataInicioAcerto,
  setDataInicioAcerto,
  dataFimAcerto,
  setDataFimAcerto,
  fretesAcerto,
  clientesUnicos,
  vinculosCaminhoes,
  caminhoes,
  reboques,
  onFiltrar,
  onGerarPDF
}) => {
  return (
    <>
      <div className="acerto-filters">
        <h3>
          <Filter size={18} />
          Filtros para Relatório de Acerto
        </h3>
        <div className="filter-row">
          <div className="filter-group">
            <label>Cliente *</label>
            <select
              value={clienteSelecionado}
              onChange={(e) => setClienteSelecionado(e.target.value)}
            >
              <option value="">Selecione um cliente</option>
              {clientesUnicos.map((cliente) => (
                <option key={cliente} value={cliente}>
                  {cliente}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Data Início</label>
            <input
              type="date"
              value={dataInicioAcerto}
              onChange={(e) => setDataInicioAcerto(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Data Fim</label>
            <input
              type="date"
              value={dataFimAcerto}
              onChange={(e) => setDataFimAcerto(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <div className="acerto-actions">
              <button
                type="button"
                className="btn-acerto"
                onClick={onFiltrar}
              >
                <Filter size={16} />
                Filtrar Fretes
              </button>
              {fretesAcerto.length > 0 && (
                <button
                  type="button"
                  className="btn-pdf"
                  onClick={onGerarPDF}
                >
                  <Download size={16} />
                  Gerar PDF
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {fretesAcerto.length > 0 && (
        <div className="acerto-summary">
          <div className="count">
            {fretesAcerto.length} frete{fretesAcerto.length > 1 ? 's' : ''} encontrado{fretesAcerto.length > 1 ? 's' : ''}
            {clienteSelecionado && ` para ${clienteSelecionado}`}
          </div>
          <div className="total">
            Total: {formatCurrency(fretesAcerto.reduce((sum, f) => {
              const { total } = calcularValoresPorCaminhao(f.id!, vinculosCaminhoes, reboques);
              return sum + total;
            }, 0))}
          </div>
        </div>
      )}

      {fretesAcerto.length > 0 && (
        <div className="table-container">
          <table className="data-table frete-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Placa</th>
                <th>Pecuarista</th>
                <th>Remetente/Faz</th>
                <th>Destinatário/Faz</th>
                <th>Base Cálculo</th>
                <th>Valor</th>
                <th>Valores Detalhados</th>
                <th>Situação</th>
                <th>Tipo Pagamento</th>
                <th>Data Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {fretesAcerto.map((frete) => {
                const vinculosCaminhao = vinculosCaminhoes[frete.id!];
                const descricoesConfiguracao: string[] = [];
                const placasCaminhoes: string[] = [];

                if (vinculosCaminhao && vinculosCaminhao.length > 0) {
                  vinculosCaminhao.forEach(vinculo => {
                    const caminhao = caminhoes.find(c => c.id === vinculo.caminhao_id);
                    const configuracao = vinculo.configuracao;
                    const reboqueId = vinculo.reboque_id;

                    const descricaoConfiguracao = configuracao === 'Truck'
                      ? 'Truck'
                      : `${configuracao}${reboqueId ? ` (${reboques.find(r => r.id === reboqueId)?.placa || ''})` : ''}`;

                    descricoesConfiguracao.push(descricaoConfiguracao);
                    placasCaminhoes.push(caminhao?.placa || 'N/A');
                  });
                } else {
                  if (frete.caminhao) {
                    const descricaoConfiguracao = frete.configuracao === 'Truck'
                      ? 'Truck'
                      : `${frete.configuracao || 'N/A'}`;
                    descricoesConfiguracao.push(descricaoConfiguracao);
                    // @ts-ignore
                    placasCaminhoes.push(frete.caminhao.placa);
                  } else {
                    descricoesConfiguracao.push('N/A');
                    placasCaminhoes.push('N/A');
                  }
                }

                return (
                  <tr key={frete.id}>
                    <td>{formatDate(frete.data_emissao)}</td>
                    <td>
                      {descricoesConfiguracao.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {descricoesConfiguracao.map((descricao, index) => (
                            <div key={index} style={{ fontSize: '0.9em' }}>
                              {descricao}
                            </div>
                          ))}
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td>
                      {placasCaminhoes.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {placasCaminhoes.map((placa, index) => (
                            <div key={index} style={{ fontSize: '0.9em' }}>
                              {placa}
                            </div>
                          ))}
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td>{frete.pecuarista}</td>
                    <td>{frete.origem}</td>
                    <td>{frete.destino}</td>
                    <td>{frete.total_km ? `${frete.total_km}KM` : 'N/A'}</td>
                    <td>{formatCurrency(frete.valor_frete)}</td>
                    <td>
                      {(() => {
                        const { valoresIndividuais, total } = calcularValoresPorCaminhao(frete.id!, vinculosCaminhoes, reboques);
                        if (valoresIndividuais.length === 0) {
                          return '-';
                        }
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {valoresIndividuais.map((item, index) => (
                              <div key={index} style={{ fontSize: '0.9em' }}>
                                {formatCurrency(item.valor)} ({item.descricao})
                              </div>
                            ))}
                            {valoresIndividuais.length > 1 && (
                              <>
                                <div style={{ borderTop: '1px solid #ddd', margin: '2px 0' }}></div>
                                <div style={{ fontSize: '0.9em', fontWeight: 'bold' }}>
                                  Total: {formatCurrency(total)}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td>
                      <span className={`status ${getSituacaoClass(frete.situacao)}`}>
                        {frete.situacao}
                      </span>
                    </td>
                    <td>{frete.situacao === 'Pago' ? (frete.tipo_pagamento || '-') : '-'}</td>
                    <td>{frete.situacao === 'Pago' ? (frete.data_pagamento ? formatDate(frete.data_pagamento) : '-') : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {clienteSelecionado && fretesAcerto.length === 0 && (
        <div className="empty-state">
          <p>Nenhum frete encontrado para o cliente "{clienteSelecionado}" no período selecionado.</p>
        </div>
      )}

      {!clienteSelecionado && (
        <div className="empty-state">
          <p>Selecione um cliente para visualizar os fretes disponíveis para acerto.</p>
        </div>
      )}
    </>
  );
};
