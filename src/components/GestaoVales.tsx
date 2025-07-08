import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, DollarSign, Filter, Search, X } from 'lucide-react';
import { valeService, Vale, ValeCreateData } from '../services/valeService';
import { motoristaService, Motorista } from '../services/motoristaService';
import { formatDisplayDate } from '../services/dateUtils';
import './GestaoVales.css';

const GestaoVales: React.FC = () => {
  const [vales, setVales] = useState<Vale[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState(() => {
    const now = new Date();
    return `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
  });

  const [formData, setFormData] = useState({
    motorista_id: '',
    data_vale: '',
    valor: '',
    descricao: ''
  });

  // Estados para filtros
  const [mostrandoFiltros, setMostrandoFiltros] = useState(false);
  const [usandoFiltros, setUsandoFiltros] = useState(false);
  const [filtros, setFiltros] = useState({
    motorista_id: '',
    data_inicio: '',
    data_fim: ''
  });

  const loadVales = useCallback(async () => {
    try {
      let data: Vale[];
      
      if (usandoFiltros) {
        // Usar filtros avançados
        const filtrosQuery = {
          motorista_id: filtros.motorista_id ? parseInt(filtros.motorista_id) : undefined,
          data_inicio: filtros.data_inicio || undefined,
          data_fim: filtros.data_fim || undefined,
          periodo: !filtros.data_inicio && !filtros.data_fim ? selectedPeriodo : undefined
        };
        
        data = await valeService.getWithFilters(filtrosQuery);
      } else {
        // Usar filtro de período padrão
        data = await valeService.getByPeriodo(selectedPeriodo);
      }
      
      setVales(data);
    } catch (error) {
      console.error('Erro ao carregar vales:', error);
      alert('Erro ao carregar vales.');
    }
  }, [selectedPeriodo, usandoFiltros, filtros]);

  const loadMotoristas = useCallback(async () => {
    try {
      const data = await motoristaService.getAll();
      setMotoristas(data.filter(m => m.status === 'Ativo'));
    } catch (error) {
      console.error('Erro ao carregar motoristas:', error);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadVales(), loadMotoristas()]).finally(() => setLoading(false));
  }, [loadVales, loadMotoristas]);

  const resetForm = () => {
    setFormData({ motorista_id: '', data_vale: '', valor: '', descricao: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (vale: Vale) => {
    setFormData({
      motorista_id: vale.motorista_id.toString(),
      data_vale: vale.data_vale,
      valor: vale.valor.toString(),
      descricao: vale.descricao || ''
    });
    setEditingId(vale.id || null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!formData.motorista_id || !formData.data_vale || !formData.valor) {
        alert('Preencha todos os campos obrigatórios');
        return;
      }

      const valor = parseFloat(formData.valor);
      if (valor <= 0) {
        alert('O valor deve ser maior que zero');
        return;
      }

      const valeData: ValeCreateData = {
        motorista_id: parseInt(formData.motorista_id),
        data_vale: formData.data_vale,
        valor: valor,
        descricao: formData.descricao || undefined
      };

      if (editingId) {
        const updatedVale = await valeService.update(editingId, valeData);
        setVales(vales.map(v => v.id === editingId ? updatedVale : v));
        alert('Vale atualizado com sucesso!');
      } else {
        const newVale = await valeService.create(valeData);
        setVales([newVale, ...vales]);
        alert('Vale registrado com sucesso!');
      }
      
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar vale:', error);
      alert('Erro ao salvar vale.');
    }
  };

  const handleDelete = async (id: number, nomeMotorista: string) => {
    if (!window.confirm(`Excluir vale do motorista "${nomeMotorista}"?`)) return;

    try {
      await valeService.delete(id);
      setVales(vales.filter(v => v.id !== id));
      alert('Vale excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir vale:', error);
      alert('Erro ao excluir vale.');
    }
  };

  const gerarPeriodos = () => {
    const periodos = [];
    const hoje = new Date();
    
    for (let i = 0; i < 12; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mes = (data.getMonth() + 1).toString().padStart(2, '0');
      const ano = data.getFullYear();
      const valor = `${mes}/${ano}`;
      const nome = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      periodos.push({ valor, nome: nome.charAt(0).toUpperCase() + nome.slice(1) });
    }
    
    return periodos;
  };

  // Funções para filtros
  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      motorista_id: '',
      data_inicio: '',
      data_fim: ''
    });
    setUsandoFiltros(false);
    setMostrandoFiltros(false);
  };

  const executarBusca = () => {
    setUsandoFiltros(true);
    setLoading(true);
    // O useEffect será acionado pela mudança do usandoFiltros
  };

  // Adicionar useEffect para controlar loading
  useEffect(() => {
    if (usandoFiltros) {
      loadVales().finally(() => setLoading(false));
    }
  }, [usandoFiltros, loadVales]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    // CORREÇÃO: Usar função sem problema de fuso horário
    return formatDisplayDate(dateString);
  };

  const totalVales = vales.reduce((sum, vale) => sum + parseFloat(vale.valor.toString()), 0);

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Gestão de Vales</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Carregando vales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container gestao-vales-container">
      <div className="page-header">
        <h1>
          <DollarSign size={28} />
          Gestão de Vales
        </h1>
        <div className="header-actions">
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
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={20} />
            Novo Vale
          </button>
        </div>
      </div>

      {/* Controles de Filtro */}
      <div className="filter-controls">
        <button
          className="filter-toggle"
          onClick={() => setMostrandoFiltros(!mostrandoFiltros)}
        >
          <Filter size={20} />
          {mostrandoFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
        <div className="search-actions">
          <button className="search-btn" onClick={executarBusca} disabled={loading}>
            <Search size={20} />
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          <button className="clear-btn" onClick={limparFiltros}>
            <X size={20} />
            Limpar
          </button>
        </div>
      </div>

      {/* Filtros Expandidos */}
      {mostrandoFiltros && (
        <div className="filters-expanded">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Motorista:</label>
              <select
                value={filtros.motorista_id}
                onChange={(e) => handleFiltroChange('motorista_id', e.target.value)}
              >
                <option value="">Todos os motoristas</option>
                {motoristas.map(motorista => (
                  <option key={motorista.id} value={motorista.id?.toString()}>
                    {motorista.nome} ({motorista.tipo_motorista})
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Data Início:</label>
              <input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Data Fim:</label>
              <input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
              />
            </div>
          </div>
          <div className="filter-help">
            <p>💡 <strong>Dica:</strong> Use os filtros acima para busca avançada, ou utilize o seletor de período para consulta rápida por mês.</p>
          </div>
        </div>
      )}

      {/* Resumo */}
      <div className="resumo-cards">
        <div className="card">
          <h3>Total de Vales</h3>
          <p className="valor-destaque">{vales.length}</p>
        </div>
        <div className="card">
          <h3>Valor Total</h3>
          <p className="valor-destaque">{formatCurrency(totalVales)}</p>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Editar Vale' : 'Novo Vale'}</h2>
              <button onClick={resetForm} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Motorista *</label>
                  <select
                    value={formData.motorista_id}
                    onChange={(e) => setFormData({...formData, motorista_id: e.target.value})}
                    required
                  >
                    <option value="">Selecione</option>
                    {motoristas.map((motorista) => (
                      <option key={motorista.id} value={motorista.id}>
                        {motorista.nome} ({motorista.tipo_motorista})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Data *</label>
                  <input
                    type="date"
                    value={formData.data_vale}
                    onChange={(e) => setFormData({...formData, data_vale: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Valor (R$) *</label>
                  <input
                    type="number"
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    rows={3}
                  />
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

      {/* Tabela */}
      <div className="table-container">
        {vales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Nenhum vale registrado para este período.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Motorista</th>
                <th>Tipo</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {vales.map((vale) => (
                <tr key={vale.id}>
                  <td>{vale.motorista?.nome || 'N/A'}</td>
                  <td>
                    <span className={`tipo ${vale.motorista?.tipo_motorista?.toLowerCase()}`}>
                      {vale.motorista?.tipo_motorista || 'N/A'}
                    </span>
                  </td>
                  <td>{formatDate(vale.data_vale)}</td>
                  <td style={{ color: '#dc3545', fontWeight: '600' }}>
                    {formatCurrency(parseFloat(vale.valor.toString()))}
                  </td>
                  <td>{vale.descricao || '-'}</td>
                  <td>
                    <div className="actions">
                      <button 
                        className="btn-edit" 
                        onClick={() => handleEdit(vale)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => vale.id && handleDelete(vale.id, vale.motorista?.nome || 'Motorista')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GestaoVales; 