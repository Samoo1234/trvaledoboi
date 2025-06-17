import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Wrench, FileText, Filter } from 'lucide-react';
import { manutencaoService, Manutencao, ManutencaoCreateData } from '../../services/manutencaoService';
import { caminhaoService, Caminhao } from '../../services/caminhaoService';
import { formatDisplayDate, getCurrentDate } from '../../services/dateUtils';
import './ManutencaoCaminhoes.css';

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
  const [relatorioData, setRelatorioData] = useState<any>(null);

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
      let data: Manutencao[];
      
      if (filtros.periodo) {
        data = await manutencaoService.getByPeriodo(filtros.periodo);
      } else {
        data = await manutencaoService.getAll();
      }

      // Aplicar filtros adicionais
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

  useEffect(() => {
    Promise.all([loadManutencoes(), loadCaminhoes()]);
  }, [loadManutencoes, loadCaminhoes]);

  const resetForm = () => {
    setFormData({
      caminhao_id: 0,
      data_manutencao: getCurrentDate(),
      tipo_manutencao: 'Corretiva',
      descricao_servico: '',
      valor_servico: 0,
      oficina_responsavel: '',
      km_caminhao: undefined,
      observacoes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (manutencao: Manutencao) => {
    setFormData({
      caminhao_id: manutencao.caminhao_id,
      data_manutencao: manutencao.data_manutencao,
      tipo_manutencao: manutencao.tipo_manutencao,
      descricao_servico: manutencao.descricao_servico,
      valor_servico: manutencao.valor_servico,
      oficina_responsavel: manutencao.oficina_responsavel || '',
      km_caminhao: manutencao.km_caminhao,
      observacoes: manutencao.observacoes || ''
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
        const updatedManutencao = await manutencaoService.update(editingId, formData);
        setManutencoes(manutencoes.map(m => m.id === editingId ? updatedManutencao : m));
        alert('Manutenção atualizada com sucesso!');
      } else {
        const newManutencao = await manutencaoService.create(formData);
        setManutencoes([newManutencao, ...manutencoes]);
        alert('Manutenção registrada com sucesso!');
      }
      
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar manutenção:', error);
      alert('Erro ao salvar manutenção.');
    }
  };

  const handleDelete = async (id: number, descricaoServico: string) => {
    if (!window.confirm(`Excluir manutenção "${descricaoServico}"?`)) return;

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Preventiva': return '#28a745';
      case 'Corretiva': return '#dc3545';
      case 'Emergencial': return '#ff6b35';
      default: return '#6c757d';
    }
  };

  const totalManutencoes = manutencoes.length;
  const valorTotal = manutencoes.reduce((sum, manutencao) => sum + parseFloat(manutencao.valor_servico.toString()), 0);
  const mediaValor = totalManutencoes > 0 ? valorTotal / totalManutencoes : 0;

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
          {/* Filtros */}
          <div className="filtros-section">
            <h3><Filter size={20} /> Filtros</h3>
            <div className="filtros-grid">
              <div className="filtro-item">
                <label>Período:</label>
                <select 
                  value={filtros.periodo}
                  onChange={(e) => setFiltros({...filtros, periodo: e.target.value})}
                >
                  <option value="">Todos os períodos</option>
                  {gerarPeriodos().map(periodo => (
                    <option key={periodo.valor} value={periodo.valor}>
                      {periodo.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filtro-item">
                <label>Caminhão:</label>
                <select 
                  value={filtros.caminhaoId}
                  onChange={(e) => setFiltros({...filtros, caminhaoId: e.target.value})}
                >
                  <option value="">Todos os caminhões</option>
                  {caminhoes.map(caminhao => (
                    <option key={caminhao.id} value={caminhao.id}>
                      {caminhao.placa} - {caminhao.modelo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filtro-item">
                <label>Tipo:</label>
                <select 
                  value={filtros.tipoManutencao}
                  onChange={(e) => setFiltros({...filtros, tipoManutencao: e.target.value})}
                >
                  <option value="">Todos os tipos</option>
                  <option value="Preventiva">Preventiva</option>
                  <option value="Corretiva">Corretiva</option>
                  <option value="Emergencial">Emergencial</option>
                </select>
              </div>
              <div className="filtro-actions">
                <button className="btn-secondary" onClick={() => setFiltros({periodo: '', caminhaoId: '', tipoManutencao: ''})}>
                  Limpar
                </button>
                <button className="btn-primary" onClick={() => setShowForm(true)}>
                  <Plus size={20} />
                  Nova Manutenção
                </button>
                <button className="btn-info" onClick={gerarRelatorioConsolidado}>
                  <FileText size={20} />
                  Relatório
                </button>
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="resumo-cards">
            <div className="card">
              <h3>Total de Manutenções</h3>
              <p className="valor-destaque">{totalManutencoes}</p>
            </div>
            <div className="card">
              <h3>Valor Total</h3>
              <p className="valor-destaque">{formatCurrency(valorTotal)}</p>
            </div>
            <div className="card">
              <h3>Valor Médio</h3>
              <p className="valor-destaque">{formatCurrency(mediaValor)}</p>
            </div>
          </div>

          {/* Tabela */}
          <div className="table-container">
            {manutencoes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Nenhuma manutenção encontrada para os filtros selecionados.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Caminhão</th>
                    <th>Tipo</th>
                    <th>Descrição do Serviço</th>
                    <th>Valor</th>
                    <th>Oficina</th>
                    <th>KM</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {manutencoes.map((manutencao) => (
                    <tr key={manutencao.id}>
                      <td>{formatDisplayDate(manutencao.data_manutencao)}</td>
                      <td>
                        <strong>{manutencao.caminhao?.placa}</strong><br />
                        <small>{manutencao.caminhao?.modelo}</small>
                      </td>
                      <td>
                        <span 
                          className="tipo-badge"
                          style={{ backgroundColor: getTipoColor(manutencao.tipo_manutencao) }}
                        >
                          {manutencao.tipo_manutencao}
                        </span>
                      </td>
                      <td className="descricao-cell">
                        {manutencao.descricao_servico}
                        {manutencao.observacoes && (
                          <small><br />Obs: {manutencao.observacoes}</small>
                        )}
                      </td>
                      <td className="valor-cell">{formatCurrency(manutencao.valor_servico)}</td>
                      <td>{manutencao.oficina_responsavel || '-'}</td>
                      <td>{manutencao.km_caminhao ? `${manutencao.km_caminhao} km` : '-'}</td>
                      <td>
                        <div className="actions">
                          <button 
                            className="btn-action"
                            onClick={() => handleEdit(manutencao)}
                            title="Editar Manutenção"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="btn-action btn-danger"
                            onClick={() => manutencao.id && handleDelete(manutencao.id, manutencao.descricao_servico)}
                            title="Excluir Manutenção"
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
        </>
      )}

      {activeTab === 'relatorios' && relatorioData && (
        <div className="relatorio-section">
          <h3>Relatório Consolidado - {gerarPeriodos().find(p => p.valor === filtros.periodo)?.nome}</h3>
          
          <div className="resumo-cards">
            <div className="card">
              <h3>Total de Manutenções</h3>
              <p className="valor-destaque">{relatorioData.totalManutencoes}</p>
            </div>
            <div className="card">
              <h3>Valor Total Gasto</h3>
              <p className="valor-destaque">{formatCurrency(relatorioData.valorTotal)}</p>
            </div>
          </div>

          <div className="relatorio-grid">
            <div className="relatorio-card">
              <h4>Manutenções por Tipo</h4>
              <table className="relatorio-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Quantidade</th>
                    <th>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorioData.manutencoesPorTipo.map((item: any, index: number) => (
                    <tr key={index}>
                      <td>
                        <span 
                          className="tipo-badge"
                          style={{ backgroundColor: getTipoColor(item.tipo) }}
                        >
                          {item.tipo}
                        </span>
                      </td>
                      <td>{item.quantidade}</td>
                      <td>{formatCurrency(item.valorTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="relatorio-card">
              <h4>Manutenções por Caminhão</h4>
              <table className="relatorio-table">
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Modelo</th>
                    <th>Quantidade</th>
                    <th>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorioData.manutencoesPorCaminhao.map((item: any, index: number) => (
                    <tr key={index}>
                      <td><strong>{item.placa}</strong></td>
                      <td>{item.caminhao}</td>
                      <td>{item.totalManutencoes}</td>
                      <td>{formatCurrency(item.valorTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Formulário */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? 'Editar Manutenção' : 'Nova Manutenção'}</h3>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Caminhão *</label>
                  <select
                    value={formData.caminhao_id}
                    onChange={(e) => setFormData({...formData, caminhao_id: parseInt(e.target.value)})}
                    required
                  >
                    <option value={0}>Selecione o caminhão</option>
                    {caminhoes.map(caminhao => (
                      <option key={caminhao.id} value={caminhao.id}>
                        {caminhao.placa} - {caminhao.modelo} ({caminhao.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Data da Manutenção *</label>
                  <input
                    type="date"
                    value={formData.data_manutencao}
                    onChange={(e) => setFormData({...formData, data_manutencao: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de Manutenção *</label>
                  <select
                    value={formData.tipo_manutencao}
                    onChange={(e) => setFormData({...formData, tipo_manutencao: e.target.value as any})}
                    required
                  >
                    <option value="Preventiva">Preventiva</option>
                    <option value="Corretiva">Corretiva</option>
                    <option value="Emergencial">Emergencial</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Valor do Serviço *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_servico}
                    onChange={(e) => setFormData({...formData, valor_servico: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>Descrição do Serviço *</label>
                  <textarea
                    value={formData.descricao_servico}
                    onChange={(e) => setFormData({...formData, descricao_servico: e.target.value})}
                    placeholder="Descreva o serviço realizado..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Oficina/Responsável</label>
                  <input
                    type="text"
                    value={formData.oficina_responsavel}
                    onChange={(e) => setFormData({...formData, oficina_responsavel: e.target.value})}
                    placeholder="Nome da oficina ou responsável"
                  />
                </div>

                <div className="form-group">
                  <label>KM do Caminhão</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.km_caminhao || ''}
                    onChange={(e) => setFormData({...formData, km_caminhao: e.target.value ? parseInt(e.target.value) : undefined})}
                    placeholder="Quilometragem atual"
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManutencaoCaminhoes; 