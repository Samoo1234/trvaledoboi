import React from 'react';
import { Caminhao } from '../../../services/caminhaoService';
import { ManutencaoCreateData } from '../../../services/manutencaoService';
import { Wrench, X } from 'lucide-react';

interface ManutencaoCaminhoesFormProps {
  showForm: boolean;
  editingId: number | null;
  formData: ManutencaoCreateData;
  setFormData: React.Dispatch<React.SetStateAction<ManutencaoCreateData>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  caminhoes: Caminhao[];
}

export const ManutencaoCaminhoesForm: React.FC<ManutencaoCaminhoesFormProps> = ({
  showForm,
  editingId,
  formData,
  setFormData,
  handleSubmit,
  resetForm,
  caminhoes
}) => {
  if (!showForm) return null;

  return (
    <div 
      className="manutencao-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) resetForm();
      }}
    >
      <div className="manutencao-modal-content">
        <div className="manutencao-modal-header">
          <h3>
            <Wrench size={20} />
            {editingId ? 'Editar Manutenção' : 'Nova Manutenção'}
          </h3>
          <button type="button" className="manutencao-modal-close" onClick={resetForm} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="manutencao-modal-form">
          <div className="manutencao-form-grid">
            <div className="manutencao-form-group">
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

            <div className="manutencao-form-group">
              <label>Data da Manutenção *</label>
              <input
                type="date"
                value={formData.data_manutencao}
                onChange={(e) => setFormData({...formData, data_manutencao: e.target.value})}
                required
              />
            </div>

            <div className="manutencao-form-group">
              <label>Tipo de Manutenção *</label>
              <select
                value={formData.tipo_manutencao}
                onChange={(e) => setFormData({...formData, tipo_manutencao: e.target.value as 'Preventiva' | 'Corretiva' | 'Emergencial'})}
                required
              >
                <option value="Preventiva">Preventiva</option>
                <option value="Corretiva">Corretiva</option>
                <option value="Emergencial">Emergencial</option>
              </select>
            </div>

            <div className="manutencao-form-group">
              <label>Valor do Serviço *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_servico || ''}
                onChange={(e) => setFormData({...formData, valor_servico: parseFloat(e.target.value) || 0})}
                required
              />
            </div>

            <div className="manutencao-form-group manutencao-form-group-full">
              <label>Descrição do Serviço *</label>
              <textarea
                value={formData.descricao_servico}
                onChange={(e) => setFormData({...formData, descricao_servico: e.target.value})}
                placeholder="Descreva o serviço realizado..."
                required
              />
            </div>

            <div className="manutencao-form-group">
              <label>Oficina/Responsável</label>
              <input
                type="text"
                value={formData.oficina_responsavel}
                onChange={(e) => setFormData({...formData, oficina_responsavel: e.target.value})}
                placeholder="Nome da oficina ou responsável"
              />
            </div>

            <div className="manutencao-form-group">
              <label>KM do Caminhão</label>
              <input
                type="number"
                min="0"
                value={formData.km_caminhao || ''}
                onChange={(e) => setFormData({...formData, km_caminhao: e.target.value ? parseInt(e.target.value) : undefined})}
                placeholder="Quilometragem atual"
              />
            </div>

            <div className="manutencao-form-group manutencao-form-group-full">
              <label>Observações</label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Observações adicionais..."
              />
            </div>
          </div>

          <div className="manutencao-form-actions">
            <button type="button" className="btn-cancel" onClick={resetForm}>
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              {editingId ? 'Atualizar Manutenção' : 'Cadastrar Manutenção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
