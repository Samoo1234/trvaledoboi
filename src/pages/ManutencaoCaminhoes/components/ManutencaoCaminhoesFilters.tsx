import React from 'react';
import { Filter, Plus, FileText } from 'lucide-react';
import { Caminhao } from '../../../services/caminhaoService';
import { gerarPeriodos } from '../utils';

interface ManutencaoCaminhoesFiltersProps {
  filtros: {
    periodo: string;
    caminhaoId: string;
    tipoManutencao: string;
  };
  setFiltros: React.Dispatch<React.SetStateAction<{
    periodo: string;
    caminhaoId: string;
    tipoManutencao: string;
  }>>;
  caminhoes: Caminhao[];
  setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
  gerarRelatorioConsolidado: () => Promise<void>;
}

export const ManutencaoCaminhoesFilters: React.FC<ManutencaoCaminhoesFiltersProps> = ({
  filtros,
  setFiltros,
  caminhoes,
  setShowForm,
  gerarRelatorioConsolidado
}) => {
  return (
    <div className="filtros-section">
      <h3><Filter size={20} /> Filtros</h3>
      <div className="filtros-grid">
        <div className="filtro-item">
          <label>Período:</label>
          <select 
            value={filtros.periodo}
            onChange={(e) => setFiltros({...filtros, periodo: e.target.value})}
          >
            <option value="">Todos os períodos</option>
            {gerarPeriodos().map(periodo => (
              <option key={periodo.valor} value={periodo.valor}>
                {periodo.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="filtro-item">
          <label>Caminhão:</label>
          <select 
            value={filtros.caminhaoId}
            onChange={(e) => setFiltros({...filtros, caminhaoId: e.target.value})}
          >
            <option value="">Todos os caminhões</option>
            {caminhoes.map(caminhao => (
              <option key={caminhao.id} value={caminhao.id}>
                {caminhao.placa} - {caminhao.modelo}
              </option>
            ))}
          </select>
        </div>
        <div className="filtro-item">
          <label>Tipo:</label>
          <select 
            value={filtros.tipoManutencao}
            onChange={(e) => setFiltros({...filtros, tipoManutencao: e.target.value})}
          >
            <option value="">Todos os tipos</option>
            <option value="Preventiva">Preventiva</option>
            <option value="Corretiva">Corretiva</option>
            <option value="Emergencial">Emergencial</option>
          </select>
        </div>
        <div className="filtro-actions">
          <button className="btn-secondary" onClick={() => setFiltros({periodo: '', caminhaoId: '', tipoManutencao: ''})}>
            Limpar
          </button>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={20} />
            Nova Manutenção
          </button>
          <button className="btn-info" onClick={gerarRelatorioConsolidado}>
            <FileText size={20} />
            Relatório
          </button>
        </div>
      </div>
    </div>
  );
};
