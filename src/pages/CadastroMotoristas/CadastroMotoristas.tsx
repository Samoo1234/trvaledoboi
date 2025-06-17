import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User } from 'lucide-react';
import { motoristaService, Motorista } from '../../services/motoristaService';
import './CadastroMotoristas.css';

const CadastroMotoristas: React.FC = () => {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    rg: '',
    cnh: '',
    categoria_cnh: 'B',
    vencimento_cnh: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    data_nascimento: '',
    tipo_motorista: 'Funcionário',
    status: 'Ativo',
    porcentagem_comissao: '',
    observacoes: ''
  });

  // Estados brasileiros
  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Carregar motoristas do Supabase
  useEffect(() => {
    loadMotoristas();
  }, []);

  const loadMotoristas = async () => {
    try {
      setLoading(true);
      const data = await motoristaService.getAll();
      setMotoristas(data);
    } catch (error) {
      console.error('Erro ao carregar motoristas:', error);
      alert('Erro ao carregar motoristas. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf: '',
      rg: '',
      cnh: '',
      categoria_cnh: 'B',
      vencimento_cnh: '',
      telefone: '',
      email: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
          data_nascimento: '',
    tipo_motorista: 'Funcionário',
    status: 'Ativo',
    porcentagem_comissao: '',
    observacoes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (motorista: Motorista) => {
    setFormData({
      nome: motorista.nome,
      cpf: motorista.cpf,
      rg: motorista.rg,
      cnh: motorista.cnh,
      categoria_cnh: motorista.categoria_cnh,
      vencimento_cnh: motorista.vencimento_cnh,
      telefone: motorista.telefone,
      email: motorista.email || '',
      endereco: motorista.endereco,
      cidade: motorista.cidade,
      estado: motorista.estado,
      cep: motorista.cep,
      data_nascimento: motorista.data_nascimento,
      tipo_motorista: motorista.tipo_motorista,
      status: motorista.status,
      porcentagem_comissao: motorista.porcentagem_comissao?.toString() || '',
      observacoes: motorista.observacoes || ''
    });
    setEditingId(motorista.id || null);
    setShowForm(true);
  };

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatCep = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validações
      if (formData.cpf.replace(/\D/g, '').length !== 11) {
        alert('CPF deve ter 11 dígitos');
        return;
      }

      if (formData.cep.replace(/\D/g, '').length !== 8) {
        alert('CEP deve ter 8 dígitos');
        return;
      }

      // Verificar se CPF já existe
      const cpfExists = await motoristaService.checkCpfExists(
        formData.cpf.replace(/\D/g, ''), 
        editingId || undefined
      );
      if (cpfExists) {
        alert('CPF já cadastrado para outro motorista');
        return;
      }

      // Verificar se CNH já existe
      const cnhExists = await motoristaService.checkCnhExists(
        formData.cnh, 
        editingId || undefined
      );
      if (cnhExists) {
        alert('CNH já cadastrada para outro motorista');
        return;
      }

      const motoristaData = {
        nome: formData.nome,
        cpf: formData.cpf.replace(/\D/g, ''),
        rg: formData.rg,
        cnh: formData.cnh,
        categoria_cnh: formData.categoria_cnh,
        vencimento_cnh: formData.vencimento_cnh,
        telefone: formData.telefone.replace(/\D/g, ''),
        email: formData.email || undefined,
        endereco: formData.endereco,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep.replace(/\D/g, ''),
        data_nascimento: formData.data_nascimento,
        tipo_motorista: formData.tipo_motorista,
        status: formData.status,
        porcentagem_comissao: formData.porcentagem_comissao ? parseFloat(formData.porcentagem_comissao) : undefined,
        observacoes: formData.observacoes || undefined
      };

      if (editingId) {
        // Atualizar motorista existente
        const updatedMotorista = await motoristaService.update(editingId, motoristaData);
        setMotoristas(motoristas.map(m => m.id === editingId ? updatedMotorista : m));
        alert('Motorista atualizado com sucesso!');
      } else {
        // Criar novo motorista
        const newMotorista = await motoristaService.create(motoristaData);
        setMotoristas([newMotorista, ...motoristas]);
        alert('Motorista cadastrado com sucesso!');
      }
      
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar motorista:', error);
      alert('Erro ao salvar motorista. Verifique os dados e tente novamente.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este motorista?')) {
      try {
        await motoristaService.delete(id);
        setMotoristas(motoristas.filter(m => m.id !== id));
        alert('Motorista excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir motorista:', error);
        alert('Erro ao excluir motorista.');
      }
    }
  };

  const formatCpfDisplay = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatTelefoneDisplay = (telefone: string) => {
    if (telefone.length === 11) {
      return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  };

  if (loading) {
    return (
      <div className="cadastro-motoristas">
        <div className="page-header">
          <h1>Cadastro de Motoristas</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Carregando motoristas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-motoristas">
      <div className="page-header">
        <h1>Cadastro de Motoristas</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={20} />
          Novo Motorista
        </button>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container large">
            <h2>{editingId ? 'Editar Motorista' : 'Cadastrar Novo Motorista'}</h2>
            <form onSubmit={handleSubmit}>
              {/* Dados Pessoais */}
              <div className="form-section">
                <h3><User size={18} /> Dados Pessoais</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nome Completo *</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      required
                      placeholder="Nome completo do motorista"
                    />
                  </div>
                  <div className="form-group">
                    <label>CPF *</label>
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => setFormData({...formData, cpf: formatCpf(e.target.value)})}
                      required
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>RG *</label>
                    <input
                      type="text"
                      value={formData.rg}
                      onChange={(e) => setFormData({...formData, rg: e.target.value})}
                      required
                      placeholder="Ex: 12.345.678-9"
                    />
                  </div>
                  <div className="form-group">
                    <label>Data de Nascimento *</label>
                    <input
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* CNH */}
              <div className="form-section">
                <h3>📄 Carteira de Habilitação</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Número da CNH *</label>
                    <input
                      type="text"
                      value={formData.cnh}
                      onChange={(e) => setFormData({...formData, cnh: e.target.value})}
                      required
                      placeholder="Ex: 12345678901"
                    />
                  </div>
                  <div className="form-group">
                    <label>Categoria *</label>
                    <select
                      value={formData.categoria_cnh}
                      onChange={(e) => setFormData({...formData, categoria_cnh: e.target.value})}
                      required
                    >
                      <option value="A">A - Motocicleta</option>
                      <option value="B">B - Carro</option>
                      <option value="C">C - Caminhão</option>
                      <option value="D">D - Ônibus</option>
                      <option value="E">E - Carreta</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Vencimento da CNH *</label>
                    <input
                      type="date"
                      value={formData.vencimento_cnh}
                      onChange={(e) => setFormData({...formData, vencimento_cnh: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="form-section">
                <h3>📞 Contato</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Telefone *</label>
                    <input
                      type="text"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: formatTelefone(e.target.value)})}
                      required
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="form-section">
                <h3>📍 Endereço</h3>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Endereço Completo *</label>
                    <input
                      type="text"
                      value={formData.endereco}
                      onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                      required
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Cidade *</label>
                    <input
                      type="text"
                      value={formData.cidade}
                      onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                      required
                      placeholder="Nome da cidade"
                    />
                  </div>
                  <div className="form-group">
                    <label>Estado *</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      required
                    >
                      <option value="">Selecione</option>
                      {estados.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>CEP *</label>
                    <input
                      type="text"
                      value={formData.cep}
                      onChange={(e) => setFormData({...formData, cep: formatCep(e.target.value)})}
                      required
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                </div>
              </div>

              {/* Configurações */}
              <div className="form-section">
                <h3>⚙️ Configurações</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo de Motorista *</label>
                    <select
                      value={formData.tipo_motorista}
                      onChange={(e) => setFormData({...formData, tipo_motorista: e.target.value})}
                      required
                    >
                      <option value="Funcionário">Funcionário</option>
                      <option value="Terceiro">Terceiro</option>
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
                      <option value="Suspenso">Suspenso</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>% Comissão Personalizada</label>
                    <input
                      type="number"
                      value={formData.porcentagem_comissao}
                      onChange={(e) => setFormData({...formData, porcentagem_comissao: e.target.value})}
                      placeholder={formData.tipo_motorista === 'Terceiro' ? 'Padrão: 90%' : 'Padrão: 10%'}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <small style={{ color: '#666', fontSize: '0.8rem' }}>
                      Deixe vazio para usar o padrão ({formData.tipo_motorista === 'Terceiro' ? '90%' : '10%'})
                    </small>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Observações</label>
                    <textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      placeholder="Observações adicionais sobre o motorista"
                      rows={3}
                    />
                  </div>
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

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>CNH</th>
              <th>Categoria</th>
              <th>Telefone</th>
              <th>Cidade/UF</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {motoristas.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                  Nenhum motorista cadastrado
                </td>
              </tr>
            ) : (
              motoristas.map((motorista) => (
                <tr key={motorista.id}>
                  <td>{motorista.nome}</td>
                  <td>{formatCpfDisplay(motorista.cpf)}</td>
                  <td>{motorista.cnh}</td>
                  <td>{motorista.categoria_cnh}</td>
                  <td>{formatTelefoneDisplay(motorista.telefone)}</td>
                  <td>{motorista.cidade}/{motorista.estado}</td>
                  <td>
                    <span className={`tipo ${motorista.tipo_motorista.toLowerCase()}`}>
                      {motorista.tipo_motorista}
                    </span>
                  </td>
                  <td>
                    <span className={`status ${motorista.status.toLowerCase()}`}>
                      {motorista.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button 
                        className="btn-edit" 
                        title="Editar"
                        onClick={() => handleEdit(motorista)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-delete" 
                        title="Excluir"
                        onClick={() => motorista.id && handleDelete(motorista.id)}
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

export default CadastroMotoristas; 