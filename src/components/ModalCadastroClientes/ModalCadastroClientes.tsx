import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Cliente } from '../../types/cliente';
import ModalFazendas from '../ModalFazendas/ModalFazendas';
import './ModalCadastroClientes.css';

interface ModalCadastroClientesProps {
  isOpen: boolean;
  onClose: () => void;
  onClienteSalvo: (cliente: Cliente) => void;
  clienteInicial?: Cliente | null;
}

const ModalCadastroClientes: React.FC<ModalCadastroClientesProps> = ({
  isOpen,
  onClose,
  onClienteSalvo,
  clienteInicial
}) => {
  const [cliente, setCliente] = useState<Cliente>({
    razao_social: '',
    tipo_pessoa: 'Física',
    cpf_cnpj: '',
    data_cadastro: new Date().toISOString().split('T')[0],
    situacao: 'Ativo'
  });

  const [buscaCpf, setBuscaCpf] = useState('');
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [modalFazendasAberto, setModalFazendasAberto] = useState(false);

  // Busca automática ao digitar CPF/CNPJ
  useEffect(() => {
    if (buscaCpf.length >= 11) { // CPF mínimo
      const timeoutId = setTimeout(() => {
        buscarCliente(buscaCpf);
      }, 500); // Delay de 500ms para evitar muitas consultas

      return () => clearTimeout(timeoutId);
    } else {
      setClienteEncontrado(null);
    }
  }, [buscaCpf]);

  // Preencher formulário se cliente inicial for fornecido
  useEffect(() => {
    if (clienteInicial) {
      setCliente(clienteInicial);
      setBuscaCpf(clienteInicial.cpf_cnpj);
    }
  }, [clienteInicial]);

  const buscarCliente = async (cpfCnpj: string) => {
    setBuscando(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('cpf_cnpj', cpfCnpj)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = nenhum resultado
        console.error('Erro ao buscar cliente:', error);
        return;
      }

      if (data) {
        setClienteEncontrado(data);
        setCliente(data);
        setMensagem({
          tipo: 'sucesso',
          texto: `Cliente encontrado: ${data.razao_social}`
        });
      } else {
        setClienteEncontrado(null);
        // Limpar formulário para novo cadastro
        setCliente({
          razao_social: '',
          tipo_pessoa: 'Física',
          cpf_cnpj: cpfCnpj,
          data_cadastro: new Date().toISOString().split('T')[0],
          situacao: 'Ativo'
        });
        setMensagem({
          tipo: 'sucesso',
          texto: 'CPF/CNPJ não cadastrado. Preencha os dados para novo cadastro.'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
    } finally {
      setBuscando(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cpf_cnpj') {
      setBuscaCpf(value);
    }
    
    setCliente(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    try {
      let result: Cliente;
      
      if (cliente.id) {
        // Atualizar cliente existente
        const { data, error } = await supabase
          .from('clientes')
          .update(cliente)
          .eq('id', cliente.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Inserir novo cliente
        const { data, error } = await supabase
          .from('clientes')
          .insert([cliente])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      setMensagem({
        tipo: 'sucesso',
        texto: cliente.id ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!'
      });

      // Limpar mensagem após 2 segundos
      setTimeout(() => {
        setMensagem(null);
        onClienteSalvo(result);
        onClose();
      }, 2000);

    } catch (error: unknown) {
      console.error('Erro ao salvar cliente:', error);
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
    setCliente({
      razao_social: '',
      tipo_pessoa: 'Física',
      cpf_cnpj: '',
      data_cadastro: new Date().toISOString().split('T')[0],
      situacao: 'Ativo'
    });
    setBuscaCpf('');
    setClienteEncontrado(null);
    setMensagem(null);
    setModalFazendasAberto(false);
  };

  const abrirModalFazendas = () => {
    if (cliente.id) {
      setModalFazendasAberto(true);
    } else {
      setMensagem({
        tipo: 'erro',
        texto: 'Salve o cliente primeiro para gerenciar fazendas'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Cadastro de Cliente</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {mensagem && (
          <div className={`mensagem ${mensagem.tipo}`}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Campo de busca CPF/CNPJ */}
          <div className="form-group busca-cpf">
            <label htmlFor="cpf_cnpj">CPF/CNPJ *</label>
            <div className="input-busca">
              <input
                type="text"
                id="cpf_cnpj"
                name="cpf_cnpj"
                value={buscaCpf}
                onChange={handleInputChange}
                placeholder="Digite o CPF ou CNPJ"
                required
                className={clienteEncontrado ? 'cliente-encontrado' : ''}
              />
              {buscando && <span className="buscando">🔍</span>}
              {clienteEncontrado && <span className="encontrado">✅</span>}
            </div>
            {clienteEncontrado && (
              <small className="cliente-info">
                Cliente encontrado: {clienteEncontrado.razao_social}
              </small>
            )}
          </div>

          <div className="form-grid">
            {/* Seção 1: Dados Pessoais */}
            <div className="form-section">
              <h3>📋 Dados Pessoais</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tipo_pessoa">Tipo de Pessoa *</label>
                  <select
                    id="tipo_pessoa"
                    name="tipo_pessoa"
                    value={cliente.tipo_pessoa}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Física">Pessoa Física</option>
                    <option value="Jurídica">Pessoa Jurídica</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="razao_social">
                    {cliente.tipo_pessoa === 'Física' ? 'Nome Completo *' : 'Razão Social *'}
                  </label>
                  <input
                    type="text"
                    id="razao_social"
                    name="razao_social"
                    value={cliente.razao_social}
                    onChange={handleInputChange}
                    placeholder={cliente.tipo_pessoa === 'Física' ? 'Nome completo' : 'Razão social'}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nome_fantasia">Nome Fantasia</label>
                  <input
                    type="text"
                    id="nome_fantasia"
                    name="nome_fantasia"
                    value={cliente.nome_fantasia || ''}
                    onChange={handleInputChange}
                    placeholder="Nome fantasia (opcional)"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="rg_ie">
                    {cliente.tipo_pessoa === 'Física' ? 'RG' : 'Inscrição Estadual'}
                  </label>
                  <input
                    type="text"
                    id="rg_ie"
                    name="rg_ie"
                    value={cliente.rg_ie || ''}
                    onChange={handleInputChange}
                    placeholder={cliente.tipo_pessoa === 'Física' ? 'RG' : 'IE'}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="data_nascimento">
                    {cliente.tipo_pessoa === 'Física' ? 'Data de Nascimento' : 'Data de Constituição'}
                  </label>
                  <input
                    type="date"
                    id="data_nascimento"
                    name="data_nascimento"
                    value={cliente.data_nascimento || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="data_cadastro">Data de Cadastro *</label>
                  <input
                    type="date"
                    id="data_cadastro"
                    name="data_cadastro"
                    value={cliente.data_cadastro}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Contato e Endereço */}
            <div className="form-section">
              <h3>📞 Contato e Endereço</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="telefone">Telefone</label>
                  <input
                    type="tel"
                    id="telefone"
                    name="telefone"
                    value={cliente.telefone || ''}
                    onChange={handleInputChange}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="celular">Celular</label>
                  <input
                    type="tel"
                    id="celular"
                    name="celular"
                    value={cliente.celular || ''}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">E-mail</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={cliente.email || ''}
                    onChange={handleInputChange}
                    placeholder="email@exemplo.com"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="cep">CEP</label>
                  <input
                    type="text"
                    id="cep"
                    name="cep"
                    value={cliente.cep || ''}
                    onChange={handleInputChange}
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="logradouro">Logradouro</label>
                  <input
                    type="text"
                    id="logradouro"
                    name="logradouro"
                    value={cliente.logradouro || ''}
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
                    value={cliente.numero || ''}
                    onChange={handleInputChange}
                    placeholder="Número"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bairro">Bairro</label>
                  <input
                    type="text"
                    id="bairro"
                    name="bairro"
                    value={cliente.bairro || ''}
                    onChange={handleInputChange}
                    placeholder="Bairro"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="municipio">Município</label>
                  <input
                    type="text"
                    id="municipio"
                    name="municipio"
                    value={cliente.municipio || ''}
                    onChange={handleInputChange}
                    placeholder="Município"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="uf">UF</label>
                  <select
                    id="uf"
                    name="uf"
                    value={cliente.uf || ''}
                    onChange={handleInputChange}
                  >
                    <option value="">Selecione</option>
                    <option value="AC">AC</option>
                    <option value="AL">AL</option>
                    <option value="AP">AP</option>
                    <option value="AM">AM</option>
                    <option value="BA">BA</option>
                    <option value="CE">CE</option>
                    <option value="DF">DF</option>
                    <option value="ES">ES</option>
                    <option value="GO">GO</option>
                    <option value="MA">MA</option>
                    <option value="MT">MT</option>
                    <option value="MS">MS</option>
                    <option value="MG">MG</option>
                    <option value="PA">PA</option>
                    <option value="PB">PB</option>
                    <option value="PR">PR</option>
                    <option value="PE">PE</option>
                    <option value="PI">PI</option>
                    <option value="RJ">RJ</option>
                    <option value="RN">RN</option>
                    <option value="RS">RS</option>
                    <option value="RO">RO</option>
                    <option value="RR">RR</option>
                    <option value="SC">SC</option>
                    <option value="SP">SP</option>
                    <option value="SE">SE</option>
                    <option value="TO">TO</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="situacao">Situação</label>
                  <select
                    id="situacao"
                    name="situacao"
                    value={cliente.situacao}
                    onChange={handleInputChange}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-limpar"
              onClick={limparFormulario}
              disabled={salvando}
            >
              Limpar
            </button>
            
            <button
              type="button"
              className="btn-fazendas"
              onClick={abrirModalFazendas}
              disabled={salvando}
              title="Gerenciar fazendas do cliente"
            >
              🏡 Fazendas
            </button>
            
            <button
              type="button"
              className="btn-cancelar"
              onClick={onClose}
              disabled={salvando}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className="btn-salvar"
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : (cliente.id ? 'Atualizar' : 'Cadastrar')}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Fazendas */}
      <ModalFazendas
        isOpen={modalFazendasAberto}
        onClose={() => setModalFazendasAberto(false)}
        cliente={cliente}
      />
    </div>
  );
};

export default ModalCadastroClientes;
