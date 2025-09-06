import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Cliente } from '../../types/cliente';
import { calcularDistanciaBarraGarcas, validarEnderecoParaDistancia } from '../../services/distanciaService';
import './ModalFazendas.css';

interface Fazenda {
  id?: number;
  cliente_id: number;
  nome_fazenda: string;
  logradouro?: string;
  numero?: string;
  cep?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  distancia_barra_garças?: number;
  observacoes?: string;
  created_at?: string;
}

interface ModalFazendasProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente;
}

const ModalFazendas: React.FC<ModalFazendasProps> = ({
  isOpen,
  onClose,
  cliente
}) => {
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [fazendaEditando, setFazendaEditando] = useState<Fazenda | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const [fazenda, setFazenda] = useState<Fazenda>({
    cliente_id: cliente.id || 0,
    nome_fazenda: '',
    logradouro: '',
    numero: '',
    cep: '',
    bairro: '',
    municipio: '',
    uf: '',
    distancia_barra_garças: 0,
    observacoes: ''
  });

  const carregarFazendas = useCallback(async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from('fazendas')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('nome_fazenda', { ascending: true });

      if (error) throw error;
      setFazendas(data || []);
    } catch (error) {
      console.error('Erro ao carregar fazendas:', error);
      setMensagem({
        tipo: 'erro',
        texto: 'Erro ao carregar fazendas'
      });
    } finally {
      setCarregando(false);
    }
  }, [cliente.id]);

  useEffect(() => {
    if (isOpen && cliente.id) {
      carregarFazendas();
    }
  }, [isOpen, cliente.id, carregarFazendas]);

  const calcularDistancia = async (endereco: { logradouro?: string; numero?: string; municipio?: string; uf?: string }) => {
    try {
      if (validarEnderecoParaDistancia(endereco)) {
        return await calcularDistanciaBarraGarcas(endereco);
      }
      return 0;
    } catch (error) {
      console.error('Erro ao calcular distância:', error);
      return 0;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFazenda(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    try {
      // Calcular distância se endereço estiver completo
      if (fazenda.municipio && fazenda.uf) {
        const distancia = await calcularDistancia(fazenda);
        fazenda.distancia_barra_garças = distancia;
      }

      if (fazendaEditando?.id) {
        // Atualizar fazenda existente
        const { error } = await supabase
          .from('fazendas')
          .update(fazenda)
          .eq('id', fazendaEditando.id);
        
        if (error) throw error;
      } else {
        // Inserir nova fazenda
        const { error } = await supabase
          .from('fazendas')
          .insert([fazenda]);
        
        if (error) throw error;
      }

      setMensagem({
        tipo: 'sucesso',
        texto: fazendaEditando?.id ? 'Fazenda atualizada com sucesso!' : 'Fazenda cadastrada com sucesso!'
      });

      // Recarregar lista e limpar formulário
      await carregarFazendas();
      limparFormulario();

    } catch (error: unknown) {
      console.error('Erro ao salvar fazenda:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setMensagem({
        tipo: 'erro',
        texto: `Erro ao salvar: ${errorMessage}`
      });
    } finally {
      setSalvando(false);
    }
  };

  const limparFormulario = () => {
    setFazenda({
      cliente_id: cliente.id || 0,
      nome_fazenda: '',
      logradouro: '',
      numero: '',
      cep: '',
      bairro: '',
      municipio: '',
      uf: '',
      distancia_barra_garças: 0,
      observacoes: ''
    });
    setFazendaEditando(null);
    setMostrarFormulario(false);
    setMensagem(null);
  };

  const editarFazenda = (fazenda: Fazenda) => {
    setFazenda(fazenda);
    setFazendaEditando(fazenda);
    setMostrarFormulario(true);
  };

  const excluirFazenda = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta fazenda?')) return;

    try {
      const { error } = await supabase
        .from('fazendas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMensagem({
        tipo: 'sucesso',
        texto: 'Fazenda excluída com sucesso!'
      });

      await carregarFazendas();
    } catch (error: unknown) {
      console.error('Erro ao excluir fazenda:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setMensagem({
        tipo: 'erro',
        texto: `Erro ao excluir: ${errorMessage}`
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content fazendas-modal">
        <div className="modal-header">
          <h2>Fazendas de {cliente.razao_social}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {mensagem && (
          <div className={`mensagem ${mensagem.tipo}`}>
            {mensagem.texto}
          </div>
        )}

        <div className="fazendas-content">
          {/* Lista de Fazendas */}
          <div className="fazendas-lista">
            <div className="lista-header">
              <h3>Fazendas Cadastradas ({fazendas.length})</h3>
              <button
                className="btn-nova-fazenda"
                onClick={() => setMostrarFormulario(true)}
              >
                ➕ Nova Fazenda
              </button>
            </div>

            {carregando ? (
              <div className="carregando">
                <div className="spinner"></div>
                <p>Carregando fazendas...</p>
              </div>
            ) : fazendas.length === 0 ? (
              <div className="sem-fazendas">
                <p>Nenhuma fazenda cadastrada.</p>
                <button
                  className="btn-cadastrar-primeira"
                  onClick={() => setMostrarFormulario(true)}
                >
                  Cadastrar Primeira Fazenda
                </button>
              </div>
            ) : (
              <div className="fazendas-grid">
                {fazendas.map((fazenda) => (
                  <div key={fazenda.id} className="fazenda-card">
                    <div className="fazenda-header">
                      <h4>{fazenda.nome_fazenda}</h4>
                      <div className="fazenda-acoes">
                        <button
                          className="btn-editar"
                          onClick={() => editarFazenda(fazenda)}
                          title="Editar fazenda"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-excluir"
                          onClick={() => excluirFazenda(fazenda.id!)}
                          title="Excluir fazenda"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="fazenda-info">
                      {fazenda.logradouro && (
                        <p><strong>Endereço:</strong> {fazenda.logradouro}, {fazenda.numero}</p>
                      )}
                      {fazenda.municipio && (
                        <p><strong>Cidade:</strong> {fazenda.municipio} - {fazenda.uf}</p>
                      )}
                      {fazenda.distancia_barra_garças && (
                        <p><strong>Distância:</strong> {fazenda.distancia_barra_garças} km de Barra do Garças-MT</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulário de Fazenda */}
          {mostrarFormulario && (
            <div className="fazenda-formulario">
              <div className="formulario-header">
                <h3>{fazendaEditando ? 'Editar Fazenda' : 'Nova Fazenda'}</h3>
                <button
                  className="btn-fechar-formulario"
                  onClick={limparFormulario}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-grid">
                  <div className="form-section">
                    <h4>📋 Dados da Fazenda</h4>
                    
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label htmlFor="nome_fazenda">Nome da Fazenda *</label>
                        <input
                          type="text"
                          id="nome_fazenda"
                          name="nome_fazenda"
                          value={fazenda.nome_fazenda}
                          onChange={handleInputChange}
                          placeholder="Nome identificador da fazenda"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>📍 Endereço da Fazenda</h4>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="logradouro">Logradouro</label>
                        <input
                          type="text"
                          id="logradouro"
                          name="logradouro"
                          value={fazenda.logradouro}
                          onChange={handleInputChange}
                          placeholder="Rua, Avenida, etc."
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="numero">Número</label>
                        <input
                          type="text"
                          id="numero"
                          name="numero"
                          value={fazenda.numero}
                          onChange={handleInputChange}
                          placeholder="Número"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="cep">CEP</label>
                        <input
                          type="text"
                          id="cep"
                          name="cep"
                          value={fazenda.cep}
                          onChange={handleInputChange}
                          placeholder="00000-000"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="bairro">Bairro</label>
                        <input
                          type="text"
                          id="bairro"
                          name="bairro"
                          value={fazenda.bairro}
                          onChange={handleInputChange}
                          placeholder="Bairro"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="municipio">Município</label>
                        <input
                          type="text"
                          id="municipio"
                          name="municipio"
                          value={fazenda.municipio}
                          onChange={handleInputChange}
                          placeholder="Município"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="uf">UF</label>
                        <select
                          id="uf"
                          name="uf"
                          value={fazenda.uf}
                          onChange={handleInputChange}
                        >
                          <option value="">Selecione</option>
                          <option value="MT">MT</option>
                          <option value="GO">GO</option>
                          <option value="MS">MS</option>
                          <option value="TO">TO</option>
                          <option value="PA">PA</option>
                          <option value="RO">RO</option>
                          <option value="AC">AC</option>
                          <option value="AM">AM</option>
                          <option value="RR">RR</option>
                          <option value="AP">AP</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group full-width">
                        <label htmlFor="observacoes">Observações</label>
                        <textarea
                          id="observacoes"
                          name="observacoes"
                          value={fazenda.observacoes}
                          onChange={handleInputChange}
                          placeholder="Observações adicionais sobre a fazenda"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-cancelar"
                    onClick={limparFormulario}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    className="btn-salvar"
                    disabled={salvando}
                  >
                    {salvando ? 'Salvando...' : (fazendaEditando ? 'Atualizar' : 'Cadastrar')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalFazendas;
