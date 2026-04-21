import { Cliente } from '../../types/cliente';

export interface CadastroClientesStatsProps {
  estatisticas: {
    total: number;
    ativos: number;
    inativos: number;
    fisicas: number;
    juridicas: number;
  };
}

export interface CadastroClientesFiltersProps {
  filtro: string;
  setFiltro: (valor: string) => void;
  mostrarFiltros: boolean;
  setMostrarFiltros: (mostrar: boolean) => void;
  filtroTipo: 'todos' | 'fisica' | 'juridica';
  setFiltroTipo: (tipo: 'todos' | 'fisica' | 'juridica') => void;
  filtroSituacao: 'todos' | 'ativo' | 'inativo';
  setFiltroSituacao: (situacao: 'todos' | 'ativo' | 'inativo') => void;
  limparFiltros: () => void;
  abrirModal: () => void;
}

export interface CadastroClientesTableProps {
  clientesOrdenados: Cliente[];
  clientesPaginados: Cliente[];
  ordenacao: 'nome' | 'data' | 'situacao';
  direcaoOrdenacao: 'asc' | 'desc';
  alterarOrdenacao: (novaOrdenacao: 'nome' | 'data' | 'situacao') => void;
  abrirModal: (cliente?: Cliente) => void;
  alterarSituacao: (cliente: Cliente) => void;
  filtro: string;
  filtroTipo: 'todos' | 'fisica' | 'juridica';
  filtroSituacao: 'todos' | 'ativo' | 'inativo';
  limparFiltros: () => void;
  paginaAtual: number;
  setPaginaAtual: (pagina: number | ((prev: number) => number)) => void;
  totalPaginas: number;
  indiceInicial: number;
  indiceFinal: number;
}
