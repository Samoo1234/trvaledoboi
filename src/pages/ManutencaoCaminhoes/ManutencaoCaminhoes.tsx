import React, { useState, useEffect, useCallback } from 'react';
import { Wrench } from 'lucide-react';
import { manutencaoService, Manutencao, ManutencaoCreateData } from '../../services/manutencaoService';
import { caminhaoService, Caminhao } from '../../services/caminhaoService';
import { getCurrentDate } from '../../services/dateUtils';
import { gerarPeriodos } from './utils';
import { ManutencaoCaminhoesFilters } from './components/ManutencaoCaminhoesFilters';
import { ManutencaoCaminhoesStats } from './components/ManutencaoCaminhoesStats';
import { ManutencaoCaminhoesTable } from './components/ManutencaoCaminhoesTable';
import { ManutencaoCaminhoesRelatorios } from './components/ManutencaoCaminhoesRelatorios';
import { ManutencaoCaminhoesForm } from './components/ManutencaoCaminhoesForm';
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
  const [caminhoes, setCaminhoes] = useState<Caminhao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
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
      let data = filtros.periodo ? await manutencaoService.getByPeriodo(filtros.periodo) : await manutencaoService.getAll();
      if (filtros.caminhaoId) data = data.filter(m => m.caminhao_id === parseInt(filtros.caminhaoId));
      if (filtros.tipoManutencao) data = data.filter(m => m.tipo_manutencao === filtros.tipoManutencao);
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

  useEffect(() => {
    Promise.all([loadManutencoes(), loadCaminhoes()]);
  }, [loadManutencoes, loadCaminhoes]);

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
        const updated = await manutencaoService.update(editingId, formData);
        setManutencoes(manutencoes.map(m => m.id === editingId ? updated : m));
        alert('Manutenção atualizada com sucesso!');
      } else {
        const novo = await manutencaoService.create(formData);
        setManutencoes([novo, ...manutencoes]);
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
      setManutencoes(manutencoes.filter(m => m.id !== id));
      alert('Manutenção excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir manutenção:', error);
      alert('Erro ao excluir manutenção.');
    }
  };

  const gerarRelatorioConsolidado = async () => {
    try {
      setLoading(true);
      const data = await manutencaoService.getRelatorioConsolidado(filtros.periodo);
      setRelatorioData(data);
      setActiveTab('relatorios');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório.');
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
      )}

      {activeTab === 'relatorios' && (
        <ManutencaoCaminhoesRelatorios
          relatorioData={relatorioData}
          periodoNome={periodoNome}
        />
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