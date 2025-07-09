import React, { useState, useEffect } from 'react';
import { Archive, Search, RotateCcw, Eye, FileText, DollarSign, Filter, X } from 'lucide-react';
import { freteService, Frete } from '../../services/freteService';
import { fechamentoService, FechamentoMotorista } from '../../services/fechamentoService';
import { motoristaService, Motorista } from '../../services/motoristaService';
import { formatDisplayDate } from '../../services/dateUtils';
import './Historico.css';

const Historico: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fretes' | 'fechamentos'>('fretes');
  const [loading, setLoading] = useState(false);
  
  // Estados para fretes
  const [fretesArquivados, setFretesArquivados] = useState<Frete[]>([]);
  const [filtrosFrete, setFiltrosFrete] = useState({
    dataInicio: '',
    dataFim: '',
    motorista: '',
    cliente: '',
    tipoPagamento: '',
    buscarTexto: ''
  });
  
  // Estados para fechamentos
  const [fechamentosArquivados, setFechamentosArquivados] = useState<FechamentoMotorista[]>([]);
  const [filtrosFechamento, setFiltrosFechamento] = useState({
    dataInicio: '',
    dataFim: '',
    motorista: '',
    tipoMotorista: '',
    periodo: '',
    buscarTexto: ''
  });
  
  // Estados compartilhados
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [mostrandoFiltros, setMostrandoFiltros] = useState(false);
  const [filtrosAtivos, setFiltrosAtivos] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadMotoristas();
    // Carregar todos os registros automaticamente ao abrir a tela
    carregarTodosRegistros();
  }, []);

  // Carregar todos os registros sem filtros
  const carregarTodosRegistros = async () => {
    try {
      setLoading(true);
      // Buscar fretes arquivados sem filtros
      const fretes = await freteService.getArquivados({});
      setFretesArquivados(fretes);
      
      // Buscar fechamentos arquivados sem filtros  
      const fechamentos = await fechamentoService.getArquivados({});
      setFechamentosArquivados(fechamentos);
      
      setFiltrosAtivos(false);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      alert('Erro ao carregar registros arquivados.');
    } finally {
      setLoading(false);
    }
  };

  const loadMotoristas = async () => {
    try {
      const data = await motoristaService.getAll();
      setMotoristas(data);
    } catch (error) {
      console.error('Erro ao carregar motoristas:', error);
    }
  };

  const buscarFretesArquivados = async () => {
    try {
      setLoading(true);
      const data = await freteService.getArquivados(filtrosFrete);
      setFretesArquivados(data);
      
      // Verificar se existem filtros ativos
      const temFiltros = Object.values(filtrosFrete).some(valor => valor.trim() !== '');
      setFiltrosAtivos(temFiltros);
    } catch (error) {
      console.error('Erro ao buscar fretes arquivados:', error);
      alert('Erro ao buscar fretes arquivados.');
    } finally {
      setLoading(false);
    }
  };

  const buscarFechamentosArquivados = async () => {
    try {
      setLoading(true);
      const data = await fechamentoService.getArquivados(filtrosFechamento);
      setFechamentosArquivados(data);
      
      // Verificar se existem filtros ativos
      const temFiltros = Object.values(filtrosFechamento).some(valor => valor.trim() !== '');
      setFiltrosAtivos(temFiltros);
    } catch (error) {
      console.error('Erro ao buscar fechamentos arquivados:', error);
      alert('Erro ao buscar fechamentos arquivados.');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroFreteChange = (campo: string, valor: string) => {
    setFiltrosFrete(prev => ({ ...prev, [campo]: valor }));
  };

  const handleFiltroFechamentoChange = (campo: string, valor: string) => {
    setFiltrosFechamento(prev => ({ ...prev, [campo]: valor }));
  };

  const limparFiltros = () => {
    if (activeTab === 'fretes') {
      setFiltrosFrete({
        dataInicio: '',
        dataFim: '',
        motorista: '',
        cliente: '',
        tipoPagamento: '',
        buscarTexto: ''
      });
    } else {
      setFiltrosFechamento({
        dataInicio: '',
        dataFim: '',
        motorista: '',
        tipoMotorista: '',
        periodo: '',
        buscarTexto: ''
      });
    }
    // Carregar todos os registros automaticamente após limpar
    carregarTodosRegistros();
  };

  const reabrirFrete = async (freteId: number) => {
    if (window.confirm('Tem certeza que deseja reabrir este frete para correção?')) {
      try {
        setLoading(true);
        await freteService.reabrir(freteId);
        alert('✅ Frete reaberto com sucesso! Agora está disponível para edição na tela de Controle de Fretes.');
        // Atualizar lista
        if (activeTab === 'fretes') {
          buscarFretesArquivados();
        }
      } catch (error: any) {
        console.error('Erro ao reabrir frete:', error);
        const mensagem = error?.message || 'Erro desconhecido';
        alert(`❌ Erro ao reabrir frete: ${mensagem}\n\nTente novamente ou contate o suporte.`);
      } finally {
        setLoading(false);
      }
    }
  };

  const reabrirFechamento = async (fechamentoId: number) => {
    if (window.confirm('Tem certeza que deseja reabrir este fechamento para correção?')) {
      try {
        setLoading(true);
        await fechamentoService.reabrir(fechamentoId);
        alert('✅ Fechamento reaberto com sucesso! Agora está disponível para edição na tela de Fechamentos.');
        // Atualizar lista
        if (activeTab === 'fechamentos') {
          buscarFechamentosArquivados();
        }
      } catch (error: any) {
        console.error('Erro ao reabrir fechamento:', error);
        const mensagem = error?.message || 'Erro desconhecido';
        alert(`❌ Erro ao reabrir fechamento: ${mensagem}\n\nTente novamente ou contate o suporte.`);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getClientesUnicos = (): string[] => {
    const clientes = fretesArquivados.map(f => f.cliente).filter(Boolean) as string[];
    return Array.from(new Set(clientes)).sort();
  };

  const getTiposPagamento = (): string[] => {
    const tipos = fretesArquivados.map(f => f.tipo_pagamento).filter(Boolean) as string[];
    return Array.from(new Set(tipos)).sort();
  };

  const getTiposMotorista = (): string[] => {
    const tipos = fechamentosArquivados.map(f => f.motorista?.tipo_motorista).filter(Boolean) as string[];
    return Array.from(new Set(tipos)).sort();
  };

  const executarBusca = () => {
    if (activeTab === 'fretes') {
      buscarFretesArquivados();
    } else {
      buscarFechamentosArquivados();
    }
  };

  return (
    <div className="historico-container">
      <div className="historico-header">
        <div className="header-title">
          <Archive size={32} />
          <h1>Histórico de Registros</h1>
        </div>
        <p className="header-subtitle">
          Consulte e gerencie registros arquivados de fretes e fechamentos
        </p>
      </div>

      {/* Abas */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'fretes' ? 'active' : ''}`}
          onClick={() => setActiveTab('fretes')}
        >
          <FileText size={20} />
          Fretes Arquivados
        </button>
        <button
          className={`tab-button ${activeTab === 'fechamentos' ? 'active' : ''}`}
          onClick={() => setActiveTab('fechamentos')}
        >
          <DollarSign size={20} />
          Fechamentos Arquivados
        </button>
      </div>

      {/* Controles de Filtro */}
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

      {/* Aviso quando há filtros ativos mas sem resultados */}
      {filtrosAtivos && (
        <div className="filtros-info">
          <div className="filtros-warning">
            📋 <strong>Filtros ativos aplicados.</strong> 
            {activeTab === 'fretes' && fretesArquivados.length === 0 && (
              <span> Nenhum frete encontrado no período/critério selecionado.</span>
            )}
            {activeTab === 'fechamentos' && fechamentosArquivados.length === 0 && (
              <span> Nenhum fechamento encontrado no período/critério selecionado.</span>
            )}
            <button onClick={limparFiltros} className="link-btn">Clique aqui para ver todos os registros</button>
          </div>
        </div>
      )}

      {/* Filtros Expandidos */}
      {mostrandoFiltros && (
        <div className="filters-expanded">
          {activeTab === 'fretes' ? (
            // Filtros para Fretes
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
            // Filtros para Fechamentos
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

      {/* Conteúdo das Abas */}
      <div className="tab-content">
        {activeTab === 'fretes' ? (
          <div className="fretes-arquivados">
            <div className="results-header">
              <h3>Fretes Arquivados ({fretesArquivados.length})</h3>
            </div>
            
            {fretesArquivados.length === 0 ? (
              <div className="no-results">
                <Archive size={48} />
                <p>Nenhum frete arquivado encontrado</p>
                <span>Use os filtros acima para buscar registros</span>
              </div>
            ) : (
              <div className="table-container">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Motorista</th>
                      <th>Cliente</th>
                      <th>Origem → Destino</th>
                      <th>Valor</th>
                      <th>Pago em</th>
                      <th>Tipo Pagamento</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fretesArquivados.map(frete => (
                      <tr key={frete.id}>
                        <td>{formatDisplayDate(frete.data_emissao)}</td>
                        <td>{frete.motorista?.nome}</td>
                        <td>{frete.cliente || '-'}</td>
                        <td>{frete.origem} → {frete.destino}</td>
                        <td className="valor">{formatCurrency(frete.valor_frete)}</td>
                        <td>{frete.data_pagamento ? formatDisplayDate(frete.data_pagamento) : '-'}</td>
                        <td>{frete.tipo_pagamento || '-'}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="view-btn"
                              title="Visualizar detalhes"
                              onClick={() => {/* TODO: Implementar visualização */}}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="reopen-btn"
                              title="Reabrir para correção"
                              onClick={() => reabrirFrete(frete.frete_id!)}
                            >
                              <RotateCcw size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="fechamentos-arquivados">
            <div className="results-header">
              <h3>Fechamentos Arquivados ({fechamentosArquivados.length})</h3>
            </div>
            
            {fechamentosArquivados.length === 0 ? (
              <div className="no-results">
                <Archive size={48} />
                <p>Nenhum fechamento arquivado encontrado</p>
                <span>Use os filtros acima para buscar registros</span>
              </div>
            ) : (
              <div className="table-container">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Período</th>
                      <th>Motorista</th>
                      <th>Tipo</th>
                      <th>Total Fretes</th>
                      <th>Valor Bruto</th>
                      <th>Valor Líquido</th>
                      <th>Data Fechamento</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fechamentosArquivados.map(fechamento => (
                      <tr key={fechamento.id}>
                        <td>{fechamento.periodo}</td>
                        <td>{fechamento.motorista?.nome}</td>
                        <td>
                          <span className={`tipo-badge ${fechamento.motorista?.tipo_motorista?.toLowerCase()}`}>
                            {fechamento.motorista?.tipo_motorista}
                          </span>
                        </td>
                        <td>{fechamento.total_fretes}</td>
                        <td className="valor">{formatCurrency(fechamento.valor_bruto)}</td>
                        <td className="valor">{formatCurrency(fechamento.valor_liquido)}</td>
                        <td>{fechamento.data_fechamento ? formatDisplayDate(fechamento.data_fechamento) : '-'}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="view-btn"
                              title="Visualizar detalhes"
                              onClick={() => {/* TODO: Implementar visualização */}}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="pdf-btn"
                              title="Gerar PDF"
                              onClick={() => {/* TODO: Implementar PDF */}}
                            >
                              <FileText size={16} />
                            </button>
                            <button
                              className="reopen-btn"
                              title="Reabrir para correção"
                              onClick={() => reabrirFechamento(fechamento.fechamento_id!)}
                            >
                              <RotateCcw size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Historico; 