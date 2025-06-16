import React, { useState, useEffect } from 'react';
import { fornecedorService, Fornecedor } from '../services/fornecedorService';
import './CadastroFornecedores.css';

const CadastroFornecedores: React.FC = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);

  const [formData, setFormData] = useState<Partial<Fornecedor>>({
    nome: '',
    tipo: 'Posto',
    cnpj: '',
    endereco: '',
    telefone: '',
    status: 'Ativo'
  });

  useEffect(() => {
    loadFornecedores();
  }, []);

  const loadFornecedores = async () => {
    try {
      setLoading(true);
      const data = await fornecedorService.getAll();
      setFornecedores(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFornecedor) {
        await fornecedorService.update(editingFornecedor.id!, formData);
      } else {
        await fornecedorService.create(formData as Omit<Fornecedor, 'id' | 'created_at' | 'updated_at'>);
      }
      
      await loadFornecedores();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar fornecedor');
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setFormData({
      nome: fornecedor.nome,
      tipo: fornecedor.tipo,
      cnpj: fornecedor.cnpj,
      endereco: fornecedor.endereco,
      telefone: fornecedor.telefone,
      status: fornecedor.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        await fornecedorService.delete(id);
        await loadFornecedores();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao excluir fornecedor');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'Posto',
      cnpj: '',
      endereco: '',
      telefone: '',
      status: 'Ativo'
    });
    setEditingFornecedor(null);
    setShowForm(false);
  };

  const formatarCNPJ = (cnpj: string) => {
    const numbers = cnpj.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatarTelefone = (telefone: string) => {
    const numbers = telefone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  };

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="cadastro-fornecedores">
      <div className="header">
        <h1>Cadastro de Fornecedores</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          Novo Fornecedor
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Formulário */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
              <button className="btn-close" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="fornecedor-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nome/Razão Social *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                    placeholder="Nome do posto ou distribuidora"
                  />
                </div>

                <div className="form-group">
                  <label>Tipo *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    required
                  >
                    <option value="Posto">Posto de Combustível</option>
                    <option value="Distribuidora">Distribuidora</option>
                    <option value="Cooperativa">Cooperativa</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>CNPJ</label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 14) {
                        setFormData({...formData, cnpj: value});
                      }
                    }}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>

                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 11) {
                        setFormData({...formData, telefone: value});
                      }
                    }}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Endereço</label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    placeholder="Endereço completo"
                  />
                </div>

                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    required
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingFornecedor ? 'Atualizar' : 'Salvar'}
                </button>
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabela de Fornecedores */}
      <div className="table-container">
        <table className="fornecedores-table">
          <thead>
            <tr>
              <th>Nome/Razão Social</th>
              <th>Tipo</th>
              <th>CNPJ</th>
              <th>Telefone</th>
              <th>Endereço</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {fornecedores.map(fornecedor => (
              <tr key={fornecedor.id}>
                <td>{fornecedor.nome}</td>
                <td>{fornecedor.tipo}</td>
                <td>{fornecedor.cnpj ? formatarCNPJ(fornecedor.cnpj) : '-'}</td>
                <td>{fornecedor.telefone ? formatarTelefone(fornecedor.telefone) : '-'}</td>
                <td>{fornecedor.endereco || '-'}</td>
                <td>
                  <span className={`status ${fornecedor.status.toLowerCase()}`}>
                    {fornecedor.status}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEdit(fornecedor)}
                    >
                      Editar
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(fornecedor.id!)}
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

      {fornecedores.length === 0 && !loading && (
        <div className="empty-state">
          <p>Nenhum fornecedor cadastrado.</p>
        </div>
      )}
    </div>
  );
};

export default CadastroFornecedores; 