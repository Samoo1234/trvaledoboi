import React, { useState, useEffect } from 'react';
import { abastecimentoService, Abastecimento } from '../../services/abastecimentoService';
import { caminhaoService, Caminhao } from '../../services/caminhaoService';
import { motoristaService, Motorista } from '../../services/motoristaService';
import { formatarMesAno, calcularPrecoTotal } from './utils';

import { ControleAbastecimentoFilters } from './components/ControleAbastecimentoFilters';
import { ControleAbastecimentoStats } from './components/ControleAbastecimentoStats';
import { ControleAbastecimentoTable } from './components/ControleAbastecimentoTable';
import { ControleAbastecimentoForm } from './components/ControleAbastecimentoForm';

import './ControleAbastecimento.css';

const ControleAbastecimento: React.FC = () => {
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [caminhoes, setCaminhoes] = useState<Caminhao[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [editingAbastecimento, setEditingAbastecimento] = useState<Abastecimento | null>(null);
  
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    caminhaoId: '',
    motoristaId: '',
    combustivel: ''
  });

  const [formData, setFormData] = useState<Partial<Abastecimento>>({
    data_abastecimento: '',
    mes: '',
    combustivel: 'Diesel',
    quantidade_litros: undefined,
    posto_tanque: '',
    caminhao_id: 0,
    motorista_id: 0,
    km_rodado: undefined,
    preco_por_litro: undefined,
    preco_total: undefined,
    tanque_cheio: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [abastecimentosData, caminhoesData, motoristasData] = await Promise.all([
        abastecimentoService.getAll(),
        caminhaoService.getAll(),
        motoristaService.getAll()
      ]);
      
      setAbastecimentos(abastecimentosData);
      setCaminhoes(caminhoesData);
      setMotoristas(motoristasData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (abastecimento: Abastecimento) => {
    setEditingAbastecimento(abastecimento);
    setFormData({
      data_abastecimento: abastecimento.data_abastecimento,
      mes: abastecimento.mes,
      combustivel: abastecimento.combustivel,
      quantidade_litros: abastecimento.quantidade_litros,
      posto_tanque: abastecimento.posto_tanque,
      caminhao_id: abastecimento.caminhao_id,
      motorista_id: abastecimento.motorista_id,
      km_rodado: abastecimento.km_rodado,
      preco_por_litro: abastecimento.preco_por_litro,
      preco_total: abastecimento.preco_total,
      tanque_cheio: abastecimento.tanque_cheio ?? false
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este abastecimento?')) {
      try {
        await abastecimentoService.delete(id);
        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao excluir abastecimento');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      data_abastecimento: '',
      mes: '',
      combustivel: 'Diesel',
      quantidade_litros: undefined,
      posto_tanque: '',
      caminhao_id: 0,
      motorista_id: 0,
      km_rodado: undefined,
      preco_por_litro: undefined,
      preco_total: undefined,
      tanque_cheio: true
    });
    setEditingAbastecimento(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAbastecimento) {
        await abastecimentoService.update(editingAbastecimento.id!, formData);
      } else {
        await abastecimentoService.create(formData as Omit<Abastecimento, 'id' | 'created_at' | 'updated_at'>);
      }
      
      await loadData();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar abastecimento');
    }
  };

  const handleDataChange = (data: string) => {
    setFormData({
      ...formData, 
      data_abastecimento: data,
      mes: formatarMesAno(data)
    });
  };

  const handleQuantidadeChange = (quantidade: number | undefined) => {
    const precoTotal = calcularPrecoTotal(quantidade, formData.preco_por_litro);
    setFormData({
      ...formData,
      quantidade_litros: quantidade,
      preco_total: precoTotal
    });
  };

  const handlePrecoPorLitroChange = (preco: number | undefined) => {
    const precoTotal = calcularPrecoTotal(formData.quantidade_litros, preco);
    setFormData({
      ...formData,
      preco_por_litro: preco,
      preco_total: precoTotal
    });
  };

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const aplicarFiltros = async () => {
    try {
      setLoading(true);
      let dados = await abastecimentoService.getAll();

      if (filtros.dataInicio && filtros.dataFim) {
        dados = await abastecimentoService.getByPeriodo(filtros.dataInicio, filtros.dataFim);
      }
      if (filtros.caminhaoId) {
        dados = dados.filter(a => a.caminhao_id === parseInt(filtros.caminhaoId));
      }
      if (filtros.motoristaId) {
        dados = dados.filter(a => a.motorista_id === parseInt(filtros.motoristaId));
      }
      if (filtros.combustivel) {
        dados = dados.filter(a => a.combustivel === filtros.combustivel);
      }
      setAbastecimentos(dados);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aplicar filtros');
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = async () => {
    setFiltros({
      dataInicio: '', dataFim: '', caminhaoId: '', motoristaId: '', combustivel: ''
    });
    await loadData();
  };

  const totalLitros = abastecimentos.reduce((sum, item) => sum + item.quantidade_litros, 0);
  const totalValor = abastecimentos.reduce((sum, item) => sum + (item.preco_total || 0), 0);
  const mediaPreco = totalLitros > 0 ? totalValor / totalLitros : 0;
  const temFiltroPeriodo = Boolean(filtros.dataInicio && filtros.dataFim);
  
  const mediasPorCaminhao = caminhoes.map(caminhao => {
    const abastecimentosCaminhao = abastecimentos
      .filter(a => a.caminhao_id === caminhao.id && a.tanque_cheio && a.km_rodado && a.km_rodado > 0)
      .sort((a, b) => (a.km_rodado || 0) - (b.km_rodado || 0));
    
    if (abastecimentosCaminhao.length < 2) {
      return { placa: caminhao.placa, modelo: caminhao.modelo, totalLitros: 0, totalKm: 0, media: 0 };
    }
    
    const kmInicial = abastecimentosCaminhao[0].km_rodado || 0;
    const kmFinal = abastecimentosCaminhao[abastecimentosCaminhao.length - 1].km_rodado || 0;
    const somaLitros = abastecimentosCaminhao.slice(1).reduce((sum, a) => sum + a.quantidade_litros, 0);
    const totalKm = kmFinal - kmInicial;
    const media = somaLitros > 0 ? totalKm / somaLitros : 0;
    
    return { placa: caminhao.placa, modelo: caminhao.modelo, totalLitros: somaLitros, totalKm, media };
  }).filter(m => m.totalLitros > 0 && m.totalKm > 0);

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="controle-abastecimento">
      <div className="page-header">
        <h1>Controle de Abastecimento</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Novo Abastecimento
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <ControleAbastecimentoStats
        totalLitros={totalLitros} totalValor={totalValor} mediaPreco={mediaPreco}
        temFiltroPeriodo={temFiltroPeriodo} dataInicio={filtros.dataInicio} dataFim={filtros.dataFim}
        mediasPorCaminhao={mediasPorCaminhao}
      />

      <ControleAbastecimentoFilters
        filtros={filtros} handleFiltroChange={handleFiltroChange}
        caminhoes={caminhoes} motoristas={motoristas}
        aplicarFiltros={aplicarFiltros} limparFiltros={limparFiltros}
      />

      <ControleAbastecimentoForm
        showForm={showForm} editingAbastecimento={editingAbastecimento}
        formData={formData} setFormData={setFormData}
        caminhoes={caminhoes} motoristas={motoristas}
        handleDataChange={handleDataChange} handleQuantidadeChange={handleQuantidadeChange}
        handlePrecoPorLitroChange={handlePrecoPorLitroChange} handleSubmit={handleSubmit}
        resetForm={resetForm}
      />

      <ControleAbastecimentoTable
        abastecimentos={abastecimentos} loading={loading}
        handleEdit={handleEdit} handleDelete={handleDelete}
      />
    </div>
  );
};

export default ControleAbastecimento;