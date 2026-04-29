import React from 'react';
import { Filter, Download } from 'lucide-react';
import { formatDisplayDate } from '../../../services/dateUtils';
import { Frete } from '../../../services/freteService';
import { Motorista } from '../../../services/motoristaService';

interface ControleFreteFiltersProps {
  filtroSituacao: string;
  setFiltroSituacao: (v: string) => void;
  filtroDataInicio: string;
  setFiltroDataInicio: (v: string) => void;
  filtroDataFim: string;
  setFiltroDataFim: (v: string) => void;
  filtroCliente: string;
  setFiltroCliente: (v: string) => void;
  filtroMotorista: string;
  setFiltroMotorista: (v: string) => void;
  clientesCadastro: { id: number; razao_social: string }[];
  motoristas: Motorista[];
  onClearFilters: () => void;
  onGeneratePDF: () => void;
  fretesFiltrados: Frete[];
}

export const ControleFreteFilters: React.FC<ControleFreteFiltersProps> = ({
  filtroSituacao,
  setFiltroSituacao,
  filtroDataInicio,
  setFiltroDataInicio,
  filtroDataFim,
  setFiltroDataFim,
  filtroCliente,
  setFiltroCliente,
  filtroMotorista,
  setFiltroMotorista,
  clientesCadastro,
  motoristas,
  onClearFilters,
  onGeneratePDF,
  fretesFiltrados
}) => {
  return (
    <>
      <div className="filtros-container">
        <h3><Filter size={18} /> Filtros</h3>
        <div className="filtros-grid">
          <div className="filtro-group">
            <label>Situação</label>
            <select
              value={filtroSituacao}
              onChange={(e) => setFiltroSituacao(e.target.value)}
              className="filtro-select"
            >
              <option value="">Todas as Situações</option>
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago</option>
              <option value="FRIGORÍFICO">Frigorífico</option>
            </select>
          </div>

          <div className="filtro-group">
            <label>Data Início</label>
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="filtro-input"
            />
          </div>

          <div className="filtro-group">
            <label>Data Fim</label>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="filtro-input"
            />
          </div>

          <div className="filtro-group">
            <label>Cliente</label>
            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="filtro-select"
            >
              <option value="">Todos os Clientes</option>
              {clientesCadastro.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.razao_social}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label>Motorista</label>
            <select
              value={filtroMotorista}
              onChange={(e) => setFiltroMotorista(e.target.value)}
              className="filtro-select"
            >
              <option value="">Todos os Motoristas</option>
              {motoristas.map((motorista) => (
                <option key={motorista.id} value={motorista.id}>
                  {motorista.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <button
              type="button"
              className="btn-clear-filters"
              onClick={onClearFilters}
            >
              Limpar Filtros
            </button>
          </div>

          <div className="filtro-group">
            <button
              type="button"
              className="btn-pdf-fretes"
              onClick={onGeneratePDF}
              title="Gerar PDF dos fretes filtrados"
            >
              <Download size={16} />
              Gerar PDF
            </button>
          </div>
        </div>
      </div>

      {(filtroSituacao || filtroDataInicio || filtroDataFim || filtroCliente || filtroMotorista) && (
        <div className="filtros-resumo">
          <p>
            <strong>{fretesFiltrados.length}</strong> frete{fretesFiltrados.length !== 1 ? 's' : ''}
            {fretesFiltrados.length !== 1 ? ' encontrados' : ' encontrado'}
            {filtroSituacao && ` • Situação: ${filtroSituacao}`}
            {filtroDataInicio && ` • De: ${formatDisplayDate(filtroDataInicio)}`}
            {filtroDataFim && ` • Até: ${formatDisplayDate(filtroDataFim)}`}
            {filtroCliente && ` • Cliente: ${clientesCadastro.find(c => c.id === parseInt(filtroCliente))?.razao_social || filtroCliente}`}
            {filtroMotorista && ` • Motorista: ${motoristas.find(m => m.id === parseInt(filtroMotorista))?.nome || ''}`}
          </p>
        </div>
      )}
    </>
  );
};
