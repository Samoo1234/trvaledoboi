import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import ModalCadastroClientes from '../../components/ModalCadastroClientes/ModalCadastroClientes';
import { Cliente } from '../../types/cliente';
import './CadastroClientes.css';
import CadastroClientesStats from './components/CadastroClientesStats';
import CadastroClientesFilters from './components/CadastroClientesFilters';
import CadastroClientesTable from './components/CadastroClientesTable';

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

  const excluirCliente = useCallback(async (cliente: Cliente) => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir o cliente "${cliente.razao_social}"?\n\nEssa ação não pode ser desfeita.`
    );

    if (!confirmacao) return;

    try {
      setErro(null);

      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', cliente.id);

      if (error) throw error;

      // Remover do estado local
      setClientes(prev => prev.filter(c => c.id !== cliente.id));
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro ao excluir cliente';
      setErro(mensagemErro);
      console.error('Erro ao excluir cliente:', error);
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
      <div className="container-filho">
        <div className="header">
          <div className="header-content">
            <h1>Cadastro de Clientes</h1>
            <p>Gerencie o cadastro de clientes do sistema</p>
          </div>
        </div>

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
        <CadastroClientesStats estatisticas={estatisticas} />

        <CadastroClientesFilters
          filtro={filtro}
          setFiltro={setFiltro}
          mostrarFiltros={mostrarFiltros}
          setMostrarFiltros={setMostrarFiltros}
          filtroTipo={filtroTipo}
          setFiltroTipo={setFiltroTipo}
          filtroSituacao={filtroSituacao}
          setFiltroSituacao={setFiltroSituacao}
          limparFiltros={limparFiltros}
          abrirModal={abrirModal}
        />

        <CadastroClientesTable
          clientesOrdenados={clientesOrdenados}
          clientesPaginados={clientesPaginados}
          ordenacao={ordenacao}
          direcaoOrdenacao={direcaoOrdenacao}
          alterarOrdenacao={alterarOrdenacao}
          abrirModal={abrirModal}
          alterarSituacao={alterarSituacao}
          excluirCliente={excluirCliente}
          filtro={filtro}
          filtroTipo={filtroTipo}
          filtroSituacao={filtroSituacao}
          limparFiltros={limparFiltros}
          paginaAtual={paginaAtual}
          setPaginaAtual={setPaginaAtual}
          totalPaginas={totalPaginas}
          indiceInicial={indiceInicial}
          indiceFinal={indiceFinal}
        />
      </div>

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
