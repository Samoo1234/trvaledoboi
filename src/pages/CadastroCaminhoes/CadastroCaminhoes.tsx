import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { caminhaoService, Caminhao } from '../../services/caminhaoService';
import './CadastroCaminhoes.css';

const CadastroCaminhoes: React.FC = () => {
  const [caminhoes, setCaminhoes] = useState<Caminhao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    tipo: 'Toco',
    ano: '',
    cor: '',
    combustivel: 'Diesel',
    status: 'Ativo'
  });

  // Carregar caminhões do Supabase
  useEffect(() => {
    loadCaminhoes();
  }, []);

  const loadCaminhoes = async () => {
    try {
      setLoading(true);
      const data = await caminhaoService.getAll();
      setCaminhoes(data);
    } catch (error) {
      console.error('Erro ao carregar caminhões:', error);
      alert('Erro ao carregar caminhões. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      placa: '', 
      modelo: '', 
      tipo: 'Toco', 
      ano: '', 
      cor: '', 
      combustivel: 'Diesel', 
      status: 'Ativo' 
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = async (caminhao: Caminhao) => {
    setFormData({
      placa: caminhao.placa,
      modelo: caminhao.modelo,
      tipo: caminhao.tipo,
      ano: caminhao.ano.toString(),
      cor: caminhao.cor,
      combustivel: caminhao.combustivel,
      status: caminhao.status
    });
    setEditingId(typeof caminhao.id === 'number' ? caminhao.id : null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Atualizar caminhão existente
        const updatedCaminhao = await caminhaoService.update(editingId, {
          placa: formData.placa,
          modelo: formData.modelo,
          tipo: formData.tipo,
          ano: parseInt(formData.ano),
          cor: formData.cor,
          combustivel: formData.combustivel,
          status: formData.status
        });
        setCaminhoes(caminhoes.map(c => c.id === editingId ? updatedCaminhao : c));
        alert('Caminhão atualizado com sucesso!');
      } else {
        // Criar novo caminhão
        const newCaminhao = await caminhaoService.create({
          placa: formData.placa,
          modelo: formData.modelo,
          tipo: formData.tipo,
          ano: parseInt(formData.ano),
          cor: formData.cor,
          combustivel: formData.combustivel,
          status: formData.status
        });
        setCaminhoes([newCaminhao, ...caminhoes]);
        alert('Caminhão cadastrado com sucesso!');
      }
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar caminhão:', error);
      alert('Erro ao salvar caminhão. Verifique os dados e tente novamente.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este caminhão?')) {
      try {
        await caminhaoService.delete(id);
        setCaminhoes(caminhoes.filter(c => c.id !== id));
        alert('Caminhão excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir caminhão:', error);
        alert('Erro ao excluir caminhão.');
      }
    }
  };

  if (loading) {
    return (
      <div className="cadastro-caminhoes">
        <div className="page-header">
          <h1>Cadastro de Caminhões</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Carregando caminhões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-caminhoes">
      <div className="page-header">
        <h1>Cadastro de Caminhões</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={20} />
          Novo Caminhão
        </button>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h2>{editingId ? 'Editar Caminhão' : 'Cadastrar Novo Caminhão'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Placa</label>
                  <input
                    type="text"
                    value={formData.placa}
                    onChange={(e) => setFormData({...formData, placa: e.target.value})}
                    required
                    placeholder="Ex: ABC-1234"
                  />
                </div>
                <div className="form-group">
                  <label>Modelo</label>
                  <input
                    type="text"
                    value={formData.modelo}
                    onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                    required
                    placeholder="Ex: Volvo FH"
                  />
                </div>
                <div className="form-group">
                  <label>Tipo de Caminhão</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    required
                  >
                    <option value="Toco">Toco</option>
                    <option value="Truck">Truck</option>
                    <option value="Carreta Baixa">Carreta Baixa</option>
                    <option value="Julieta">Julieta</option>
                    <option value="Carreta 2 Pisos">Carreta 2 Pisos</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ano</label>
                  <input
                    type="number"
                    value={formData.ano}
                    onChange={(e) => setFormData({...formData, ano: e.target.value})}
                    required
                    min="1990"
                    max="2030"
                  />
                </div>
                <div className="form-group">
                  <label>Cor</label>
                  <input
                    type="text"
                    value={formData.cor}
                    onChange={(e) => setFormData({...formData, cor: e.target.value})}
                    required
                    placeholder="Ex: Branco"
                  />
                </div>
                <div className="form-group">
                  <label>Combustível</label>
                  <select
                    value={formData.combustivel}
                    onChange={(e) => setFormData({...formData, combustivel: e.target.value})}
                    required
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Gasolina">Gasolina</option>
                    <option value="Etanol">Etanol</option>
                    <option value="GNV">GNV</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    required
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Manutenção">Manutenção</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingId ? 'Atualizar Caminhão' : 'Salvar Caminhão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Placa</th>
              <th>Modelo</th>
              <th>Tipo</th>
              <th>Ano</th>
              <th>Cor</th>
              <th>Combustível</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {caminhoes.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  Nenhum caminhão cadastrado
                </td>
              </tr>
            ) : (
              caminhoes.map((caminhao) => (
                <tr key={caminhao.id}>
                  <td>{caminhao.placa}</td>
                  <td>{caminhao.modelo}</td>
                  <td>{caminhao.tipo}</td>
                  <td>{caminhao.ano}</td>
                  <td>{caminhao.cor}</td>
                  <td>{caminhao.combustivel}</td>
                  <td>
                    <span className={`status ${caminhao.status.toLowerCase()}`}>
                      {caminhao.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button 
                        className="btn-edit" 
                        title="Editar"
                        onClick={() => handleEdit(caminhao)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-delete" 
                        title="Excluir"
                        onClick={() => caminhao.id && handleDelete(caminhao.id)}
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
    </div>
  );
};

export default CadastroCaminhoes; 