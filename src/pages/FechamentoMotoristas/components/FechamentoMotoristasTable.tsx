import React from 'react';
import { Eye, FileText, Trash2, Archive, RefreshCw } from 'lucide-react';
import { FechamentoMotorista } from '../../../services/fechamentoService';
import { formatDisplayDate } from '../../../services/dateUtils';

interface FechamentoMotoristasTableProps {
  fechamentos: FechamentoMotorista[];
  fechamentosFiltrados: FechamentoMotorista[];
  dadosTemporarios: boolean;
  editandoBonus: number | null;
  novoBonus: string;
  setNovoBonus: (value: string) => void;
  mostrandoDetalhes: number | null;
  formatCurrency: (value: number) => string;
  recalcularDescontos: (id: number) => void;
  iniciarEdicaoBonus: (id: number, bonusAtual: number) => void;
  salvarBonus: (id: number) => void;
  cancelarEdicaoBonus: () => void;
  atualizarStatus: (id: number, status: string) => void;
  toggleDetalhes: (id: number) => void;
  recalcularFechamento: (id: number) => void;
  gerarRelatorioPDF: (id: number) => void;
  arquivarFechamento: (id: number, nome: string) => void;
  deletarFechamento: (id: number, nome: string) => void;
}

const FechamentoMotoristasTable: React.FC<FechamentoMotoristasTableProps> = ({
  fechamentos,
  fechamentosFiltrados,
  dadosTemporarios,
  editandoBonus,
  novoBonus,
  setNovoBonus,
  mostrandoDetalhes,
  formatCurrency,
  recalcularDescontos,
  iniciarEdicaoBonus,
  salvarBonus,
  cancelarEdicaoBonus,
  atualizarStatus,
  toggleDetalhes,
  recalcularFechamento,
  gerarRelatorioPDF,
  arquivarFechamento,
  deletarFechamento
}) => {

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return '#ffc107';
      case 'Pago': return '#28a745';
      case 'Atrasado': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (fechamentosFiltrados.length === 0) {
    return (
      <div className="table-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          {fechamentos.length === 0 ? (
            <>
              <p>Nenhum fechamento encontrado para este período.</p>
              <p>Clique em "Calcular Fechamento" para processar os fretes do período.</p>
            </>
          ) : (
            <p>Nenhum fechamento encontrado para o filtro selecionado.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Motorista</th>
            <th>Tipo</th>
            <th>Período</th>
            <th>Qtd Fretes</th>
            <th>Valor Bruto</th>
            <th>Comissão</th>
            <th>Descontos</th>
            <th>Bônus</th>
            <th>Valor Líquido</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {fechamentosFiltrados.map((fechamento) => (
            <React.Fragment key={fechamento.id}>
              <tr>
                <td>{fechamento.motorista?.nome || 'Nome não encontrado'}</td>
                <td>{fechamento.motorista?.tipo_motorista || '-'}</td>
                <td>{fechamento.periodo}</td>
                <td>{fechamento.total_fretes}</td>
                <td>{formatCurrency(fechamento.valor_bruto)}</td>
                <td>
                  {formatCurrency(fechamento.valor_comissao)}
                  <small style={{ display: 'block', color: '#666' }}>
                    {fechamento.motorista?.porcentagem_comissao 
                      ? `(${fechamento.motorista.porcentagem_comissao}%)`
                      : fechamento.motorista?.tipo_motorista === 'Terceiro' ? '(90%)' : '(10%)'
                    }
                  </small>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{formatCurrency(fechamento.descontos || 0)}</span>
                    {!dadosTemporarios && (
                      <button
                        onClick={() => fechamento.id && recalcularDescontos(fechamento.id)}
                        style={{ 
                          padding: '2px 6px', 
                          fontSize: '10px', 
                          background: '#17a2b8', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                        title="Recalcular descontos baseado nos vales atuais"
                      >
                        ↻
                      </button>
                    )}
                  </div>
                </td>
                <td>
                  {editandoBonus === fechamento.id && !dadosTemporarios ? (
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={novoBonus}
                        onChange={(e) => setNovoBonus(e.target.value)}
                        style={{ width: '80px', padding: '2px 4px' }}
                        placeholder="0.00"
                      />
                      <button 
                        onClick={() => fechamento.id && salvarBonus(fechamento.id)}
                        style={{ padding: '2px 6px', fontSize: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px' }}
                      >
                        ✓
                      </button>
                      <button 
                        onClick={cancelarEdicaoBonus}
                        style={{ padding: '2px 6px', fontSize: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div 
                      style={{ 
                        cursor: dadosTemporarios ? 'not-allowed' : 'pointer', 
                        padding: '4px',
                        opacity: dadosTemporarios ? 0.6 : 1
                      }}
                      onClick={() => !dadosTemporarios && fechamento.id && iniciarEdicaoBonus(fechamento.id, fechamento.bonus || 0)}
                      title={dadosTemporarios ? "Edição não disponível para dados temporários" : "Clique para editar bônus"}
                    >
                      {formatCurrency(fechamento.bonus || 0)}
                    </div>
                  )}
                </td>
                <td>{formatCurrency(fechamento.valor_liquido)}</td>
                <td>
                  <select
                    value={fechamento.status}
                    onChange={(e) => !dadosTemporarios && fechamento.id && atualizarStatus(fechamento.id, e.target.value)}
                    disabled={dadosTemporarios}
                    style={{ 
                      backgroundColor: getStatusColor(fechamento.status),
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      opacity: dadosTemporarios ? 0.6 : 1,
                      cursor: dadosTemporarios ? 'not-allowed' : 'pointer'
                    }}
                    title={dadosTemporarios ? "Edição não disponível para dados temporários" : "Alterar status"}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                    <option value="Atrasado">Atrasado</option>
                  </select>
                </td>
                <td>
                  <div className="actions">
                    <button 
                      className="btn-action"
                      onClick={() => !dadosTemporarios && fechamento.id && toggleDetalhes(fechamento.id)}
                      title={dadosTemporarios ? "Detalhes não disponíveis para dados temporários" : "Ver Detalhes"}
                      style={{ 
                        backgroundColor: mostrandoDetalhes === fechamento.id ? '#17a2b8' : '',
                        color: mostrandoDetalhes === fechamento.id ? 'white' : '',
                        opacity: dadosTemporarios ? 0.6 : 1,
                        cursor: dadosTemporarios ? 'not-allowed' : 'pointer'
                      }}
                      disabled={dadosTemporarios}
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="btn-action btn-recalcular"
                      onClick={() => !dadosTemporarios && fechamento.id && recalcularFechamento(fechamento.id)}
                      title={dadosTemporarios ? "Recálculo não disponível para dados temporários" : "Recalcular Fechamento"}
                      style={{ 
                        opacity: dadosTemporarios ? 0.6 : 1,
                        cursor: dadosTemporarios ? 'not-allowed' : 'pointer'
                      }}
                      disabled={dadosTemporarios}
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button 
                      className="btn-action"
                      onClick={() => !dadosTemporarios && fechamento.id && gerarRelatorioPDF(fechamento.id)}
                      title={dadosTemporarios ? "PDF não disponível para dados temporários" : "Gerar Relatório PDF"}
                      style={{ 
                        opacity: dadosTemporarios ? 0.6 : 1,
                        cursor: dadosTemporarios ? 'not-allowed' : 'pointer'
                      }}
                      disabled={dadosTemporarios}
                    >
                      <FileText size={16} />
                    </button>
                    <button 
                      className="btn-action btn-archive"
                      onClick={() => !dadosTemporarios && fechamento.id && arquivarFechamento(fechamento.id, fechamento.motorista?.nome || 'Motorista')}
                      title={dadosTemporarios ? "Arquivamento não disponível para dados temporários" : "Arquivar Fechamento"}
                      style={{ 
                        opacity: dadosTemporarios ? 0.6 : 1,
                        cursor: dadosTemporarios ? 'not-allowed' : 'pointer'
                      }}
                      disabled={dadosTemporarios}
                    >
                      <Archive size={16} />
                    </button>
                    <button 
                      className="btn-action btn-danger"
                      onClick={() => !dadosTemporarios && fechamento.id && deletarFechamento(fechamento.id, fechamento.motorista?.nome || 'Motorista')}
                      title={dadosTemporarios ? "Exclusão não disponível para dados temporários" : "Excluir Fechamento"}
                      style={{ 
                        opacity: dadosTemporarios ? 0.6 : 1,
                        cursor: dadosTemporarios ? 'not-allowed' : 'pointer'
                      }}
                      disabled={dadosTemporarios}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
              {mostrandoDetalhes && mostrandoDetalhes === fechamento.id && (
                <tr className="detalhes-row">
                  <td colSpan={11} style={{ backgroundColor: '#f8f9fa', padding: '15px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <h4 style={{ marginBottom: '10px', color: '#495057' }}>📊 Informações Detalhadas</h4>
                        <p><strong>Data do Fechamento:</strong> {fechamento.data_fechamento ? formatDisplayDate(fechamento.data_fechamento) : 'Não informada'}</p>
                        <p><strong>Porcentagem de Comissão:</strong> {
                          fechamento.motorista?.porcentagem_comissao 
                            ? `${fechamento.motorista.porcentagem_comissao}% (personalizada)`
                            : `${fechamento.motorista?.tipo_motorista === 'Terceiro' ? '90' : '10'}% (padrão)`
                        }</p>
                        <p><strong>Valor por Frete:</strong> {fechamento.total_fretes > 0 ? formatCurrency(fechamento.valor_bruto / fechamento.total_fretes) : 'N/A'}</p>
                        <p><strong>Comissão por Frete:</strong> {fechamento.total_fretes > 0 ? formatCurrency(fechamento.valor_comissao / fechamento.total_fretes) : 'N/A'}</p>
                      </div>
                      <div>
                        <h4 style={{ marginBottom: '10px', color: '#495057' }}>💰 Breakdown Financeiro</h4>
                        <p><strong>Valor Bruto:</strong> <span style={{ color: '#28a745' }}>{formatCurrency(fechamento.valor_bruto)}</span></p>
                        <p><strong>(-) Comissão:</strong> <span style={{ color: '#007bff' }}>{formatCurrency(fechamento.valor_comissao)}</span></p>
                        <p><strong>(-) Descontos/Vales:</strong> <span style={{ color: '#dc3545' }}>{formatCurrency(fechamento.descontos || 0)}</span></p>
                        <p><strong>(+) Bônus:</strong> <span style={{ color: '#ffc107' }}>{formatCurrency(fechamento.bonus || 0)}</span></p>
                        <p style={{ borderTop: '1px solid #dee2e6', paddingTop: '5px', marginTop: '10px' }}>
                          <strong>Valor Líquido:</strong> <span style={{ color: '#28a745', fontSize: '1.1em' }}>{formatCurrency(fechamento.valor_liquido)}</span>
                        </p>
                        {fechamento.observacoes && (
                          <div style={{ marginTop: '10px' }}>
                            <strong>Observações:</strong>
                            <p style={{ fontStyle: 'italic', color: '#6c757d' }}>{fechamento.observacoes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FechamentoMotoristasTable;
