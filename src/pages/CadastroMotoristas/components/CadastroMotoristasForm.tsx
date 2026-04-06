import React from 'react';
import { User, X } from 'lucide-react';

interface FormData {
  nome: string;
  cpf: string;
  rg: string;
  cnh: string;
  categoria_cnh: string;
  vencimento_cnh: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  data_nascimento: string;
  tipo_motorista: string;
  status: string;
  porcentagem_comissao: string;
  observacoes: string;
}

interface CadastroMotoristasFormProps {
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  editingId: number | null;
  formData: FormData;
  setFormData: (data: FormData) => void;
  handleSubmit: (e: React.FormEvent) => void;
  resetForm: () => void;
  formatCpf: (value: string) => string;
  formatCep: (value: string) => string;
  formatTelefone: (value: string) => string;
  estados: string[];
}

const CadastroMotoristasForm: React.FC<CadastroMotoristasFormProps> = ({
  showForm,
  setShowForm,
  editingId,
  formData,
  setFormData,
  handleSubmit,
  resetForm,
  formatCpf,
  formatCep,
  formatTelefone,
  estados
}) => {
  if (!showForm) return null;

  return (
    <div className="form-modal">
      <div className="form-container large">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>{editingId ? 'Editar Motorista' : 'Cadastrar Novo Motorista'}</h2>
          <button 
            type="button" 
            onClick={resetForm}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d' }}
          >
            <X size={24} />
          </button>
        </div>
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
            <button type="button" className="btn-cancel" onClick={resetForm}>
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              {editingId ? 'Atualizar Motorista' : 'Salvar Motorista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastroMotoristasForm;
