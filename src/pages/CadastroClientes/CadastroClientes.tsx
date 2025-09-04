import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import ModalCadastroClientes from '../../components/ModalCadastroClientes/ModalCadastroClientes';
import { Cliente } from '../../types/cliente';
import { Search, Filter, Download, Eye, EyeOff, Edit, MapPin, Phone, Mail, Calendar, User, Building } from 'lucide-react';
import './CadastroClientes.css';

const CadastroClientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | null>(null);
  const [filtro, setFiltro] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'fisica' | 'juridica'>('todos');
  const [filtroSituacao, setFiltroSituacao] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [ordenacao, setOrdenacao] = useState<'nome' | 'data' | 'situacao'>('nome');
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<'asc' | 'desc'>('asc');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Memoizar função de carregamento para evitar recriações
  const carregarClientes = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('razao_social', { ascending: true });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido ao carregar clientes';
      setErro(mensagemErro);
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  const abrirModal = useCallback((cliente?: Cliente) => {
    setClienteParaEditar(cliente || null);
    setModalAberto(true);
  }, []);

  const fecharModal = useCallback(() => {
    setModalAberto(false);
    setClienteParaEditar(null);
  }, []);

  const handleClienteSalvo = useCallback((cliente: Cliente) => {
    if (clienteParaEditar) {
      // Atualizar cliente existente
      setClientes(prev => prev.map(c => c.id === cliente.id ? cliente : c));
    } else {
      // Adicionar novo cliente
      setClientes(prev => [...prev, cliente]);
    }
  }, [clienteParaEditar]);

  const alterarSituacao = useCallback(async (cliente: Cliente) => {
    try {
      setErro(null);
      const novaSituacao = cliente.situacao === 'Ativo' ? 'Inativo' : 'Ativo';
      
      const { error } = await supabase
        .from('clientes')
        .update({ situacao: novaSituacao })
        .eq('id', cliente.id);

      if (error) throw error;

      // Atualizar estado local
      setClientes(prev => prev.map(c => 
        c.id === cliente.id ? { ...c, situacao: novaSituacao } : c
      ));
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro ao alterar situação';
      setErro(mensagemErro);
      console.error('Erro ao alterar situação:', error);
    }
  }, []);

  // Estatísticas dos clientes
  const estatisticas = useMemo(() => {
    const total = clientes.length;
    const ativos = clientes.filter(c => c.situacao === 'Ativo').length;
    const inativos = clientes.filter(c => c.situacao === 'Inativo').length;
    const fisicas = clientes.filter(c => c.tipo_pessoa === 'Física').length;
    const juridicas = clientes.filter(c => c.tipo_pessoa === 'Jurídica').length;
    
    return { total, ativos, inativos, fisicas, juridicas };
  }, [clientes]);

  // Memoizar filtros e ordenação para melhor performance
  const clientesFiltrados = useMemo(() => {
    let filtrados = clientes;

    // Filtro de texto
    if (filtro) {
      filtrados = filtrados.filter(cliente =>
        cliente.razao_social.toLowerCase().includes(filtro.toLowerCase()) ||
        cliente.cpf_cnpj.includes(filtro) ||
        cliente.nome_fantasia?.toLowerCase().includes(filtro.toLowerCase()) ||
        cliente.email?.toLowerCase().includes(filtro.toLowerCase()) ||
        cliente.telefone?.includes(filtro) ||
        cliente.celular?.includes(filtro) ||
        cliente.municipio?.toLowerCase().includes(filtro.toLowerCase())
      );
    }

    // Filtro por tipo
    if (filtroTipo !== 'todos') {
      filtrados = filtrados.filter(cliente => 
        cliente.tipo_pessoa.toLowerCase() === filtroTipo
      );
    }

    // Filtro por situação
    if (filtroSituacao !== 'todos') {
      filtrados = filtrados.filter(cliente => 
        cliente.situacao.toLowerCase() === filtroSituacao
      );
    }

    return filtrados;
  }, [clientes, filtro, filtroTipo, filtroSituacao]);

  const clientesOrdenados = useMemo(() => {
    return [...clientesFiltrados].sort((a, b) => {
      let resultado = 0;
      
      switch (ordenacao) {
        case 'nome':
          resultado = a.razao_social.localeCompare(b.razao_social);
          break;
        case 'data':
          resultado = new Date(a.data_cadastro).getTime() - new Date(b.data_cadastro).getTime();
          break;
        case 'situacao':
          resultado = a.situacao.localeCompare(b.situacao);
          break;
        default:
          resultado = 0;
      }
      
      return direcaoOrdenacao === 'desc' ? -resultado : resultado;
    });
  }, [clientesFiltrados, ordenacao, direcaoOrdenacao]);

  // Paginação
  const totalPaginas = Math.ceil(clientesOrdenados.length / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = indiceInicial + itensPorPagina;
  const clientesPaginados = clientesOrdenados.slice(indiceInicial, indiceFinal);

  // Função para alterar ordenação
  const alterarOrdenacao = useCallback((novaOrdenacao: 'nome' | 'data' | 'situacao') => {
    if (ordenacao === novaOrdenacao) {
      setDirecaoOrdenacao(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenacao(novaOrdenacao);
      setDirecaoOrdenacao('asc');
    }
    setPaginaAtual(1);
  }, [ordenacao]);

  // Função para limpar filtros
  const limparFiltros = useCallback(() => {
    setFiltro('');
    setFiltroTipo('todos');
    setFiltroSituacao('todos');
    setPaginaAtual(1);
  }, []);

  // Função para limpar erro
  const limparErro = useCallback(() => {
    setErro(null);
  }, []);

  if (carregando) {
    return (
      <div className="cadastro-clientes">
        <div className="container-filho">
          <div className="carregando">
            <div className="spinner"></div>
            <p>Carregando clientes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-clientes">
      {/* Container filho com margens internas (como no seu desenho) */}
      <div className="container-filho">
        <div className="header">
          <div className="header-content">
            <h1>Cadastro de Clientes</h1>
            <p>Gerencie o cadastro de clientes do sistema</p>
          </div>
        </div>

        {/* Exibir mensagens de erro */}
        {erro && (
          <div className="mensagem-erro" role="alert" aria-live="polite">
            <span>⚠️ {erro}</span>
            <button 
              onClick={limparErro}
              className="btn-fechar-erro"
              aria-label="Fechar mensagem de erro"
            >
              ×
            </button>
          </div>
        )}

        {/* Estatísticas */}
        <div className="estatisticas">
          <div className="stat-card">
            <div className="stat-icon total">
              <User size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-number">{estatisticas.total}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon ativo">
              <Eye size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-number">{estatisticas.ativos}</span>
              <span className="stat-label">Ativos</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon inativo">
              <EyeOff size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-number">{estatisticas.inativos}</span>
              <span className="stat-label">Inativos</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon fisica">
              <User size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-number">{estatisticas.fisicas}</span>
              <span className="stat-label">Físicas</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon juridica">
              <Building size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-number">{estatisticas.juridicas}</span>
              <span className="stat-label">Jurídicas</span>
            </div>
          </div>
        </div>

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
      </div>

      {/* Modal de Cadastro */}
      <ModalCadastroClientes
        isOpen={modalAberto}
        onClose={fecharModal}
        onClienteSalvo={handleClienteSalvo}
        clienteInicial={clienteParaEditar}
      />
    </div>
  );
};

export default CadastroClientes;

