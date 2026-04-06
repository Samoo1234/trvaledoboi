import React from 'react';
import { Calculator, FileText } from 'lucide-react';
import { FechamentoMotorista } from '../../../services/fechamentoService';

interface FechamentoMotoristasFiltersProps {
  modoFiltro: 'mensal' | 'periodo' | 'motorista';
  handleModoFiltroChange: (novoModo: 'mensal' | 'periodo' | 'motorista') => void;
  selectedPeriodo: string;
  setSelectedPeriodo: (periodo: string) => void;
  gerarPeriodos: () => Array<{ valor: string; nome: string }>;
  filtrosPeriodo: { dataInicio: string; dataFim: string };
  handleFiltroPeriodoChange: (campo: 'dataInicio' | 'dataFim', valor: string) => void;
  aplicarFiltrosPeriodo: () => void;
  limparFiltrosPeriodo: () => void;
  motoristasSelecionado: number | null;
  setMotoristaSelecionado: (id: number | null) => void;
  motoristas: Array<{ id: number; nome: string; tipo_motorista: string }>;
  filtrosMotorista: { dataInicio: string; dataFim: string };
  handleFiltroMotoristaChange: (campo: 'dataInicio' | 'dataFim', valor: string) => void;
  aplicarFiltrosMotorista: () => void;
  limparFiltrosMotorista: () => void;
  filtroTipoMotorista: string;
  setFiltroTipoMotorista: (tipo: string) => void;
  fechamentos: FechamentoMotorista[];
  fechamentosFiltrados: FechamentoMotorista[];
  calcularFechamento: () => void;
  calculandoFechamento: boolean;
  gerarRelatorioConsolidado: () => void;
  gerarRelatorioConsolidadoPorMotorista: () => void;
}

const FechamentoMotoristasFilters: React.FC<FechamentoMotoristasFiltersProps> = ({
  modoFiltro,
  handleModoFiltroChange,
  selectedPeriodo,
  setSelectedPeriodo,
  gerarPeriodos,
  filtrosPeriodo,
  handleFiltroPeriodoChange,
  aplicarFiltrosPeriodo,
  limparFiltrosPeriodo,
  motoristasSelecionado,
  setMotoristaSelecionado,
  motoristas,
  filtrosMotorista,
  handleFiltroMotoristaChange,
  aplicarFiltrosMotorista,
  limparFiltrosMotorista,
  filtroTipoMotorista,
  setFiltroTipoMotorista,
  fechamentos,
  fechamentosFiltrados,
  calcularFechamento,
  calculandoFechamento,
  gerarRelatorioConsolidado,
  gerarRelatorioConsolidadoPorMotorista
}) => {
  return (
    <div className="header-actions">
      {/* Toggle entre modos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '15px' }}>
        <span style={{ fontSize: '14px', color: '#666' }}>Filtrar por:</span>
        <div style={{ 
          display: 'flex', 
          background: '#f8f9fa', 
          borderRadius: '6px', 
          border: '1px solid #dee2e6',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => handleModoFiltroChange('mensal')}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: modoFiltro === 'mensal' ? '#007bff' : 'transparent',
              color: modoFiltro === 'mensal' ? 'white' : '#495057',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Mês
          </button>
          <button
            onClick={() => handleModoFiltroChange('periodo')}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: modoFiltro === 'periodo' ? '#007bff' : 'transparent',
              color: modoFiltro === 'periodo' ? 'white' : '#495057',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Período
          </button>
          <button
            onClick={() => handleModoFiltroChange('motorista')}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: modoFiltro === 'motorista' ? '#007bff' : 'transparent',
              color: modoFiltro === 'motorista' ? 'white' : '#495057',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Motorista
          </button>
        </div>
      </div>

      {/* Filtros condicionais baseados no modo */}
      {modoFiltro === 'mensal' ? (
        <select 
          value={selectedPeriodo}
          onChange={(e) => setSelectedPeriodo(e.target.value)}
          className="periodo-select"
        >
          {gerarPeriodos().map(periodo => (
            <option key={periodo.valor} value={periodo.valor}>
              {periodo.nome}
            </option>
          ))}
        </select>
      ) : modoFiltro === 'periodo' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="date"
            value={filtrosPeriodo.dataInicio}
            onChange={(e) => handleFiltroPeriodoChange('dataInicio', e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
            title="Data início"
          />
          <span style={{ color: '#666', fontSize: '13px' }}>até</span>
          <input
            type="date"
            value={filtrosPeriodo.dataFim}
            onChange={(e) => handleFiltroPeriodoChange('dataFim', e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
            title="Data fim"
          />
          <button 
            onClick={aplicarFiltrosPeriodo}
            style={{ 
              padding: '4px 8px', 
              background: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              fontSize: '12px',
              cursor: 'pointer'
            }}
            title="Aplicar filtro por período"
          >
            Aplicar
          </button>
          <button 
            onClick={limparFiltrosPeriodo}
            style={{ 
              padding: '4px 8px', 
              background: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              fontSize: '12px',
              cursor: 'pointer'
            }}
            title="Limpar filtros de período"
          >
            Limpar
          </button>
        </div>
      ) : modoFiltro === 'motorista' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select 
            value={motoristasSelecionado || ''}
            onChange={(e) => setMotoristaSelecionado(e.target.value ? parseInt(e.target.value) : null)}
            className="periodo-select"
            style={{ minWidth: '200px' }}
          >
            <option value="">Selecione um motorista</option>
            {motoristas.map(motorista => (
              <option key={motorista.id} value={motorista.id}>
                {motorista.nome} ({motorista.tipo_motorista})
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filtrosMotorista.dataInicio}
            onChange={(e) => handleFiltroMotoristaChange('dataInicio', e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
            title="Data início (opcional)"
            placeholder="Data início"
          />
          <span style={{ color: '#666', fontSize: '13px' }}>até</span>
          <input
            type="date"
            value={filtrosMotorista.dataFim}
            onChange={(e) => handleFiltroMotoristaChange('dataFim', e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
            title="Data fim (opcional)"
            placeholder="Data fim"
          />
          <button 
            onClick={aplicarFiltrosMotorista}
            style={{ 
              padding: '4px 8px', 
              background: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              fontSize: '12px',
              cursor: 'pointer'
            }}
            title="Aplicar filtro por motorista"
          >
            Aplicar
          </button>
          {(filtrosMotorista.dataInicio || filtrosMotorista.dataFim || motoristasSelecionado) && (
            <button 
              onClick={() => {
                setMotoristaSelecionado(null);
                limparFiltrosMotorista();
              }}
              style={{ 
                padding: '4px 8px', 
                background: '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                fontSize: '12px',
                cursor: 'pointer'
              }}
              title="Limpar filtros de motorista"
            >
              Limpar
            </button>
          )}
        </div>
      ) : null}

      <select 
        value={filtroTipoMotorista}
        onChange={(e) => setFiltroTipoMotorista(e.target.value)}
        className="periodo-select"
        title="Filtrar por tipo de motorista"
      >
        <option value="Todos">Todos os Tipos</option>
        <option value="Funcionário">
          Funcionário ({fechamentos.filter(f => f.motorista?.tipo_motorista === 'Funcionário').length})
        </option>
        <option value="Terceiro">
          Terceiro ({fechamentos.filter(f => f.motorista?.tipo_motorista === 'Terceiro').length})
        </option>
      </select>
      
      {modoFiltro === 'mensal' && (
        <button 
          className="btn-primary"
          onClick={calcularFechamento}
          disabled={calculandoFechamento}
        >
          <Calculator size={20} />
          {calculandoFechamento ? 'Calculando...' : 'Calcular Fechamento'}
        </button>
      )}
      
      {fechamentosFiltrados.length > 0 && modoFiltro !== 'motorista' && (
        <button 
          className="btn-secondary"
          onClick={gerarRelatorioConsolidado}
          title="Gerar Relatório Consolidado em PDF"
        >
          <FileText size={20} />
          Relatório Consolidado
        </button>
      )}

      {modoFiltro === 'motorista' && motoristasSelecionado && (
        <button 
          className="btn-secondary"
          onClick={gerarRelatorioConsolidadoPorMotorista}
          title="Gerar Relatório Consolidado do Motorista em PDF"
        >
          <FileText size={20} />
          Relatório Consolidado Motorista
        </button>
      )}
    </div>
  );
};

export default FechamentoMotoristasFilters;
