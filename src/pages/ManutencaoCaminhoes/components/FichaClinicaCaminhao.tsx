import React, { useState } from 'react';
import { Caminhao } from '../../../services/caminhaoService';
import { Manutencao } from '../../../services/manutencaoService';
import { Abastecimento } from '../../../services/abastecimentoService';
import { calcularProntuarioVeiculo } from '../prontuarioUtils';
import { ProntuarioTimeline } from './ProntuarioTimeline';
import { formatCurrency } from '../utils';
import { formatDisplayDate } from '../../../services/dateUtils';
import { 
  ArrowLeft, Activity, ShieldAlert, CheckCircle, AlertTriangle, 
  Droplet, Disc, Disc2, RefreshCw, BarChart2, Fuel, Plus
} from 'lucide-react';

interface FichaClinicaCaminhaoProps {
  caminhao: Caminhao;
  manutencoes: Manutencao[];
  abastecimentos: Abastecimento[];
  onClose: () => void;
  onQuickAction: (tipo: 'oleo' | 'freio' | 'pneus') => void;
  handleEdit: (manutencao: Manutencao) => void;
  handleDelete: (id: number, descricao: string) => void;
}

export const FichaClinicaCaminhao: React.FC<FichaClinicaCaminhaoProps> = ({
  caminhao,
  manutencoes,
  abastecimentos,
  onClose,
  onQuickAction,
  handleEdit,
  handleDelete
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats' | 'abastecimento'>('timeline');

  const report = calcularProntuarioVeiculo(
    caminhao.id!,
    caminhao.placa,
    caminhao.modelo,
    manutencoes,
    abastecimentos
  );

  const manutencoesFiltradas = manutencoes.filter(m => m.caminhao_id === caminhao.id);
  const abastecimentosFiltrados = abastecimentos.filter(a => a.caminhao_id === caminhao.id).slice(0, 5);

  // Health check styling helper
  const getHealthClass = (status: 'ok' | 'warning' | 'danger') => {
    switch (status) {
      case 'danger': return 'health-indicator-danger';
      case 'warning': return 'health-indicator-warning';
      default: return 'health-indicator-ok';
    }
  };

  const getHealthIcon = (status: 'ok' | 'warning' | 'danger') => {
    switch (status) {
      case 'danger': return <ShieldAlert size={20} className="indicator-icon icon-danger" />;
      case 'warning': return <AlertTriangle size={20} className="indicator-icon icon-warning" />;
      default: return <CheckCircle size={20} className="indicator-icon icon-ok" />;
    }
  };

  // Math for stats tab
  const totalSpent = manutencoesFiltradas.reduce((sum, m) => sum + parseFloat(m.valor_servico.toString()), 0);
  const countPreventive = manutencoesFiltradas.filter(m => m.tipo_manutencao === 'Preventiva').length;
  const countCorrective = manutencoesFiltradas.filter(m => m.tipo_manutencao === 'Corretiva').length;
  const countEmergency = manutencoesFiltradas.filter(m => m.tipo_manutencao === 'Emergencial').length;

  // Math for fuel consumption
  const totalLitros = abastecimentosFiltrados.reduce((sum, a) => sum + parseFloat(a.quantidade_litros.toString()), 0);
  const totalKmRodado = abastecimentosFiltrados.reduce((sum, a) => sum + (a.km_rodado || 0), 0);
  const mediaConsumo = totalLitros > 0 && totalKmRodado > 0 ? (totalKmRodado / totalLitros).toFixed(2) : null;

  return (
    <div className="ficha-clinica-container">
      {/* Header section with back button and main profile */}
      <div className="ficha-header">
        <button className="btn-back" onClick={onClose}>
          <ArrowLeft size={20} />
          Voltar para Caminhões
        </button>
        
        <div className="truck-profile-info">
          <div className="profile-badge">
            <h2>{caminhao.placa}</h2>
            <span>{caminhao.modelo}</span>
          </div>
          <div className="profile-metrics">
            <div className="metric-box">
              <span className="box-label">Odômetro</span>
              <span className="box-value">{report.kmAtual ? `${report.kmAtual.toLocaleString('pt-BR')} km` : '-'}</span>
            </div>
            <div className="metric-box">
              <span className="box-label">Status Clínico</span>
              <span className={`box-value health-${report.statusGeral}`}>
                {report.statusGeral === 'danger' && 'Crítico'}
                {report.statusGeral === 'warning' && 'Atenção'}
                {report.statusGeral === 'ok' && 'Saudável'}
              </span>
            </div>
            <div className="metric-box">
              <span className="box-label">Total Gasto</span>
              <span className="box-value total-spent-val">{formatCurrency(totalSpent)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="ficha-grid">
        {/* Left Side: Diagnostic Indicators */}
        <div className="ficha-left-column">
          <div className="health-diagnostics-card">
            <h3><Activity size={18} /> Indicadores de Saúde</h3>
            
            {/* Oil Checkup Item */}
            <div className={`health-indicator-item ${getHealthClass(report.oleo.status)}`}>
              <div className="indicator-top">
                <div className="indicator-title">
                  <Droplet size={18} />
                  <span>Troca de Óleo</span>
                </div>
                <div className="indicator-badge">
                  {getHealthIcon(report.oleo.status)}
                  <span className="status-text">{report.oleo.label}</span>
                </div>
              </div>
              
              <div className="indicator-bar-container">
                <div className="indicator-bar">
                  <div 
                    className="indicator-bar-fill" 
                    style={{ width: `${report.oleo.percentage}%` }}
                  ></div>
                </div>
                <div className="bar-labels">
                  <span>Percorrido: {report.oleo.kmSinceLast.toLocaleString('pt-BR')} km</span>
                  <span>Meta: 20.000 km</span>
                </div>
              </div>

              <div className="indicator-footer">
                <div className="meta-text">
                  Última troca: {report.oleo.lastDate ? formatDisplayDate(report.oleo.lastDate) : 'Sem registro'} 
                  {report.oleo.lastKm ? ` (${report.oleo.lastKm.toLocaleString('pt-BR')} km)` : ''}
                </div>
                <button 
                  className="btn-quick-action" 
                  onClick={() => onQuickAction('oleo')}
                  title="Trocar Óleo"
                >
                  <Plus size={14} /> Registrar Troca
                </button>
              </div>
            </div>

            {/* Brake Checkup Item */}
            <div className={`health-indicator-item ${getHealthClass(report.freios.status)}`}>
              <div className="indicator-top">
                <div className="indicator-title">
                  <Disc size={18} />
                  <span>Sistema de Freios</span>
                </div>
                <div className="indicator-badge">
                  {getHealthIcon(report.freios.status)}
                  <span className="status-text">{report.freios.label}</span>
                </div>
              </div>
              
              <div className="indicator-bar-container">
                <div className="indicator-bar">
                  <div 
                    className="indicator-bar-fill" 
                    style={{ width: `${report.freios.percentage}%` }}
                  ></div>
                </div>
                <div className="bar-labels">
                  <span>Percorrido: {report.freios.kmSinceLast.toLocaleString('pt-BR')} km</span>
                  <span>Meta: 40.000 km</span>
                </div>
              </div>

              <div className="indicator-footer">
                <div className="meta-text">
                  Última revisão: {report.freios.lastDate ? formatDisplayDate(report.freios.lastDate) : 'Sem registro'}
                  {report.freios.lastKm ? ` (${report.freios.lastKm.toLocaleString('pt-BR')} km)` : ''}
                </div>
                <button 
                  className="btn-quick-action" 
                  onClick={() => onQuickAction('freio')}
                  title="Revisar Freios"
                >
                  <Plus size={14} /> Registrar Revisão
                </button>
              </div>
            </div>

            {/* Tires Checkup Item */}
            <div className={`health-indicator-item ${getHealthClass(report.pneus.status)}`}>
              <div className="indicator-top">
                <div className="indicator-title">
                  <Disc2 size={18} />
                  <span>Pneus e Alinhamento</span>
                </div>
                <div className="indicator-badge">
                  {getHealthIcon(report.pneus.status)}
                  <span className="status-text">{report.pneus.label}</span>
                </div>
              </div>
              
              <div className="indicator-bar-container">
                <div className="indicator-bar">
                  <div 
                    className="indicator-bar-fill" 
                    style={{ width: `${report.pneus.percentage}%` }}
                  ></div>
                </div>
                <div className="bar-labels">
                  <span>Percorrido: {report.pneus.kmSinceLast.toLocaleString('pt-BR')} km</span>
                  <span>Meta: 10.000 km</span>
                </div>
              </div>

              <div className="indicator-footer">
                <div className="meta-text">
                  Último serviço: {report.pneus.lastDate ? formatDisplayDate(report.pneus.lastDate) : 'Sem registro'}
                  {report.pneus.lastKm ? ` (${report.pneus.lastKm.toLocaleString('pt-BR')} km)` : ''}
                </div>
                <button 
                  className="btn-quick-action" 
                  onClick={() => onQuickAction('pneus')}
                  title="Revisar Pneus"
                >
                  <Plus size={14} /> Registrar Alinhamento
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Tabbed Interface for Timeline and Details */}
        <div className="ficha-right-column">
          <div className="ficha-tabs-container">
            <div className="ficha-tabs-navigation">
              <button 
                className={`ficha-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveTab('timeline')}
              >
                <RefreshCw size={16} />
                Histórico Clínico ({manutencoesFiltradas.length})
              </button>
              <button 
                className={`ficha-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                onClick={() => setActiveTab('stats')}
              >
                <BarChart2 size={16} />
                Estatísticas Clínicas
              </button>
              <button 
                className={`ficha-tab-btn ${activeTab === 'abastecimento' ? 'active' : ''}`}
                onClick={() => setActiveTab('abastecimento')}
              >
                <Fuel size={16} />
                Últimos Abastecimentos ({abastecimentosFiltrados.length})
              </button>
            </div>

            <div className="ficha-tab-content">
              {activeTab === 'timeline' && (
                <ProntuarioTimeline 
                  manutencoes={manutencoesFiltradas}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              )}

              {activeTab === 'stats' && (
                <div className="prontuario-stats">
                  <div className="stats-header">
                    <h4>Diagnóstico Financeiro e Operacional</h4>
                  </div>
                  
                  <div className="stats-summary-grid">
                    <div className="summary-stat-box">
                      <span className="stat-num">{manutencoesFiltradas.length}</span>
                      <span className="stat-desc">Total de Entradas</span>
                    </div>
                    <div className="summary-stat-box text-green">
                      <span className="stat-num">{countPreventive}</span>
                      <span className="stat-desc">Preventivas</span>
                    </div>
                    <div className="summary-stat-box text-orange">
                      <span className="stat-num">{countCorrective}</span>
                      <span className="stat-desc">Corretivas</span>
                    </div>
                    <div className="summary-stat-box text-red">
                      <span className="stat-num">{countEmergency}</span>
                      <span className="stat-desc">Emergenciais</span>
                    </div>
                  </div>

                  <div className="stats-comparison">
                    <div className="comparison-row">
                      <span>Média de Custo por Serviço</span>
                      <strong>
                        {manutencoesFiltradas.length > 0 
                          ? formatCurrency(totalSpent / manutencoesFiltradas.length) 
                          : 'R$ 0,00'}
                      </strong>
                    </div>
                    <div className="comparison-row">
                      <span>Ano de Fabricação</span>
                      <strong>{caminhao.ano}</strong>
                    </div>
                    <div className="comparison-row">
                      <span>Tipo do Veículo</span>
                      <strong>{caminhao.tipo}</strong>
                    </div>
                    <div className="comparison-row">
                      <span>Combustível</span>
                      <strong>{caminhao.combustivel}</strong>
                    </div>
                    <div className="comparison-row">
                      <span>Cor</span>
                      <strong>{caminhao.cor}</strong>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'abastecimento' && (
                <div className="prontuario-abastecimentos">
                  <div className="consumption-summary">
                    <div className="consumption-avatar">
                      <Fuel size={20} />
                    </div>
                    <div>
                      <h5>Consumo Médio Recente (Baseado nos últimos logs)</h5>
                      <p className="consumption-value">
                        {mediaConsumo ? `${mediaConsumo} KM/L` : 'Indisponível (Sem registros de quilometragem e litros nos abastecimentos)'}
                      </p>
                    </div>
                  </div>

                  <div className="table-container shadow-none p-0 mt-3 border-none">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Litros</th>
                          <th>Combustível</th>
                          <th>KM Atual</th>
                          <th>Posto / Tanque</th>
                          <th>Valor Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {abastecimentosFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                              Nenhum abastecimento recente cadastrado para este veículo.
                            </td>
                          </tr>
                        ) : (
                          abastecimentosFiltrados.map(a => (
                            <tr key={a.id}>
                              <td>{formatDisplayDate(a.data_abastecimento)}</td>
                              <td>{parseFloat(a.quantidade_litros.toString()).toLocaleString('pt-BR')} L</td>
                              <td>{a.combustivel}</td>
                              <td>{a.km_rodado ? `${a.km_rodado.toLocaleString('pt-BR')} km` : '-'}</td>
                              <td>{a.posto_tanque || '-'}</td>
                              <td className="valor-cell">{a.preco_total ? formatCurrency(a.preco_total) : '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
