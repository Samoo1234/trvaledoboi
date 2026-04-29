import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Truck, Trash2, User } from 'lucide-react';
import CurrencyInput from 'react-currency-input-field';
import { Caminhao } from '../../../services/caminhaoService';
import { Motorista } from '../../../services/motoristaService';
import { Reboque } from '../../../services/reboqueService';
import { supabase } from '../../../services/supabaseClient';
import { Cliente } from '../../../types/cliente';

type CaminhaoSelecionado = {
  caminhao_id: string;
  reboque_id?: string;
  valor_frete?: string;
};

type MotoristaSelecionado = {
  motorista_id: string;
  caminhao_id: string;
};

interface ControleFreteFormProps {
  editingId: number | null;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  caminhoesSelecionados: CaminhaoSelecionado[];
  setCaminhoesSelecionados: React.Dispatch<React.SetStateAction<CaminhaoSelecionado[]>>;
  motoristasSelecionados: MotoristaSelecionado[];
  setMotoristasSelecionados: React.Dispatch<React.SetStateAction<MotoristaSelecionado[]>>;
  caminhoes: Caminhao[];
  motoristas: Motorista[];
  reboques: Reboque[];
  handleValorFreteChange: (val: string | undefined) => void;
  handleSubmit: (e: React.FormEvent) => void;
  resetForm: () => void;
}

export const ControleFreteForm: React.FC<ControleFreteFormProps> = ({
  editingId,
  formData,
  setFormData,
  caminhoesSelecionados,
  setCaminhoesSelecionados,
  motoristasSelecionados,
  setMotoristasSelecionados,
  caminhoes,
  motoristas,
  reboques,
  handleValorFreteChange,
  handleSubmit,
  resetForm
}) => {
  const [clientesDisponiveis, setClientesDisponiveis] = useState<Cliente[]>([]);
  const [clienteSearch, setClienteSearch] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('id, razao_social, cpf_cnpj, municipio, uf')
          .eq('situacao', 'Ativo')
          .order('razao_social');
        
        if (error) throw error;
        
        if (data) {
          setClientesDisponiveis(data as Cliente[]);
        }
      } catch (error) {
        console.error('Erro ao buscar clientes para autocomplete:', error);
      }
    };

    fetchClientes();
  }, []);

  // Atualizar o campo de busca quando formData.cliente muda (ex: ao editar)
  useEffect(() => {
    if (formData.cliente_id) {
      const clienteEncontrado = clientesDisponiveis.find(c => c.id === formData.cliente_id);
      if (clienteEncontrado) {
        setClienteSearch(clienteEncontrado.razao_social);
      }
    } else if (formData.cliente) {
      setClienteSearch(formData.cliente);
    } else {
      setClienteSearch('');
    }
  }, [formData.cliente_id, formData.cliente, clientesDisponiveis]);

  const clientesFiltrados = clientesDisponiveis.filter(c =>
    c.razao_social.toLowerCase().includes(clienteSearch.toLowerCase()) ||
    (c.municipio && c.municipio.toLowerCase().includes(clienteSearch.toLowerCase())) ||
    (c.cpf_cnpj && c.cpf_cnpj.includes(clienteSearch))
  );

  return (
    <div className="form-modal">
      <div className="form-modal-content">
        <h2>
          <FileText size={20} />
          {editingId ? 'Editar Frete' : 'Novo Frete'}
        </h2>

        <datalist id="clientes-list">
          {clientesDisponiveis.map((c, i) => (
            <option key={i} value={c.razao_social} />
          ))}
        </datalist>

        <form onSubmit={handleSubmit}>
          {/* Dados Básicos */}
          <div className="form-section">
            <h3><Calendar size={18} /> Dados do Frete</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Data de Emissão *</label>
                <input
                  type="date"
                  value={formData.data_emissao}
                  onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Pecuarista *</label>
                <input
                  type="text"
                  value={formData.pecuarista}
                  onChange={(e) => setFormData({ ...formData, pecuarista: e.target.value })}
                  required
                  placeholder="Nome do pecuarista"
                />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Cliente</label>
                <input
                  type="text"
                  value={clienteSearch}
                  onChange={(e) => {
                    setClienteSearch(e.target.value);
                    setShowClienteDropdown(true);
                    // Se o texto mudar, limpar o vínculo por ID
                    if (formData.cliente_id) {
                      setFormData({ ...formData, cliente_id: null, cliente: e.target.value });
                    } else {
                      setFormData({ ...formData, cliente: e.target.value });
                    }
                  }}
                  onFocus={() => setShowClienteDropdown(true)}
                  onBlur={() => setTimeout(() => setShowClienteDropdown(false), 200)}
                  placeholder="🔍 Buscar cliente..."
                  autoComplete="off"
                />
                {showClienteDropdown && clienteSearch && clientesFiltrados.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '0 0 6px 6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1000
                  }}>
                    {clientesFiltrados.map(c => (
                      <div
                        key={c.id}
                        onMouseDown={() => {
                          setFormData({
                            ...formData,
                            cliente_id: c.id!,
                            cliente: c.razao_social
                          });
                          setClienteSearch(c.razao_social);
                          setShowClienteDropdown(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.9rem',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f7ff')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                      >
                        <div style={{ fontWeight: 500 }}>{c.razao_social}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>
                          {c.municipio && c.uf ? `${c.municipio}/${c.uf}` : ''}
                          {c.cpf_cnpj ? ` • ${c.cpf_cnpj}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Origem *</label>
                <input
                  type="text"
                  value={formData.origem}
                  onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                  required
                  placeholder="Local de origem"
                />
              </div>
              <div className="form-group">
                <label>Destino *</label>
                <input
                  type="text"
                  value={formData.destino}
                  onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                  required
                  placeholder="Local de destino"
                />
              </div>
              <div className="form-group">
                <label>Total KM</label>
                <input
                  type="number"
                  value={formData.total_km}
                  onChange={(e) => setFormData({ ...formData, total_km: e.target.value })}
                  placeholder="Quilometragem total"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Nº Minuta</label>
                <input
                  type="text"
                  value={formData.numero_minuta}
                  onChange={(e) => setFormData({ ...formData, numero_minuta: e.target.value })}
                  placeholder="Número da Minuta"
                />
              </div>
              <div className="form-group">
                <label>Nº CB</label>
                <input
                  type="text"
                  value={formData.numero_cb}
                  onChange={(e) => setFormData({ ...formData, numero_cb: e.target.value })}
                  placeholder="Número do CB"
                />
              </div>
              <div className="form-group">
                <label>Faixa</label>
                <input
                  type="text"
                  value={formData.faixa}
                  onChange={(e) => setFormData({ ...formData, faixa: e.target.value })}
                  placeholder="Faixa do frete"
                />
              </div>
            </div>
          </div>

          {/* Veículos e Motoristas */}
          <div className="form-section vehicles-motorists-section">
            <h3><Truck size={18} /> Veículos e Motoristas</h3>
            <div className="dynamic-fields-container">
              <div className="dynamic-field-group">
                <h4>🚛 Caminhões *</h4>
                {caminhoesSelecionados.map((item, idx) => (
                  <div key={idx} className="caminhao-card">
                    <button
                      type="button"
                      onClick={() => setCaminhoesSelecionados(caminhoesSelecionados.filter((_, i) => i !== idx))}
                      className="btn-remove-small"
                      title="Remover caminhão"
                      style={{ padding: 4, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={18} />
                    </button>
                    <select
                      value={item.caminhao_id}
                      onChange={e => {
                        const novos = [...caminhoesSelecionados];
                        novos[idx] = { ...novos[idx], caminhao_id: e.target.value };
                        setCaminhoesSelecionados(novos);
                      }}
                      required
                      style={{ marginBottom: 8 }}
                    >
                      <option value="">Selecione o caminhão</option>
                      {caminhoes.map(caminhao => (
                        <option key={caminhao.id} value={caminhao.id}>
                          {caminhao.placa} - {caminhao.tipo} ({caminhao.modelo})
                        </option>
                      ))}
                    </select>

                    {(() => {
                      const caminhao = caminhoes.find(c => c.id === parseInt(item.caminhao_id));
                      if (caminhao?.tipo === 'Truck') {
                        return (
                          <div style={{ marginBottom: 4 }}>
                            <label style={{ fontWeight: 500, fontSize: '0.95rem', marginBottom: 8, display: 'block' }}>Configuração:</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                                <input
                                  type="radio"
                                  name={`config-${idx}`}
                                  checked={!item.reboque_id}
                                  onChange={() => {
                                    const novos = [...caminhoesSelecionados];
                                    novos[idx].reboque_id = undefined;
                                    setCaminhoesSelecionados(novos);
                                  }}
                                />
                                Usar como Truck (padrão)
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                                <input
                                  type="radio"
                                  name={`config-${idx}`}
                                  checked={!!item.reboque_id}
                                  onChange={() => {
                                    const novos = [...caminhoesSelecionados];
                                    novos[idx].reboque_id = '';
                                    setCaminhoesSelecionados(novos);
                                  }}
                                />
                                Usar com reboque
                              </label>
                            </div>
                            {item.reboque_id !== undefined && (
                              <div style={{ marginTop: 8 }}>
                                <label style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: 4, display: 'block' }}>Reboque:</label>
                                <select
                                  value={item.reboque_id || ''}
                                  onChange={e => {
                                    const novos = [...caminhoesSelecionados];
                                    novos[idx].reboque_id = e.target.value;
                                    setCaminhoesSelecionados(novos);
                                  }}
                                  required
                                >
                                  <option value="">Selecione o reboque</option>
                                  {reboques.map(reb => (
                                    <option key={reb.id} value={reb.id}>
                                      {reb.placa} - {reb.conjunto}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      } else if (caminhao?.tipo === 'Cavalo Mecânico') {
                        return (
                          <div style={{ marginBottom: 4 }}>
                            <label style={{ fontWeight: 500, fontSize: '0.95rem', marginBottom: 2, display: 'block' }}>Reboque *</label>
                            <select
                              value={item.reboque_id || ''}
                              onChange={e => {
                                const novos = [...caminhoesSelecionados];
                                novos[idx].reboque_id = e.target.value;
                                setCaminhoesSelecionados(novos);
                              }}
                              required
                            >
                              <option value="">Selecione o reboque</option>
                              {reboques.map(reb => (
                                <option key={reb.id} value={reb.id}>
                                  {reb.placa} - {reb.conjunto}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div style={{ marginTop: 8 }}>
                      <label style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: 4, display: 'block' }}>Valor do Frete (R$):</label>
                      <CurrencyInput
                        intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                        decimalsLimit={2}
                        value={item.valor_frete || ''}
                        onValueChange={(value) => {
                          const novos = [...caminhoesSelecionados];
                          novos[idx].valor_frete = value || '';
                          setCaminhoesSelecionados(novos);
                          const total = novos.reduce((sum, cam) => sum + parseFloat(cam.valor_frete || '0'), 0);
                          setFormData((prev: any) => ({
                            ...prev,
                            valor_frete: total.toString()
                          }));
                        }}
                        placeholder="0,00"
                        allowNegativeValue={false}
                        className="form-control"
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                    </div>
                  </div>
                ))}
                <div className="add-button-container">
                  <button
                    type="button"
                    className="btn-add-small"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => setCaminhoesSelecionados([...caminhoesSelecionados, { caminhao_id: '' }])}
                  >
                    <Truck size={16} /> + Adicionar caminhão
                  </button>
                </div>
              </div>

              <div className="dynamic-field-group">
                <h4>👨‍💼 Motoristas *</h4>
                {motoristasSelecionados.map((motorista, idx) => (
                  <div key={idx} className="motorista-card">
                    <button
                      type="button"
                      onClick={() => setMotoristasSelecionados(motoristasSelecionados.filter((_, i) => i !== idx))}
                      className="btn-remove-small"
                      title="Remover motorista"
                      style={{ padding: 4, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={18} />
                    </button>
                    <select
                      value={motorista.motorista_id}
                      onChange={e => {
                        const novos = [...motoristasSelecionados];
                        novos[idx] = { ...novos[idx], motorista_id: e.target.value };
                        setMotoristasSelecionados(novos);
                      }}
                      required
                      style={{ marginBottom: 8 }}
                    >
                      <option value="">Selecione o motorista</option>
                      {motoristas.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.nome} - {m.tipo_motorista}
                        </option>
                      ))}
                    </select>
                    <select
                      value={motorista.caminhao_id}
                      onChange={e => {
                        const novos = [...motoristasSelecionados];
                        novos[idx] = { ...novos[idx], caminhao_id: e.target.value };
                        setMotoristasSelecionados(novos);
                      }}
                      required
                      style={{ marginBottom: 8 }}
                    >
                      <option value="">Selecione o caminhão</option>
                      {caminhoesSelecionados.map(caminhao => (
                        <option key={caminhao.caminhao_id} value={caminhao.caminhao_id}>
                          {caminhoes.find(c => c.id === parseInt(caminhao.caminhao_id))?.placa || `Caminhão ${caminhao.caminhao_id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                <div className="add-button-container">
                  <button
                    type="button"
                    className="btn-add-small"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => setMotoristasSelecionados([...motoristasSelecionados, { motorista_id: '', caminhao_id: '' }])}
                  >
                    <User size={16} /> + Adicionar motorista
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="form-section values-section">
            <h3>💰 Valores</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Valor Total do Frete (R$) *</label>
                <CurrencyInput
                  intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                  decimalsLimit={2}
                  value={formData.valor_frete}
                  onValueChange={handleValorFreteChange}
                  placeholder="0,00"
                  allowNegativeValue={false}
                  className="form-control"
                  readOnly
                />
                <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  Total calculado automaticamente dos valores individuais dos caminhões
                </small>
              </div>
              <div className="form-group">
                <label>Situação *</label>
                <select
                  value={formData.situacao}
                  onChange={(e) => setFormData({ ...formData, situacao: e.target.value })}
                  required
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Frigorífico">Frigorífico</option>
                  <option value="Pago">Pago</option>
                </select>
              </div>
              {formData.situacao === 'Pago' && (
                <>
                  <div className="form-group">
                    <label>Tipo de Pagamento *</label>
                    <select
                      value={formData.tipo_pagamento}
                      onChange={(e) => setFormData({ ...formData, tipo_pagamento: e.target.value })}
                      required
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="PIX">PIX</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cheque">Cheque</option>
                      <option value="TED">TED</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Data do Pagamento *</label>
                    <input
                      type="date"
                      value={formData.data_pagamento}
                      onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="form-section observations-section">
            <h3>📝 Observações</h3>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais sobre o frete"
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
              {editingId ? 'Atualizar Frete' : 'Salvar Frete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
