import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Truck, Filter, Calendar, FileText, Download } from 'lucide-react';
import CurrencyInput from 'react-currency-input-field';
import { freteService, Frete } from '../../services/freteService';
import { caminhaoService, Caminhao } from '../../services/caminhaoService';
import { motoristaService, Motorista } from '../../services/motoristaService';
import { formatDisplayDate } from '../../services/dateUtils';
import './ControleFrete.css';

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
  const [filtroMotorista, setFiltroMotorista] = useState<string>('');
  const [filtroCaminhao, setFiltroCaminhao] = useState<string>('');
  
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
    numero_cte: '',
    cliente: '',
    observacoes: '',
    caminhao_id: '',
    motorista_id: '',
    faixa: '',
    total_km: '',
    valor_frete: '',
    saldo_receber: '',
    situacao: 'Pendente',
    tipo_pagamento: '',
    data_pagamento: ''
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

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
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      data_emissao: '',
      pecuarista: '',
      origem: '',
      destino: '',
      numero_minuta: '',
      numero_cte: '',
      cliente: '',
      observacoes: '',
      caminhao_id: '',
      motorista_id: '',
      faixa: '',
      total_km: '',
      valor_frete: '',
      saldo_receber: '',
      situacao: 'Pendente',
      tipo_pagamento: '',
      data_pagamento: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (frete: Frete) => {
    setFormData({
      data_emissao: frete.data_emissao,
      pecuarista: frete.pecuarista,
      origem: frete.origem,
      destino: frete.destino,
      numero_minuta: frete.numero_minuta || '',
      numero_cte: frete.numero_cte || '',
      cliente: frete.cliente || '',
      observacoes: frete.observacoes || '',
      caminhao_id: frete.caminhao_id.toString(),
      motorista_id: frete.motorista_id.toString(),
      faixa: frete.faixa || '',
      total_km: frete.total_km?.toString() || '',
      valor_frete: frete.valor_frete.toString(),
      saldo_receber: frete.saldo_receber?.toString() || '',
      situacao: frete.situacao,
      tipo_pagamento: frete.tipo_pagamento || '',
      data_pagamento: frete.data_pagamento || ''
    });
    setEditingId(frete.id || null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validações básicas
      if (!formData.caminhao_id || !formData.motorista_id) {
        alert('Selecione o caminhão e motorista');
        return;
      }

      if (!formData.valor_frete || parseFloat(formData.valor_frete) <= 0) {
        alert('Informe um valor de frete válido');
        return;
      }

      // Validações condicionais para pagamento
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
        numero_cte: formData.numero_cte || undefined,
        cliente: formData.cliente || undefined,
        observacoes: formData.observacoes || undefined,
        caminhao_id: parseInt(formData.caminhao_id),
        motorista_id: parseInt(formData.motorista_id),
        faixa: formData.faixa || undefined,
        total_km: formData.total_km ? parseInt(formData.total_km) : undefined,
        valor_frete: parseFloat(formData.valor_frete),
        saldo_receber: formData.saldo_receber ? parseFloat(formData.saldo_receber) : parseFloat(formData.valor_frete),
        situacao: formData.situacao,
        // CORREÇÃO: Explicitamente definir como null quando não for "Pago"
        tipo_pagamento: formData.situacao === 'Pago' ? formData.tipo_pagamento : null,
        data_pagamento: formData.situacao === 'Pago' ? formData.data_pagamento : null
      };

      if (editingId) {
        // Atualizar frete existente
        await freteService.update(editingId, freteData);
        alert('Frete atualizado com sucesso!');
      } else {
        // Criar novo frete
        await freteService.create(freteData);
        alert('Frete cadastrado com sucesso!');
      }
      
      // Recarregar dados para manter ordem correta
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
        await freteService.delete(id);
        setFretes(fretes.filter(f => f.id !== id));
        alert('Frete excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir frete:', error);
        alert('Erro ao excluir frete.');
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    // CORREÇÃO: Usar formatDisplayDate para evitar problema de UTC
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

  // Funções para obter listas únicas para os filtros
  const getClientesUnicos = (): string[] => {
    const clientes = fretes
      .map(f => f.cliente)
      .filter((cliente): cliente is string => Boolean(cliente && cliente.trim()))
      .filter((cliente, index, arr) => arr.indexOf(cliente) === index);
    return clientes.sort();
  };

  const getMotoristasUnicos = (): {id: number, nome: string}[] => {
    const motoristasMap = new Map<number, {id: number, nome: string}>();
    
    fretes.forEach(frete => {
      if (frete.motorista && frete.motorista_id) {
        motoristasMap.set(frete.motorista_id, {
          id: frete.motorista_id,
          nome: frete.motorista.nome
        });
      }
    });
    
    return Array.from(motoristasMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  };

  const getCaminhoesUnicos = (): {id: number, placa: string, tipo: string}[] => {
    const caminhoesMap = new Map<number, {id: number, placa: string, tipo: string}>();
    
    fretes.forEach(frete => {
      if (frete.caminhao && frete.caminhao_id) {
        caminhoesMap.set(frete.caminhao_id, {
          id: frete.caminhao_id,
          placa: frete.caminhao.placa,
          tipo: frete.caminhao.tipo
        });
      }
    });
    
    return Array.from(caminhoesMap.values()).sort((a, b) => a.placa.localeCompare(b.placa));
  };

  // Aplicar todos os filtros
  const fretesFiltrados = fretes.filter(frete => {
    // Filtro por situação
    if (filtroSituacao && frete.situacao !== filtroSituacao) {
      return false;
    }

    // Filtro por período de data
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

    // Filtro por cliente
    if (filtroCliente && frete.cliente !== filtroCliente) {
      return false;
    }

    // Filtro por motorista
    if (filtroMotorista && frete.motorista_id.toString() !== filtroMotorista) {
      return false;
    }

    // Filtro por caminhão
    if (filtroCaminhao && frete.caminhao_id.toString() !== filtroCaminhao) {
      return false;
    }

    return true;
  });

  // Handler para mudança no valor do frete (sem cálculo de desconto)
  const handleValorFreteChange = (value: string | undefined) => {
    const valor = value || '';
    
    setFormData(prev => ({
      ...prev,
      valor_frete: valor,
      saldo_receber: valor // Sempre igual ao valor do frete
    }));
  };

  // Handler para mudança no motorista (sem cálculo de desconto)
  const handleMotoristaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const motoristaId = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      motorista_id: motoristaId
      // saldo_receber permanece igual ao valor_frete
    }));
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
      doc.text('SISTEMA LOGÍSTICA', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Relatório de Acerto de Frete', pageWidth / 2, 30, { align: 'center' });
      
      // Linha separadora
      doc.setLineWidth(0.5);
      doc.setDrawColor(139, 0, 0);
      doc.line(20, 35, pageWidth - 20, 35);
      
      // Informações do cliente
      let yPos = 50;
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
        doc.text(row[1], 178, yPos + 6, { align: 'right' });
        yPos += 8;
      });
      
      // Detalhamento dos fretes
      yPos += 20;
      doc.setFontSize(14);
      doc.setTextColor(139, 0, 0);
      doc.text('DETALHAMENTO DOS FRETES', 20, yPos);
      
      yPos += 15;
      
      // Função para desenhar tabela de fretes
      const drawFretesTable = (startY: number) => {
        const headers = ['Data', 'Tipo', 'Placa', 'Remetente', 'Destinatário', 'KM', 'Valor'];
        const colWidths = [20, 25, 18, 35, 35, 15, 22];
        let currentY = startY;
        
        // Cabeçalho da tabela
        doc.setFillColor(139, 0, 0);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        
        let currentX = 20;
        headers.forEach((header, i) => {
          doc.rect(currentX, currentY, colWidths[i], 10, 'F');
          doc.text(header, currentX + colWidths[i]/2, currentY + 7, { align: 'center' });
          currentX += colWidths[i];
        });
        
        currentY += 10;
        
        // Dados dos fretes
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        fretesAcerto.forEach((frete, index) => {
          // Verificar quebra de página
          if (currentY + 8 > pageHeight - 40) {
            doc.addPage();
            currentY = 20;
            
            // Redesenhar cabeçalho na nova página
            doc.setFillColor(139, 0, 0);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            
            currentX = 20;
            headers.forEach((header, i) => {
              doc.rect(currentX, currentY, colWidths[i], 10, 'F');
              doc.text(header, currentX + colWidths[i]/2, currentY + 7, { align: 'center' });
              currentX += colWidths[i];
            });
            
            currentY += 10;
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
          }
          
          const caminhao = caminhoes.find(c => c.id === frete.caminhao_id);
          
          // Alternar cor de fundo
          if (index % 2 === 1) {
            doc.setFillColor(245, 245, 245);
            doc.rect(20, currentY, colWidths.reduce((a, b) => a + b, 0), 8, 'F');
          }
          
          const rowData = [
            formatDisplayDate(frete.data_emissao).substring(0, 5),
            (caminhao?.tipo || 'N/A').substring(0, 8),
            caminhao?.placa || 'N/A',
            frete.pecuarista.substring(0, 12),
            frete.origem.substring(0, 12),
            frete.total_km ? frete.total_km.toString() : '-',
            formatCurrency(frete.valor_frete)
          ];
          
          currentX = 20;
          rowData.forEach((data, i) => {
            // Desenhar borda da célula
            doc.setDrawColor(200, 200, 200);
            doc.rect(currentX, currentY, colWidths[i], 8);
            
            // Texto
            if (i === 6) { // Valor à direita
              doc.text(data, currentX + colWidths[i] - 2, currentY + 6, { align: 'right' });
            } else if (i === 0 || i === 2 || i === 5) { // Centralizados
              doc.text(data, currentX + colWidths[i]/2, currentY + 6, { align: 'center' });
            } else {
              doc.text(data, currentX + 2, currentY + 6);
            }
            
            currentX += colWidths[i];
          });
          
          currentY += 8;
        });
        
        return currentY;
      };
      
      const finalY = drawFretesTable(yPos);
      
      // Dados bancários
      let dadosY = finalY + 20;
      if (dadosY + 40 > pageHeight - 20) {
        doc.addPage();
        dadosY = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(139, 0, 0);
      doc.text('DADOS BANCÁRIOS', 20, dadosY);
      
      dadosY += 15;
      doc.setFillColor(245, 245, 245);
      doc.rect(20, dadosY, 120, 35, 'F');
      doc.setDrawColor(139, 0, 0);
      doc.rect(20, dadosY, 120, 35);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('BANCO: 756 SICOOB', 25, dadosY + 8);
      doc.text('AGÊNCIA: 4349  CONTA CORRENTE: 141.105-5', 25, dadosY + 16);
      doc.text('PIX-CNPJ: 27.244.973/0001-22', 25, dadosY + 24);
      doc.text('VALE DO BOI CARNES LTDA', 25, dadosY + 32);
      
      // Rodapé
      const rodapeY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Relatório gerado automaticamente pelo Sistema Logística', pageWidth / 2, rodapeY - 5, { align: 'center' });
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
                <label>Motorista</label>
                <select
                  value={filtroMotorista}
                  onChange={(e) => setFiltroMotorista(e.target.value)}
                  className="filtro-select"
                >
                  <option value="">Todos os Motoristas</option>
                  {getMotoristasUnicos().map((motorista) => (
                    <option key={motorista.id} value={motorista.id.toString()}>
                      {motorista.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filtro-group">
                <label>Caminhão</label>
                <select
                  value={filtroCaminhao}
                  onChange={(e) => setFiltroCaminhao(e.target.value)}
                  className="filtro-select"
                >
                  <option value="">Todos os Caminhões</option>
                  {getCaminhoesUnicos().map((caminhao) => (
                    <option key={caminhao.id} value={caminhao.id.toString()}>
                      {caminhao.placa} - {caminhao.tipo}
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
                    setFiltroMotorista('');
                    setFiltroCaminhao('');
                  }}
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Resumo dos filtros */}
          {(filtroSituacao || filtroDataInicio || filtroDataFim || filtroCliente || filtroMotorista || filtroCaminhao) && (
            <div className="filtros-resumo">
              <p>
                <strong>{fretesFiltrados.length}</strong> frete{fretesFiltrados.length !== 1 ? 's' : ''} 
                {fretesFiltrados.length !== 1 ? ' encontrados' : ' encontrado'}
                {filtroSituacao && ` • Situação: ${filtroSituacao}`}
                {filtroDataInicio && ` • De: ${formatDisplayDate(filtroDataInicio)}`}
                {filtroDataFim && ` • Até: ${formatDisplayDate(filtroDataFim)}`}
                {filtroCliente && ` • Cliente: ${filtroCliente}`}
                {filtroMotorista && ` • Motorista: ${getMotoristasUnicos().find(m => m.id.toString() === filtroMotorista)?.nome}`}
                {filtroCaminhao && ` • Caminhão: ${getCaminhoesUnicos().find(c => c.id.toString() === filtroCaminhao)?.placa}`}
              </p>
            </div>
          )}

          {showForm && (
            <div className="form-modal">
              <div className="form-container large">
                <h2>{editingId ? 'Editar Frete' : 'Cadastrar Novo Frete'}</h2>
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
                  </div>

                  {/* Documentos */}
                  <div className="form-section">
                    <h3>📄 Documentos</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nº Minuta</label>
                        <input
                          type="text"
                          value={formData.numero_minuta}
                          onChange={(e) => setFormData({...formData, numero_minuta: e.target.value})}
                          placeholder="Número da minuta"
                        />
                      </div>
                      <div className="form-group">
                        <label>Nº CTE</label>
                        <input
                          type="text"
                          value={formData.numero_cte}
                          onChange={(e) => setFormData({...formData, numero_cte: e.target.value})}
                          placeholder="Número do CTE"
                        />
                      </div>
                      <div className="form-group">
                        <label>Faixa</label>
                        <input
                          type="text"
                          value={formData.faixa}
                          onChange={(e) => setFormData({...formData, faixa: e.target.value})}
                          placeholder="Classificação/faixa"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Veículo e Motorista */}
                  <div className="form-section">
                    <h3><Truck size={18} /> Veículo e Motorista</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Caminhão *</label>
                        <select
                          value={formData.caminhao_id}
                          onChange={(e) => setFormData({...formData, caminhao_id: e.target.value})}
                          required
                        >
                          <option value="">Selecione o caminhão</option>
                          {caminhoes.map(caminhao => (
                            <option key={caminhao.id} value={caminhao.id}>
                              {caminhao.placa} - {caminhao.tipo} ({caminhao.modelo})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Motorista *</label>
                        <select
                          value={formData.motorista_id}
                          onChange={handleMotoristaChange}
                          required
                        >
                          <option value="">Selecione o motorista</option>
                          {motoristas.map(motorista => (
                            <option key={motorista.id} value={motorista.id}>
                              {motorista.nome} - {motorista.tipo_motorista}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Valores */}
                  <div className="form-section">
                    <h3>💰 Valores</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Valor do Frete (R$) *</label>
                        <CurrencyInput
                          intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                          decimalsLimit={2}
                          value={formData.valor_frete}
                          onValueChange={handleValorFreteChange}
                          placeholder="0,00"
                          allowNegativeValue={false}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Saldo a Receber (R$)</label>
                        <input
                          type="text"
                          value={formData.saldo_receber ? 
                            parseFloat(formData.saldo_receber).toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            }) : 'R$ 0,00'
                        }
                        readOnly
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                      </div>
                      <div className="form-group">
                        <label>Situação *</label>
                        <select
                          value={formData.situacao}
                          onChange={(e) => {
                            const novaSituacao = e.target.value;
                            // Se mudou para algo diferente de "Pago", limpar campos de pagamento
                            if (novaSituacao !== 'Pago') {
                              setFormData({
                                ...formData, 
                                situacao: novaSituacao,
                                tipo_pagamento: '',
                                data_pagamento: ''
                              });
                            } else {
                              setFormData({...formData, situacao: novaSituacao});
                            }
                          }}
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
                  <div className="form-section">
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
                    <button type="button" onClick={resetForm}>Cancelar</button>
                    <button type="submit" className="btn-primary">
                      {editingId ? 'Atualizar' : 'Salvar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="table-container">
            <table className="data-table frete-table">
              <thead>
                <tr>
                  <th>Situação</th>
                  <th>Data</th>
                  <th>Pecuarista</th>
                  <th>Origem</th>
                  <th>Destino</th>
                  <th>Nº Minuta</th>
                  <th>Nº CTE</th>
                  <th>Cliente</th>
                  <th>Placa</th>
                  <th>Tipo Veículo</th>
                  <th>Motorista</th>
                  <th>Faixa</th>
                  <th>Total KM</th>
                  <th>Valor Frete</th>
                  <th>Saldo a Receber</th>
                  <th>Tipo Pagamento</th>
                  <th>Data Pagamento</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {fretesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={18} style={{ textAlign: 'center', padding: '2rem' }}>
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
                      <td>{frete.numero_cte || '-'}</td>
                      <td>{frete.cliente || '-'}</td>
                      <td>{frete.caminhao?.placa}</td>
                      <td>{frete.caminhao?.tipo}</td>
                      <td>{frete.motorista?.nome}</td>
                      <td>{frete.faixa || '-'}</td>
                      <td>{frete.total_km || '-'}</td>
                      <td>{formatCurrency(frete.valor_frete)}</td>
                      <td>{frete.saldo_receber ? formatCurrency(frete.saldo_receber) : '-'}</td>
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
                Total: {formatCurrency(fretesAcerto.reduce((sum, f) => sum + f.valor_frete, 0))}
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
                    <th>Remetente/Faz</th>
                    <th>Destinatário/Faz</th>
                    <th>Base Cálculo</th>
                    <th>Valor</th>
                    <th>Situação</th>
                    <th>Tipo Pagamento</th>
                    <th>Data Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {fretesAcerto.map((frete) => {
                    const caminhao = caminhoes.find(c => c.id === frete.caminhao_id);
                    return (
                      <tr key={frete.id}>
                        <td>{formatDate(frete.data_emissao)}</td>
                        <td>{caminhao?.tipo || 'N/A'}</td>
                        <td>{caminhao?.placa || 'N/A'}</td>
                        <td>{frete.pecuarista}</td>
                        <td>{frete.origem}</td>
                        <td>{frete.total_km ? `${frete.total_km}KM` : 'N/A'}</td>
                        <td>{formatCurrency(frete.valor_frete)}</td>
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