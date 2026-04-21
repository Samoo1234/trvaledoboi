import React from 'react';
import { Search, RotateCcw, Filter, X } from 'lucide-react';
import { Motorista } from '../../../services/motoristaService';

interface HistoricoFiltersProps {
  activeTab: 'fretes' | 'fechamentos';
  mostrandoFiltros: boolean;
  setMostrandoFiltros: (mostrando: boolean) => void;
  filtrosAtivos: boolean;
  executarBusca: () => void;
  limparFiltros: () => void;
  carregarTodosRegistros: () => void;
  loading: boolean;
  filtrosFrete: {
    dataInicio: string;
    dataFim: string;
    motorista: string;
    cliente: string;
    tipoPagamento: string;
    buscarTexto: string;
  };
  handleFiltroFreteChange: (campo: string, valor: string) => void;
  filtrosFechamento: {
    dataInicio: string;
    dataFim: string;
    motorista: string;
    tipoMotorista: string;
    periodo: string;
    buscarTexto: string;
  };
  handleFiltroFechamentoChange: (campo: string, valor: string) => void;
  motoristas: Motorista[];
  getClientesUnicos: () => string[];
  getTiposPagamento: () => string[];
  getTiposMotorista: () => string[];
}

const HistoricoFilters: React.FC<HistoricoFiltersProps> = ({
  activeTab,
  mostrandoFiltros,
  setMostrandoFiltros,
  filtrosAtivos,
  executarBusca,
  limparFiltros,
  carregarTodosRegistros,
  loading,
  filtrosFrete,
  handleFiltroFreteChange,
  filtrosFechamento,
  handleFiltroFechamentoChange,
  motoristas,
  getClientesUnicos,
  getTiposPagamento,
  getTiposMotorista
}) => {
  return (
    <>
      <div className="filter-controls">
        <button
          className="filter-toggle"
          onClick={() => setMostrandoFiltros(!mostrandoFiltros)}
        >
          <Filter size={20} />
          {mostrandoFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          {filtrosAtivos && <span className="filtros-ativos-badge">!</span>}
        </button>
        <div className="search-actions">
          <button className="search-btn" onClick={executarBusca} disabled={loading}>
            <Search size={20} />
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          <button className="clear-btn" onClick={limparFiltros} disabled={loading}>
            <X size={20} />
            {filtrosAtivos ? 'Limpar e Ver Todos' : 'Ver Todos'}
          </button>
          <button 
            className="reload-btn" 
            onClick={carregarTodosRegistros} 
            disabled={loading}
            title="Carregar todos os registros"
          >
            <RotateCcw size={20} />
            Todos
          </button>
        </div>
      </div>

      {mostrandoFiltros && (
        <div className="filters-expanded">
          {activeTab === 'fretes' ? (
            <div className="filters-grid">
              <div className="filter-group">
                <label>Data Início:</label>
                <input
                  type="date"
                  value={filtrosFrete.dataInicio}
                  onChange={(e) => handleFiltroFreteChange('dataInicio', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Data Fim:</label>
                <input
                  type="date"
                  value={filtrosFrete.dataFim}
                  onChange={(e) => handleFiltroFreteChange('dataFim', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Motorista:</label>
                <select
                  value={filtrosFrete.motorista}
                  onChange={(e) => handleFiltroFreteChange('motorista', e.target.value)}
                >
                  <option value="">Todos</option>
                  {motoristas.map(m => (
                    <option key={m.id} value={m.id?.toString()}>{m.nome}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Cliente:</label>
                <select
                  value={filtrosFrete.cliente}
                  onChange={(e) => handleFiltroFreteChange('cliente', e.target.value)}
                >
                  <option value="">Todos</option>
                  {getClientesUnicos().map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Tipo Pagamento:</label>
                <select
                  value={filtrosFrete.tipoPagamento}
                  onChange={(e) => handleFiltroFreteChange('tipoPagamento', e.target.value)}
                >
                  <option value="">Todos</option>
                  {getTiposPagamento().map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Buscar Texto:</label>
                <input
                  type="text"
                  placeholder="Número, origem, destino..."
                  value={filtrosFrete.buscarTexto}
                  onChange={(e) => handleFiltroFreteChange('buscarTexto', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="filters-grid">
              <div className="filter-group">
                <label>Data Início:</label>
                <input
                  type="date"
                  value={filtrosFechamento.dataInicio}
                  onChange={(e) => handleFiltroFechamentoChange('dataInicio', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Data Fim:</label>
                <input
                  type="date"
                  value={filtrosFechamento.dataFim}
                  onChange={(e) => handleFiltroFechamentoChange('dataFim', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Motorista:</label>
                <select
                  value={filtrosFechamento.motorista}
                  onChange={(e) => handleFiltroFechamentoChange('motorista', e.target.value)}
                >
                  <option value="">Todos</option>
                  {motoristas.map(m => (
                    <option key={m.id} value={m.id?.toString()}>{m.nome}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Tipo Motorista:</label>
                <select
                  value={filtrosFechamento.tipoMotorista}
                  onChange={(e) => handleFiltroFechamentoChange('tipoMotorista', e.target.value)}
                >
                  <option value="">Todos</option>
                  {getTiposMotorista().map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Período:</label>
                <input
                  type="text"
                  placeholder="MM/YYYY"
                  value={filtrosFechamento.periodo}
                  onChange={(e) => handleFiltroFechamentoChange('periodo', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Buscar Texto:</label>
                <input
                  type="text"
                  placeholder="Nome, observações..."
                  value={filtrosFechamento.buscarTexto}
                  onChange={(e) => handleFiltroFechamentoChange('buscarTexto', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default HistoricoFilters;
