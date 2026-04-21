import React from 'react';
import { Caminhao } from '../../../services/caminhaoService';
import { Motorista } from '../../../services/motoristaService';

interface ControleAbastecimentoFiltersProps {
  filtros: {
    dataInicio: string;
    dataFim: string;
    caminhaoId: string;
    motoristaId: string;
    combustivel: string;
  };
  handleFiltroChange: (campo: string, valor: string) => void;
  caminhoes: Caminhao[];
  motoristas: Motorista[];
  aplicarFiltros: () => void;
  limparFiltros: () => void;
}

export const ControleAbastecimentoFilters: React.FC<ControleAbastecimentoFiltersProps> = ({
  filtros,
  handleFiltroChange,
  caminhoes,
  motoristas,
  aplicarFiltros,
  limparFiltros
}) => {
  return (
    <div className="filtros-section">
      <h3>Filtros</h3>
      <div className="filtros-grid">
        <div className="filtro-item">
          <label>Data Início:</label>
          <input
            type="date"
            value={filtros.dataInicio}
            onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
          />
        </div>
        <div className="filtro-item">
          <label>Data Fim:</label>
          <input
            type="date"
            value={filtros.dataFim}
            onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
          />
        </div>
        <div className="filtro-item">
          <label>Caminhão:</label>
          <select
            value={filtros.caminhaoId}
            onChange={(e) => handleFiltroChange('caminhaoId', e.target.value)}
          >
            <option value="">Todos</option>
            {caminhoes.map(caminhao => (
              <option key={caminhao.id} value={caminhao.id}>
                {caminhao.placa} - {caminhao.modelo}
              </option>
            ))}
          </select>
        </div>
        <div className="filtro-item">
          <label>Motorista:</label>
          <select
            value={filtros.motoristaId}
            onChange={(e) => handleFiltroChange('motoristaId', e.target.value)}
          >
            <option value="">Todos</option>
            {motoristas.map(motorista => (
              <option key={motorista.id} value={motorista.id}>
                {motorista.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="filtro-item">
          <label>Combustível:</label>
          <select
            value={filtros.combustivel}
            onChange={(e) => handleFiltroChange('combustivel', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="Diesel">Diesel</option>
            <option value="Gasolina">Gasolina</option>
            <option value="Etanol">Etanol</option>
            <option value="Arla 32">Arla 32</option>
          </select>
        </div>
      </div>
      <div className="filtros-actions">
        <button className="btn-secondary" onClick={aplicarFiltros}>
          Aplicar Filtros
        </button>
        <button className="btn-outline" onClick={limparFiltros}>
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};
