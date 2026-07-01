import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Frete } from '../../../services/freteService';
import { FechamentoMotorista } from '../../../services/fechamentoService';
import { Motorista } from '../../../services/motoristaService';
import { formatDisplayDate } from '../../../services/dateUtils';

interface HistoricoModalsProps {
  freteDetalhes: Frete | null;
  setFreteDetalhes: (frete: Frete | null) => void;
  fechamentoDetalhes: FechamentoMotorista | null;
  setFechamentoDetalhes: (fechamento: FechamentoMotorista | null) => void;
  motoristas: Motorista[];
  formatCurrency: (value: number) => string;
  reabrirFrete: (id: number) => void;
  reabrirFechamento: (id: number) => void;
}

const HistoricoModals: React.FC<HistoricoModalsProps> = ({
  freteDetalhes,
  setFreteDetalhes,
  fechamentoDetalhes,
  setFechamentoDetalhes,
  motoristas,
  formatCurrency,
  reabrirFrete,
  reabrirFechamento
}) => {
  return (
    <>
      {/* Modal de Detalhes do Frete */}
      {freteDetalhes && (
        <div className="modal-overlay" onClick={() => setFreteDetalhes(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📦 Detalhes do Frete Arquivado</h2>
              <button className="modal-close" onClick={() => setFreteDetalhes(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detalhes-grid">
                <div className="detalhe-item">
                  <label>Data de Emissão:</label>
                  <span>{formatDisplayDate(freteDetalhes.data_emissao)}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Número Minuta:</label>
                  <span>{freteDetalhes.numero_minuta || '-'}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Número CB:</label>
                  <span>{freteDetalhes.numero_cb || '-'}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Pecuarista:</label>
                  <span>{freteDetalhes.pecuarista || '-'}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Cliente:</label>
                  <span>{freteDetalhes.clienteData?.razao_social || freteDetalhes.cliente || '-'}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Origem:</label>
                  <span>{freteDetalhes.origem}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Destino:</label>
                  <span>{freteDetalhes.destino}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Faixa:</label>
                  <span>{freteDetalhes.faixa || '-'}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Total KM:</label>
                  <span>{freteDetalhes.total_km ? `${freteDetalhes.total_km} km` : '-'}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Valor do Frete:</label>
                  <span className="valor-destaque">{formatCurrency(freteDetalhes.valor_frete)}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Situação:</label>
                  <span className={`badge ${freteDetalhes.situacao?.toLowerCase()}`}>
                    {freteDetalhes.situacao}
                  </span>
                </div>
                
                <div className="detalhe-item">
                  <label>Tipo de Pagamento:</label>
                  <span>{freteDetalhes.tipo_pagamento || '-'}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Data de Pagamento:</label>
                  <span>{freteDetalhes.data_pagamento ? formatDisplayDate(freteDetalhes.data_pagamento) : '-'}</span>
                </div>
                
                <div className="detalhe-item full-width">
                  <label>Observações:</label>
                  <span>{freteDetalhes.observacoes ? freteDetalhes.observacoes : 'Sem observações'}</span>
                </div>
                
                {freteDetalhes.arquivado_em && (
                  <div className="detalhe-item">
                    <label>Arquivado em:</label>
                    <span>{new Date(freteDetalhes.arquivado_em).toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setFreteDetalhes(null)}>
                Fechar
              </button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  reabrirFrete(freteDetalhes.id!);
                  setFreteDetalhes(null);
                }}
              >
                <RotateCcw size={16} />
                Reabrir Frete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Fechamento */}
      {fechamentoDetalhes && (
        <div className="modal-overlay" onClick={() => setFechamentoDetalhes(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💰 Detalhes do Fechamento Arquivado</h2>
              <button className="modal-close" onClick={() => setFechamentoDetalhes(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detalhes-grid">
                <div className="detalhe-item">
                  <label>Motorista:</label>
                  <span>{motoristas.find(m => m.id === fechamentoDetalhes.motorista_id)?.nome || '-'}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Período:</label>
                  <span>{fechamentoDetalhes.periodo}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Data do Fechamento:</label>
                  <span>{fechamentoDetalhes.data_fechamento ? formatDisplayDate(fechamentoDetalhes.data_fechamento) : '-'}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Total de Fretes:</label>
                  <span className="valor-destaque">{fechamentoDetalhes.total_fretes}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Valor Bruto:</label>
                  <span className="valor-destaque">{formatCurrency(fechamentoDetalhes.valor_bruto)}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Comissão:</label>
                  <span>{formatCurrency(fechamentoDetalhes.valor_comissao)}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Descontos:</label>
                  <span className="valor-negativo">{formatCurrency(fechamentoDetalhes.descontos || 0)}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Bônus:</label>
                  <span className="valor-positivo">{formatCurrency(fechamentoDetalhes.bonus || 0)}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Valor Líquido:</label>
                  <span className="valor-destaque">{formatCurrency(fechamentoDetalhes.valor_liquido)}</span>
                </div>
                
                <div className="detalhe-item">
                  <label>Status:</label>
                  <span className={`badge ${fechamentoDetalhes.status?.toLowerCase()}`}>
                    {fechamentoDetalhes.status}
                  </span>
                </div>
                
                <div className="detalhe-item full-width">
                  <label>Observações:</label>
                  <span>{fechamentoDetalhes.observacoes ? fechamentoDetalhes.observacoes : 'Sem observações'}</span>
                </div>
                
                {fechamentoDetalhes.arquivado_em && (
                  <div className="detalhe-item">
                    <label>Arquivado em:</label>
                    <span>{new Date(fechamentoDetalhes.arquivado_em).toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setFechamentoDetalhes(null)}>
                Fechar
              </button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  reabrirFechamento(fechamentoDetalhes.id!);
                  setFechamentoDetalhes(null);
                }}
              >
                <RotateCcw size={16} />
                Reabrir Fechamento
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HistoricoModals;
