import React from 'react';
import { Manutencao } from '../../../services/manutencaoService';
import { formatDisplayDate } from '../../../services/dateUtils';
import { formatCurrency, getTipoColor } from '../utils';
import { Edit2, Trash2, CheckCircle2, AlertTriangle, MapPin, Calendar, Compass, ShieldAlert } from 'lucide-react';

interface ProntuarioTimelineProps {
  manutencoes: Manutencao[];
  handleEdit: (manutencao: Manutencao) => void;
  handleDelete: (id: number, descricao: string) => void;
}

export const ProntuarioTimeline: React.FC<ProntuarioTimelineProps> = ({
  manutencoes,
  handleEdit,
  handleDelete
}) => {
  if (manutencoes.length === 0) {
    return (
      <div className="timeline-empty">
        <p>Nenhuma intervenção mecânica ou preventiva registrada no prontuário deste veículo.</p>
      </div>
    );
  }

  return (
    <div className="prontuario-timeline">
      {manutencoes.map((manutencao, index) => {
        let typeIcon = <CheckCircle2 size={16} />;
        let typeClass = 'timeline-badge-preventiva';
        
        if (manutencao.tipo_manutencao === 'Corretiva') {
          typeIcon = <AlertTriangle size={16} />;
          typeClass = 'timeline-badge-corretiva';
        } else if (manutencao.tipo_manutencao === 'Emergencial') {
          typeIcon = <ShieldAlert size={16} />;
          typeClass = 'timeline-badge-emergencial';
        }

        return (
          <div key={manutencao.id} className="timeline-item">
            {/* Timeline line connector */}
            <div className="timeline-line"></div>
            
            {/* Timeline icon */}
            <div className={`timeline-badge ${typeClass}`} style={{ borderColor: getTipoColor(manutencao.tipo_manutencao) }}>
              {typeIcon}
            </div>

            {/* Timeline content block */}
            <div className="timeline-content">
              <div className="timeline-header">
                <div className="timeline-main-info">
                  <span className="timeline-date">
                    <Calendar size={14} />
                    {formatDisplayDate(manutencao.data_manutencao)}
                  </span>
                  <span 
                    className="timeline-type-pill" 
                    style={{ backgroundColor: getTipoColor(manutencao.tipo_manutencao) + '15', color: getTipoColor(manutencao.tipo_manutencao) }}
                  >
                    {manutencao.tipo_manutencao}
                  </span>
                </div>
                
                <div className="timeline-actions">
                  <button 
                    className="timeline-btn btn-edit"
                    onClick={() => handleEdit(manutencao)}
                    title="Editar Registro"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className="timeline-btn btn-delete"
                    onClick={() => manutencao.id && handleDelete(manutencao.id, manutencao.descricao_servico)}
                    title="Excluir Registro"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="timeline-body">
                <h4 className="timeline-desc">{manutencao.descricao_servico}</h4>
                {manutencao.observacoes && (
                  <p className="timeline-obs">
                    <strong>Observações:</strong> {manutencao.observacoes}
                  </p>
                )}
              </div>

              <div className="timeline-footer">
                <div className="footer-meta">
                  {manutencao.km_caminhao && (
                    <span className="meta-item">
                      <Compass size={14} />
                      {manutencao.km_caminhao.toLocaleString('pt-BR')} km
                    </span>
                  )}
                  {manutencao.oficina_responsavel && (
                    <span className="meta-item">
                      <MapPin size={14} />
                      {manutencao.oficina_responsavel}
                    </span>
                  )}
                </div>
                <div className="timeline-price">
                  {formatCurrency(manutencao.valor_servico)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
