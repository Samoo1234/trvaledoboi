import React, { useState, useEffect } from 'react';
import { Archive, FileText, DollarSign } from 'lucide-react';
import { freteService, Frete } from '../../services/freteService';
import { fechamentoService, FechamentoMotorista } from '../../services/fechamentoService';
import { motoristaService, Motorista } from '../../services/motoristaService';
import { controleFretePDFService } from '../ControleFrete/services/controleFretePDFService';

import './Historico.css';
import HistoricoFilters from './components/HistoricoFilters';
import HistoricoTable from './components/HistoricoTable';
import HistoricoModals from './components/HistoricoModals';

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
  
  // Estados para visualização de detalhes
  const [freteDetalhes, setFreteDetalhes] = useState<Frete | null>(null);
  const [fechamentoDetalhes, setFechamentoDetalhes] = useState<FechamentoMotorista | null>(null);

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
      } catch (error: unknown) {
        console.error('Erro ao reabrir frete:', error);
        const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
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
      } catch (error: unknown) {
        console.error('Erro ao reabrir fechamento:', error);
        const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
        alert(`❌ Erro ao reabrir fechamento: ${mensagem}\n\nTente novamente ou contate o suporte.`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGerarReciboFrete = async (frete: Frete) => {
    try {
      setLoading(true);
      let clienteNome = 'Cliente não identificado';
      let clienteCpfCnpj = undefined;
      if (frete.clienteData) {
        clienteNome = frete.clienteData.razao_social;
        clienteCpfCnpj = frete.clienteData.cpf_cnpj;
      } else if (frete.cliente) {
        clienteNome = frete.cliente;
      }
      await controleFretePDFService.gerarPDFReciboConsolidado(clienteNome, clienteCpfCnpj, [frete]);
    } catch (error) {
      console.error('Erro ao gerar recibo:', error);
      alert(error instanceof Error ? error.message : 'Erro ao gerar recibo');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getClientesUnicos = (): string[] => {
    const clientes = fretesArquivados
      .map(f => f.clienteData?.razao_social || f.cliente)
      .filter(Boolean) as string[];
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

      <HistoricoFilters
        activeTab={activeTab}
        mostrandoFiltros={mostrandoFiltros}
        setMostrandoFiltros={setMostrandoFiltros}
        filtrosAtivos={filtrosAtivos}
        executarBusca={executarBusca}
        limparFiltros={limparFiltros}
        carregarTodosRegistros={carregarTodosRegistros}
        loading={loading}
        filtrosFrete={filtrosFrete}
        handleFiltroFreteChange={handleFiltroFreteChange}
        filtrosFechamento={filtrosFechamento}
        handleFiltroFechamentoChange={handleFiltroFechamentoChange}
        motoristas={motoristas}
        getClientesUnicos={getClientesUnicos}
        getTiposPagamento={getTiposPagamento}
        getTiposMotorista={getTiposMotorista}
      />

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

      <HistoricoTable
        activeTab={activeTab}
        fretesArquivados={fretesArquivados}
        fechamentosArquivados={fechamentosArquivados}
        formatCurrency={formatCurrency}
        setFreteDetalhes={setFreteDetalhes}
        setFechamentoDetalhes={setFechamentoDetalhes}
        reabrirFrete={reabrirFrete}
        reabrirFechamento={reabrirFechamento}
        handleGerarReciboFrete={handleGerarReciboFrete}
      />

      <HistoricoModals
        freteDetalhes={freteDetalhes}
        setFreteDetalhes={setFreteDetalhes}
        fechamentoDetalhes={fechamentoDetalhes}
        setFechamentoDetalhes={setFechamentoDetalhes}
        motoristas={motoristas}
        formatCurrency={formatCurrency}
        reabrirFrete={reabrirFrete}
        reabrirFechamento={reabrirFechamento}
      />
    </div>
  );
};

export default Historico; 