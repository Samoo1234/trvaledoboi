import React from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { CadastroClientesFiltersProps } from '../utils';

const CadastroClientesFilters: React.FC<CadastroClientesFiltersProps> = ({
  filtro,
  setFiltro,
  mostrarFiltros,
  setMostrarFiltros,
  filtroTipo,
  setFiltroTipo,
  filtroSituacao,
  setFiltroSituacao,
  limparFiltros,
  abrirModal
}) => {
  return (
    <>
      <div className="controles">
        <div className="filtros">
          <div className="busca-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF/CNPJ, fantasia, email, telefone ou cidade..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="campo-busca"
              aria-label="Campo de busca para clientes"
            />
          </div>
          
          <button
            className={`btn-filtros ${mostrarFiltros ? 'ativo' : ''}`}
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            aria-label="Mostrar filtros avançados"
          >
            <Filter size={18} />
            Filtros
          </button>
        </div>

        <div className="acoes-principais">
          <button
            className="btn-exportar"
            onClick={() => {/* TODO: Implementar exportação */}}
            aria-label="Exportar lista de clientes"
          >
            <Download size={18} />
            Exportar
          </button>
          
          <button
            className="btn-novo-cliente"
            onClick={() => abrirModal()}
            aria-label="Adicionar novo cliente"
          >
            ➕ Novo Cliente
          </button>
        </div>
      </div>

      {/* Filtros Avançados */}
      {mostrarFiltros && (
        <div className="filtros-avancados">
          <div className="filtro-grupo">
            <label>Tipo de Pessoa:</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as 'todos' | 'fisica' | 'juridica')}
              className="filtro-select"
            >
              <option value="todos">Todos</option>
              <option value="fisica">Física</option>
              <option value="juridica">Jurídica</option>
            </select>
          </div>
          
          <div className="filtro-grupo">
            <label>Situação:</label>
            <select
              value={filtroSituacao}
              onChange={(e) => setFiltroSituacao(e.target.value as 'todos' | 'ativo' | 'inativo')}
              className="filtro-select"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
          
          <button
            className="btn-limpar-filtros"
            onClick={limparFiltros}
          >
            Limpar Filtros
          </button>
        </div>
      )}
    </>
  );
};

export default CadastroClientesFilters;
