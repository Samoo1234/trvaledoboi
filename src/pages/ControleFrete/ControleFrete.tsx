import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Truck, Filter, Calendar, FileText, Download } from 'lucide-react';
import CurrencyInput from 'react-currency-input-field';
import { freteService, Frete } from '../../services/freteService';
import { caminhaoService, Caminhao } from '../../services/caminhaoService';
import { motoristaService, Motorista } from '../../services/motoristaService';
import './ControleFrete.css';

const ControleFrete: React.FC = () => {
  const [fretes, setFretes] = useState<Frete[]>([]);
  const [caminhoes, setCaminhoes] = useState<Caminhao[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filtroSituacao, setFiltroSituacao] = useState<string>('');
  
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
    situacao: 'Pendente'
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
      situacao: 'Pendente'
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
      situacao: frete.situacao
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
        situacao: formData.situacao
      };

      if (editingId) {
        // Atualizar frete existente
        const updatedFrete = await freteService.update(editingId, freteData);
        setFretes(fretes.map(f => f.id === editingId ? updatedFrete : f));
        alert('Frete atualizado com sucesso!');
      } else {
        // Criar novo frete
        const newFrete = await freteService.create(freteData);
        setFretes([newFrete, ...fretes]);
        alert('Frete cadastrado com sucesso!');
      }
      
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
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getSituacaoClass = (situacao: string) => {
    switch (situacao.toLowerCase()) {
      case 'pendente': return 'pendente';
      case 'em andamento': return 'em-andamento';
      case 'concluído': case 'concluido': return 'concluido';
      case 'pago': return 'pago';
      default: return 'pendente';
    }
  };

  const fretesFiltrados = filtroSituacao 
    ? fretes.filter(f => f.situacao === filtroSituacao)
    : fretes;

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
  const getClientesUnicos = (): string[] => {
    const clientes = fretes
      .map(f => f.cliente)
      .filter((cliente): cliente is string => Boolean(cliente && cliente.trim()))
      .filter((cliente, index, arr) => arr.indexOf(cliente) === index);
    return clientes.sort();
  };

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
      const doc = new jsPDF('landscape'); // Modo paisagem
      
      // Configurações da página
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Função para adicionar logo
      const addLogo = () => {
        return new Promise<void>((resolve) => {
          fetch('/assets/images/logo.png')
            .then(response => response.blob())
            .then(blob => {
              const reader = new FileReader();
              reader.onload = function(e) {
                if (e.target?.result) {
                  try {
                    doc.addImage(e.target.result as string, 'PNG', 20, 15, 40, 40);
                  } catch (error) {
                    console.log('Erro ao adicionar logo');
                  }
                }
                resolve();
              };
              reader.readAsDataURL(blob);
            })
            .catch(() => resolve());
        });
      };

      // Adicionar logo
      await addLogo();

      // Borda externa da página
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

      // Título principal - TR VALE DO BOI (grande e vermelho)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(36);
      doc.setTextColor(255, 0, 0);
      doc.text('TR', pageWidth / 2 - 40, 35, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      doc.text('VALE DO BOI', pageWidth / 2 + 20, 35, { align: 'center' });
      
      // Subtítulo
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('TRANSPORTE DE BOVINOS!', pageWidth / 2 + 20, 45, { align: 'center' });

      // Dados da empresa - canto superior direito
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const rightX = pageWidth - 20;
      doc.text('(66) 9 9238-8551', rightX, 25, { align: 'right' });
      doc.text('Rua Mato Grosso Centro Bg-MT 78600-023', rightX, 33, { align: 'right' });
      doc.text('CNPJ: 27.244.973.0001-22', rightX, 41, { align: 'right' });

      // Nome do cliente (canto esquerdo)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(clienteSelecionado.toUpperCase(), 20, 75);

      // Título ACERTO DE FRETE (centralizado)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('ACERTO DE FRETE', pageWidth / 2, 75, { align: 'center' });

      // Cabeçalho da tabela
      const startY = 90;
      const headers = ['DATA', 'DESCRIÇÃO', 'PLACA', 'REMETENTE/FAZ', 'DESTINATÁRIO/FAZ', 'BASE DE CÁLCULO', 'VALOR'];
      const colWidths = [28, 38, 28, 48, 48, 38, 32];
      let currentX = 20;

      // Desenhar cabeçalho com fundo laranja/bege
      doc.setFillColor(255, 204, 153);
      doc.setDrawColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      
      // Desenhar fundo do cabeçalho
      doc.rect(20, startY, colWidths.reduce((a, b) => a + b, 0), 12, 'FD');
      
      headers.forEach((header, i) => {
        doc.text(header, currentX + colWidths[i]/2, startY + 8, { align: 'center' });
        currentX += colWidths[i];
      });

      // Desenhar bordas verticais do cabeçalho
      currentX = 20;
      headers.forEach((_, i) => {
        doc.line(currentX, startY, currentX, startY + 12);
        currentX += colWidths[i];
      });
      doc.line(currentX, startY, currentX, startY + 12); // Última borda

      // Dados dos fretes
      let currentY = startY + 12;
      let total = 0;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      fretesAcerto.forEach((frete, index) => {
        currentX = 20;
        const caminhao = caminhoes.find(c => c.id === frete.caminhao_id);
        
        const rowData = [
          new Date(frete.data_emissao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          caminhao?.tipo?.toUpperCase() || 'N/A',
          caminhao?.placa || 'N/A',
          frete.pecuarista.toUpperCase(),
          frete.origem.toUpperCase(),
          frete.total_km ? `${frete.total_km}KM` : 'N/A',
          formatCurrency(frete.valor_frete)
        ];

        // Desenhar linha de dados
        rowData.forEach((data, i) => {
          if (i === 6) { // Valor alinhado à direita
            doc.text(data, currentX + colWidths[i] - 5, currentY + 8, { align: 'right' });
          } else if (i === 0) { // Data centralizada
            doc.text(data, currentX + colWidths[i]/2, currentY + 8, { align: 'center' });
          } else {
            doc.text(data, currentX + 5, currentY + 8);
          }
          currentX += colWidths[i];
        });

        // Desenhar bordas verticais
        currentX = 20;
        headers.forEach((_, i) => {
          doc.line(currentX, currentY, currentX, currentY + 10);
          currentX += colWidths[i];
        });
        doc.line(currentX, currentY, currentX, currentY + 10); // Última borda

        // Linha horizontal
        doc.line(20, currentY + 10, 20 + colWidths.reduce((a, b) => a + b, 0), currentY + 10);

        total += frete.valor_frete;
        currentY += 10;
      });

      // Linha de total
      currentX = 20;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      
      // Texto TOTAL na penúltima coluna
      const totalX = 20 + colWidths.slice(0, -2).reduce((a, b) => a + b, 0);
      doc.text('TOTAL ------>', totalX + colWidths[colWidths.length - 2] - 5, currentY + 8, { align: 'right' });
      
      // Valor do total na última coluna
      const valorX = 20 + colWidths.slice(0, -1).reduce((a, b) => a + b, 0);
      doc.text(formatCurrency(total), valorX + colWidths[colWidths.length - 1] - 5, currentY + 8, { align: 'right' });

      // Bordas da linha de total
      currentX = 20;
      headers.forEach((_, i) => {
        doc.line(currentX, currentY, currentX, currentY + 10);
        currentX += colWidths[i];
      });
      doc.line(currentX, currentY, currentX, currentY + 10);
      doc.line(20, currentY + 10, 20 + colWidths.reduce((a, b) => a + b, 0), currentY + 10);

      // Dados bancários (caixa no canto inferior esquerdo)
      const bancarioY = currentY + 25;
      doc.setFillColor(255, 204, 153);
      doc.setDrawColor(0, 0, 0);
      doc.rect(20, bancarioY, 140, 50, 'FD');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('BANCO: 756 SICOOB', 25, bancarioY + 12);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('AG-      4349', 25, bancarioY + 20);
      doc.text('CC-      141.105-5', 25, bancarioY + 27);
      doc.text('PIX-CNPJ     27.244.973/0001-22', 25, bancarioY + 34);
      
      doc.setFont('helvetica', 'bold');
      doc.text('VALE DO BOI CARNES LTDA', 25, bancarioY + 41);
      doc.text('VALE DO BOI', 25, bancarioY + 48);

      // Salvar PDF
      const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '_');
      const nomeArquivo = `acerto_${clienteSelecionado.replace(/\s+/g, '_')}_${dataAtual}.pdf`;
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
          <div className="filtros">
            <Filter size={16} />
            <select
              value={filtroSituacao}
              onChange={(e) => setFiltroSituacao(e.target.value)}
              className="filtro-select"
            >
              <option value="">Todas as Situações</option>
              <option value="Pendente">Pendente</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Concluído">Concluído</option>
              <option value="Pago">Pago</option>
            </select>
          </div>
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
                          onChange={(e) => setFormData({...formData, situacao: e.target.value})}
                          required
                        >
                          <option value="Pendente">Pendente</option>
                          <option value="Em Andamento">Em Andamento</option>
                          <option value="Concluído">Concluído</option>
                          <option value="Pago">Pago</option>
                        </select>
                      </div>
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
                      <td>{frete.numero_cte || '-'}</td>
                      <td>{frete.cliente || '-'}</td>
                      <td>{frete.caminhao?.placa}</td>
                      <td>{frete.caminhao?.tipo}</td>
                      <td>{frete.motorista?.nome}</td>
                      <td>{frete.faixa || '-'}</td>
                      <td>{frete.total_km || '-'}</td>
                      <td>{formatCurrency(frete.valor_frete)}</td>
                      <td>{frete.saldo_receber ? formatCurrency(frete.saldo_receber) : '-'}</td>
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