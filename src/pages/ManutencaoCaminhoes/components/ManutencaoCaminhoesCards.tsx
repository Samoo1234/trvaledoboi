import React from 'react';
import { Caminhao } from '../../../services/caminhaoService';
import { Manutencao } from '../../../services/manutencaoService';
import { Abastecimento } from '../../../services/abastecimentoService';
import { calcularProntuarioVeiculo } from '../prontuarioUtils';
import { Truck, AlertTriangle, CheckCircle, ShieldAlert, Activity } from 'lucide-react';

interface ManutencaoCaminhoesCardsProps {
  caminhoes: Caminhao[];
  manutencoes: Manutencao[];
  abastecimentos: Abastecimento[];
  onSelectCaminhao: (caminhaoId: number) => void;
  selectedCaminhaoId: number | null;
}

export const ManutencaoCaminhoesCards: React.FC<ManutencaoCaminhoesCardsProps> = ({
  caminhoes,
  manutencoes,
  abastecimentos,
  onSelectCaminhao,
  selectedCaminhaoId
}) => {
  if (caminhoes.length === 0) {
    return (
      <div className="no-trucks-container">
        <p>Nenhum caminhão ativo cadastrado no sistema.</p>
      </div>
    );
  }

  return (
    <div className="truck-cards-grid">
      {caminhoes.map(caminhao => {
        const report = calcularProntuarioVeiculo(
          caminhao.id!,
          caminhao.placa,
          caminhao.modelo,
          manutencoes,
          abastecimentos
        );

        let cardClass = 'truck-card';
        let healthIcon = <CheckCircle className="health-icon icon-ok" size={18} />;
        
        if (report.statusGeral === 'danger') {
          cardClass += ' health-danger';
          healthIcon = <ShieldAlert className="health-icon icon-danger" size={18} />;
        } else if (report.statusGeral === 'warning') {
          cardClass += ' health-warning';
          healthIcon = <AlertTriangle className="health-icon icon-warning" size={18} />;
        } else {
          cardClass += ' health-ok';
        }

        if (selectedCaminhaoId === caminhao.id) {
          cardClass += ' selected';
        }

        return (
          <div 
            key={caminhao.id} 
            className={cardClass}
            onClick={() => onSelectCaminhao(caminhao.id!)}
          >
            <div className="card-header">
              <div className="truck-info">
                <div className="truck-avatar">
                  <Truck size={22} />
                </div>
                <div>
                  <h4 className="truck-plate">{caminhao.placa}</h4>
                  <p className="truck-model">{caminhao.modelo}</p>
                </div>
              </div>
              <span className={`status-badge ${caminhao.status.toLowerCase()}`}>
                {caminhao.status}
              </span>
            </div>

            <div className="card-body">
              <div className="card-metric">
                <span className="metric-label">Odômetro Estimado</span>
                <span className="metric-value">
                  {report.kmAtual ? `${report.kmAtual.toLocaleString('pt-BR')} km` : 'Não registrado'}
                </span>
              </div>

              <div className="health-indicators-summary">
                <div className="indicator-pill-group">
                  <span className={`indicator-pill oleo-${report.oleo.status}`}>
                    Óleo: {report.oleo.label}
                  </span>
                  <span className={`indicator-pill freios-${report.freios.status}`}>
                    Freios: {report.freios.label}
                  </span>
                  <span className={`indicator-pill pneus-${report.pneus.status}`}>
                    Pneus: {report.pneus.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="card-footer">
              <div className="health-status-message">
                {healthIcon}
                <span>
                  {report.statusGeral === 'danger' && 'Intervenção Crítica Necessária'}
                  {report.statusGeral === 'warning' && 'Revisão Preventiva Próxima'}
                  {report.statusGeral === 'ok' && 'Prontuário Saudável'}
                </span>
              </div>
              <Activity size={16} className="pulse-icon" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
