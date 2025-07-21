import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building } from 'lucide-react';
import { fornecedorService, Fornecedor } from '../services/fornecedorService';
import './CadastroFornecedores.css';

const CadastroFornecedores: React.FC = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
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
      console.error('Erro ao carregar fornecedores:', err);
      alert('Erro ao carregar fornecedores. Verifique sua conexão.');
    } finally {
      setLoading(false);
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
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setFormData({
      nome: fornecedor.nome,
      tipo: fornecedor.tipo,
      cnpj: fornecedor.cnpj || '',
      endereco: fornecedor.endereco || '',
      telefone: fornecedor.telefone || '',
      status: fornecedor.status
    });
    setEditingId(fornecedor.id || null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fornecedorData = {
        nome: formData.nome,
        tipo: formData.tipo,
        cnpj: formData.cnpj || undefined,
        endereco: formData.endereco || undefined,
        telefone: formData.telefone || undefined,
        status: formData.status
      };

      if (editingId) {
        // Atualizar fornecedor existente
        const updatedFornecedor = await fornecedorService.update(editingId, fornecedorData);
        setFornecedores(fornecedores.map(f => f.id === editingId ? updatedFornecedor : f));
        alert('Fornecedor atualizado com sucesso!');
      } else {
        // Criar novo fornecedor
        const newFornecedor = await fornecedorService.create(fornecedorData as Omit<Fornecedor, 'id' | 'created_at' | 'updated_at'>);
        setFornecedores([newFornecedor, ...fornecedores]);
        alert('Fornecedor cadastrado com sucesso!');
      }
      
      resetForm();
    } catch (err) {
      console.error('Erro ao salvar fornecedor:', err);
      alert('Erro ao salvar fornecedor. Verifique os dados e tente novamente.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        await fornecedorService.delete(id);
        setFornecedores(fornecedores.filter(f => f.id !== id));
        alert('Fornecedor excluído com sucesso!');
      } catch (err) {
        console.error('Erro ao excluir fornecedor:', err);
        alert('Erro ao excluir fornecedor.');
      }
    }
  };

  const formatarCNPJ = (cnpj: string) => {
    if (!cnpj) return '';
    const numbers = cnpj.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatarTelefone = (telefone: string) => {
    if (!telefone) return '';
    const numbers = telefone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  };

  if (loading) {
    return (
      <div className="cadastro-fornecedores">
        <div className="page-header">
          <h1>Cadastro de Fornecedores</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Carregando fornecedores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-fornecedores">
      <div className="page-header">
        <h1>Cadastro de Fornecedores</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={20} />
          Novo Fornecedor
        </button>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h2>{editingId ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}</h2>
            <form onSubmit={handleSubmit}>
              {/* Dados do Fornecedor */}
              <div className="form-section">
                <h3><Building size={18} /> Dados do Fornecedor</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nome/Razão Social *</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      required
                      placeholder="Nome do posto ou empresa"
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
                <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Endereço</label>
                    <input
                      type="text"
                      value={formData.endereco}
                      onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                      placeholder="Endereço completo"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingId ? 'Atualizar Fornecedor' : 'Salvar Fornecedor'}
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
            {fornecedores.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  Nenhum fornecedor cadastrado
                </td>
              </tr>
            ) : (
              fornecedores.map((fornecedor) => (
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
                        title="Editar"
                        onClick={() => handleEdit(fornecedor)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-delete"
                        title="Excluir"
                        onClick={() => fornecedor.id && handleDelete(fornecedor.id)}
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

export default CadastroFornecedores; 