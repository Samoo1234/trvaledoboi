import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, UserCheck, Eye, EyeOff } from 'lucide-react';
import { authService, Usuario, CreateUserData } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import './GerenciarUsuarios.css';

const GerenciarUsuarios: React.FC = () => {
  const { isAdmin } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo_usuario: 'Operador' as 'Admin' | 'Operador',
    status: 'Ativo' as 'Ativo' | 'Inativo'
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (isAdmin) {
      loadUsuarios();
    }
  }, [isAdmin]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await authService.getUsers();
      setUsuarios(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      alert('Erro ao carregar usuários. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      tipo_usuario: 'Operador',
      status: 'Ativo'
    });
    setErrors({});
    setEditingId(null);
    setShowForm(false);
    setShowPassword(false);
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Senha obrigatória apenas para novos usuários
    if (!editingId && !formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha && formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = (usuario: Usuario) => {
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      senha: '', // Não preencher senha para edição
      tipo_usuario: usuario.tipo_usuario,
      status: usuario.status
    });
    setEditingId(usuario.id || null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingId) {
        // Atualizar usuário existente
        const updateData: Partial<Usuario> = {
          nome: formData.nome,
          email: formData.email,
          tipo_usuario: formData.tipo_usuario,
          status: formData.status
        };

        await authService.updateUser(editingId, updateData);
        
        // Se trocou a senha, atualizar separadamente
        if (formData.senha) {
          await authService.changePassword(editingId, formData.senha);
        }
        
        alert('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário
        const userData: CreateUserData = {
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          tipo_usuario: formData.tipo_usuario,
          status: formData.status
        };

        await authService.createUser(userData);
        alert('Usuário criado com sucesso!');
      }

      await loadUsuarios();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar usuário');
    }
  };

  const handleDeactivate = async (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja inativar o usuário "${nome}"?`)) {
      try {
        await authService.deactivateUser(id);
        alert('Usuário inativado com sucesso!');
        await loadUsuarios();
      } catch (error) {
        console.error('Erro ao inativar usuário:', error);
        alert('Erro ao inativar usuário.');
      }
    }
  };

  const handleActivate = async (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja reativar o usuário "${nome}"?`)) {
      try {
        await authService.updateUser(id, { status: 'Ativo' });
        alert('Usuário reativado com sucesso!');
        await loadUsuarios();
      } catch (error) {
        console.error('Erro ao reativar usuário:', error);
        alert('Erro ao reativar usuário.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verificar se usuário tem permissão
  if (!isAdmin) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        backgroundColor: '#fff5f5',
        border: '1px solid #feb2b2',
        borderRadius: '8px',
        margin: '2rem',
        color: '#c53030'
      }}>
        <h2>Acesso Negado</h2>
        <p>Apenas administradores podem gerenciar usuários.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="gerenciar-usuarios">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gerenciar-usuarios">
      <div className="page-header">
        <h1>
          <Users size={24} />
          Gerenciar Usuários
        </h1>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={20} />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Formulário de usuário */}
      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h2>
              {editingId ? <Edit size={20} /> : <Plus size={20} />}
              {editingId ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nome Completo *</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      className={errors.nome ? 'error' : ''}
                      placeholder="Digite o nome completo"
                    />
                    {errors.nome && <div className="error-message">{errors.nome}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={errors.email ? 'error' : ''}
                      placeholder="email@exemplo.com"
                    />
                    {errors.email && <div className="error-message">{errors.email}</div>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      {editingId ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.senha}
                        onChange={(e) => setFormData({...formData, senha: e.target.value})}
                        className={errors.senha ? 'error' : ''}
                        placeholder={editingId ? 'Nova senha' : 'Digite a senha'}
                        style={{ paddingRight: '3rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '1rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#666'
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.senha && <div className="error-message">{errors.senha}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label>Tipo de Usuário *</label>
                    <select
                      value={formData.tipo_usuario}
                      onChange={(e) => setFormData({...formData, tipo_usuario: e.target.value as 'Admin' | 'Operador'})}
                    >
                      <option value="Operador">Operador</option>
                      <option value="Admin">Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'Ativo' | 'Inativo'})}
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Atualizar' : 'Criar'} Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de usuários */}
      {usuarios.length === 0 ? (
        <div className="empty-state">
          <h3>Nenhum usuário encontrado</h3>
          <p>Clique em "Novo Usuário" para cadastrar o primeiro usuário.</p>
        </div>
      ) : (
        <div className="usuarios-grid">
          {usuarios.map((usuario) => (
            <div key={usuario.id} className="usuario-card">
              <div className="usuario-header">
                <div className="usuario-info">
                  <h3>{usuario.nome}</h3>
                  <p className="usuario-email">{usuario.email}</p>
                </div>
                <div className="usuario-badges">
                  <span className={`badge badge-${usuario.tipo_usuario.toLowerCase()}`}>
                    {usuario.tipo_usuario}
                  </span>
                  <span className={`badge badge-${usuario.status.toLowerCase()}`}>
                    {usuario.status}
                  </span>
                </div>
              </div>
              
              <div className="usuario-meta">
                <div className="usuario-data">
                  Criado em {formatDate(usuario.created_at!)}
                </div>
                <div className="usuario-actions">
                  <button
                    className="btn-icon btn-edit"
                    title="Editar usuário"
                    onClick={() => handleEdit(usuario)}
                  >
                    <Edit size={16} />
                  </button>
                  
                  {usuario.status === 'Ativo' ? (
                    <button
                      className="btn-icon btn-delete"
                      title="Inativar usuário"
                      onClick={() => usuario.id && handleDeactivate(usuario.id, usuario.nome)}
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <button
                      className="btn-icon btn-activate"
                      title="Reativar usuário"
                      onClick={() => usuario.id && handleActivate(usuario.id, usuario.nome)}
                    >
                      <UserCheck size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GerenciarUsuarios; 