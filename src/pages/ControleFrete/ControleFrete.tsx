import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Truck, Filter, Calendar, FileText, Download, Archive, User } from 'lucide-react';
import CurrencyInput from 'react-currency-input-field';
import { freteService, Frete } from '../../services/freteService';
import { caminhaoService, Caminhao } from '../../services/caminhaoService';
import { motoristaService, Motorista } from '../../services/motoristaService';
import { freteCaminhaoService } from '../../services/freteCaminhaoService';
import { freteMotoristaService } from '../../services/freteMotoristaService';
import { formatDisplayDate } from '../../services/dateUtils';
import { reboqueService, Reboque } from '../../services/reboqueService';
import { arquivamentoAutomaticoService } from '../../services/arquivamentoAutomaticoService';
import './ControleFrete.css';

type CaminhaoSelecionado = {
  caminhao_id: string;
  reboque_id?: string;
  valor_frete?: string;
};

type MotoristaSelecionado = {
  motorista_id: string;
  caminhao_id: string; // Associar motorista ao caminhão específico
};

const ControleFrete: React.FC = () => {
  const [fretes, setFretes] = useState<Frete[]>([]);
  const [caminhoes, setCaminhoes] = useState<Caminhao[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filtroSituacao, setFiltroSituacao] = useState<string>('');
  
  // Estados para os novos filtros
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');
  const [filtroCliente, setFiltroCliente] = useState<string>('');
  
  // Estados para relatório de acerto
  const [activeTab, setActiveTab] = useState<'fretes' | 'acerto'>('fretes');
  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');
  const [dataInicioAcerto, setDataInicioAcerto] = useState<string>('');
  const [dataFimAcerto, setDataFimAcerto] = useState<string>('');
  const [fretesAcerto, setFretesAcerto] = useState<Frete[]>([]);

  const [formData, setFormData] = useState({
    data_emissao: '',
    pecuarista: '',
    origem: '',
    destino: '',
    numero_minuta: '',
    numero_cb: '',
    cliente: '',
    observacoes: '',
    faixa: '',
    total_km: '',
    valor_frete: '',
    situacao: 'Pendente',
    tipo_pagamento: '',
    data_pagamento: ''
  });

  // Arrays para múltiplos caminhões e motoristas
  const [caminhoesSelecionados, setCaminhoesSelecionados] = useState<CaminhaoSelecionado[]>([]);
  const [motoristasSelecionados, setMotoristasSelecionados] = useState<MotoristaSelecionado[]>([]);

  // Estado para reboques
  const [reboques, setReboques] = useState<Reboque[]>([]);

  // [1] Adicionar estados auxiliares para vínculos
  const [vinculosCaminhoes, setVinculosCaminhoes] = useState<{ [freteId: number]: import('../../services/freteCaminhaoService').FreteCaminhao[] }>({});
  const [vinculosMotoristas, setVinculosMotoristas] = useState<{ [freteId: number]: import('../../services/freteMotoristaService').FreteMotorista[] }>({});

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
    setupScrollIndicators();
    loadReboques();
  }, []);

  // Executar arquivamento automático em background
  useEffect(() => {
    const executarArquivamentoAutomatico = async () => {
      try {
        const resultado = await arquivamentoAutomaticoService.verificarEExecutar();
        
        if (resultado.executado && resultado.quantidade > 0) {
          // Mostrar notificação ao usuário
          alert(`✅ Arquivamento automático executado!\n\n${resultado.quantidade} fretes antigos foram arquivados automaticamente.`);
          
          // Recarregar dados para atualizar a lista
          loadData();
        }
      } catch (error) {
        console.error('❌ Erro no arquivamento automático:', error);
        // Não mostrar erro ao usuário para não atrapalhar a experiência
      }
    };

    // Executar após 2 segundos (para não interferir no carregamento inicial)
    const timer = setTimeout(() => {
      executarArquivamentoAutomatico();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const setupScrollIndicators = () => {
    const tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return;

    const updateScrollIndicators = () => {
      const { scrollLeft, scrollWidth, clientWidth } = tableContainer;
      
      tableContainer.classList.remove('scrolled-left', 'scrolled-right');
      
      if (scrollLeft > 10) {
        tableContainer.classList.add('scrolled-left');
      }
      
      if (scrollLeft < scrollWidth - clientWidth - 10) {
        tableContainer.classList.add('scrolled-right');
      }
    };

    tableContainer.addEventListener('scroll', updateScrollIndicators);
    setTimeout(updateScrollIndicators, 100);
    
    return () => {
      tableContainer.removeEventListener('scroll', updateScrollIndicators);
    };
  };

  // [2] Alterar loadData para buscar vínculos após carregar fretes
  const loadData = async () => {
    try {
      setLoading(true);
      const [fretesData, caminhoesData, motoristasData] = await Promise.all([
        freteService.getAll(),
        caminhaoService.getAll(),
        motoristaService.getAll()
      ]);
      setFretes(fretesData);
      setCaminhoes(caminhoesData.filter(c => c.status === 'Ativo'));
      setMotoristas(motoristasData.filter(m => m.status === 'Ativo'));
      // Buscar vínculos de caminhões e motoristas para todos os fretes
      const ids = fretesData.map(f => f.id).filter((id): id is number => typeof id === 'number');
      // Buscar todos os vínculos de caminhão
      const allCaminhoes = await Promise.all(ids.map(id => freteCaminhaoService.getByFreteId(id)));
      const vincCaminhoes: { [freteId: number]: import('../../services/freteCaminhaoService').FreteCaminhao[] } = {};
      ids.forEach((id, idx) => { vincCaminhoes[id!] = allCaminhoes[idx]; });
      setVinculosCaminhoes(vincCaminhoes);
      // Buscar todos os vínculos de motoristas
      const allMotoristas = await Promise.all(ids.map(id => freteMotoristaService.getByFreteId(id)));
      const vincMotoristas: { [freteId: number]: import('../../services/freteMotoristaService').FreteMotorista[] } = {};
      ids.forEach((id, idx) => { vincMotoristas[id!] = allMotoristas[idx]; });
      setVinculosMotoristas(vincMotoristas);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const loadReboques = async () => {
    try {
      const data = await reboqueService.getAll();
      setReboques(data);
    } catch {
      setReboques([]);
    }
  };

  const resetForm = () => {
    setFormData({
      data_emissao: '',
      pecuarista: '',
      origem: '',
      destino: '',
      numero_minuta: '',
      numero_cb: '',
      cliente: '',
      observacoes: '',
      faixa: '',
      total_km: '',
      valor_frete: '',
      situacao: 'Pendente',
      tipo_pagamento: '',
      data_pagamento: ''
    });
    setCaminhoesSelecionados([]);
    setMotoristasSelecionados([]);
    setEditingId(null);
    setShowForm(false);
  };

  // Função para gerenciar arquivamento automático
  const handleGerenciarArquivamento = async () => {
    const ultimo = arquivamentoAutomaticoService.getUltimoArquivamento();
    
    const mensagem = ultimo 
      ? `📊 Último Arquivamento Automático:\n\n` +
        `📅 Data: ${new Date(ultimo.data).toLocaleString('pt-BR')}\n` +
        `📦 Período: ${ultimo.periodo}\n` +
        `📁 Fretes arquivados: ${ultimo.quantidade}\n\n` +
        `Deseja forçar o arquivamento agora?`
      : `📊 Arquivamento Automático\n\n` +
        `Nenhum arquivamento foi executado ainda.\n\n` +
        `Deseja executar o arquivamento agora?`;

    if (window.confirm(mensagem)) {
      try {
        setLoading(true);
        const quantidade = await arquivamentoAutomaticoService.forcarArquivamento();
        alert(`✅ Arquivamento concluído!\n\n${quantidade} fretes foram arquivados.`);
        loadData(); // Recarregar dados
      } catch (error) {
        console.error('Erro ao arquivar:', error);
        alert('❌ Erro ao executar arquivamento. Verifique o console para detalhes.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = async (frete: Frete) => {
    setFormData({
      data_emissao: frete.data_emissao,
      pecuarista: frete.pecuarista,
      origem: frete.origem,
      destino: frete.destino,
      numero_minuta: frete.numero_minuta || '',
      numero_cb: frete.numero_cb || '',
      cliente: frete.cliente || '',
      observacoes: frete.observacoes || '',
      faixa: frete.faixa || '',
      total_km: frete.total_km?.toString() || '',
      valor_frete: frete.valor_frete.toString(),
      situacao: frete.situacao,
      tipo_pagamento: frete.tipo_pagamento || '',
      data_pagamento: frete.data_pagamento || ''
    });
    
    // Carregar vínculos de caminhões e motoristas
    const caminhoesVinc = await freteCaminhaoService.getByFreteId(frete.id!);
    setCaminhoesSelecionados(caminhoesVinc.map(v => ({
      caminhao_id: v.caminhao_id.toString(),
      reboque_id: v.reboque_id ? v.reboque_id.toString() : undefined,
      valor_frete: v.valor_frete ? v.valor_frete.toString() : undefined
    })));
    const motoristasVinc = await freteMotoristaService.getByFreteId(frete.id!);
    setMotoristasSelecionados(motoristasVinc.map(v => ({
      motorista_id: v.motorista_id.toString(),
      caminhao_id: v.caminhao_id ? v.caminhao_id.toString() : (caminhoesVinc[0]?.caminhao_id || 0).toString()
    })));
    
    setEditingId(typeof frete.id === 'number' ? frete.id : null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validações básicas
      if (caminhoesSelecionados.length === 0 || motoristasSelecionados.length === 0) {
        alert('Selecione pelo menos um caminhão e um motorista');
        return;
      }

      // Validar se todos os motoristas têm caminhão associado
      const motoristasSemCaminhao = motoristasSelecionados.filter(m => !m.caminhao_id);
      if (motoristasSemCaminhao.length > 0) {
        alert('Todos os motoristas devem estar associados a um caminhão');
        return;
      }

      // VALIDAÇÃO CRÍTICA: Verificar se há motoristas duplicados no mesmo caminhão
      const caminhoesPorMotorista = new Map<string, string[]>();
      motoristasSelecionados.forEach(m => {
        const motoristaNome = motoristas.find(mot => mot.id === parseInt(m.motorista_id))?.nome || m.motorista_id;
        if (!caminhoesPorMotorista.has(m.caminhao_id)) {
          caminhoesPorMotorista.set(m.caminhao_id, []);
        }
        caminhoesPorMotorista.get(m.caminhao_id)!.push(motoristaNome);
      });

      // Verificar se algum caminhão tem mais de 1 motorista
      const caminhoesComMultiplosMotoristas: string[] = [];
      caminhoesPorMotorista.forEach((motoristasNomes, caminhaoId) => {
        if (motoristasNomes.length > 1) {
          const caminhaoPlaca = caminhoes.find(c => c.id === parseInt(caminhaoId))?.placa || caminhaoId;
          caminhoesComMultiplosMotoristas.push(
            `${caminhaoPlaca}: ${motoristasNomes.join(', ')}`
          );
        }
      });

      if (caminhoesComMultiplosMotoristas.length > 0) {
        alert(
          `ERRO: Os seguintes caminhões têm mais de 1 motorista associado:\n\n` +
          caminhoesComMultiplosMotoristas.join('\n') +
          `\n\nRegra: 1 CAMINHÃO = 1 MOTORISTA ÚNICO!\n` +
          `Corrija antes de salvar.`
        );
        return;
      }

      // VALIDAÇÃO CRÍTICA: Verificar se há caminhões sem motorista
      const caminhoesComMotorista = new Set(motoristasSelecionados.map(m => m.caminhao_id));
      const caminhoesSemMotorista = caminhoesSelecionados.filter(c => !caminhoesComMotorista.has(c.caminhao_id));
      
      if (caminhoesSemMotorista.length > 0) {
        const placasSemMotorista = caminhoesSemMotorista.map(c => {
          const caminhao = caminhoes.find(cam => cam.id === parseInt(c.caminhao_id));
          return caminhao?.placa || c.caminhao_id;
        });
        
        alert(
          `ERRO: Os seguintes caminhões NÃO têm motorista associado:\n\n` +
          placasSemMotorista.join(', ') +
          `\n\nTodos os caminhões DEVEM ter um motorista!\n` +
          `Corrija antes de salvar.`
        );
        return;
      }

      if (!formData.valor_frete || parseFloat(formData.valor_frete) <= 0) {
        alert('Informe um valor de frete válido');
        return;
      }

      // CORREÇÃO #1: Validar se todos os caminhões têm valor individual preenchido
      const caminhoesSemValor = caminhoesSelecionados.filter(c => !c.valor_frete || parseFloat(c.valor_frete) <= 0);
      if (caminhoesSemValor.length > 0) {
        alert('Todos os caminhões devem ter valor de frete individual preenchido e maior que zero!');
        return;
      }

      // CORREÇÃO #2: Validar se soma dos valores individuais = valor total do frete
      const somaCaminhoes = caminhoesSelecionados.reduce((sum, cam) => {
        return sum + (parseFloat(cam.valor_frete || '0'));
      }, 0);
      
      const valorTotalFrete = parseFloat(formData.valor_frete);
      const diferenca = Math.abs(somaCaminhoes - valorTotalFrete);
      
      if (diferenca > 0.01) { // Tolerância de 1 centavo para arredondamento
        alert(
          `ERRO: Inconsistência nos valores!\n\n` +
          `Valor total do frete: R$ ${valorTotalFrete.toFixed(2)}\n` +
          `Soma dos valores individuais dos caminhões: R$ ${somaCaminhoes.toFixed(2)}\n` +
          `Diferença: R$ ${diferenca.toFixed(2)}\n\n` +
          `A soma dos valores individuais DEVE ser igual ao valor total do frete.\n` +
          `Ajuste os valores antes de salvar.`
        );
        return;
      }

      if (formData.situacao === 'Pago') {
        if (!formData.tipo_pagamento) {
          alert('Selecione o tipo de pagamento quando a situação for "Pago"');
          return;
        }
        if (!formData.data_pagamento) {
          alert('Informe a data do pagamento quando a situação for "Pago"');
          return;
        }
      }

      const freteData = {
        data_emissao: formData.data_emissao,
        pecuarista: formData.pecuarista,
        origem: formData.origem,
        destino: formData.destino,
        numero_minuta: formData.numero_minuta || undefined,
        numero_cb: formData.numero_cb || undefined,
        cliente: formData.cliente || undefined,
        observacoes: formData.observacoes || undefined,
        faixa: formData.faixa || undefined,
        total_km: formData.total_km ? parseInt(formData.total_km) : undefined,
        valor_frete: parseFloat(formData.valor_frete),
        situacao: formData.situacao,
        tipo_pagamento: formData.situacao === 'Pago' ? formData.tipo_pagamento : null,
        data_pagamento: formData.situacao === 'Pago' ? formData.data_pagamento : null
      };

      let freteId = editingId;
      
      if (editingId) {
        await freteService.update(editingId, freteData);
        // Remover vínculos antigos
        await freteCaminhaoService.deleteByFreteId(editingId);
        await freteMotoristaService.deleteByFreteId(editingId);
        freteId = editingId;
      } else {
        const novoFrete = await freteService.create(freteData);
        freteId = typeof novoFrete.id === 'number' ? novoFrete.id : null;
      }

      // Salvar vínculos de caminhões
      for (const caminhaoVinc of caminhoesSelecionados) {
        const caminhao = caminhoes.find(c => c.id === parseInt(caminhaoVinc.caminhao_id));
        let configuracao: 'Truck' | 'Julieta' | 'Carreta Baixa' | 'Carreta 2 Pisos' = 'Truck';
        if (caminhao?.tipo === 'Julieta') configuracao = 'Julieta';
        else if (caminhao?.tipo === 'Carreta Baixa') configuracao = 'Carreta Baixa';
        else if (caminhao?.tipo === 'Carreta 2 Pisos') configuracao = 'Carreta 2 Pisos';
        else if (caminhao?.tipo === 'Truck' && caminhaoVinc.reboque_id) configuracao = 'Julieta';
        
        // CORREÇÃO #3: Garantir que valor_frete nunca seja null - validado acima
        const valorFreteIndividual = parseFloat(caminhaoVinc.valor_frete!);
        
        await freteCaminhaoService.create({
          frete_id: freteId!,
          caminhao_id: parseInt(caminhaoVinc.caminhao_id),
          configuracao: configuracao,
          reboque_id: caminhaoVinc.reboque_id ? parseInt(caminhaoVinc.reboque_id) : null,
          valor_frete: valorFreteIndividual
        });
      }
      
      // Salvar vínculos de motoristas com caminhão específico
      for (const motorista of motoristasSelecionados) {
        await freteMotoristaService.create({ 
          frete_id: freteId!, 
          motorista_id: parseInt(motorista.motorista_id),
          caminhao_id: parseInt(motorista.caminhao_id)
        });
      }
      
      alert(editingId ? 'Frete atualizado com sucesso!' : 'Frete cadastrado com sucesso!');
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar frete:', error);
      alert('Erro ao salvar frete. Verifique os dados e tente novamente.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este frete?')) {
      try {
        await freteCaminhaoService.deleteByFreteId(id);
        await freteMotoristaService.deleteByFreteId(id);
        await freteService.delete(id);
        setFretes(fretes.filter(f => f.id !== id));
        alert('Frete excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir frete:', error);
        alert('Erro ao excluir frete.');
      }
    }
  };

  const handleArquivar = async (id: number) => {
    if (window.confirm('Tem certeza que deseja arquivar este frete? Ele será movido para o histórico.')) {
      try {
        await freteCaminhaoService.deleteByFreteId(id);
        await freteMotoristaService.deleteByFreteId(id);
        await freteService.arquivar(id);
        setFretes(fretes.filter(f => f.id !== id));
        alert('Frete arquivado com sucesso!');
      } catch (error) {
        console.error('Erro ao arquivar frete:', error);
        alert('Erro ao arquivar frete. Tente novamente.');
      }
    }
  };

  // Função auxiliar para calcular valores individuais e total por frete
  const calcularValoresPorCaminhao = (freteId: number) => {
    const vinculos = vinculosCaminhoes[freteId];
    if (!vinculos || vinculos.length === 0) {
      return {
        valoresIndividuais: [],
        total: 0
      };
    }
    
    const valoresIndividuais = vinculos.map(vinculo => {
      const configuracao = vinculo.configuracao;
      const reboqueId = vinculo.reboque_id;
      
      const descricaoConfiguracao = configuracao === 'Truck'
        ? 'Truck'
        : `${configuracao}${reboqueId ? ` (${reboques.find(r => r.id === reboqueId)?.placa || ''})` : ''}`;
      
      return {
        valor: vinculo.valor_frete || 0,
        descricao: descricaoConfiguracao
      };
    });
    
    const total = valoresIndividuais.reduce((sum, item) => sum + item.valor, 0);
    
    return {
      valoresIndividuais,
      total
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return formatDisplayDate(dateString);
  };

  const getSituacaoClass = (situacao: string) => {
    switch (situacao.toLowerCase()) {
      case 'pendente': return 'pendente';
      case 'em andamento': return 'em-andamento';
      case 'concluído': case 'concluido': return 'concluido';
      case 'frigorífico': return 'frigorifico';
      case 'pago': return 'pago';
      default: return 'pendente';
    }
  };

  const getClientesUnicos = (): string[] => {
    const clientes = fretes
      .map(f => f.cliente)
      .filter((cliente): cliente is string => Boolean(cliente && cliente.trim()))
      .filter((cliente, index, arr) => arr.indexOf(cliente) === index);
    return clientes.sort();
  };

  // Aplicar filtros (simplificados)
  const fretesFiltrados = fretes.filter(frete => {
    if (filtroSituacao && frete.situacao !== filtroSituacao) {
      return false;
    }

    if (filtroDataInicio || filtroDataFim) {
      const dataFrete = new Date(frete.data_emissao);
      
      if (filtroDataInicio) {
        const dataInicio = new Date(filtroDataInicio);
        if (dataFrete < dataInicio) return false;
      }
      
      if (filtroDataFim) {
        const dataFim = new Date(filtroDataFim);
        if (dataFrete > dataFim) return false;
      }
    }

    if (filtroCliente && frete.cliente !== filtroCliente) {
      return false;
    }

    return true;
  });

  const handleValorFreteChange = (value: string | undefined) => {
    const valor = value || '';
    
    setFormData(prev => ({
      ...prev,
      valor_frete: valor
    }));
  };

  // Função para gerar PDF do Controle de Fretes
  const gerarPDFControleFrentes = async () => {
    if (fretesFiltrados.length === 0) {
      alert('Nenhum frete para gerar o relatório');
      return;
    }

    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = 297; // A4 paisagem
      const pageHeight = 210;
      
      // Função para adicionar logo
      const addLogo = async (x: number, y: number, width: number, height: number): Promise<void> => {
        try {
          const response = await fetch('/assets/images/logo.png');
          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            
            return new Promise((resolve) => {
              reader.onload = function(e) {
                if (e.target?.result) {
                  try {
                    doc.addImage(e.target.result as string, 'PNG', x, y, width, height);
                  } catch (error) {
                    console.log('Erro ao adicionar logo no PDF:', error);
                  }
                }
                resolve();
              };
              reader.readAsDataURL(blob);
            });
          }
        } catch (error) {
          console.log('Logo não encontrada, continuando sem logo:', error);
        }
      };

      // Configurar fonte
      doc.setFont('helvetica');
      
      // Adicionar logo
      await addLogo(15, 8, 25, 25);
      
      // Cabeçalho da empresa
      doc.setFontSize(18);
      doc.setTextColor(139, 0, 0);
      doc.text('VALE DO BOI', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(139, 0, 0);
      doc.text('Transporte de Bovinos', pageWidth / 2, 22, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Relatório de Controle de Fretes', pageWidth / 2, 30, { align: 'center' });
      
      // Linha separadora
      doc.setLineWidth(0.5);
      doc.setDrawColor(139, 0, 0);
      doc.line(15, 35, pageWidth - 15, 35);
      
      // Informações do relatório
      let yPos = 42;
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      
      let infoText = `Data do Relatório: ${new Date().toLocaleDateString('pt-BR')}  |  `;
      infoText += `Total de Fretes: ${fretesFiltrados.length}  |  `;
      
      if (filtroDataInicio && filtroDataFim) {
        infoText += `Período: ${formatDisplayDate(filtroDataInicio)} a ${formatDisplayDate(filtroDataFim)}`;
      } else if (filtroDataInicio) {
        infoText += `A partir de: ${formatDisplayDate(filtroDataInicio)}`;
      } else if (filtroDataFim) {
        infoText += `Até: ${formatDisplayDate(filtroDataFim)}`;
      }
      
      doc.text(infoText, pageWidth / 2, yPos, { align: 'center' });
      
      if (filtroCliente) {
        yPos += 5;
        doc.text(`Cliente: ${filtroCliente}`, pageWidth / 2, yPos, { align: 'center' });
      }
      
      if (filtroSituacao) {
        yPos += 5;
        doc.text(`Situação: ${filtroSituacao}`, pageWidth / 2, yPos, { align: 'center' });
      }
      
      // Função para desenhar tabela de fretes (mesmo padrão do relatório de acerto)
      const drawFretesTable = (startY: number) => {
        const headers = ['Sit.', 'Data', 'Min.', 'CB', 'Pecuarista', 'Cliente', 'Origem', 'Destino', 'Motorista', 'Caminhão', 'Conf.', 'Valor', 'T.Pag', 'D.Pag', 'Faixa', 'KM'];
        const colWidths = [15, 18, 14, 12, 22, 22, 20, 20, 22, 18, 16, 20, 15, 18, 13, 12];
        const totalWidth = colWidths.reduce((a, b) => a + b, 0);
        const startX = (pageWidth - totalWidth) / 2; // Centralizar
        const rowHeight = 8;
        let currentY = startY;
        let pageNum = 1;
        
        // Função para desenhar cabeçalho
        const drawHeader = () => {
          doc.setFillColor(139, 0, 0);
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          
          let currentX = startX;
          headers.forEach((header, i) => {
            // Preencher célula
            doc.setFillColor(139, 0, 0);
            doc.rect(currentX, currentY, colWidths[i], rowHeight, 'F');
            
            // Texto
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(header, currentX + colWidths[i]/2, currentY + 6, { align: 'center' });
            currentX += colWidths[i];
          });
          
          currentY += rowHeight;
        };
        
        // Desenhar cabeçalho inicial
        drawHeader();
        
        // Linhas de dados
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        
        fretesFiltrados.forEach((frete, index) => {
          // Verificar quebra de página
          if (currentY + rowHeight > pageHeight - 25) {
            // Rodapé
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Página ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            
            // Nova página
            doc.addPage();
            pageNum++;
            currentY = 20;
            
            // Redesenhar cabeçalho
            drawHeader();
            
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
          }
          
          // Dados do frete
          const caminhaoVinculo = vinculosCaminhoes[frete.id!]?.[0];
          const motoristaVinculo = vinculosMotoristas[frete.id!]?.[0];
          const caminhao = caminhaoVinculo ? caminhoes.find(c => c.id === caminhaoVinculo.caminhao_id) : null;
          const motorista = motoristaVinculo ? motoristas.find(m => m.id === motoristaVinculo.motorista_id) : null;
          
          const rowData = [
            frete.situacao || '-',
            formatDate(frete.data_emissao),
            frete.numero_minuta || '-',
            frete.numero_cb || '-',
            (frete.pecuarista || '-').substring(0, 15),
            (frete.cliente || '-').substring(0, 15),
            (frete.origem || '-').substring(0, 14),
            (frete.destino || '-').substring(0, 14),
            (motorista?.nome || '-').substring(0, 15),
            caminhao?.placa || '-',
            (caminhaoVinculo?.configuracao || '-').substring(0, 10),
            formatCurrency(frete.valor_frete),
            (frete.tipo_pagamento || '-').substring(0, 10),
            frete.data_pagamento ? formatDate(frete.data_pagamento) : '-',
            frete.faixa || '-',
            frete.total_km ? `${frete.total_km}` : '-'
          ];
          
          // Cor de fundo zebrado
          const bgColor = index % 2 === 0 ? [255, 255, 255] : [245, 245, 245];
          
          let currentX = startX;
          rowData.forEach((cell, i) => {
            // Preencher célula com cor de fundo
            doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
            doc.rect(currentX, currentY, colWidths[i], rowHeight, 'F');
            
            // Borda
            doc.setDrawColor(200, 200, 200);
            doc.rect(currentX, currentY, colWidths[i], rowHeight);
            
            // Texto
            doc.setTextColor(0, 0, 0);
            let align: 'left' | 'center' | 'right' = 'center';
            if ([4, 5, 6, 7, 8].includes(i)) align = 'left'; // Nomes
            if (i === 11) align = 'right'; // Valor
            
            const textX = align === 'center' ? currentX + colWidths[i] / 2 : 
                         align === 'right' ? currentX + colWidths[i] - 2 : currentX + 2;
            
            doc.text(cell, textX, currentY + 6, { align });
            currentX += colWidths[i];
          });
          
          currentY += rowHeight;
        });
        
        // Rodapé da última página
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Página ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        return currentY;
      };
      
      // Desenhar tabela
      const tableEndY = drawFretesTable(yPos + 8);
      
      // Adicionar resumo financeiro
      const totalGeral = fretesFiltrados.reduce((sum, f) => sum + f.valor_frete, 0);
      const resumoY = tableEndY + 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 0, 0);
      doc.text(`TOTAL GERAL: ${formatCurrency(totalGeral)}`, pageWidth - 15, resumoY, { align: 'right' });
      
      // Salvar PDF
      const dataAtual = new Date().toISOString().split('T')[0];
      doc.save(`relatorio-fretes-${dataAtual}.pdf`);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
    }
  };

  // Funções para relatório de acerto

  const filtrarFretesAcerto = () => {
    if (!clienteSelecionado) {
      alert('Selecione um cliente para gerar o acerto');
      return;
    }

    let fretesFiltrados = fretes.filter(f => 
      f.cliente === clienteSelecionado
    );

    if (dataInicioAcerto && dataFimAcerto) {
      fretesFiltrados = fretesFiltrados.filter(f => {
        const dataFrete = new Date(f.data_emissao);
        const inicio = new Date(dataInicioAcerto);
        const fim = new Date(dataFimAcerto);
        return dataFrete >= inicio && dataFrete <= fim;
      });
    }

    // Manter apenas uma linha por frete - os caminhões serão mostrados na renderização
    setFretesAcerto(fretesFiltrados);
  };

  const gerarPDFAcerto = async () => {
    if (fretesAcerto.length === 0) {
      alert('Nenhum frete encontrado para o acerto');
      return;
    }

    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF('portrait', 'mm', 'a4');
      
      const pageWidth = 210;
      const pageHeight = 297;
      
      // Função para adicionar logo
      const addLogo = async (x: number, y: number, width: number, height: number): Promise<void> => {
        try {
          const response = await fetch('/assets/images/logo.png');
          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            
            return new Promise((resolve) => {
              reader.onload = function(e) {
                if (e.target?.result) {
                  try {
                    doc.addImage(e.target.result as string, 'PNG', x, y, width, height);
                  } catch (error) {
                    console.log('Erro ao adicionar logo no PDF:', error);
                  }
                }
                resolve();
              };
              reader.readAsDataURL(blob);
            });
          }
        } catch (error) {
          console.log('Logo não encontrada, continuando sem logo:', error);
        }
      };

      // Configurar fonte
      doc.setFont('helvetica');
      
      // Adicionar logo
      await addLogo(20, 10, 30, 30);
      
      // Cabeçalho da empresa
      doc.setFontSize(20);
      doc.setTextColor(139, 0, 0); // Cor vermelha
      doc.text('VALE DO BOI', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setTextColor(139, 0, 0);
      doc.text('Transporte de Bovinos', pageWidth / 2, 28, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Relatório de Acerto de Frete', pageWidth / 2, 38, { align: 'center' });
      
      // Linha separadora
      doc.setLineWidth(0.5);
      doc.setDrawColor(139, 0, 0);
      doc.line(20, 43, pageWidth - 20, 43);
      
      // Informações do cliente
      let yPos = 58;
      doc.setFontSize(14);
      doc.setTextColor(139, 0, 0);
      doc.text('DADOS DO CLIENTE', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Cliente: ${clienteSelecionado.toUpperCase()}`, 20, yPos);
      yPos += 8;
      
      if (dataInicioAcerto && dataFimAcerto) {
        doc.text(`Período: ${formatDisplayDate(dataInicioAcerto)} a ${formatDisplayDate(dataFimAcerto)}`, 20, yPos);
        yPos += 8;
      }
      
      doc.text(`Data do Relatório: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPos);
      yPos += 8;
      doc.text(`Total de Fretes: ${fretesAcerto.length}`, 20, yPos);
      
      // Resumo financeiro
      const total = fretesAcerto.reduce((sum, f) => sum + f.valor_frete, 0);
      yPos += 20;
      doc.setFontSize(14);
      doc.setTextColor(139, 0, 0);
      doc.text('RESUMO FINANCEIRO', 20, yPos);
      
      yPos += 15;
      // Desenhar tabela de resumo
      doc.setFillColor(139, 0, 0);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      // Cabeçalho do resumo
      doc.rect(20, yPos, 100, 10, 'F');
      doc.text('Descrição', 22, yPos + 7);
      doc.rect(120, yPos, 60, 10, 'F');
      doc.text('Valor', 150, yPos + 7, { align: 'center' });
      
      yPos += 10;
      
      // Dados do resumo
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      const resumoData = [
        ['Valor Total dos Fretes', formatCurrency(total)]
      ];
      
      resumoData.forEach((row, index) => {
        const bgColor = index % 2 === 1 ? [245, 245, 245] : [255, 255, 255];
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(20, yPos, 100, 8, 'F');
        doc.rect(120, yPos, 60, 8, 'F');
        
        doc.setDrawColor(200, 200, 200);
        doc.rect(20, yPos, 100, 8);
        doc.rect(120, yPos, 60, 8);
        
        doc.text(row[0], 22, yPos + 6);
        doc.setFont('helvetica', 'bold');
        doc.text(row[1], 178, yPos + 6, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 8;
      });
      
      // (Detalhamento dos fretes será colocado após dados bancários)
      
      // Função para desenhar tabela de fretes
                  const drawFretesTable = (startY: number) => {
              const headers = ['Data', 'Tipo Veículo', 'Origem', 'Destino', 'KM', 'Valor', 'Valores Detalhados'];
              const colWidths = [21, 28, 31, 31, 15, 25, 38]; // Total: 189mm - aumentado mais 1mm cada coluna
              const totalWidth = colWidths.reduce((a, b) => a + b, 0);
        const startX = (pageWidth - totalWidth) / 2; // Centralizar na página
        console.log(`[ACERTO PDF DEBUG] Centralizando tabela: startX=${startX}, totalWidth=${totalWidth}`);
        let currentY = startY;
        
        // Cabeçalho da tabela
        doc.setFillColor(139, 0, 0);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        
        let currentX = startX;
        headers.forEach((header, i) => {
          // Garantir que a cor de fundo está sendo aplicada
          doc.setFillColor(139, 0, 0);
          doc.rect(currentX, currentY, colWidths[i], 12, 'F');
          
          // Garantir que a cor do texto está branca
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          
          doc.text(header, currentX + colWidths[i]/2, currentY + 8, { align: 'center' });
          currentX += colWidths[i];
        });
        
        currentY += 12;
        
        // Dados dos fretes
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        fretesAcerto.forEach((frete, index) => {
          // Verificar quebra de página (com mais margem de segurança)
          if (currentY + 20 > pageHeight - 40) {
            doc.addPage();
            currentY = 20;
            
            // Redesenhar cabeçalho na nova página
            doc.setFillColor(139, 0, 0);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            
            currentX = startX;
            headers.forEach((header, i) => {
              // Garantir que a cor de fundo está sendo aplicada
              doc.setFillColor(139, 0, 0);
              doc.rect(currentX, currentY, colWidths[i], 12, 'F');
              
              // Garantir que a cor do texto está branca
              doc.setTextColor(255, 255, 255);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              
              doc.text(header, currentX + colWidths[i]/2, currentY + 8, { align: 'center' });
              currentX += colWidths[i];
            });
            
            currentY += 12;
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
          }
          
          // Buscar todos os caminhões vinculados a este frete
          const vinculosCaminhao = vinculosCaminhoes[frete.id!];
          
          // Preparar arrays para concatenar informações de todos os caminhões
          const descricoesConfiguracao: string[] = [];
          
          if (vinculosCaminhao && vinculosCaminhao.length > 0) {
            vinculosCaminhao.forEach(vinculo => {
              const configuracao = vinculo.configuracao;
              const reboqueId = vinculo.reboque_id;
              
              // Formatar configuração igual à tabela principal
              const descricaoConfiguracao = configuracao === 'Truck' 
                ? 'Truck'
                : `${configuracao}${reboqueId ? ` (${reboques.find(r => r.id === reboqueId)?.placa || ''})` : ''}`;
              
              descricoesConfiguracao.push(descricaoConfiguracao);
            });
          } else {
            // Fallback para dados diretos do frete
            if (frete.caminhao) {
              const descricaoConfiguracao = frete.configuracao === 'Truck' 
                ? 'Truck'
                : `${frete.configuracao || 'N/A'}`;
              descricoesConfiguracao.push(descricaoConfiguracao);
            } else {
              descricoesConfiguracao.push('N/A');
            }
          }
          
          // Alternar cor de fundo
          if (index % 2 === 1) {
            doc.setFillColor(245, 245, 245);
            doc.rect(startX, currentY, totalWidth, 8, 'F');
          }
          
          // Calcular valores por caminhão para o PDF
          const { valoresIndividuais, total } = calcularValoresPorCaminhao(frete.id!);
          
          // Calcular altura necessária para acomodar múltiplas linhas
          const maxItems = Math.max(descricoesConfiguracao.length, valoresIndividuais.length);
          const lineHeight = 4;
          const cellHeight = Math.max(12, maxItems * lineHeight + (valoresIndividuais.length > 1 ? lineHeight : 0) + 4);
          
          // Aplicar cor de fundo alternada
          if (index % 2 === 1) {
            doc.setFillColor(245, 245, 245);
            doc.rect(startX, currentY, totalWidth, cellHeight, 'F');
          }
          
          const rowData = [
            formatDisplayDate(frete.data_emissao).substring(0, 5),
            '', // Será preenchido manualmente
            frete.origem.length > 18 ? frete.origem.substring(0, 18) + '...' : frete.origem,
            frete.destino.length > 18 ? frete.destino.substring(0, 18) + '...' : frete.destino,
            frete.total_km ? frete.total_km.toString() : '-',
            formatCurrency(frete.valor_frete),
            '' // Será preenchido manualmente
          ];
          
          currentX = startX;
          rowData.forEach((data, i) => {
            // Desenhar borda da célula
            doc.setDrawColor(200, 200, 200);
            doc.rect(currentX, currentY, colWidths[i], cellHeight);
            
            // Tratamento especial para colunas de descrição e valores detalhados
            if (i === 1) { // Coluna de descrição
              if (descricoesConfiguracao.length > 0) {
                descricoesConfiguracao.forEach((descricao, index) => {
                  const yPos = currentY + 4 + (index * lineHeight);
                  doc.text(descricao.substring(0, 15), currentX + colWidths[i]/2, yPos, { align: 'center' });
                });
              } else {
                doc.text('N/A', currentX + colWidths[i]/2, currentY + 8, { align: 'center' });
              }
            } else if (i === 6) { // Coluna de valores detalhados
              if (valoresIndividuais.length > 0) {
                valoresIndividuais.forEach((item, index) => {
                  const yPos = currentY + 4 + (index * lineHeight);
                  const texto = `${formatCurrency(item.valor)} (${item.descricao.substring(0, 10)})`;
                  doc.text(texto, currentX + colWidths[i]/2, yPos, { align: 'center' });
                });
                if (valoresIndividuais.length > 1) {
                  const yPos = currentY + 4 + (valoresIndividuais.length * lineHeight);
                  doc.text(`Total: ${formatCurrency(total)}`, currentX + colWidths[i]/2, yPos, { align: 'center' });
                }
              } else {
                doc.text('N/A', currentX + colWidths[i]/2, currentY + 8, { align: 'center' });
              }
            } else {
              // Texto normal para outras colunas
              doc.text(data, currentX + colWidths[i]/2, currentY + 8, { align: 'center' });
            }
            
            currentX += colWidths[i];
          });
          
          currentY += cellHeight;
        });
        
        return currentY;
      };
      
      // Dados bancários logo após o resumo financeiro
      yPos += 20;
      doc.setFontSize(14);
      doc.setTextColor(139, 0, 0);
      doc.text('DADOS BANCÁRIOS', 20, yPos);
      
      yPos += 15;
      doc.setFillColor(245, 245, 245);
      doc.rect(20, yPos, 120, 35, 'F');
      doc.setDrawColor(139, 0, 0);
      doc.rect(20, yPos, 120, 35);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('BANCO: 756 SICOOB', 25, yPos + 8);
      doc.text('AGÊNCIA: 4349  CONTA CORRENTE: 141.105-5', 25, yPos + 16);
      doc.text('PIX-CNPJ: 27.244.973/0001-22', 25, yPos + 24);
      doc.text('VALE DO BOI CARNES LTDA', 25, yPos + 32);
      
      // Verificar se há espaço suficiente na página
      if (yPos + 120 > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      } else {
        yPos += 25;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(139, 0, 0);
      doc.text('DETALHAMENTO DOS FRETES', 20, yPos);
      
      yPos += 15;
      
      drawFretesTable(yPos);
      
      // Rodapé
      const rodapeY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Relatório gerado automaticamente pelo Vale do Boi', pageWidth / 2, rodapeY - 5, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, rodapeY, { align: 'center' });

      // Salvar PDF
      const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '_');
      const nomeArquivo = `acerto_frete_${clienteSelecionado.replace(/\s+/g, '_')}_${dataAtual}.pdf`;
      doc.save(nomeArquivo);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="controle-frete">
        <div className="page-header">
          <h1>Controle de Fretes</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Carregando fretes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="controle-frete">
      <div className="page-header">
        <h1>Controle de Fretes</h1>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={handleGerenciarArquivamento}
            title="Gerenciar arquivamento automático de fretes"
          >
            <Archive size={20} />
            Arquivamento
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={20} />
            Novo Frete
          </button>
        </div>
      </div>

      {/* Abas de navegação */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'fretes' ? 'active' : ''}`}
            onClick={() => setActiveTab('fretes')}
          >
            <Truck size={16} />
            Controle de Fretes
          </button>
          <button 
            className={`tab ${activeTab === 'acerto' ? 'active' : ''}`}
            onClick={() => setActiveTab('acerto')}
          >
            <FileText size={16} />
            Relatório de Acerto
          </button>
        </div>
      </div>

      {activeTab === 'fretes' && (
        <>
          {/* Seção de Filtros */}
          <div className="filtros-container">
            <h3>
              <Filter size={18} />
              Filtros
            </h3>
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
                  {getClientesUnicos().map((cliente) => (
                    <option key={cliente} value={cliente}>
                      {cliente}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filtro-group">
                <button 
                  type="button" 
                  className="btn-clear-filters"
                  onClick={() => {
                    setFiltroSituacao('');
                    setFiltroDataInicio('');
                    setFiltroDataFim('');
                    setFiltroCliente('');
                  }}
                >
                  Limpar Filtros
                </button>
              </div>
              
              <div className="filtro-group">
                <button 
                  type="button" 
                  className="btn-pdf-fretes"
                  onClick={gerarPDFControleFrentes}
                  title="Gerar PDF dos fretes filtrados"
                >
                  <Download size={16} />
                  Gerar PDF
                </button>
              </div>
            </div>
          </div>

          {/* Resumo dos filtros */}
          {(filtroSituacao || filtroDataInicio || filtroDataFim || filtroCliente) && (
            <div className="filtros-resumo">
              <p>
                <strong>{fretesFiltrados.length}</strong> frete{fretesFiltrados.length !== 1 ? 's' : ''} 
                {fretesFiltrados.length !== 1 ? ' encontrados' : ' encontrado'}
                {filtroSituacao && ` • Situação: ${filtroSituacao}`}
                {filtroDataInicio && ` • De: ${formatDisplayDate(filtroDataInicio)}`}
                {filtroDataFim && ` • Até: ${formatDisplayDate(filtroDataFim)}`}
                {filtroCliente && ` • Cliente: ${filtroCliente}`}
              </p>
            </div>
          )}

          {showForm && (
            <div className="form-modal">
              <div className="form-modal-content">
                <h2>
                  <FileText size={20} />
                  {editingId ? 'Editar Frete' : 'Novo Frete'}
                </h2>
                <form onSubmit={handleSubmit}>
                  {/* Dados Básicos */}
                  <div className="form-section">
                    <h3><Calendar size={18} /> Dados do Frete</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Data de Emissão *</label>
                        <input
                          type="date"
                          value={formData.data_emissao}
                          onChange={(e) => setFormData({...formData, data_emissao: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Pecuarista *</label>
                        <input
                          type="text"
                          value={formData.pecuarista}
                          onChange={(e) => setFormData({...formData, pecuarista: e.target.value})}
                          required
                          placeholder="Nome do pecuarista"
                        />
                      </div>
                      <div className="form-group">
                        <label>Cliente</label>
                        <input
                          type="text"
                          value={formData.cliente}
                          onChange={(e) => setFormData({...formData, cliente: e.target.value})}
                          placeholder="Nome do cliente final"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Origem *</label>
                        <input
                          type="text"
                          value={formData.origem}
                          onChange={(e) => setFormData({...formData, origem: e.target.value})}
                          required
                          placeholder="Local de origem"
                        />
                      </div>
                      <div className="form-group">
                        <label>Destino *</label>
                        <input
                          type="text"
                          value={formData.destino}
                          onChange={(e) => setFormData({...formData, destino: e.target.value})}
                          required
                          placeholder="Local de destino"
                        />
                      </div>
                      <div className="form-group">
                        <label>Total KM</label>
                        <input
                          type="number"
                          value={formData.total_km}
                          onChange={(e) => setFormData({...formData, total_km: e.target.value})}
                          placeholder="Quilometragem total"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nº Minuta</label>
                        <input
                          type="text"
                          value={formData.numero_minuta}
                          onChange={(e) => setFormData({...formData, numero_minuta: e.target.value})}
                          placeholder="Número da Minuta"
                        />
                      </div>
                      <div className="form-group">
                        <label>Nº CB</label>
                        <input
                          type="text"
                          value={formData.numero_cb}
                          onChange={(e) => setFormData({...formData, numero_cb: e.target.value})}
                          placeholder="Número do CB"
                        />
                      </div>
                      <div className="form-group">
                        <label>Faixa</label>
                        <input
                          type="text"
                          value={formData.faixa}
                          onChange={(e) => setFormData({...formData, faixa: e.target.value})}
                          placeholder="Faixa do frete"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Veículos e Motoristas */}
                  <div className="form-section vehicles-motorists-section">
                    <h3><Truck size={18} /> Veículos e Motoristas</h3>
                    <div className="dynamic-fields-container">
                      <div className="dynamic-field-group">
                        <h4>🚛 Caminhões *</h4>
                        {caminhoesSelecionados.map((item, idx) => (
                          <div key={idx} className="caminhao-card">
                            {/* Botão remover só ícone no topo direito */}
                            <button
                              type="button"
                              onClick={() => setCaminhoesSelecionados(caminhoesSelecionados.filter((_, i) => i !== idx))}
                              className="btn-remove-small"
                              title="Remover caminhão"
                              style={{ padding: 4, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 size={18} />
                            </button>
                            {/* Select do caminhão */}
                            <select
                              value={item.caminhao_id}
                              onChange={e => {
                                const novos = [...caminhoesSelecionados];
                                novos[idx] = { ...novos[idx], caminhao_id: e.target.value };
                                setCaminhoesSelecionados(novos);
                              }}
                              required
                              style={{ marginBottom: 8 }}
                            >
                              <option value="">Selecione o caminhão</option>
                              {caminhoes.map(caminhao => (
                                <option key={caminhao.id} value={caminhao.id}>
                                  {caminhao.placa} - {caminhao.tipo} ({caminhao.modelo})
                                </option>
                              ))}
                            </select>
                            {/* Configuração específica para cada tipo de caminhão */}
                            {(() => {
                              const caminhao = caminhoes.find(c => c.id === parseInt(item.caminhao_id));
                              
                              if (caminhao?.tipo === 'Truck') {
                                // Para Truck: opção de usar como Truck ou Julieta
                                return (
                                  <div style={{ marginBottom: 4 }}>
                                    <label style={{ fontWeight: 500, fontSize: '0.95rem', marginBottom: 8, display: 'block' }}>Configuração:</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                                        <input
                                          type="radio"
                                          name={`config-${idx}`}
                                          checked={!item.reboque_id}
                                          onChange={() => {
                                            const novos = [...caminhoesSelecionados];
                                            novos[idx].reboque_id = undefined;
                                            setCaminhoesSelecionados(novos);
                                          }}
                                        />
                                        Usar como Truck (padrão)
                                      </label>
                                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                                        <input
                                          type="radio"
                                          name={`config-${idx}`}
                                          checked={!!item.reboque_id}
                                          onChange={() => {
                                            const novos = [...caminhoesSelecionados];
                                            novos[idx].reboque_id = '';
                                            setCaminhoesSelecionados(novos);
                                          }}
                                        />
                                        Usar como Julieta (com reboque)
                                      </label>
                                    </div>
                                    
                                    {/* Campo de reboque se escolher Julieta */}
                                    {item.reboque_id !== undefined && (
                                      <div style={{ marginTop: 8 }}>
                                        <label style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: 4, display: 'block' }}>Reboque:</label>
                                        <select
                                          value={item.reboque_id || ''}
                                          onChange={e => {
                                            const novos = [...caminhoesSelecionados];
                                            novos[idx].reboque_id = e.target.value;
                                            setCaminhoesSelecionados(novos);
                                          }}
                                          required
                                        >
                                          <option value="">Selecione o reboque</option>
                                          {reboques.map(reb => (
                                            <option key={reb.id} value={reb.id}>
                                              {reb.placa} - {reb.conjunto}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                  </div>
                                );
                              } else if (caminhao?.tipo === 'Julieta' || caminhao?.tipo === 'Carreta Baixa' || caminhao?.tipo === '2 Pisos') {
                                // Para outros tipos: sempre precisam de reboque
                                return (
                                  <div style={{ marginBottom: 4 }}>
                                    <label style={{ fontWeight: 500, fontSize: '0.95rem', marginBottom: 2, display: 'block' }}>Reboque</label>
                                    <select
                                      value={item.reboque_id || ''}
                                      onChange={e => {
                                        const novos = [...caminhoesSelecionados];
                                        novos[idx].reboque_id = e.target.value;
                                        setCaminhoesSelecionados(novos);
                                      }}
                                      required
                                    >
                                      <option value="">Selecione o reboque</option>
                                      {reboques.map(reb => (
                                        <option key={reb.id} value={reb.id}>
                                          {reb.placa} - {reb.conjunto}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            
                            {/* Campo de valor individual para cada caminhão */}
                            <div style={{ marginTop: 8 }}>
                              <label style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: 4, display: 'block' }}>Valor do Frete (R$):</label>
                              <CurrencyInput
                                intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                                decimalsLimit={2}
                                value={item.valor_frete || ''}
                                onValueChange={(value) => {
                                  const novos = [...caminhoesSelecionados];
                                  novos[idx].valor_frete = value || '';
                                  setCaminhoesSelecionados(novos);
                                  // Recalcular valor total
                                  const total = novos.reduce((sum, cam) => {
                                    const valor = parseFloat(cam.valor_frete || '0');
                                    return sum + valor;
                                  }, 0);
                                  setFormData(prev => ({
                                    ...prev,
                                    valor_frete: total.toString()
                                  }));
                                }}
                                placeholder="0,00"
                                allowNegativeValue={false}
                                className="form-control"
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                              />
                            </div>
                          </div>
                        ))}
                        <div className="add-button-container">
                          <button
                            type="button"
                            className="btn-add-small"
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() =>
                              setCaminhoesSelecionados([
                                ...caminhoesSelecionados,
                                { caminhao_id: '' }
                              ])
                            }
                          >
                            <Truck size={16} /> + Adicionar caminhão
                          </button>
                        </div>
                      </div>
                      
                      <div className="dynamic-field-group">
                        <h4>👨‍💼 Motoristas *</h4>
                        {motoristasSelecionados.map((motorista, idx) => (
                          <div key={idx} className="motorista-card">
                            {/* Botão remover só ícone no topo direito */}
                            <button
                              type="button"
                              onClick={() => setMotoristasSelecionados(motoristasSelecionados.filter((_, i) => i !== idx))}
                              className="btn-remove-small"
                              title="Remover motorista"
                              style={{ padding: 4, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 size={18} />
                            </button>
                            
                            {/* Select do motorista */}
                            <select
                              value={motorista.motorista_id}
                              onChange={e => {
                                const novos = [...motoristasSelecionados];
                                novos[idx] = { ...novos[idx], motorista_id: e.target.value };
                                setMotoristasSelecionados(novos);
                              }}
                              required
                              style={{ marginBottom: 8 }}
                            >
                              <option value="">Selecione o motorista</option>
                              {motoristas.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.nome} - {m.tipo_motorista}
                                </option>
                              ))}
                            </select>
                            
                            {/* Select do caminhão para este motorista */}
                            <select
                              value={motorista.caminhao_id}
                              onChange={e => {
                                const novos = [...motoristasSelecionados];
                                novos[idx] = { ...novos[idx], caminhao_id: e.target.value };
                                setMotoristasSelecionados(novos);
                              }}
                              required
                              style={{ marginBottom: 8 }}
                            >
                              <option value="">Selecione o caminhão</option>
                              {caminhoesSelecionados.map(caminhao => (
                                <option key={caminhao.caminhao_id} value={caminhao.caminhao_id}>
                                  {caminhoes.find(c => c.id === parseInt(caminhao.caminhao_id))?.placa || `Caminhão ${caminhao.caminhao_id}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                        <div className="add-button-container">
                          <button
                            type="button"
                            className="btn-add-small"
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() => setMotoristasSelecionados([...motoristasSelecionados, { motorista_id: '', caminhao_id: '' }])}
                          >
                            <User size={16} /> + Adicionar motorista
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Valores */}
                  <div className="form-section values-section">
                    <h3>💰 Valores</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Valor Total do Frete (R$) *</label>
                        <CurrencyInput
                          intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                          decimalsLimit={2}
                          value={formData.valor_frete}
                          onValueChange={handleValorFreteChange}
                          placeholder="0,00"
                          allowNegativeValue={false}
                          className="form-control"
                          readOnly
                        />
                        <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                          Total calculado automaticamente dos valores individuais dos caminhões
                        </small>
                      </div>
                      <div className="form-group">
                        <label>Situação *</label>
                        <select
                          value={formData.situacao}
                          onChange={(e) => setFormData({...formData, situacao: e.target.value})}
                          required
                        >
                          <option value="Pendente">Pendente</option>
                          <option value="Frigorífico">Frigorífico</option>
                          <option value="Pago">Pago</option>
                        </select>
                      </div>
                      
                      {formData.situacao === 'Pago' && (
                        <>
                          <div className="form-group">
                            <label>Tipo de Pagamento *</label>
                            <select
                              value={formData.tipo_pagamento}
                              onChange={(e) => setFormData({...formData, tipo_pagamento: e.target.value})}
                              required
                            >
                              <option value="">Selecione o tipo</option>
                              <option value="PIX">PIX</option>
                              <option value="Dinheiro">Dinheiro</option>
                              <option value="Cheque">Cheque</option>
                              <option value="TED">TED</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Data do Pagamento *</label>
                            <input
                              type="date"
                              value={formData.data_pagamento}
                              onChange={(e) => setFormData({...formData, data_pagamento: e.target.value})}
                              required
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="form-section observations-section">
                    <h3>📝 Observações</h3>
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label>Observações</label>
                        <textarea
                          value={formData.observacoes}
                          onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                          placeholder="Observações adicionais sobre o frete"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={resetForm}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-save">
                      {editingId ? 'Atualizar Frete' : 'Salvar Frete'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="table-container">
            <div className="scroll-indicator">
              ← Arraste para ver mais colunas →
            </div>
            <table className="data-table frete-table">
              <thead>
                <tr>
                  <th>Situação</th>
                  <th>Data</th>
                  <th>Pecuarista</th>
                  <th>Origem</th>
                  <th>Destino</th>
                  <th>Nº Minuta</th>
                  <th>Nº CB</th>
                  <th>Cliente</th>
                  <th>Placa</th>
                  <th>Tipo de Veículo</th>
                  <th>Motorista</th>
                  <th>Faixa</th>
                  <th>Total KM</th>
                  <th>Valor Frete</th>
                  <th>Valores Detalhados</th>
                  <th>Tipo Pagamento</th>
                  <th>Data Pagamento</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {fretesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={16} style={{ textAlign: 'center', padding: '2rem' }}>
                      {filtroSituacao ? `Nenhum frete com situação "${filtroSituacao}"` : 'Nenhum frete cadastrado'}
                    </td>
                  </tr>
                ) : (
                  fretesFiltrados.map((frete) => (
                    <tr key={frete.id}>
                      <td>
                        <span className={`situacao ${getSituacaoClass(frete.situacao)}`}>
                          {frete.situacao}
                        </span>
                      </td>
                      <td>{formatDate(frete.data_emissao)}</td>
                      <td>{frete.pecuarista}</td>
                      <td>{frete.origem}</td>
                      <td>{frete.destino}</td>
                      <td>{frete.numero_minuta || '-'}</td>
                      <td>{frete.numero_cb || '-'}</td>
                      <td>{frete.cliente || '-'}</td>
                      <td>
                        {vinculosCaminhoes[frete.id!] && vinculosCaminhoes[frete.id!].length > 0 ? (
                          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            {vinculosCaminhoes[frete.id!].map((v, i) => {
                              const cam = caminhoes.find(c => c.id === v.caminhao_id);
                              return (
                                <li key={i}>{cam ? cam.placa : v.caminhao_id}</li>
                              );
                            })}
                          </ul>
                        ) : '-'}
                      </td>
                      <td>
                        {vinculosCaminhoes[frete.id!] && vinculosCaminhoes[frete.id!].length > 0 ? (
                          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            {vinculosCaminhoes[frete.id!].map((item, i) => (
                              <li key={i}>
                                {item.configuracao === 'Truck'
                                  ? 'Truck'
                                  : `${item.configuracao}${item.reboque_id ? ` (${reboques.find(r => r.id === item.reboque_id)?.placa || ''})` : ''}`}
                              </li>
                            ))}
                          </ul>
                        ) : '-'}
                      </td>
                      <td>
                        {vinculosMotoristas[frete.id!] && vinculosMotoristas[frete.id!].length > 0 ? (
                          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            {vinculosMotoristas[frete.id!].map((v, i) => {
                              const mot = motoristas.find(m => m.id === v.motorista_id);
                              return (
                                <li key={i}>{mot ? mot.nome : v.motorista_id}</li>
                              );
                            })}
                          </ul>
                        ) : '-'}
                      </td>
                      <td>{frete.faixa || '-'}</td>
                      <td>{frete.total_km || '-'}</td>
                      <td>{formatCurrency(frete.valor_frete)}</td>
                      <td>
                        {(() => {
                          const { valoresIndividuais, total } = calcularValoresPorCaminhao(frete.id!);
                          if (valoresIndividuais.length === 0) {
                            return '-';
                          }
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {valoresIndividuais.map((item, index) => (
                                <div key={index} style={{ fontSize: '0.9em' }}>
                                  {formatCurrency(item.valor)} ({item.descricao})
                                </div>
                              ))}
                              {valoresIndividuais.length > 1 && (
                                <>
                                  <div style={{ borderTop: '1px solid #ddd', margin: '2px 0' }}></div>
                                  <div style={{ fontSize: '0.9em', fontWeight: 'bold' }}>
                                    Total: {formatCurrency(total)}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td>{frete.situacao === 'Pago' ? (frete.tipo_pagamento || '-') : '-'}</td>
                      <td>{frete.situacao === 'Pago' ? (frete.data_pagamento ? formatDate(frete.data_pagamento) : '-') : '-'}</td>
                      <td>
                        <div className="actions">
                          <button 
                            className="btn-edit" 
                            title="Editar"
                            onClick={() => handleEdit(frete)}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="btn-archive" 
                            title="Arquivar"
                            onClick={() => frete.id && handleArquivar(frete.id)}
                          >
                            <Archive size={16} />
                          </button>
                          <button 
                            className="btn-delete" 
                            title="Excluir"
                            onClick={() => frete.id && handleDelete(frete.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'acerto' && (
        <>
          {/* Filtros de Acerto */}
          <div className="acerto-filters">
            <h3>
              <Filter size={18} />
              Filtros para Relatório de Acerto
            </h3>
            <div className="filter-row">
              <div className="filter-group">
                <label>Cliente *</label>
                <select
                  value={clienteSelecionado}
                  onChange={(e) => setClienteSelecionado(e.target.value)}
                >
                  <option value="">Selecione um cliente</option>
                  {getClientesUnicos().map((cliente) => (
                    <option key={cliente} value={cliente}>
                      {cliente}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Data Início</label>
                <input
                  type="date"
                  value={dataInicioAcerto}
                  onChange={(e) => setDataInicioAcerto(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Data Fim</label>
                <input
                  type="date"
                  value={dataFimAcerto}
                  onChange={(e) => setDataFimAcerto(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <div className="acerto-actions">
                  <button 
                    type="button" 
                    className="btn-acerto"
                    onClick={filtrarFretesAcerto}
                  >
                    <Filter size={16} />
                    Filtrar Fretes
                  </button>
                  {fretesAcerto.length > 0 && (
                    <button 
                      type="button" 
                      className="btn-pdf"
                      onClick={gerarPDFAcerto}
                    >
                      <Download size={16} />
                      Gerar PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Resumo do Acerto */}
          {fretesAcerto.length > 0 && (
            <div className="acerto-summary">
              <div className="count">
                {fretesAcerto.length} frete{fretesAcerto.length > 1 ? 's' : ''} encontrado{fretesAcerto.length > 1 ? 's' : ''}
                {clienteSelecionado && ` para ${clienteSelecionado}`}
              </div>
              <div className="total">
                Total: {formatCurrency(fretesAcerto.reduce((sum, f) => {
                  const { total } = calcularValoresPorCaminhao(f.id!);
                  return sum + total;
                }, 0))}
              </div>
            </div>
          )}

          {/* Tabela de Fretes do Acerto */}
          {fretesAcerto.length > 0 && (
            <div className="table-container">
              <table className="data-table frete-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Placa</th>
                    <th>Pecuarista</th>
                    <th>Remetente/Faz</th>
                    <th>Destinatário/Faz</th>
                    <th>Base Cálculo</th>
                    <th>Valor</th>
                    <th>Valores Detalhados</th>
                    <th>Situação</th>
                    <th>Tipo Pagamento</th>
                    <th>Data Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {fretesAcerto.map((frete) => {
                    // Buscar todos os caminhões vinculados a este frete
                    const vinculosCaminhao = vinculosCaminhoes[frete.id!];
                    
                    // Preparar arrays para concatenar informações de todos os caminhões
                    const descricoesConfiguracao: string[] = [];
                    const placasCaminhoes: string[] = [];
                    
                    if (vinculosCaminhao && vinculosCaminhao.length > 0) {
                      vinculosCaminhao.forEach(vinculo => {
                        const caminhao = caminhoes.find(c => c.id === vinculo.caminhao_id);
                        const configuracao = vinculo.configuracao;
                        const reboqueId = vinculo.reboque_id;
                        
                        // Formatar configuração igual à tabela principal
                        const descricaoConfiguracao = configuracao === 'Truck' 
                          ? 'Truck'
                          : `${configuracao}${reboqueId ? ` (${reboques.find(r => r.id === reboqueId)?.placa || ''})` : ''}`;
                        
                        descricoesConfiguracao.push(descricaoConfiguracao);
                        placasCaminhoes.push(caminhao?.placa || 'N/A');
                      });
                    } else {
                      // Fallback para dados diretos do frete
                      if (frete.caminhao) {
                        const descricaoConfiguracao = frete.configuracao === 'Truck' 
                          ? 'Truck'
                          : `${frete.configuracao || 'N/A'}`;
                        descricoesConfiguracao.push(descricaoConfiguracao);
                        placasCaminhoes.push(frete.caminhao.placa);
                      } else {
                        descricoesConfiguracao.push('N/A');
                        placasCaminhoes.push('N/A');
                      }
                    }
                    
                    return (
                      <tr key={frete.id}>
                        <td>{formatDate(frete.data_emissao)}</td>
                        <td>
                          {descricoesConfiguracao.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {descricoesConfiguracao.map((descricao, index) => (
                                <div key={index} style={{ fontSize: '0.9em' }}>
                                  {descricao}
                                </div>
                              ))}
                            </div>
                          ) : 'N/A'}
                        </td>
                        <td>
                          {placasCaminhoes.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {placasCaminhoes.map((placa, index) => (
                                <div key={index} style={{ fontSize: '0.9em' }}>
                                  {placa}
                                </div>
                              ))}
                            </div>
                          ) : 'N/A'}
                        </td>
                        <td>{frete.pecuarista}</td>
                        <td>{frete.origem}</td>
                        <td>{frete.destino}</td>
                        <td>{frete.total_km ? `${frete.total_km}KM` : 'N/A'}</td>
                        <td>{formatCurrency(frete.valor_frete)}</td>
                        <td>
                          {(() => {
                            const { valoresIndividuais, total } = calcularValoresPorCaminhao(frete.id!);
                            if (valoresIndividuais.length === 0) {
                              return '-';
                            }
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {valoresIndividuais.map((item, index) => (
                                  <div key={index} style={{ fontSize: '0.9em' }}>
                                    {formatCurrency(item.valor)} ({item.descricao})
                                  </div>
                                ))}
                                {valoresIndividuais.length > 1 && (
                                  <>
                                    <div style={{ borderTop: '1px solid #ddd', margin: '2px 0' }}></div>
                                    <div style={{ fontSize: '0.9em', fontWeight: 'bold' }}>
                                      Total: {formatCurrency(total)}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          <span className={`status ${getSituacaoClass(frete.situacao)}`}>
                            {frete.situacao}
                          </span>
                        </td>
                        <td>{frete.situacao === 'Pago' ? (frete.tipo_pagamento || '-') : '-'}</td>
                        <td>{frete.situacao === 'Pago' ? (frete.data_pagamento ? formatDate(frete.data_pagamento) : '-') : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Estado vazio */}
          {clienteSelecionado && fretesAcerto.length === 0 && (
            <div className="empty-state">
              <p>Nenhum frete encontrado para o cliente "{clienteSelecionado}" no período selecionado.</p>
            </div>
          )}

          {!clienteSelecionado && (
            <div className="empty-state">
              <p>Selecione um cliente para visualizar os fretes disponíveis para acerto.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ControleFrete; 