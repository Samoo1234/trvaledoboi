import React, { useState, useEffect } from 'react';
import { abastecimentoService, Abastecimento } from '../services/abastecimentoService';
import { caminhaoService, Caminhao } from '../services/caminhaoService';
import { motoristaService, Motorista } from '../services/motoristaService';
import { formatDisplayDate } from '../services/dateUtils';
import './ControleAbastecimento.css';

const ControleAbastecimento: React.FC = () => {
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [caminhoes, setCaminhoes] = useState<Caminhao[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAbastecimento, setEditingAbastecimento] = useState<Abastecimento | null>(null);
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    caminhaoId: '',
    motoristaId: '',
    combustivel: ''
  });

  const [formData, setFormData] = useState<Partial<Abastecimento>>({
    data_abastecimento: '',
    mes: '',
    combustivel: 'Diesel',
    quantidade_litros: 0,
    posto_tanque: '',
    caminhao_id: 0,
    motorista_id: 0,
    horimetro: 0,
    km_rodado: 0,
    numero_ticket: '',
    preco_total: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [abastecimentosData, caminhoesData, motoristasData] = await Promise.all([
        abastecimentoService.getAll(),
        caminhaoService.getAll(),
        motoristaService.getAll()
      ]);
      
      setAbastecimentos(abastecimentosData);
      setCaminhoes(caminhoesData);
      setMotoristas(motoristasData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAbastecimento) {
        await abastecimentoService.update(editingAbastecimento.id!, formData);
      } else {
        await abastecimentoService.create(formData as Omit<Abastecimento, 'id' | 'created_at' | 'updated_at'>);
      }
      
      await loadData();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar abastecimento');
    }
  };

  const handleEdit = (abastecimento: Abastecimento) => {
    setEditingAbastecimento(abastecimento);
    setFormData({
      data_abastecimento: abastecimento.data_abastecimento,
      mes: abastecimento.mes,
      combustivel: abastecimento.combustivel,
      quantidade_litros: abastecimento.quantidade_litros,
      posto_tanque: abastecimento.posto_tanque,
      caminhao_id: abastecimento.caminhao_id,
      motorista_id: abastecimento.motorista_id,
      horimetro: abastecimento.horimetro,
      km_rodado: abastecimento.km_rodado,
      numero_ticket: abastecimento.numero_ticket,
      preco_total: abastecimento.preco_total
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este abastecimento?')) {
      try {
        await abastecimentoService.delete(id);
        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao excluir abastecimento');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      data_abastecimento: '',
      mes: '',
      combustivel: 'Diesel',
      quantidade_litros: 0,
      posto_tanque: '',
      caminhao_id: 0,
      motorista_id: 0,
      horimetro: 0,
      km_rodado: 0,
      numero_ticket: '',
      preco_total: 0
    });
    setEditingAbastecimento(null);
    setShowForm(false);
  };

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const aplicarFiltros = async () => {
    try {
      setLoading(true);
      let dados = await abastecimentoService.getAll();

      if (filtros.dataInicio && filtros.dataFim) {
        dados = await abastecimentoService.getByPeriodo(filtros.dataInicio, filtros.dataFim);
      }

      if (filtros.caminhaoId) {
        dados = dados.filter(a => a.caminhao_id === parseInt(filtros.caminhaoId));
      }

      if (filtros.motoristaId) {
        dados = dados.filter(a => a.motorista_id === parseInt(filtros.motoristaId));
      }

      if (filtros.combustivel) {
        dados = dados.filter(a => a.combustivel === filtros.combustivel);
      }

      setAbastecimentos(dados);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aplicar filtros');
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = () => {
    setFiltros({
      dataInicio: '',
      dataFim: '',
      caminhaoId: '',
      motoristaId: '',
      combustivel: ''
    });
    loadData();
  };

  const formatarData = (data: string) => {
    // CORREÇÃO: Usar formatDisplayDate para evitar problema de UTC
    return formatDisplayDate(data);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="controle-abastecimento">
      <div className="header">
        <h1>Controle de Abastecimento</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          Novo Abastecimento
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filtros */}
      <div className="filtros-section">
        <h3>Filtros</h3>
        <div className="filtros-grid">
          <div className="filtro-item">
            <label>Data Início:</label>
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
            />
          </div>
          <div className="filtro-item">
            <label>Data Fim:</label>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
            />
          </div>
          <div className="filtro-item">
            <label>Caminhão:</label>
            <select
              value={filtros.caminhaoId}
              onChange={(e) => handleFiltroChange('caminhaoId', e.target.value)}
            >
              <option value="">Todos</option>
              {caminhoes.map(caminhao => (
                <option key={caminhao.id} value={caminhao.id}>
                  {caminhao.placa} - {caminhao.modelo}
                </option>
              ))}
            </select>
          </div>
          <div className="filtro-item">
            <label>Motorista:</label>
            <select
              value={filtros.motoristaId}
              onChange={(e) => handleFiltroChange('motoristaId', e.target.value)}
            >
              <option value="">Todos</option>
              {motoristas.map(motorista => (
                <option key={motorista.id} value={motorista.id}>
                  {motorista.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="filtro-item">
            <label>Combustível:</label>
            <select
              value={filtros.combustivel}
              onChange={(e) => handleFiltroChange('combustivel', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Diesel">Diesel</option>
              <option value="Gasolina">Gasolina</option>
              <option value="Etanol">Etanol</option>
              <option value="Arla 32">Arla 32</option>
            </select>
          </div>
        </div>
        <div className="filtros-actions">
          <button className="btn-secondary" onClick={aplicarFiltros}>
            Aplicar Filtros
          </button>
          <button className="btn-outline" onClick={limparFiltros}>
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingAbastecimento ? 'Editar Abastecimento' : 'Novo Abastecimento'}</h2>
              <button className="btn-close" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="abastecimento-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Data do Abastecimento *</label>
                  <input
                    type="date"
                    value={formData.data_abastecimento}
                    onChange={(e) => setFormData({...formData, data_abastecimento: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mês</label>
                  <input
                    type="text"
                    value={formData.mes}
                    onChange={(e) => setFormData({...formData, mes: e.target.value})}
                    placeholder="Ex: Janeiro/2024"
                  />
                </div>

                <div className="form-group">
                  <label>Combustível *</label>
                  <select
                    value={formData.combustivel}
                    onChange={(e) => setFormData({...formData, combustivel: e.target.value})}
                    required
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Gasolina">Gasolina</option>
                    <option value="Etanol">Etanol</option>
                    <option value="Arla 32">Arla 32</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantidade (Litros) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantidade_litros}
                    onChange={(e) => setFormData({...formData, quantidade_litros: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Posto/Tanque</label>
                  <input
                    type="text"
                    value={formData.posto_tanque}
                    onChange={(e) => setFormData({...formData, posto_tanque: e.target.value})}
                    placeholder="Nome do posto ou tanque"
                  />
                </div>

                <div className="form-group">
                  <label>Caminhão *</label>
                  <select
                    value={formData.caminhao_id}
                    onChange={(e) => setFormData({...formData, caminhao_id: parseInt(e.target.value)})}
                    required
                  >
                    <option value="">Selecione um caminhão</option>
                    {caminhoes.map(caminhao => (
                      <option key={caminhao.id} value={caminhao.id}>
                        {caminhao.placa} - {caminhao.modelo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Motorista *</label>
                  <select
                    value={formData.motorista_id}
                    onChange={(e) => setFormData({...formData, motorista_id: parseInt(e.target.value)})}
                    required
                  >
                    <option value="">Selecione um motorista</option>
                    {motoristas.map(motorista => (
                      <option key={motorista.id} value={motorista.id}>
                        {motorista.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Horímetro</label>
                  <input
                    type="number"
                    value={formData.horimetro}
                    onChange={(e) => setFormData({...formData, horimetro: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="form-group">
                  <label>KM Rodado</label>
                  <input
                    type="number"
                    value={formData.km_rodado}
                    onChange={(e) => setFormData({...formData, km_rodado: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="form-group">
                  <label>Número do Ticket</label>
                  <input
                    type="text"
                    value={formData.numero_ticket}
                    onChange={(e) => setFormData({...formData, numero_ticket: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Preço Total</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.preco_total}
                    onChange={(e) => setFormData({...formData, preco_total: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingAbastecimento ? 'Atualizar' : 'Salvar'}
                </button>
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabela de Abastecimentos */}
      <div className="table-container">
        <table className="abastecimentos-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Mês</th>
              <th>Combustível</th>
              <th>Qtd (L)</th>
              <th>Posto/Tanque</th>
              <th>Caminhão</th>
              <th>Motorista</th>
              <th>Horímetro</th>
              <th>KM</th>
              <th>Ticket</th>
              <th>Valor</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {abastecimentos.map(abastecimento => (
              <tr key={abastecimento.id}>
                <td>{formatarData(abastecimento.data_abastecimento)}</td>
                <td>{abastecimento.mes}</td>
                <td>{abastecimento.combustivel}</td>
                <td>{abastecimento.quantidade_litros.toFixed(2)}</td>
                <td>{abastecimento.posto_tanque}</td>
                <td>{abastecimento.caminhao?.placa}</td>
                <td>{abastecimento.motorista?.nome}</td>
                <td>{abastecimento.horimetro}</td>
                <td>{abastecimento.km_rodado}</td>
                <td>{abastecimento.numero_ticket}</td>
                <td>{abastecimento.preco_total ? formatarMoeda(abastecimento.preco_total) : '-'}</td>
                <td>
                  <div className="actions">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEdit(abastecimento)}
                    >
                      Editar
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(abastecimento.id!)}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {abastecimentos.length === 0 && !loading && (
        <div className="empty-state">
          <p>Nenhum abastecimento encontrado.</p>
        </div>
      )}
    </div>
  );
};

export default ControleAbastecimento; 