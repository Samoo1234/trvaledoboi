import React, { useState, useEffect } from 'react';
import { Plus, Truck, FileText, Archive } from 'lucide-react';
import { freteService, Frete } from '../../services/freteService';
import { caminhaoService, Caminhao } from '../../services/caminhaoService';
import { motoristaService, Motorista } from '../../services/motoristaService';
import { freteCaminhaoService, FreteCaminhao } from '../../services/freteCaminhaoService';
import { freteMotoristaService, FreteMotorista } from '../../services/freteMotoristaService';
import { reboqueService, Reboque } from '../../services/reboqueService';
import { supabase } from '../../services/supabaseClient';
import { Cliente } from '../../types/cliente';

import { ControleFreteFilters } from './components/ControleFreteFilters';
import { ControleFreteTable } from './components/ControleFreteTable';
import { ControleFreteForm } from './components/ControleFreteForm';
import { ControleFreteAcerto } from './components/ControleFreteAcerto';
import { controleFretePDFService } from './services/controleFretePDFService';

import './ControleFrete.css';

type CaminhaoSelecionado = {
  caminhao_id: string;
  reboque_id?: string;
  valor_frete?: string;
};

type MotoristaSelecionado = {
  motorista_id: string;
  caminhao_id: string;
};

const getPrimeiroDiaMes = () => {
  const data = new Date();
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-01`;
};

const getUltimoDiaMes = () => {
  const data = new Date();
  const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0);
  return `${ultimoDia.getFullYear()}-${String(ultimoDia.getMonth() + 1).padStart(2, '0')}-${String(ultimoDia.getDate()).padStart(2, '0')}`;
};

const ControleFrete: React.FC = () => {
  const [fretes, setFretes] = useState<Frete[]>([]);
  const [caminhoes, setCaminhoes] = useState<Caminhao[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [reboques, setReboques] = useState<Reboque[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [filtroSituacao, setFiltroSituacao] = useState<string>('');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>(getPrimeiroDiaMes());
  const [filtroDataFim, setFiltroDataFim] = useState<string>(getUltimoDiaMes());
  const [filtroCliente, setFiltroCliente] = useState<string>('');
  const [filtroMotorista, setFiltroMotorista] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'fretes' | 'acerto'>('fretes');
  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');
  const [dataInicioAcerto, setDataInicioAcerto] = useState<string>('');
  const [dataFimAcerto, setDataFimAcerto] = useState<string>('');
  const [fretesAcerto, setFretesAcerto] = useState<Frete[]>([]);
  const [clientesCadastro, setClientesCadastro] = useState<Cliente[]>([]);

  const [formData, setFormData] = useState({
    data_emissao: '',
    pecuarista: '',
    origem: '',
    destino: '',
    numero_minuta: '',
    numero_cb: '',
    cliente: '',
    cliente_id: null as number | null,
    observacoes: '',
    faixa: '',
    total_km: '',
    valor_frete: '',
    situacao: 'Pendente',
    tipo_pagamento: '',
    data_pagamento: ''
  });

  const [caminhoesSelecionados, setCaminhoesSelecionados] = useState<CaminhaoSelecionado[]>([]);
  const [motoristasSelecionados, setMotoristasSelecionados] = useState<MotoristaSelecionado[]>([]);

  const [vinculosCaminhoes, setVinculosCaminhoes] = useState<{ [freteId: number]: FreteCaminhao[] }>({});
  const [vinculosMotoristas, setVinculosMotoristas] = useState<{ [freteId: number]: FreteMotorista[] }>({});
  const [fretesSelecionados, setFretesSelecionados] = useState<number[]>([]);

  useEffect(() => {
    loadData();
    loadReboques();
    loadClientesCadastro();
  }, []);

  const loadClientesCadastro = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, razao_social, cpf_cnpj, municipio, uf')
        .eq('situacao', 'Ativo')
        .order('razao_social');
      if (error) throw error;
      setClientesCadastro(data as Cliente[] || []);
    } catch {
      setClientesCadastro([]);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [fretesData, caminhoesData, motoristasData] = await Promise.all([
        freteService.getAll(),
        caminhaoService.getAll(),
        motoristaService.getAll()
      ]);
      setFretes(fretesData);
      setCaminhoes(caminhoesData.filter(c => c.status === 'Ativo'));
      setMotoristas(motoristasData.filter(m => m.status === 'Ativo'));
      
      const ids = fretesData.map(f => f.id).filter((id): id is number => typeof id === 'number');
      
      const allCaminhoes = await Promise.all(ids.map(id => freteCaminhaoService.getByFreteId(id)));
      const vincCaminhoes: { [freteId: number]: FreteCaminhao[] } = {};
      ids.forEach((id, idx) => { vincCaminhoes[id!] = allCaminhoes[idx]; });
      setVinculosCaminhoes(vincCaminhoes);
      
      const allMotoristas = await Promise.all(ids.map(id => freteMotoristaService.getByFreteId(id)));
      const vincMotoristas: { [freteId: number]: FreteMotorista[] } = {};
      ids.forEach((id, idx) => { vincMotoristas[id!] = allMotoristas[idx]; });
      setVinculosMotoristas(vincMotoristas);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const loadReboques = async () => {
    try {
      const data = await reboqueService.getAll();
      setReboques(data);
    } catch {
      setReboques([]);
    }
  };

  const resetForm = () => {
    setFormData({
      data_emissao: '',
      pecuarista: '',
      origem: '',
      destino: '',
      numero_minuta: '',
      numero_cb: '',
      cliente: '',
      cliente_id: null,
      observacoes: '',
      faixa: '',
      total_km: '',
      valor_frete: '',
      situacao: 'Pendente',
      tipo_pagamento: '',
      data_pagamento: ''
    });
    setCaminhoesSelecionados([]);
    setMotoristasSelecionados([]);
    setEditingId(null);
    setShowForm(false);
  };

  const toggleSelecionarFrete = (freteId: number) => {
    setFretesSelecionados(prev => prev.includes(freteId) ? prev.filter(id => id !== freteId) : [...prev, freteId]);
  };

  const toggleSelecionarTodos = () => {
    if (fretesSelecionados.length === fretesFiltrados.length) {
      setFretesSelecionados([]);
    } else {
      setFretesSelecionados(fretesFiltrados.map(f => f.id).filter((id): id is number => typeof id === 'number'));
    }
  };

  const arquivarSelecionados = async () => {
    if (fretesSelecionados.length === 0) return;

    if (!window.confirm(`Deseja arquivar ${fretesSelecionados.length} frete(s)?`)) return;

    try {
      setLoading(true);
      for (const freteId of fretesSelecionados) {
        await freteService.arquivar(freteId);
      }
      alert('Arquivamento concluído!');
      setFretesSelecionados([]);
      loadData();
    } catch (error) {
      alert('Erro ao arquivar fretes.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (frete: Frete) => {
    setFormData({
      data_emissao: frete.data_emissao,
      pecuarista: frete.pecuarista,
      origem: frete.origem,
      destino: frete.destino,
      numero_minuta: frete.numero_minuta || '',
      numero_cb: frete.numero_cb || '',
      cliente: frete.cliente || '',
      cliente_id: frete.cliente_id || null,
      observacoes: frete.observacoes || '',
      faixa: frete.faixa || '',
      total_km: frete.total_km?.toString() || '',
      valor_frete: frete.valor_frete.toString(),
      situacao: frete.situacao,
      tipo_pagamento: frete.tipo_pagamento || '',
      data_pagamento: frete.data_pagamento || ''
    });

    const caminhoesVinc = await freteCaminhaoService.getByFreteId(frete.id!);
    setCaminhoesSelecionados(caminhoesVinc.map(v => ({
      caminhao_id: v.caminhao_id.toString(),
      reboque_id: v.reboque_id ? v.reboque_id.toString() : undefined,
      valor_frete: v.valor_frete ? v.valor_frete.toString() : undefined
    })));
    
    const motoristasVinc = await freteMotoristaService.getByFreteId(frete.id!);
    setMotoristasSelecionados(motoristasVinc.map(v => ({
      motorista_id: v.motorista_id.toString(),
      caminhao_id: v.caminhao_id ? v.caminhao_id.toString() : (caminhoesVinc[0]?.caminhao_id || 0).toString()
    })));

    setEditingId(frete.id as number);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (caminhoesSelecionados.length === 0 || motoristasSelecionados.length === 0) {
        alert('Selecione pelo menos um caminhão e um motorista');
        return;
      }

      if (motoristasSelecionados.some(m => !m.caminhao_id)) {
        alert('Todos os motoristas devem estar associados a um caminhão');
        return;
      }

      const caminhoesPorMotorista = new Map<string, string[]>();
      motoristasSelecionados.forEach(m => {
        if (!caminhoesPorMotorista.has(m.caminhao_id)) caminhoesPorMotorista.set(m.caminhao_id, []);
        caminhoesPorMotorista.get(m.caminhao_id)!.push(m.motorista_id);
      });

      if (Array.from(caminhoesPorMotorista.values()).some(m => m.length > 1)) {
        alert('ERRO: Regra: 1 CAMINHÃO = 1 MOTORISTA ÚNICO!');
        return;
      }

      const caminhoesComMotorista = new Set(motoristasSelecionados.map(m => m.caminhao_id));
      if (caminhoesSelecionados.some(c => !caminhoesComMotorista.has(c.caminhao_id))) {
        alert('ERRO: Todos os caminhões DEVEM ter um motorista!');
        return;
      }

      if (!formData.valor_frete || parseFloat(formData.valor_frete) <= 0) {
        alert('Informe um valor de frete válido');
        return;
      }

      const somaCaminhoes = caminhoesSelecionados.reduce((sum, cam) => sum + parseFloat(cam.valor_frete || '0'), 0);
      const valorTotalFrete = parseFloat(formData.valor_frete);
      
      if (Math.abs(somaCaminhoes - valorTotalFrete) > 0.01) {
        alert('ERRO: Inconsistência nos valores! A soma dos individuais deve igualar o total.');
        return;
      }

      const freteData = {
        data_emissao: formData.data_emissao,
        pecuarista: formData.pecuarista,
        origem: formData.origem,
        destino: formData.destino,
        numero_minuta: formData.numero_minuta || undefined,
        numero_cb: formData.numero_cb || undefined,
        cliente: formData.cliente || undefined,
        cliente_id: formData.cliente_id || undefined,
        observacoes: formData.observacoes || undefined,
        faixa: formData.faixa || undefined,
        total_km: formData.total_km ? parseInt(formData.total_km) : undefined,
        valor_frete: valorTotalFrete,
        situacao: formData.situacao,
        tipo_pagamento: formData.situacao === 'Pago' ? formData.tipo_pagamento : null,
        data_pagamento: formData.situacao === 'Pago' ? formData.data_pagamento : null
      };

      let freteId = editingId;

      if (editingId) {
        await freteService.update(editingId, freteData);
        await freteCaminhaoService.deleteByFreteId(editingId);
        await freteMotoristaService.deleteByFreteId(editingId);
      } else {
        const novoFrete = await freteService.create(freteData);
        freteId = novoFrete.id as number;
      }

      for (const caminhaoVinc of caminhoesSelecionados) {
        const caminhao = caminhoes.find(c => c.id === parseInt(caminhaoVinc.caminhao_id));
        let configuracao: 'Toco' | 'Truck' | 'Julieta' | 'Carreta Baixa' | 'Carreta 2 Pisos' = 'Truck';
        if (caminhao?.tipo === 'Toco') {
          configuracao = 'Toco';
        } else if (caminhaoVinc.reboque_id) {
          // Se tem reboque, configuração = tipo do reboque
          const reboque = reboques.find(r => r.id === parseInt(caminhaoVinc.reboque_id!));
          configuracao = (reboque?.conjunto as typeof configuracao) || 'Truck';
        } else {
          configuracao = 'Truck';
        }

        await freteCaminhaoService.create({
          frete_id: freteId!,
          caminhao_id: parseInt(caminhaoVinc.caminhao_id),
          configuracao: configuracao,
          reboque_id: caminhaoVinc.reboque_id ? parseInt(caminhaoVinc.reboque_id) : null,
          valor_frete: parseFloat(caminhaoVinc.valor_frete!)
        });
      }

      for (const motorista of motoristasSelecionados) {
        await freteMotoristaService.create({
          frete_id: freteId!,
          motorista_id: parseInt(motorista.motorista_id),
          caminhao_id: parseInt(motorista.caminhao_id)
        });
      }

      alert(editingId ? 'Frete atualizado!' : 'Frete cadastrado!');
      await loadData();
      resetForm();
    } catch (error) {
      alert('Erro ao salvar frete.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Excluir frete?')) {
      try {
        await freteCaminhaoService.deleteByFreteId(id);
        await freteMotoristaService.deleteByFreteId(id);
        await freteService.delete(id);
        setFretes(fretes.filter(f => f.id !== id));
        alert('Frete excluído!');
      } catch (error) {
        alert('Erro ao excluir frete.');
      }
    }
  };

  // Buscar clientes do cadastro para filtros (agora da tabela clientes, não dos fretes)
  const getClientesParaFiltro = (): { id: number; razao_social: string }[] => {
    return clientesCadastro.map(c => ({ id: c.id!, razao_social: c.razao_social }));
  };

  const fretesFiltrados = fretes.filter(frete => {
    if (filtroSituacao && frete.situacao?.toUpperCase() !== filtroSituacao.toUpperCase()) return false;
    
    // Tratamento robusto para as datas, ignorando fuso horário
    if (filtroDataInicio || filtroDataFim) {
      if (frete.data_emissao) {
        const [yFrete, mFrete, dFrete] = frete.data_emissao.split('T')[0].split('-').map(Number);
        const dataFreteCalc = new Date(yFrete, mFrete - 1, dFrete).getTime();

        if (filtroDataInicio) {
          const [yIni, mIni, dIni] = filtroDataInicio.split('-').map(Number);
          if (dataFreteCalc < new Date(yIni, mIni - 1, dIni).getTime()) return false;
        }
        
        if (filtroDataFim) {
          const [yFim, mFim, dFim] = filtroDataFim.split('-').map(Number);
          if (dataFreteCalc > new Date(yFim, mFim - 1, dFim).getTime()) return false;
        }
      } else {
        return false; // se não tiver data, não mostra no filtro por período
      }
    }
    
    if (filtroCliente) {
      // filtroCliente agora armazena o ID do cliente (como string)
      const clienteIdFiltro = parseInt(filtroCliente);
      if (!isNaN(clienteIdFiltro)) {
        // Filtrar por cliente_id (novo sistema)
        if (frete.cliente_id !== clienteIdFiltro) {
          // Fallback: se frete não tem cliente_id, verificar pelo nome legado
          const clienteCadastro = clientesCadastro.find(c => c.id === clienteIdFiltro);
          if (!clienteCadastro || frete.cliente !== clienteCadastro.razao_social) return false;
        }
      } else {
        // Filtro legado por string
        if (frete.cliente !== filtroCliente) return false;
      }
    }
    if (filtroMotorista) {
      const vincs = vinculosMotoristas[frete.id!] || [];
      if (!vincs.some(v => v.motorista_id === parseInt(filtroMotorista))) return false;
    }
    return true;
  }).sort((a, b) => {
    // Ordenar de forma Ascendente (do mais antigo para o mais novo) no frontend
    const dateA = new Date(a.data_emissao).getTime();
    const dateB = new Date(b.data_emissao).getTime();
    return dateA - dateB;
  });

  const handleValorFreteChange = (value: string | undefined) => {
    setFormData(prev => ({ ...prev, valor_frete: value || '' }));
  };

  const handleGerarPDFControle = async () => {
    // Resolver o nome do cliente a partir do ID para exibição no relatório
    const nomeClienteFiltro = filtroCliente
      ? clientesCadastro.find(c => c.id === parseInt(filtroCliente))?.razao_social || filtroCliente
      : '';
    await controleFretePDFService.gerarPDFControleFrentes({
      fretesFiltrados,
      filtroDataInicio,
      filtroDataFim,
      filtroCliente: nomeClienteFiltro,
      filtroSituacao,
      caminhoes,
      motoristas,
      reboques,
      vinculosCaminhoes,
      vinculosMotoristas
    });
  };

  const filtrarFretesAcerto = () => {
    if (!clienteSelecionado) {
      alert('Selecione um cliente');
      return;
    }
    const clienteIdAcerto = parseInt(clienteSelecionado);
    let filtrados = fretes.filter(f => {
      if (!isNaN(clienteIdAcerto)) {
        // Filtrar por cliente_id ou pelo nome legado
        if (f.cliente_id === clienteIdAcerto) return true;
        const clienteCadastro = clientesCadastro.find(c => c.id === clienteIdAcerto);
        return clienteCadastro && f.cliente === clienteCadastro.razao_social;
      }
      return f.cliente === clienteSelecionado;
    });
    if (dataInicioAcerto && dataFimAcerto) {
      filtrados = filtrados.filter(f => {
        const d = new Date(f.data_emissao);
        return d >= new Date(dataInicioAcerto) && d <= new Date(dataFimAcerto);
      });
    }
    setFretesAcerto(filtrados);
  };

  const handleGerarPDFAcerto = async () => {
    // Resolver o nome do cliente a partir do ID para exibição no relatório
    const nomeClienteAcerto = clienteSelecionado
      ? clientesCadastro.find(c => c.id === parseInt(clienteSelecionado))?.razao_social || clienteSelecionado
      : '';
    await controleFretePDFService.gerarPDFAcerto({
      fretesAcerto,
      clienteSelecionado: nomeClienteAcerto,
      dataInicioAcerto,
      dataFimAcerto,
      caminhoes,
      reboques,
      vinculosCaminhoes
    });
  };

  if (loading) {
    return (
      <div className="controle-frete">
        <div className="page-header">
          <h1>Controle de Fretes</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Carregando fretes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="controle-frete">
      <div className="page-header">
        <h1>Controle de Fretes</h1>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={20} /> Novo Frete
          </button>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button className={`tab ${activeTab === 'fretes' ? 'active' : ''}`} onClick={() => setActiveTab('fretes')}>
            <Truck size={16} /> Controle de Fretes
          </button>
          <button className={`tab ${activeTab === 'acerto' ? 'active' : ''}`} onClick={() => setActiveTab('acerto')}>
            <FileText size={16} /> Relatório de Acerto
          </button>
        </div>
      </div>

      {activeTab === 'fretes' && (
        <>
          <ControleFreteFilters
            filtroSituacao={filtroSituacao} setFiltroSituacao={setFiltroSituacao}
            filtroDataInicio={filtroDataInicio} setFiltroDataInicio={setFiltroDataInicio}
            filtroDataFim={filtroDataFim} setFiltroDataFim={setFiltroDataFim}
            filtroCliente={filtroCliente} setFiltroCliente={setFiltroCliente}
            filtroMotorista={filtroMotorista} setFiltroMotorista={setFiltroMotorista}
            clientesCadastro={getClientesParaFiltro()} motoristas={motoristas}
            onClearFilters={() => {
              setFiltroSituacao(''); 
              setFiltroDataInicio(getPrimeiroDiaMes()); 
              setFiltroDataFim(getUltimoDiaMes());
              setFiltroCliente(''); 
              setFiltroMotorista('');
            }}
            onGeneratePDF={handleGerarPDFControle}
            fretesFiltrados={fretesFiltrados}
          />

          {fretesSelecionados.length > 0 && (
            <div className="barra-selecao">
              <div className="barra-selecao-info">
                <Archive size={18} />
                <span>
                  <strong>{fretesSelecionados.length}</strong> frete{fretesSelecionados.length !== 1 ? 's' : ''} selecionado(s)
                </span>
              </div>
              <div className="barra-selecao-acoes">
                <button className="btn-cancelar-selecao" onClick={() => setFretesSelecionados([])}>Cancelar</button>
                <button className="btn-arquivar-selecionados" onClick={arquivarSelecionados}>
                  <Archive size={16} /> Arquivar Selecionados
                </button>
              </div>
            </div>
          )}

          {showForm && (
            <ControleFreteForm
              editingId={editingId}
              formData={formData} setFormData={setFormData}
              caminhoesSelecionados={caminhoesSelecionados} setCaminhoesSelecionados={setCaminhoesSelecionados}
              motoristasSelecionados={motoristasSelecionados} setMotoristasSelecionados={setMotoristasSelecionados}
              caminhoes={caminhoes} motoristas={motoristas} reboques={reboques}
              handleValorFreteChange={handleValorFreteChange}
              handleSubmit={handleSubmit} resetForm={resetForm}
            />
          )}

          <ControleFreteTable 
            fretesFiltrados={fretesFiltrados} 
            fretesSelecionados={fretesSelecionados}
            vinculosCaminhoes={vinculosCaminhoes} 
            vinculosMotoristas={vinculosMotoristas} 
            caminhoes={caminhoes} 
            motoristas={motoristas} 
            reboques={reboques}
            filtroSituacao={filtroSituacao} 
            toggleSelecionarTodos={toggleSelecionarTodos} 
            toggleSelecionarFrete={toggleSelecionarFrete} 
            handleEdit={handleEdit} 
            handleDelete={handleDelete}
          />
        </>
      )}

      {activeTab === 'acerto' && (
        <ControleFreteAcerto
          clienteSelecionado={clienteSelecionado} setClienteSelecionado={setClienteSelecionado}
          dataInicioAcerto={dataInicioAcerto} setDataInicioAcerto={setDataInicioAcerto}
          dataFimAcerto={dataFimAcerto} setDataFimAcerto={setDataFimAcerto}
          fretesAcerto={fretesAcerto} clientesCadastro={getClientesParaFiltro()}
          vinculosCaminhoes={vinculosCaminhoes} caminhoes={caminhoes} reboques={reboques}
          onFiltrar={filtrarFretesAcerto}
          onGerarPDF={handleGerarPDFAcerto}
        />
      )}
    </div>
  );
};

export default ControleFrete;