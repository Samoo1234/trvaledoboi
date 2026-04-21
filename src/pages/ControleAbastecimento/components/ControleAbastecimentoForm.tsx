import React from 'react';
import { Abastecimento } from '../../../services/abastecimentoService';
import { Caminhao } from '../../../services/caminhaoService';
import { Motorista } from '../../../services/motoristaService';

interface ControleAbastecimentoFormProps {
  showForm: boolean;
  editingAbastecimento: Abastecimento | null;
  formData: Partial<Abastecimento>;
  caminhoes: Caminhao[];
  motoristas: Motorista[];
  setFormData: React.Dispatch<React.SetStateAction<Partial<Abastecimento>>>;
  handleDataChange: (data: string) => void;
  handleQuantidadeChange: (quantidade: number | undefined) => void;
  handlePrecoPorLitroChange: (preco: number | undefined) => void;
  handleSubmit: (e: React.FormEvent) => void;
  resetForm: () => void;
}

export const ControleAbastecimentoForm: React.FC<ControleAbastecimentoFormProps> = ({
  showForm,
  editingAbastecimento,
  formData,
  caminhoes,
  motoristas,
  setFormData,
  handleDataChange,
  handleQuantidadeChange,
  handlePrecoPorLitroChange,
  handleSubmit,
  resetForm
}) => {
  if (!showForm) return null;

  return (
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
                value={formData.data_abastecimento || ''}
                onChange={(e) => handleDataChange(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Mês (auto-preenchido)</label>
              <input
                type="text"
                value={formData.mes || ''}
                onChange={(e) => setFormData({...formData, mes: e.target.value})}
                placeholder="Ex: Janeiro/2024"
                style={{ backgroundColor: '#f0f9ff' }}
              />
            </div>

            <div className="form-group">
              <label>Combustível *</label>
              <select
                value={formData.combustivel || 'Diesel'}
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
                onChange={(e) => handleQuantidadeChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                required
                placeholder="Ex: 100"
              />
            </div>

            <div className="form-group">
              <label>Posto/Tanque</label>
              <input
                type="text"
                value={formData.posto_tanque || ''}
                onChange={(e) => setFormData({...formData, posto_tanque: e.target.value})}
                placeholder="Nome do posto ou tanque"
              />
            </div>

            <div className="form-group">
              <label>Caminhão *</label>
              <select
                value={formData.caminhao_id || ''}
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
                value={formData.motorista_id || ''}
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
              <label>Preço por Litro (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.preco_por_litro || ''}
                onChange={(e) => handlePrecoPorLitroChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                required
                placeholder="Ex: 6.50"
              />
            </div>

            <div className="form-group">
              <label>Preço Total (calculado)</label>
              <input
                type="text"
                value={formData.preco_total ? `R$ ${formData.preco_total.toFixed(2)}` : 'R$ 0,00'}
                readOnly
                style={{ backgroundColor: '#f0f9ff', fontWeight: 'bold', color: '#0369a1' }}
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
            <button type="button" className="btn-cancel" onClick={resetForm}>
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              {editingAbastecimento ? 'Atualizar Abastecimento' : 'Salvar Abastecimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
