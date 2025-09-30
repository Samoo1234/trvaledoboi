import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, Eye, FileText, Trash2, Archive, RefreshCw } from 'lucide-react';
import { fechamentoService, FechamentoMotorista } from '../../services/fechamentoService';
import { pdfService } from '../../services/pdfService';
import { formatDisplayDate } from '../../services/dateUtils';
import { supabase } from '../../services/supabaseClient';
import './FechamentoMotoristas.css';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return '#ffc107';
      case 'Pago': return '#28a745';
      case 'Atrasado': return '#dc3545';
      default: return '#6c757d';
    }
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
        <div className="header-actions">
          {/* Toggle entre modos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '15px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>Filtrar por:</span>
            <div style={{ 
              display: 'flex', 
              background: '#f8f9fa', 
              borderRadius: '6px', 
              border: '1px solid #dee2e6',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => handleModoFiltroChange('mensal')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: modoFiltro === 'mensal' ? '#007bff' : 'transparent',
                  color: modoFiltro === 'mensal' ? 'white' : '#495057',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Mês
              </button>
              <button
                onClick={() => handleModoFiltroChange('periodo')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: modoFiltro === 'periodo' ? '#007bff' : 'transparent',
                  color: modoFiltro === 'periodo' ? 'white' : '#495057',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Período
              </button>
              <button
                onClick={() => handleModoFiltroChange('motorista')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: modoFiltro === 'motorista' ? '#007bff' : 'transparent',
                  color: modoFiltro === 'motorista' ? 'white' : '#495057',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Motorista
              </button>
            </div>
          </div>

          {/* Filtros condicionais baseados no modo */}
          {modoFiltro === 'mensal' ? (
            <select 
              value={selectedPeriodo}
              onChange={(e) => setSelectedPeriodo(e.target.value)}
              className="periodo-select"
            >
              {gerarPeriodos().map(periodo => (
                <option key={periodo.valor} value={periodo.valor}>
                  {periodo.nome}
                </option>
              ))}
            </select>
          ) : modoFiltro === 'periodo' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="date"
                value={filtrosPeriodo.dataInicio}
                onChange={(e) => handleFiltroPeriodoChange('dataInicio', e.target.value)}
                style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
                title="Data início"
              />
              <span style={{ color: '#666', fontSize: '13px' }}>até</span>
              <input
                type="date"
                value={filtrosPeriodo.dataFim}
                onChange={(e) => handleFiltroPeriodoChange('dataFim', e.target.value)}
                style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
                title="Data fim"
              />
              <button 
                onClick={aplicarFiltrosPeriodo}
                style={{ 
                  padding: '4px 8px', 
                  background: '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                title="Aplicar filtro por período"
              >
                Aplicar
              </button>
              <button 
                onClick={limparFiltrosPeriodo}
                style={{ 
                  padding: '4px 8px', 
                  background: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                title="Limpar filtros de período"
              >
                Limpar
              </button>
            </div>
          ) : modoFiltro === 'motorista' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select 
                value={motoristasSelecionado || ''}
                onChange={(e) => setMotoristaSelecionado(e.target.value ? parseInt(e.target.value) : null)}
                className="periodo-select"
                style={{ minWidth: '200px' }}
              >
                <option value="">Selecione um motorista</option>
                {motoristas.map(motorista => (
                  <option key={motorista.id} value={motorista.id}>
                    {motorista.nome} ({motorista.tipo_motorista})
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={filtrosMotorista.dataInicio}
                onChange={(e) => handleFiltroMotoristaChange('dataInicio', e.target.value)}
                style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
                title="Data início (opcional)"
                placeholder="Data início"
              />
              <span style={{ color: '#666', fontSize: '13px' }}>até</span>
              <input
                type="date"
                value={filtrosMotorista.dataFim}
                onChange={(e) => handleFiltroMotoristaChange('dataFim', e.target.value)}
                style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
                title="Data fim (opcional)"
                placeholder="Data fim"
              />
              <button 
                onClick={aplicarFiltrosMotorista}
                style={{ 
                  padding: '4px 8px', 
                  background: '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                title="Aplicar filtro por motorista"
              >
                Aplicar
              </button>
              {(filtrosMotorista.dataInicio || filtrosMotorista.dataFim || motoristasSelecionado) && (
                <button 
                  onClick={() => {
                    setMotoristaSelecionado(null);
                    limparFiltrosMotorista();
                  }}
                  style={{ 
                    padding: '4px 8px', 
                    background: '#6c757d', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  title="Limpar filtros de motorista"
                >
                  Limpar
                </button>
              )}
            </div>
          ) : null}

          <select 
            value={filtroTipoMotorista}
            onChange={(e) => setFiltroTipoMotorista(e.target.value)}
            className="periodo-select"
            title="Filtrar por tipo de motorista"
          >
            <option value="Todos">Todos os Tipos</option>
            <option value="Funcionário">
              Funcionário ({fechamentos.filter(f => f.motorista?.tipo_motorista === 'Funcionário').length})
            </option>
            <option value="Terceiro">
              Terceiro ({fechamentos.filter(f => f.motorista?.tipo_motorista === 'Terceiro').length})
            </option>
          </select>
          
          {modoFiltro === 'mensal' && (
            <button 
              className="btn-primary"
              onClick={calcularFechamento}
              disabled={calculandoFechamento}
            >
              <Calculator size={20} />
              {calculandoFechamento ? 'Calculando...' : 'Calcular Fechamento'}
            </button>
          )}
          
          {fechamentosFiltrados.length > 0 && modoFiltro !== 'motorista' && (
            <button 
              className="btn-secondary"
              onClick={gerarRelatorioConsolidado}
              title="Gerar Relatório Consolidado em PDF"
            >
              <FileText size={20} />
              Relatório Consolidado
            </button>
          )}

          {modoFiltro === 'motorista' && motoristasSelecionado && (
            <button 
              className="btn-secondary"
              onClick={gerarRelatorioConsolidadoPorMotorista}
              title="Gerar Relatório Consolidado do Motorista em PDF"
            >
              <FileText size={20} />
              Relatório Consolidado Motorista
            </button>
          )}
        </div>
      </div>

      <div className="resumo-periodo">
        <h2>
          Resumo do Período - {
            modoFiltro === 'mensal' 
              ? gerarPeriodos().find(p => p.valor === selectedPeriodo)?.nome
              : modoFiltro === 'periodo' && filtrosPeriodo.dataInicio && filtrosPeriodo.dataFim 
                ? `${filtrosPeriodo.dataInicio.split('-').reverse().join('/')} a ${filtrosPeriodo.dataFim.split('-').reverse().join('/')}`
                : modoFiltro === 'motorista' && motoristasSelecionado
                  ? `${filtrosMotorista.dataInicio && filtrosMotorista.dataFim 
                      ? `Período ${filtrosMotorista.dataInicio.split('-').reverse().join('/')} a ${filtrosMotorista.dataFim.split('-').reverse().join('/')} - ` 
                      : 'Histórico - '}${motoristas.find(m => m.id === motoristasSelecionado)?.nome || 'Motorista'}`
                  : modoFiltro === 'periodo' 
                    ? 'Período não selecionado'
                    : 'Motorista não selecionado'
          }
          {filtroTipoMotorista !== 'Todos' && (
            <span style={{ color: '#007bff', fontSize: '0.9em', fontWeight: 'normal' }}>
              {' '}(Filtro: {filtroTipoMotorista})
            </span>
          )}
          {dadosTemporarios && (
            <span style={{ 
              backgroundColor: '#fff3cd', 
              color: '#856404', 
              padding: '4px 8px', 
              borderRadius: '4px', 
              fontSize: '0.8em', 
              fontWeight: 'normal',
              marginLeft: '10px',
              border: '1px solid #ffeaa7'
            }}>
              📊 Dados calculados em tempo real
            </span>
          )}
        </h2>
        <div className="resumo-cards">
          <div className="resumo-card">
            <h3>Total de Motoristas</h3>
            <p className="valor-destaque">{fechamentosFiltrados.length}</p>
          </div>
          <div className="resumo-card">
            <h3>Total de Fretes</h3>
            <p className="valor-destaque">
              {fechamentosFiltrados.reduce((sum, f) => sum + f.total_fretes, 0)}
            </p>
          </div>
          <div className="resumo-card">
            <h3>Valor Bruto Total</h3>
            <p className="valor-destaque">
              {formatCurrency(fechamentosFiltrados.reduce((sum, f) => sum + f.valor_bruto, 0))}
            </p>
          </div>
          <div className="resumo-card">
            <h3>Total de Comissões</h3>
            <p className="valor-destaque">
              {formatCurrency(fechamentosFiltrados.reduce((sum, f) => sum + f.valor_comissao, 0))}
            </p>
          </div>
          <div className="resumo-card">
            <h3>Total de Bônus</h3>
            <p className="valor-destaque">
              {formatCurrency(fechamentosFiltrados.reduce((sum, f) => sum + (f.bonus || 0), 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Aviso para dados temporários */}
      {dadosTemporarios && (
        <div style={{
          backgroundColor: '#e7f3ff', 
          border: '1px solid #b8daff', 
          borderRadius: '4px', 
          padding: '12px', 
          margin: '15px 0',
          fontSize: '14px',
          color: '#004085'
        }}>
          <strong>ℹ️ Informação:</strong> Os dados exibidos foram calculados em tempo real para o período selecionado. 
          Estes são dados temporários e não foram salvos permanentemente. Para salvar um fechamento oficial, 
          utilize o modo "Por Mês" e clique em "Calcular Fechamento".
        </div>
      )}

      <div className="table-container">
        {fechamentosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            {fechamentos.length === 0 ? (
              <>
                <p>Nenhum fechamento encontrado para este período.</p>
                <p>Clique em "Calcular Fechamento" para processar os fretes do período.</p>
              </>
            ) : (
              <p>Nenhum fechamento encontrado para o filtro selecionado.</p>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Motorista</th>
                <th>Tipo</th>
                <th>Período</th>
                <th>Qtd Fretes</th>
                <th>Valor Bruto</th>
                <th>Comissão</th>
                <th>Descontos</th>
                <th>Bônus</th>
                <th>Valor Líquido</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fechamentosFiltrados.map((fechamento) => (
                <tr key={fechamento.id}>
                  <td>{fechamento.motorista?.nome || 'Nome não encontrado'}</td>
                  <td>{fechamento.motorista?.tipo_motorista || '-'}</td>
                  <td>{fechamento.periodo}</td>
                  <td>{fechamento.total_fretes}</td>
                  <td>{formatCurrency(fechamento.valor_bruto)}</td>
                  <td>
                    {formatCurrency(fechamento.valor_comissao)}
                    <small style={{ display: 'block', color: '#666' }}>
                      {fechamento.motorista?.porcentagem_comissao 
                        ? `(${fechamento.motorista.porcentagem_comissao}%)`
                        : fechamento.motorista?.tipo_motorista === 'Terceiro' ? '(90%)' : '(10%)'
                      }
                    </small>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{formatCurrency(fechamento.descontos || 0)}</span>
                      {!dadosTemporarios && (
                        <button
                          onClick={() => fechamento.id && recalcularDescontos(fechamento.id)}
                          style={{ 
                            padding: '2px 6px', 
                            fontSize: '10px', 
                            background: '#17a2b8', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                          title="Recalcular descontos baseado nos vales atuais"
                        >
                          ↻
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    {editandoBonus === fechamento.id && !dadosTemporarios ? (
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={novoBonus}
                          onChange={(e) => setNovoBonus(e.target.value)}
                          style={{ width: '80px', padding: '2px 4px' }}
                          placeholder="0.00"
                        />
                        <button 
                          onClick={() => fechamento.id && salvarBonus(fechamento.id)}
                          style={{ padding: '2px 6px', fontSize: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px' }}
                        >
                          ✓
                        </button>
                        <button 
                          onClick={cancelarEdicaoBonus}
                          style={{ padding: '2px 6px', fontSize: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div 
                        style={{ 
                          cursor: dadosTemporarios ? 'not-allowed' : 'pointer', 
                          padding: '4px',
                          opacity: dadosTemporarios ? 0.6 : 1
                        }}
                        onClick={() => !dadosTemporarios && fechamento.id && iniciarEdicaoBonus(fechamento.id, fechamento.bonus || 0)}
                        title={dadosTemporarios ? "Edição não disponível para dados temporários" : "Clique para editar bônus"}
                      >
                        {formatCurrency(fechamento.bonus || 0)}
                      </div>
                    )}
                  </td>
                  <td>{formatCurrency(fechamento.valor_liquido)}</td>
                  <td>
                    <select
                      value={fechamento.status}
                      onChange={(e) => !dadosTemporarios && fechamento.id && atualizarStatus(fechamento.id, e.target.value)}
                      disabled={dadosTemporarios}
                      style={{ 
                        backgroundColor: getStatusColor(fechamento.status),
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        opacity: dadosTemporarios ? 0.6 : 1,
                        cursor: dadosTemporarios ? 'not-allowed' : 'pointer'
                      }}
                      title={dadosTemporarios ? "Edição não disponível para dados temporários" : "Alterar status"}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Pago">Pago</option>
                      <option value="Atrasado">Atrasado</option>
                    </select>
                  </td>
                  <td>
                    <div className="actions">
                      <button 
                        className="btn-action"
                        onClick={() => !dadosTemporarios && fechamento.id && toggleDetalhes(fechamento.id)}
                        title={dadosTemporarios ? "Detalhes não disponíveis para dados temporários" : "Ver Detalhes"}
                        style={{ 
                          backgroundColor: mostrandoDetalhes === fechamento.id ? '#17a2b8' : '',
                          color: mostrandoDetalhes === fechamento.id ? 'white' : '',
                          opacity: dadosTemporarios ? 0.6 : 1,
                          cursor: dadosTemporarios ? 'not-allowed' : 'pointer'
                        }}
                        disabled={dadosTemporarios}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn-action btn-recalcular"
                        onClick={() => !dadosTemporarios && fechamento.id && recalcularFechamento(fechamento.id)}
                        title={dadosTemporarios ? "Recálculo não disponível para dados temporários" : "Recalcular Fechamento"}
                        style={{ 
                          opacity: dadosTemporarios ? 0.6 : 1,
                          cursor: dadosTemporarios ? 'not-allowed' : 'pointer'
                        }}
                        disabled={dadosTemporarios}
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button 
                        className="btn-action"
                        onClick={() => !dadosTemporarios && fechamento.id && gerarRelatorioPDF(fechamento.id)}
                        title={dadosTemporarios ? "PDF não disponível para dados temporários" : "Gerar Relatório PDF"}
                        style={{ 
                          opacity: dadosTemporarios ? 0.6 : 1,
                          cursor: dadosTemporarios ? 'not-allowed' : 'pointer'
                        }}
                        disabled={dadosTemporarios}
                      >
                        <FileText size={16} />
                      </button>
                      <button 
                        className="btn-action btn-archive"
                        onClick={() => !dadosTemporarios && fechamento.id && arquivarFechamento(fechamento.id, fechamento.motorista?.nome || 'Motorista')}
                        title={dadosTemporarios ? "Arquivamento não disponível para dados temporários" : "Arquivar Fechamento"}
                        style={{ 
                          opacity: dadosTemporarios ? 0.6 : 1,
                          cursor: dadosTemporarios ? 'not-allowed' : 'pointer'
                        }}
                        disabled={dadosTemporarios}
                      >
                        <Archive size={16} />
                      </button>
                      <button 
                        className="btn-action btn-danger"
                        onClick={() => !dadosTemporarios && fechamento.id && deletarFechamento(fechamento.id, fechamento.motorista?.nome || 'Motorista')}
                        title={dadosTemporarios ? "Exclusão não disponível para dados temporários" : "Excluir Fechamento"}
                        style={{ 
                          opacity: dadosTemporarios ? 0.6 : 1,
                          cursor: dadosTemporarios ? 'not-allowed' : 'pointer'
                        }}
                        disabled={dadosTemporarios}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {mostrandoDetalhes && fechamentosFiltrados.find(f => f.id === mostrandoDetalhes) && (
                <tr className="detalhes-row">
                  <td colSpan={11} style={{ backgroundColor: '#f8f9fa', padding: '15px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <h4 style={{ marginBottom: '10px', color: '#495057' }}>📊 Informações Detalhadas</h4>
                        <p><strong>Data do Fechamento:</strong> {fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.data_fechamento ? formatDisplayDate(fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.data_fechamento!) : 'Não informada'}</p>
                        <p><strong>Porcentagem de Comissão:</strong> {
                          fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.motorista?.porcentagem_comissao 
                            ? `${fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.motorista?.porcentagem_comissao}% (personalizada)`
                            : `${fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.motorista?.tipo_motorista === 'Terceiro' ? '90' : '10'}% (padrão)`
                        }</p>
                        <p><strong>Valor por Frete:</strong> {fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.total_fretes! > 0 ? formatCurrency(fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.valor_bruto! / fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.total_fretes!) : 'N/A'}</p>
                        <p><strong>Comissão por Frete:</strong> {fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.total_fretes! > 0 ? formatCurrency(fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.valor_comissao! / fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.total_fretes!) : 'N/A'}</p>
                      </div>
                      <div>
                        <h4 style={{ marginBottom: '10px', color: '#495057' }}>💰 Breakdown Financeiro</h4>
                        <p><strong>Valor Bruto:</strong> <span style={{ color: '#28a745' }}>{formatCurrency(fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.valor_bruto!)}</span></p>
                        <p><strong>(-) Comissão:</strong> <span style={{ color: '#007bff' }}>{formatCurrency(fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.valor_comissao!)}</span></p>
                        <p><strong>(-) Descontos/Vales:</strong> <span style={{ color: '#dc3545' }}>{formatCurrency(fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.descontos || 0)}</span></p>
                        <p><strong>(+) Bônus:</strong> <span style={{ color: '#ffc107' }}>{formatCurrency(fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.bonus || 0)}</span></p>
                        <p style={{ borderTop: '1px solid #dee2e6', paddingTop: '5px', marginTop: '10px' }}>
                          <strong>Valor Líquido:</strong> <span style={{ color: '#28a745', fontSize: '1.1em' }}>{formatCurrency(fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.valor_liquido!)}</span>
                        </p>
                        {fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.observacoes && (
                          <div style={{ marginTop: '10px' }}>
                            <strong>Observações:</strong>
                            <p style={{ fontStyle: 'italic', color: '#6c757d' }}>{fechamentosFiltrados.find(f => f.id === mostrandoDetalhes)?.observacoes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FechamentoMotoristas; 