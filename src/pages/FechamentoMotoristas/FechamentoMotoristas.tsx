import React, { useState, useEffect, useCallback } from 'react';
import { fechamentoService, FechamentoMotorista } from '../../services/fechamentoService';
import { pdfService } from '../../services/pdfService';
import { supabase } from '../../services/supabaseClient';
import './FechamentoMotoristas.css';
import FechamentoMotoristasFilters from './components/FechamentoMotoristasFilters';
import FechamentoMotoristasStats from './components/FechamentoMotoristasStats';
import FechamentoMotoristasTable from './components/FechamentoMotoristasTable';

const FechamentoMotoristas: React.FC = () => {
  const [fechamentos, setFechamentos] = useState<FechamentoMotorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriodo, setSelectedPeriodo] = useState(() => {
    const now = new Date();
    // Usar meio-dia para evitar problemas de fuso horário
    const safeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    return `${(safeDate.getMonth() + 1).toString().padStart(2, '0')}/${safeDate.getFullYear()}`;
  });
  const [calculandoFechamento, setCalculandoFechamento] = useState(false);
  const [editandoBonus, setEditandoBonus] = useState<number | null>(null);
  const [novoBonus, setNovoBonus] = useState('');
  const [mostrandoDetalhes, setMostrandoDetalhes] = useState<number | null>(null);
  const [filtroTipoMotorista, setFiltroTipoMotorista] = useState<string>('Todos');

  // Novos estados para o sistema híbrido
  const [modoFiltro, setModoFiltro] = useState<'mensal' | 'periodo' | 'motorista'>('mensal');
  const [filtrosPeriodo, setFiltrosPeriodo] = useState({
    dataInicio: '',
    dataFim: ''
  });
  const [dadosTemporarios, setDadosTemporarios] = useState(false); // Indica se são dados calculados em tempo real
  
  // Novos estados para o modo motorista
  const [motoristas, setMotoristas] = useState<Array<{id: number, nome: string, tipo_motorista: string}>>([]);
  const [motoristasSelecionado, setMotoristaSelecionado] = useState<number | null>(null);
  
  // Estados para filtros de data do modo motorista
  const [filtrosMotorista, setFiltrosMotorista] = useState({
    dataInicio: '',
    dataFim: ''
  });

  // Filtrar fechamentos por tipo de motorista
  const fechamentosFiltrados = fechamentos.filter(fechamento => {
    if (filtroTipoMotorista === 'Todos') return true;
    return fechamento.motorista?.tipo_motorista === filtroTipoMotorista;
  });

  const loadFechamentos = useCallback(async () => {
    try {
      setLoading(true);
      
      if (modoFiltro === 'mensal') {
        // Modo mensal - usar sistema existente
        const data = await fechamentoService.getByPeriodo(selectedPeriodo);
        setFechamentos(data);
        setDadosTemporarios(false);
      } else if (modoFiltro === 'periodo') {
        // Modo período customizado - só carrega dados quando há filtros aplicados
        // Não executa automaticamente ao mudar datas (evita bug do calendário)
        setFechamentos([]);
        setDadosTemporarios(false);
      } else if (modoFiltro === 'motorista') {
        // Modo motorista - só carrega dados quando há motorista selecionado
        setFechamentos([]);
        setDadosTemporarios(false);
      }
    } catch (error) {
      console.error('Erro ao carregar fechamentos:', error);
      alert('Erro ao carregar fechamentos. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodo, modoFiltro]);

  // Função separada para carregar dados por período (chamada apenas no botão Aplicar)
  const loadFechamentosPorPeriodo = useCallback(async () => {
    try {
      setLoading(true);
      
      if (filtrosPeriodo.dataInicio && filtrosPeriodo.dataFim) {
        // Primeiro tentar buscar fechamentos já salvos no período
        const fechamentosSalvos = await fechamentoService.getByPeriodoCustomizado(
          filtrosPeriodo.dataInicio, 
          filtrosPeriodo.dataFim
        );
        
        if (fechamentosSalvos.length > 0) {
          // Se existem fechamentos salvos, usar eles
          setFechamentos(fechamentosSalvos);
          setDadosTemporarios(false);
        } else {
          // Se não existem fechamentos salvos, calcular em tempo real
          const fechamentosCalculados = await fechamentoService.calcularFechamentoPorPeriodo(
            filtrosPeriodo.dataInicio, 
            filtrosPeriodo.dataFim
          );
          setFechamentos(fechamentosCalculados);
          setDadosTemporarios(true);
        }
      } else {
        setFechamentos([]);
        setDadosTemporarios(false);
      }
    } catch (error) {
      console.error('Erro ao carregar fechamentos por período:', error);
      alert('Erro ao carregar fechamentos. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [filtrosPeriodo]);

  // Carregar fechamentos do período selecionado
  useEffect(() => {
    loadFechamentos();
  }, [loadFechamentos]);

  // Carregar lista de motoristas ao montar componente
  useEffect(() => {
    const carregarMotoristas = async () => {
      try {
        const { data, error } = await supabase
          .from('motoristas')
          .select('id, nome, tipo_motorista')
          .or('status.eq.Ativo,status.is.null')
          .order('nome');
        
        if (error) throw error;
        setMotoristas(data || []);
      } catch (error) {
        console.error('Erro ao carregar motoristas:', error);
      }
    };
    
    carregarMotoristas();
  }, []);

  // Funções para gerenciar filtros de período customizado
  const handleModoFiltroChange = (novoModo: 'mensal' | 'periodo' | 'motorista') => {
    setModoFiltro(novoModo);
    if (novoModo === 'mensal') {
      // Ao voltar ao modo mensal, limpar filtros de período e motorista
      setFiltrosPeriodo({ dataInicio: '', dataFim: '' });
      setMotoristaSelecionado(null);
      setDadosTemporarios(false);
    } else if (novoModo === 'periodo') {
      // Limpar motorista selecionado
      setMotoristaSelecionado(null);
    } else if (novoModo === 'motorista') {
      // Limpar filtros de período
      setFiltrosPeriodo({ dataInicio: '', dataFim: '' });
      setFiltrosMotorista({ dataInicio: '', dataFim: '' });
      setDadosTemporarios(false);
    }
  };

  const handleFiltroPeriodoChange = (campo: 'dataInicio' | 'dataFim', valor: string) => {
    setFiltrosPeriodo(prev => ({ ...prev, [campo]: valor }));
  };

  const aplicarFiltrosPeriodo = () => {
    if (!filtrosPeriodo.dataInicio || !filtrosPeriodo.dataFim) {
      alert('Por favor, selecione as datas de início e fim do período.');
      return;
    }
    
    if (filtrosPeriodo.dataInicio > filtrosPeriodo.dataFim) {
      alert('A data de início deve ser anterior à data de fim.');
      return;
    }
    
    loadFechamentosPorPeriodo();
  };

  const limparFiltrosPeriodo = () => {
    setFiltrosPeriodo({ dataInicio: '', dataFim: '' });
    setDadosTemporarios(false);
    setFechamentos([]); // Limpar dados quando filtros são removidos
  };

  // Funções para gerenciar filtros de data do motorista
  const handleFiltroMotoristaChange = (campo: 'dataInicio' | 'dataFim', valor: string) => {
    setFiltrosMotorista(prev => ({ ...prev, [campo]: valor }));
  };

  const limparFiltrosMotorista = () => {
    setFiltrosMotorista({ dataInicio: '', dataFim: '' });
    setDadosTemporarios(false);
    setFechamentos([]);
  };

  // Função para aplicar filtros de motorista
  const aplicarFiltrosMotorista = async () => {
    if (!motoristasSelecionado) {
      alert('Por favor, selecione um motorista.');
      return;
    }

    try {
      setLoading(true);
      
      // Se há filtros de data, usá-los; senão, buscar histórico completo
      const dataInicio = filtrosMotorista.dataInicio || undefined;
      const dataFim = filtrosMotorista.dataFim || undefined;
      
      const fechamentoDetalhado = await fechamentoService.getHistoricoDetalhado(
        motoristasSelecionado, 
        dataInicio, 
        dataFim
      );
      
      if (!fechamentoDetalhado) {
        alert('Nenhum dado encontrado para este motorista no período selecionado.');
        setFechamentos([]);
        setDadosTemporarios(false);
        return;
      }

      if (fechamentoDetalhado.total_fretes === 0) {
        alert('Este motorista não possui fretes registrados no período selecionado.');
        setFechamentos([]);
        setDadosTemporarios(false);
        return;
      }

      // Converter FechamentoDetalhado para FechamentoMotorista para exibição
      const fechamentoParaExibicao: FechamentoMotorista = {
        id: 0, // ID temporário para dados calculados
        motorista_id: fechamentoDetalhado.motorista_id,
        periodo: dataInicio && dataFim 
          ? `${dataInicio.split('-').reverse().join('/')} a ${dataFim.split('-').reverse().join('/')}`
          : 'Histórico completo',
        valor_bruto: fechamentoDetalhado.valor_bruto,
        valor_comissao: fechamentoDetalhado.valor_comissao,
        descontos: fechamentoDetalhado.descontos,
        bonus: fechamentoDetalhado.bonus || 0,
        valor_liquido: fechamentoDetalhado.valor_liquido,
        status: 'Pendente',
        total_fretes: fechamentoDetalhado.total_fretes,
        data_fechamento: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        motorista: {
          id: fechamentoDetalhado.motorista_id,
          nome: fechamentoDetalhado.motorista?.nome || 'Motorista não encontrado',
          tipo_motorista: fechamentoDetalhado.motorista?.tipo_motorista || 'Terceiro',
          porcentagem_comissao: fechamentoDetalhado.motorista?.porcentagem_comissao
        }
      };

      setFechamentos([fechamentoParaExibicao]);
      setDadosTemporarios(true);
    } catch (error) {
      console.error('Erro ao carregar dados do motorista:', error);
      alert('Erro ao carregar dados do motorista. Verifique sua conexão.');
      setFechamentos([]);
      setDadosTemporarios(false);
    } finally {
      setLoading(false);
    }
  };

  const calcularFechamento = async () => {
    if (calculandoFechamento) return;
    
    try {
      setCalculandoFechamento(true);
      
      // Calcular fechamentos para todos os motoristas do período
      const fechamentosCalculados = await fechamentoService.calcularFechamentoCompleto(selectedPeriodo);
      
      if (fechamentosCalculados.length === 0) {
        alert('Nenhum frete encontrado para motoristas neste período.');
        return;
      }

      // Salvar os fechamentos calculados
      const fechamentosSalvos: FechamentoMotorista[] = [];
      
      for (const fechamento of fechamentosCalculados) {
        // Verificar se já existe fechamento para este motorista no período
        const existente = fechamentos.find(f => f.motorista_id === fechamento.motorista_id);
        
        if (existente) {
          // NÃO ATUALIZAR fechamentos existentes - apenas adicionar novos
          console.log(`[DEBUG] Fechamento já existe para motorista ${fechamento.motorista_id}, mantendo valores existentes`);
          fechamentosSalvos.push(existente);
        } else {
          // Criar novo fechamento apenas se não existir
          const novo = await fechamentoService.create(fechamento);
          fechamentosSalvos.push(novo);
        }
      }

      setFechamentos(fechamentosSalvos);
      alert(`Fechamento processado! ${fechamentosSalvos.length} motorista(s) encontrado(s). Fechamentos existentes foram preservados.`);
      
    } catch (error) {
      console.error('Erro ao calcular fechamento:', error);
      alert('Erro ao calcular fechamento. Verifique os dados e tente novamente.');
    } finally {
      setCalculandoFechamento(false);
    }
  };

  const atualizarStatus = async (id: number, novoStatus: string) => {
    try {
      const fechamentoAtualizado = await fechamentoService.update(id, { status: novoStatus });
      setFechamentos(fechamentos.map(f => f.id === id ? fechamentoAtualizado : f));
      alert('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status.');
    }
  };

  const iniciarEdicaoBonus = (id: number, bonusAtual: number) => {
    setEditandoBonus(id);
    setNovoBonus(bonusAtual.toString());
  };

  const cancelarEdicaoBonus = () => {
    setEditandoBonus(null);
    setNovoBonus('');
  };

  const salvarBonus = async (id: number) => {
    try {
      const valorBonus = parseFloat(novoBonus) || 0;
      const fechamento = fechamentos.find(f => f.id === id);
      if (!fechamento) return;

      // CORREÇÃO: Recalcular valor líquido corretamente: comissão - descontos + bonus
      const novoValorLiquido = fechamento.valor_comissao - (fechamento.descontos || 0) + valorBonus;

      console.log(`[DEBUG] Recalculando valor líquido para motorista ${fechamento.motorista?.nome}:`);
      console.log(`  Comissão: R$ ${fechamento.valor_comissao}`);
      console.log(`  Descontos: R$ ${fechamento.descontos || 0}`);
      console.log(`  Bônus novo: R$ ${valorBonus}`);
      console.log(`  Valor líquido: R$ ${novoValorLiquido}`);

      const fechamentoAtualizado = await fechamentoService.update(id, { 
        bonus: valorBonus,
        valor_liquido: novoValorLiquido
      });
      
      setFechamentos(fechamentos.map(f => f.id === id ? fechamentoAtualizado : f));
      setEditandoBonus(null);
      setNovoBonus('');
      alert('Bônus atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar bônus:', error);
      alert('Erro ao atualizar bônus.');
    }
  };

  const recalcularDescontos = async (id: number) => {
    try {
      const fechamento = fechamentos.find(f => f.id === id);
      if (!fechamento) return;

      // Recalcular descontos buscando vales atualizados
      const fechamentoRecalculado = await fechamentoService.calcularFechamento(
        fechamento.motorista_id, 
        selectedPeriodo
      );

      console.log(`[DEBUG] Recalculando descontos para ${fechamento.motorista?.nome}:`);
      console.log(`  Descontos antigos: R$ ${fechamento.descontos || 0}`);
      console.log(`  Descontos novos: R$ ${fechamentoRecalculado.descontos}`);

      // Manter o bônus atual e recalcular valor líquido
      const bonusAtual = fechamento.bonus || 0;
      const novoValorLiquido = fechamentoRecalculado.valor_comissao - fechamentoRecalculado.descontos + bonusAtual;

      const fechamentoAtualizado = await fechamentoService.update(id, {
        descontos: fechamentoRecalculado.descontos,
        valor_liquido: novoValorLiquido
      });

      setFechamentos(fechamentos.map(f => f.id === id ? fechamentoAtualizado : f));
      alert('Descontos recalculados com sucesso!');
    } catch (error) {
      console.error('Erro ao recalcular descontos:', error);
      alert('Erro ao recalcular descontos.');
    }
  };

  const recalcularFechamento = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja recalcular este fechamento? Todos os valores serão recalculados com base nos fretes atuais. O bônus será mantido.')) {
      return;
    }

    try {
      const fechamento = fechamentos.find(f => f.id === id);
      if (!fechamento) return;

      console.log(`[DEBUG] Recalculando fechamento completo para ${fechamento.motorista?.nome}...`);

      // Recalcular fechamento completo com dados atualizados
      const fechamentoRecalculado = await fechamentoService.calcularFechamento(
        fechamento.motorista_id, 
        selectedPeriodo
      );

      console.log(`[DEBUG] Valores recalculados:`);
      console.log(`  Total de fretes: ${fechamento.total_fretes} → ${fechamentoRecalculado.total_fretes}`);
      console.log(`  Valor bruto: R$ ${fechamento.valor_bruto} → R$ ${fechamentoRecalculado.valor_bruto}`);
      console.log(`  Valor comissão: R$ ${fechamento.valor_comissao} → R$ ${fechamentoRecalculado.valor_comissao}`);
      console.log(`  Descontos: R$ ${fechamento.descontos || 0} → R$ ${fechamentoRecalculado.descontos}`);

      // Manter o bônus atual
      const bonusAtual = fechamento.bonus || 0;
      const novoValorLiquido = fechamentoRecalculado.valor_comissao - fechamentoRecalculado.descontos + bonusAtual;

      console.log(`  Bônus (mantido): R$ ${bonusAtual}`);
      console.log(`  Valor líquido: R$ ${fechamento.valor_liquido} → R$ ${novoValorLiquido}`);

      // Atualizar todos os valores no banco
      const fechamentoAtualizado = await fechamentoService.update(id, {
        total_fretes: fechamentoRecalculado.total_fretes,
        valor_bruto: fechamentoRecalculado.valor_bruto,
        valor_comissao: fechamentoRecalculado.valor_comissao,
        descontos: fechamentoRecalculado.descontos,
        bonus: bonusAtual, // Manter bônus atual
        valor_liquido: novoValorLiquido
      });

      setFechamentos(fechamentos.map(f => f.id === id ? fechamentoAtualizado : f));
      alert('Fechamento recalculado com sucesso! Todos os valores foram atualizados.');
    } catch (error) {
      console.error('Erro ao recalcular fechamento:', error);
      alert('Erro ao recalcular fechamento. Verifique os dados e tente novamente.');
    }
  };

  const deletarFechamento = async (id: number, nomeMotorista: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o fechamento do motorista "${nomeMotorista}"?`)) {
      return;
    }

    try {
      await fechamentoService.delete(id);
      setFechamentos(fechamentos.filter(f => f.id !== id));
      alert('Fechamento excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir fechamento:', error);
      alert('Erro ao excluir fechamento. Tente novamente.');
    }
  };

  const arquivarFechamento = async (id: number, nomeMotorista: string) => {
    if (!window.confirm(`Tem certeza que deseja arquivar o fechamento do motorista "${nomeMotorista}"? Ele será movido para o histórico.`)) {
      return;
    }

    try {
      await fechamentoService.arquivar(id);
      setFechamentos(fechamentos.filter(f => f.id !== id));
      alert('Fechamento arquivado com sucesso!');
    } catch (error) {
      console.error('Erro ao arquivar fechamento:', error);
      alert('Erro ao arquivar fechamento. Tente novamente.');
    }
  };

  const gerarRelatorioPDF = async (fechamentoId: number) => {
    try {
      console.log(`[DEBUG PDF] Tentando gerar PDF para fechamento ID: ${fechamentoId}`);
      const fechamentoDetalhado = await fechamentoService.getById(fechamentoId);
      console.log(`[DEBUG PDF] Fechamento detalhado encontrado:`, fechamentoDetalhado);
      
      if (fechamentoDetalhado) {
        console.log(`[DEBUG PDF] Iniciando geração do PDF...`);
        await pdfService.gerarRelatorioFechamento(fechamentoDetalhado);
        console.log(`[DEBUG PDF] PDF gerado com sucesso!`);
      } else {
        console.error(`[DEBUG PDF] Fechamento não encontrado para ID: ${fechamentoId}`);
        alert('Fechamento não encontrado.');
      }
    } catch (error) {
      console.error('[DEBUG PDF] Erro ao gerar relatório PDF:', error);
      
      // Exibir mensagem de erro mais específica
      let mensagemErro = 'Erro ao gerar relatório PDF.';
      
      if (error instanceof Error) {
        if (error.message.includes('Dados do fechamento não fornecidos')) {
          mensagemErro = 'Erro: Dados do fechamento não foram fornecidos.';
        } else if (error.message.includes('Dados do motorista não encontrados')) {
          mensagemErro = 'Erro: Dados do motorista não foram encontrados.';
        } else if (error.message.includes('coordenadas inválidas')) {
          mensagemErro = 'Erro: Problema com os dados do fechamento. Verifique se todos os campos estão preenchidos corretamente.';
        } else if (error.message.includes('processar imagem')) {
          mensagemErro = 'Erro: Problema ao processar a logo do sistema. O PDF será gerado sem a logo.';
        } else if (error.message.includes('fonte')) {
          mensagemErro = 'Erro: Problema com a formatação do PDF.';
        } else {
          mensagemErro = `Erro: ${error.message}`;
        }
      }
      
      alert(mensagemErro);
    }
  };

  const gerarRelatorioConsolidado = async () => {
    try {
      if (fechamentosFiltrados.length === 0) {
        alert('Nenhum fechamento disponível para gerar relatório.');
        return;
      }
      
      const periodo = gerarPeriodos().find(p => p.valor === selectedPeriodo)?.nome || selectedPeriodo;
      const tituloComFiltro = filtroTipoMotorista !== 'Todos' 
        ? `${periodo} - ${filtroTipoMotorista}` 
        : periodo;
      await pdfService.gerarRelatorioConsolidado(fechamentosFiltrados, tituloComFiltro);
    } catch (error) {
      console.error('Erro ao gerar relatório consolidado:', error);
      alert('Erro ao gerar relatório consolidado.');
    }
  };

  const gerarRelatorioConsolidadoPorMotorista = async () => {
    try {
      if (!motoristasSelecionado) {
        alert('Por favor, selecione um motorista.');
        return;
      }

      setLoading(true);
      
      // Se há filtros de data, usá-los; senão, buscar histórico completo
      const dataInicio = filtrosMotorista.dataInicio || undefined;
      const dataFim = filtrosMotorista.dataFim || undefined;
      
      const fechamentoDetalhado = await fechamentoService.getHistoricoDetalhado(
        motoristasSelecionado, 
        dataInicio, 
        dataFim
      );
      
      if (!fechamentoDetalhado) {
        alert('Nenhum dado encontrado para este motorista no período selecionado.');
        return;
      }

      if (fechamentoDetalhado.total_fretes === 0) {
        alert('Este motorista não possui fretes registrados no período selecionado.');
        return;
      }

      await pdfService.gerarRelatorioConsolidadoPorMotorista(fechamentoDetalhado);
    } catch (error) {
      console.error('Erro ao gerar relatório consolidado por motorista:', error);
      alert('Erro ao gerar relatório consolidado por motorista.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDetalhes = (fechamentoId: number) => {
    setMostrandoDetalhes(mostrandoDetalhes === fechamentoId ? null : fechamentoId);
  };

  const gerarPeriodos = () => {
    const periodos = [];
    const hoje = new Date();
    
    for (let i = 0; i < 12; i++) {
      // Usar meio-dia do primeiro dia do mês para evitar problemas de fuso horário
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1, 12, 0, 0);
      const mes = (data.getMonth() + 1).toString().padStart(2, '0');
      const ano = data.getFullYear();
      const valor = `${mes}/${ano}`;
      
      // Usar formatação manual para evitar problemas de localização
      const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      const nome = `${meses[data.getMonth()]} ${ano}`;
      
      periodos.push({ valor, nome });
    }
    
    return periodos;
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="fechamento-motoristas">
        <div className="page-header">
          <h1>Fechamento Motoristas Terceiros</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Carregando fechamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fechamento-motoristas">
      <div className="page-header">
        <h1>Fechamento de Motoristas</h1>
        <FechamentoMotoristasFilters
          modoFiltro={modoFiltro}
          handleModoFiltroChange={handleModoFiltroChange}
          selectedPeriodo={selectedPeriodo}
          setSelectedPeriodo={setSelectedPeriodo}
          gerarPeriodos={gerarPeriodos}
          filtrosPeriodo={filtrosPeriodo}
          handleFiltroPeriodoChange={handleFiltroPeriodoChange}
          aplicarFiltrosPeriodo={aplicarFiltrosPeriodo}
          limparFiltrosPeriodo={limparFiltrosPeriodo}
          motoristasSelecionado={motoristasSelecionado}
          setMotoristaSelecionado={setMotoristaSelecionado}
          motoristas={motoristas}
          filtrosMotorista={filtrosMotorista}
          handleFiltroMotoristaChange={handleFiltroMotoristaChange}
          aplicarFiltrosMotorista={aplicarFiltrosMotorista}
          limparFiltrosMotorista={limparFiltrosMotorista}
          filtroTipoMotorista={filtroTipoMotorista}
          setFiltroTipoMotorista={setFiltroTipoMotorista}
          fechamentos={fechamentos}
          fechamentosFiltrados={fechamentosFiltrados}
          calcularFechamento={calcularFechamento}
          calculandoFechamento={calculandoFechamento}
          gerarRelatorioConsolidado={gerarRelatorioConsolidado}
          gerarRelatorioConsolidadoPorMotorista={gerarRelatorioConsolidadoPorMotorista}
        />
      </div>

      <FechamentoMotoristasStats
        modoFiltro={modoFiltro}
        selectedPeriodo={selectedPeriodo}
        gerarPeriodos={gerarPeriodos}
        filtrosPeriodo={filtrosPeriodo}
        motoristasSelecionado={motoristasSelecionado}
        motoristas={motoristas}
        filtrosMotorista={filtrosMotorista}
        filtroTipoMotorista={filtroTipoMotorista}
        dadosTemporarios={dadosTemporarios}
        fechamentosFiltrados={fechamentosFiltrados}
        formatCurrency={formatCurrency}
      />

      <FechamentoMotoristasTable
        fechamentos={fechamentos}
        fechamentosFiltrados={fechamentosFiltrados}
        dadosTemporarios={dadosTemporarios}
        editandoBonus={editandoBonus}
        novoBonus={novoBonus}
        setNovoBonus={setNovoBonus}
        mostrandoDetalhes={mostrandoDetalhes}
        formatCurrency={formatCurrency}
        recalcularDescontos={recalcularDescontos}
        iniciarEdicaoBonus={iniciarEdicaoBonus}
        salvarBonus={salvarBonus}
        cancelarEdicaoBonus={cancelarEdicaoBonus}
        atualizarStatus={atualizarStatus}
        toggleDetalhes={toggleDetalhes}
        recalcularFechamento={recalcularFechamento}
        gerarRelatorioPDF={gerarRelatorioPDF}
        arquivarFechamento={arquivarFechamento}
        deletarFechamento={deletarFechamento}
      />
    </div>
  );
};

export default FechamentoMotoristas; 