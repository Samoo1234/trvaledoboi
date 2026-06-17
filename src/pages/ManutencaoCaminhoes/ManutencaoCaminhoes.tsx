import React, { useState, useEffect, useCallback } from 'react';
import { Wrench } from 'lucide-react';
import { manutencaoService, Manutencao, ManutencaoCreateData, RelatorioManutencao } from '../../services/manutencaoService';
import { pdfService } from '../../services/pdfService';
import { caminhaoService, Caminhao } from '../../services/caminhaoService';
import { abastecimentoService, Abastecimento } from '../../services/abastecimentoService';
import { getCurrentDate } from '../../services/dateUtils';
import { gerarPeriodos } from './utils';
import { ManutencaoCaminhoesFilters } from './components/ManutencaoCaminhoesFilters';
import { ManutencaoCaminhoesStats } from './components/ManutencaoCaminhoesStats';
import { ManutencaoCaminhoesTable } from './components/ManutencaoCaminhoesTable';
import { ManutencaoCaminhoesRelatorios } from './components/ManutencaoCaminhoesRelatorios';
import { ManutencaoCaminhoesForm } from './components/ManutencaoCaminhoesForm';
import { ManutencaoCaminhoesCards } from './components/ManutencaoCaminhoesCards';
import { FichaClinicaCaminhao } from './components/FichaClinicaCaminhao';
import { obterKmAtual } from './prontuarioUtils';
import './ManutencaoCaminhoes.css';

interface RelatorioManutencaoPorTipo {
  tipo: string;
  quantidade: number;
  valorTotal: number;
}
interface RelatorioManutencaoPorCaminhao {
  placa: string;
  caminhao: string;
  totalManutencoes: number;
  valorTotal: number;
}
interface RelatorioConsolidado {
  totalManutencoes: number;
  valorTotal: number;
  manutencoesPorTipo: RelatorioManutencaoPorTipo[];
  manutencoesPorCaminhao: RelatorioManutencaoPorCaminhao[];
}

const ManutencaoCaminhoes: React.FC = () => {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [todasManutencoes, setTodasManutencoes] = useState<Manutencao[]>([]);
  const [caminhoes, setCaminhoes] = useState<Caminhao[]>([]);
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedCaminhaoId, setSelectedCaminhaoId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'prontuario' | 'lista_geral'>('prontuario');
  const [filtros, setFiltros] = useState({
    periodo: (() => {
      const now = new Date();
      return `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    })(),
    caminhaoId: '',
    tipoManutencao: ''
  });
  const [activeTab, setActiveTab] = useState<'lista' | 'relatorios'>('lista');
  const [relatorioData, setRelatorioData] = useState<RelatorioConsolidado | null>(null);
  const [relatorioCaminhaoData, setRelatorioCaminhaoData] = useState<RelatorioManutencao | null>(null);
  const [formData, setFormData] = useState<ManutencaoCreateData>({
    caminhao_id: 0,
    data_manutencao: getCurrentDate(),
    tipo_manutencao: 'Corretiva',
    descricao_servico: '',
    valor_servico: 0,
    oficina_responsavel: '',
    km_caminhao: undefined,
    observacoes: ''
  });

  const loadManutencoes = useCallback(async () => {
    try {
      setLoading(true);
      const allData = await manutencaoService.getAll();
      setTodasManutencoes(allData);
      
      let data = [...allData];
      if (filtros.periodo) {
        data = data.filter(m => m.periodo === filtros.periodo);
      }
      if (filtros.caminhaoId) {
        data = data.filter(m => m.caminhao_id === parseInt(filtros.caminhaoId));
      }
      if (filtros.tipoManutencao) {
        data = data.filter(m => m.tipo_manutencao === filtros.tipoManutencao);
      }
      setManutencoes(data);
    } catch (error) {
      console.error('Erro ao carregar manutenções:', error);
      alert('Erro ao carregar manutenções.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const loadCaminhoes = useCallback(async () => {
    try {
      const data = await caminhaoService.getAll();
      setCaminhoes(data.filter(c => c.status === 'Ativo'));
    } catch (error) {
      console.error('Erro ao carregar caminhões:', error);
    }
  }, []);

  const loadAbastecimentos = useCallback(async () => {
    try {
      const data = await abastecimentoService.getAll();
      setAbastecimentos(data);
    } catch (error) {
      console.error('Erro ao carregar abastecimentos:', error);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadManutencoes(), loadCaminhoes(), loadAbastecimentos()]);
  }, [loadManutencoes, loadCaminhoes, loadAbastecimentos]);

  const resetForm = () => {
    setFormData({
      caminhao_id: 0, data_manutencao: getCurrentDate(), tipo_manutencao: 'Corretiva',
      descricao_servico: '', valor_servico: 0, oficina_responsavel: '', km_caminhao: undefined, observacoes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (manutencao: Manutencao) => {
    setFormData({
      caminhao_id: manutencao.caminhao_id, data_manutencao: manutencao.data_manutencao,
      tipo_manutencao: manutencao.tipo_manutencao, descricao_servico: manutencao.descricao_servico,
      valor_servico: manutencao.valor_servico, oficina_responsavel: manutencao.oficina_responsavel || '',
      km_caminhao: manutencao.km_caminhao, observacoes: manutencao.observacoes || ''
    });
    setEditingId(manutencao.id || null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.caminhao_id || !formData.descricao_servico || !formData.valor_servico) {
        alert('Preencha todos os campos obrigatórios');
        return;
      }
      if (formData.valor_servico <= 0) {
        alert('O valor do serviço deve ser maior que zero');
        return;
      }

      if (editingId) {
        await manutencaoService.update(editingId, formData);
        await loadManutencoes();
        alert('Manutenção atualizada com sucesso!');
      } else {
        await manutencaoService.create(formData);
        await loadManutencoes();
        alert('Manutenção registrada com sucesso!');
      }
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar manutenção:', error);
      alert('Erro ao salvar manutenção.');
    }
  };

  const handleDelete = async (id: number, descricao: string) => {
    if (!window.confirm(`Excluir manutenção "${descricao}"?`)) return;
    try {
      await manutencaoService.delete(id);
      await loadManutencoes();
      alert('Manutenção excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir manutenção:', error);
      alert('Erro ao excluir manutenção.');
    }
  };

  const handleQuickAction = (tipo: 'oleo' | 'freio' | 'pneus') => {
    if (!selectedCaminhaoId) return;
    
    const kmAtual = obterKmAtual(selectedCaminhaoId, todasManutencoes, abastecimentos);
    let desc = '';
    if (tipo === 'oleo') {
      desc = 'Troca de Óleo e Filtros';
    } else if (tipo === 'freio') {
      desc = 'Revisão e Manutenção do Sistema de Freios (Pastilhas/Lonas)';
    } else if (tipo === 'pneus') {
      desc = 'Alinhamento, Balanceamento e Rodízio de Pneus';
    }

    setFormData({
      caminhao_id: selectedCaminhaoId,
      data_manutencao: getCurrentDate(),
      tipo_manutencao: 'Preventiva',
      descricao_servico: desc,
      valor_servico: 0,
      oficina_responsavel: '',
      km_caminhao: kmAtual > 0 ? kmAtual : undefined,
      observacoes: 'Registrado via ação rápida no prontuário de saúde.'
    });
    setShowForm(true);
  };

  const fetchRelatorioData = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`[DEBUG] Gerando relatório para caminhaoId: "${filtros.caminhaoId}", periodo: "${filtros.periodo}"`);
      if (filtros.caminhaoId) {
        const data = await manutencaoService.getRelatorioByCaminhao(parseInt(filtros.caminhaoId), filtros.periodo);
        console.log(`[DEBUG] Dados retornados:`, data);
        setRelatorioCaminhaoData(data);
        setRelatorioData(null);
      } else {
        const data = await manutencaoService.getRelatorioConsolidado(filtros.periodo);
        console.log(`[DEBUG] Dados consolidados retornados:`, data);
        setRelatorioData(data);
        setRelatorioCaminhaoData(null);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const gerarRelatorioConsolidado = async () => {
    setActiveTab('relatorios');
    await fetchRelatorioData();
  };

  useEffect(() => {
    if (activeTab === 'relatorios') {
      fetchRelatorioData();
    }
  }, [activeTab, fetchRelatorioData]);

  const handleImprimirConsolidado = async () => {
    if (!relatorioData) return;
    try {
      setLoading(true);
      await pdfService.gerarPDFManutencaoConsolidado(relatorioData, periodoNome || filtros.periodo || 'Geral');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handleImprimirCaminhao = async () => {
    if (!relatorioCaminhaoData) return;
    try {
      setLoading(true);
      await pdfService.gerarPDFManutencaoCaminhao(relatorioCaminhaoData, periodoNome || filtros.periodo || 'Geral');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF.');
    } finally {
      setLoading(false);
    }
  };

  const totalManutencoes = manutencoes.length;
  const valorTotal = manutencoes.reduce((sum, m) => sum + parseFloat(m.valor_servico.toString()), 0);
  const mediaValor = totalManutencoes > 0 ? valorTotal / totalManutencoes : 0;
  const periodoNome = gerarPeriodos().find(p => p.valor === filtros.periodo)?.nome;

  if (loading && activeTab === 'lista') {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Manutenção de Caminhões</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Carregando manutenções...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>
          <Wrench size={28} />
          Manutenção de Caminhões
        </h1>
        <div className="header-actions">
          {activeTab === 'lista' && (
            <div className="view-mode-toggle">
              <button 
                className={`toggle-btn ${viewMode === 'prontuario' ? 'active' : ''}`}
                onClick={() => { setViewMode('prontuario'); setSelectedCaminhaoId(null); }}
              >
                🏥 Prontuário
              </button>
              <button 
                className={`toggle-btn ${viewMode === 'lista_geral' ? 'active' : ''}`}
                onClick={() => setViewMode('lista_geral')}
              >
                📋 Histórico Geral
              </button>
            </div>
          )}
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'lista' ? 'active' : ''}`}
              onClick={() => setActiveTab('lista')}
            >
              Lista de Manutenções
            </button>
            <button 
              className={`tab ${activeTab === 'relatorios' ? 'active' : ''}`}
              onClick={() => setActiveTab('relatorios')}
            >
              Relatórios
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'lista' && (
        viewMode === 'prontuario' ? (
          selectedCaminhaoId !== null ? (
            <FichaClinicaCaminhao
              caminhao={caminhoes.find(c => c.id === selectedCaminhaoId)!}
              manutencoes={todasManutencoes}
              abastecimentos={abastecimentos}
              onClose={() => setSelectedCaminhaoId(null)}
              onQuickAction={handleQuickAction}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
            />
          ) : (
            <div className="prontuario-dashboard">
              <div className="prontuario-intro">
                <p>Selecione um caminhão abaixo para visualizar seu prontuário clínico detalhado de saúde e histórico de revisões.</p>
              </div>
              <ManutencaoCaminhoesCards
                caminhoes={caminhoes}
                manutencoes={todasManutencoes}
                abastecimentos={abastecimentos}
                onSelectCaminhao={setSelectedCaminhaoId}
                selectedCaminhaoId={selectedCaminhaoId}
              />
            </div>
          )
        ) : (
          <>
            <ManutencaoCaminhoesFilters
              filtros={filtros}
              setFiltros={setFiltros}
              caminhoes={caminhoes}
              setShowForm={setShowForm}
              gerarRelatorioConsolidado={gerarRelatorioConsolidado}
            />
            <ManutencaoCaminhoesStats
              totalManutencoes={totalManutencoes}
              valorTotal={valorTotal}
              mediaValor={mediaValor}
            />
            <ManutencaoCaminhoesTable
              manutencoes={manutencoes}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
            />
          </>
        )
      )}

      {activeTab === 'relatorios' && (
        <>
          <ManutencaoCaminhoesFilters
            filtros={filtros}
            setFiltros={setFiltros}
            caminhoes={caminhoes}
            setShowForm={setShowForm}
            gerarRelatorioConsolidado={gerarRelatorioConsolidado}
          />
          <ManutencaoCaminhoesRelatorios
            relatorioData={relatorioData}
            relatorioCaminhaoData={relatorioCaminhaoData}
            periodoNome={periodoNome}
            onImprimirConsolidado={handleImprimirConsolidado}
            onImprimirCaminhao={handleImprimirCaminhao}
          />
        </>
      )}

      <ManutencaoCaminhoesForm
        showForm={showForm}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        caminhoes={caminhoes}
      />
    </div>
  );
};

export default ManutencaoCaminhoes;