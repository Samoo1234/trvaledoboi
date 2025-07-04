import React, { useState, useEffect } from 'react';
import { abastecimentoService, Abastecimento } from '../../services/abastecimentoService';
import { caminhaoService, Caminhao } from '../../services/caminhaoService';
import { motoristaService, Motorista } from '../../services/motoristaService';
import { formatDisplayDate } from '../../services/dateUtils';
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
    quantidade_litros: undefined,
    posto_tanque: '',
    caminhao_id: 0,
    motorista_id: 0,
    km_rodado: undefined,
    numero_ticket: '',
    preco_total: undefined,
    tanque_cheio: false
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
      km_rodado: abastecimento.km_rodado,
      numero_ticket: abastecimento.numero_ticket,
      preco_total: abastecimento.preco_total,
      tanque_cheio: abastecimento.tanque_cheio ?? false
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
      quantidade_litros: undefined,
      posto_tanque: '',
      caminhao_id: 0,
      motorista_id: 0,
      km_rodado: undefined,
      numero_ticket: '',
      preco_total: undefined,
      tanque_cheio: false
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

  const limparFiltros = async () => {
    setFiltros({
      dataInicio: '',
      dataFim: '',
      caminhaoId: '',
      motoristaId: '',
      combustivel: ''
    });
    // Recarrega todos os dados (média geral)
    await loadData();
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

  // Calcular estatísticas
  const totalLitros = abastecimentos.reduce((sum, item) => sum + item.quantidade_litros, 0);
  const totalValor = abastecimentos.reduce((sum, item) => sum + (item.preco_total || 0), 0);
  const mediaPreco = totalLitros > 0 ? totalValor / totalLitros : 0;

  // Determinar se está aplicando filtro de período
  const temFiltroPeriodo = filtros.dataInicio && filtros.dataFim;
  
  // Calcular médias de consumo por caminhão (descartando o primeiro tanque cheio)
  // Usa os dados filtrados quando há filtro de período, senão usa todos os dados
  const dadosParaCalculo = abastecimentos; // Já filtrados pela função aplicarFiltros
  
  const mediasPorCaminhao = caminhoes.map(caminhao => {
    // Filtra abastecimentos tanque cheio e ordena por KM
    const abastecimentosCaminhao = dadosParaCalculo
      .filter(a => a.caminhao_id === caminhao.id && a.tanque_cheio && a.km_rodado && a.km_rodado > 0)
      .sort((a, b) => (a.km_rodado || 0) - (b.km_rodado || 0));
    
    if (abastecimentosCaminhao.length < 2) {
      return {
        placa: caminhao.placa,
        modelo: caminhao.modelo,
        totalLitros: 0,
        totalKm: 0,
        media: 0
      };
    }
    
    const kmInicial = abastecimentosCaminhao[0].km_rodado || 0;
    const kmFinal = abastecimentosCaminhao[abastecimentosCaminhao.length - 1].km_rodado || 0;
    // Soma só os litros dos abastecimentos exceto o primeiro
    const totalLitros = abastecimentosCaminhao.slice(1).reduce((sum, a) => sum + a.quantidade_litros, 0);
    const totalKm = kmFinal - kmInicial;
    const media = totalLitros > 0 ? totalKm / totalLitros : 0;
    
    return {
      placa: caminhao.placa,
      modelo: caminhao.modelo,
      totalLitros,
      totalKm,
      media
    };
  }).filter(m => m.totalLitros > 0 && m.totalKm > 0);

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="controle-abastecimento">
      <div className="page-header">
        <h1>Controle de Abastecimento</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          Novo Abastecimento
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Estatísticas */}
      {temFiltroPeriodo && (
        <div style={{
          backgroundColor: '#fff3e0', 
          border: '1px solid #ffb74d', 
          borderRadius: '4px', 
          padding: '8px 12px', 
          margin: '10px 0',
          fontSize: '14px',
          color: '#e65100'
        }}>
          📊 Exibindo estatísticas do período: {new Date(filtros.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a {new Date(filtros.dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}
        </div>
      )}
      
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-info">
            <h3>{totalLitros.toLocaleString('pt-BR')} L</h3>
            <p>Total de Litros</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-info">
            <h3>{formatarMoeda(totalValor)}</h3>
            <p>Gasto Total</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-info">
            <h3>{formatarMoeda(mediaPreco)}</h3>
            <p>Preço Médio/Litro</p>
          </div>
        </div>
      </div>

      {/* Médias de Consumo por Caminhão */}
      {mediasPorCaminhao.length > 0 && (
        <div className="table-container" style={{marginBottom: 30, marginTop: 0}}>
          <div style={{margin: '16px', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <h3 style={{color: '#8B0000', margin: 0}}>Média de Consumo por Caminhão (km/litro)</h3>
            {temFiltroPeriodo && (
              <span style={{
                backgroundColor: '#e3f2fd', 
                color: '#1976d2', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                fontSize: '12px', 
                fontWeight: 'bold'
              }}>
                Período: {new Date(filtros.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a {new Date(filtros.dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Modelo</th>
                <th>Total Litros</th>
                <th>Total KM</th>
                <th>Média (km/litro)</th>
              </tr>
            </thead>
            <tbody>
              {mediasPorCaminhao.map((item, idx) => (
                <tr key={item.placa + idx}>
                  <td>{item.placa}</td>
                  <td>{item.modelo}</td>
                  <td>{item.totalLitros.toLocaleString('pt-BR', {maximumFractionDigits: 2})}</td>
                  <td>{item.totalKm.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</td>
                  <td>{item.media > 0 ? item.media.toLocaleString('pt-BR', {maximumFractionDigits: 2}) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
                    value={formData.quantidade_litros || ''}
                    onChange={(e) => setFormData({...formData, quantidade_litros: e.target.value ? parseFloat(e.target.value) : undefined})}
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
                  <label>KM</label>
                  <input
                    type="number"
                    value={formData.km_rodado || ''}
                    onChange={(e) => setFormData({...formData, km_rodado: e.target.value ? parseInt(e.target.value) : undefined})}
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
                    value={formData.preco_total || ''}
                    onChange={(e) => setFormData({...formData, preco_total: e.target.value ? parseFloat(e.target.value) : undefined})}
                  />
                </div>

                <div className="form-group">
                  <label>Tanque cheio?</label>
                  <input
                    type="checkbox"
                    checked={!!formData.tanque_cheio}
                    onChange={e => setFormData({...formData, tanque_cheio: e.target.checked})}
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
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Mês</th>
              <th>Combustível</th>
              <th>Qtd (L)</th>
              <th>Posto/Tanque</th>
              <th>Caminhão</th>
              <th>Motorista</th>
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