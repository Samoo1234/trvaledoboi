import React from 'react';
import { User, Building, Phone, Mail, MapPin, Calendar, Eye, EyeOff, Edit } from 'lucide-react';
import { CadastroClientesTableProps } from '../utils';

const CadastroClientesTable: React.FC<CadastroClientesTableProps> = ({
  clientesOrdenados,
  clientesPaginados,
  ordenacao,
  direcaoOrdenacao,
  alterarOrdenacao,
  abrirModal,
  alterarSituacao,
  filtro,
  filtroTipo,
  filtroSituacao,
  limparFiltros,
  paginaAtual,
  setPaginaAtual,
  totalPaginas,
  indiceInicial,
  indiceFinal
}) => {
  return (
    <div className="lista-clientes">
      <div className="lista-header">
        <h2>Clientes Cadastrados ({clientesOrdenados.length})</h2>
        <div className="info-paginacao">
          Mostrando {indiceInicial + 1} a {Math.min(indiceFinal, clientesOrdenados.length)} de {clientesOrdenados.length} clientes
        </div>
      </div>
      
      {clientesOrdenados.length === 0 ? (
        <div className="sem-clientes">
          <div className="sem-clientes-icon">
            <User size={48} />
          </div>
          <h3>Nenhum cliente encontrado</h3>
          <p>
            {filtro || filtroTipo !== 'todos' || filtroSituacao !== 'todos' 
              ? 'Tente ajustar os filtros de busca ou limpar os filtros aplicados.'
              : 'Comece cadastrando seu primeiro cliente no sistema.'
            }
          </p>
          {filtro || filtroTipo !== 'todos' || filtroSituacao !== 'todos' ? (
            <button className="btn-limpar-filtros" onClick={limparFiltros}>
              Limpar Filtros
            </button>
          ) : (
            <button className="btn-novo-cliente" onClick={() => abrirModal()}>
              ➕ Cadastrar Primeiro Cliente
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="tabela-container">
            <table className="tabela-clientes" role="table" aria-label="Lista de clientes cadastrados">
              <thead>
                <tr>
                  <th 
                    scope="col" 
                    className={`sortable ${ordenacao === 'nome' ? 'active' : ''}`}
                    onClick={() => alterarOrdenacao('nome')}
                  >
                    <div className="th-content">
                      <span>Cliente</span>
                      {ordenacao === 'nome' && (
                        <span className="sort-indicator">
                          {direcaoOrdenacao === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th scope="col">CPF/CNPJ</th>
                  <th 
                    scope="col" 
                    className={`sortable ${ordenacao === 'situacao' ? 'active' : ''}`}
                    onClick={() => alterarOrdenacao('situacao')}
                  >
                    <div className="th-content">
                      <span>Tipo</span>
                      {ordenacao === 'situacao' && (
                        <span className="sort-indicator">
                          {direcaoOrdenacao === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th scope="col">Contato</th>
                  <th scope="col">Endereço</th>
                  <th 
                    scope="col" 
                    className={`sortable ${ordenacao === 'data' ? 'active' : ''}`}
                    onClick={() => alterarOrdenacao('data')}
                  >
                    <div className="th-content">
                      <span>Data Cadastro</span>
                      {ordenacao === 'data' && (
                        <span className="sort-indicator">
                          {direcaoOrdenacao === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th scope="col">Situação</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientesPaginados.map((cliente) => (
                  <tr key={cliente.id} className={cliente.situacao === 'Inativo' ? 'inativo' : ''}>
                    <td>
                      <div className="cliente-info">
                        <div className="cliente-nome">
                          <strong>{cliente.razao_social}</strong>
                          {cliente.nome_fantasia && (
                            <small>{cliente.nome_fantasia}</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="cpf-cnpj">{cliente.cpf_cnpj}</code>
                    </td>
                    <td>
                      <span className={`tipo ${cliente.tipo_pessoa.toLowerCase()}`}>
                        {cliente.tipo_pessoa === 'Física' ? <User size={16} /> : <Building size={16} />}
                        {cliente.tipo_pessoa}
                      </span>
                    </td>
                    <td>
                      <div className="contato-info">
                        {cliente.telefone && (
                          <div className="contato-item">
                            <Phone size={14} />
                            <span>{cliente.telefone}</span>
                          </div>
                        )}
                        {cliente.celular && (
                          <div className="contato-item">
                            <Phone size={14} />
                            <span>{cliente.celular}</span>
                          </div>
                        )}
                        {cliente.email && (
                          <div className="contato-item">
                            <Mail size={14} />
                            <span>{cliente.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="endereco-info">
                        {cliente.logradouro && (
                          <div className="endereco-item">
                            <MapPin size={14} />
                            <span>{cliente.logradouro}, {cliente.numero}</span>
                          </div>
                        )}
                        {cliente.bairro && (
                          <div className="endereco-item">
                            <span>{cliente.bairro}</span>
                          </div>
                        )}
                        {cliente.municipio && (
                          <div className="endereco-item">
                            <span>{cliente.municipio} - {cliente.uf}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="data-info">
                        <Calendar size={14} />
                        <span>{new Date(cliente.data_cadastro).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`situacao ${cliente.situacao.toLowerCase()}`}>
                        {cliente.situacao === 'Ativo' ? <Eye size={14} /> : <EyeOff size={14} />}
                        {cliente.situacao}
                      </span>
                    </td>
                    <td>
                      <div className="acoes">
                        <button
                          className="btn-editar"
                          onClick={() => abrirModal(cliente)}
                          title="Editar cliente"
                          aria-label={`Editar cliente ${cliente.razao_social}`}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className={`btn-situacao ${cliente.situacao === 'Ativo' ? 'desativar' : 'ativar'}`}
                          onClick={() => alterarSituacao(cliente)}
                          title={cliente.situacao === 'Ativo' ? 'Desativar' : 'Ativar'}
                          aria-label={`${cliente.situacao === 'Ativo' ? 'Desativar' : 'Ativar'} cliente ${cliente.razao_social}`}
                        >
                          {cliente.situacao === 'Ativo' ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="paginacao">
              <div className="paginacao-info">
                Página {paginaAtual} de {totalPaginas}
              </div>
              
              <div className="paginacao-botoes">
                <button
                  className="btn-pagina"
                  onClick={() => setPaginaAtual(1)}
                  disabled={paginaAtual === 1}
                >
                  ««
                </button>
                <button
                  className="btn-pagina"
                  onClick={() => setPaginaAtual(paginaAtual - 1)}
                  disabled={paginaAtual === 1}
                >
                  «
                </button>
                
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  const pagina = Math.max(1, Math.min(totalPaginas - 4, paginaAtual - 2)) + i;
                  if (pagina > totalPaginas) return null;
                  
                  return (
                    <button
                      key={pagina}
                      className={`btn-pagina ${pagina === paginaAtual ? 'ativa' : ''}`}
                      onClick={() => setPaginaAtual(pagina)}
                    >
                      {pagina}
                    </button>
                  );
                })}
                
                <button
                  className="btn-pagina"
                  onClick={() => setPaginaAtual(paginaAtual + 1)}
                  disabled={paginaAtual === totalPaginas}
                >
                  »
                </button>
                <button
                  className="btn-pagina"
                  onClick={() => setPaginaAtual(totalPaginas)}
                  disabled={paginaAtual === totalPaginas}
                >
                  »»
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CadastroClientesTable;
