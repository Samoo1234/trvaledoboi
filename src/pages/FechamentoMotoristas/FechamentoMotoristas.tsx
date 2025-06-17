import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, Download, Eye, FileText, Trash2 } from 'lucide-react';
import { fechamentoService, FechamentoMotorista } from '../../services/fechamentoService';
import { pdfService } from '../../services/pdfService';
import './FechamentoMotoristas.css';

const FechamentoMotoristas: React.FC = () => {
  const [fechamentos, setFechamentos] = useState<FechamentoMotorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriodo, setSelectedPeriodo] = useState(() => {
    const now = new Date();
    return `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
  });
  const [calculandoFechamento, setCalculandoFechamento] = useState(false);
  const [editandoBonus, setEditandoBonus] = useState<number | null>(null);
  const [novoBonus, setNovoBonus] = useState('');

  const loadFechamentos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fechamentoService.getByPeriodo(selectedPeriodo);
      setFechamentos(data);
    } catch (error) {
      console.error('Erro ao carregar fechamentos:', error);
      alert('Erro ao carregar fechamentos. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodo]);

  // Carregar fechamentos do período selecionado
  useEffect(() => {
    loadFechamentos();
  }, [loadFechamentos]);

  const calcularFechamento = async () => {
    if (calculandoFechamento) return;
    
    try {
      setCalculandoFechamento(true);
      
      // Calcular fechamentos para todos os motoristas do período
      const fechamentosCalculados = await fechamentoService.calcularFechamentoCompleto(selectedPeriodo);
      
      if (fechamentosCalculados.length === 0) {
        alert('Nenhum frete encontrado para motoristas neste período.');
        return;
      }

      // Salvar os fechamentos calculados
      const fechamentosSalvos: FechamentoMotorista[] = [];
      
      for (const fechamento of fechamentosCalculados) {
        // Verificar se já existe fechamento para este motorista no período
        const existente = fechamentos.find(f => f.motorista_id === fechamento.motorista_id);
        
        if (existente) {
          // Atualizar fechamento existente - CORRIGIR: usar valores recalculados
          const atualizado = await fechamentoService.update(existente.id!, {
            total_fretes: fechamento.total_fretes,
            valor_bruto: fechamento.valor_bruto,
            valor_comissao: fechamento.valor_comissao,
            descontos: fechamento.descontos, // CORREÇÃO: usar descontos recalculados
            valor_liquido: fechamento.valor_liquido // CORREÇÃO: usar valor_liquido recalculado
          });
          fechamentosSalvos.push(atualizado);
        } else {
          // Criar novo fechamento
          const novo = await fechamentoService.create(fechamento);
          fechamentosSalvos.push(novo);
        }
      }

      setFechamentos(fechamentosSalvos);
      alert(`Fechamento calculado com sucesso! ${fechamentosSalvos.length} motorista(s) processado(s).`);
      
    } catch (error) {
      console.error('Erro ao calcular fechamento:', error);
      alert('Erro ao calcular fechamento. Verifique os dados e tente novamente.');
    } finally {
      setCalculandoFechamento(false);
    }
  };

  const atualizarStatus = async (id: number, novoStatus: string) => {
    try {
      const fechamentoAtualizado = await fechamentoService.update(id, { status: novoStatus });
      setFechamentos(fechamentos.map(f => f.id === id ? fechamentoAtualizado : f));
      alert('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status.');
    }
  };

  const iniciarEdicaoBonus = (id: number, bonusAtual: number) => {
    setEditandoBonus(id);
    setNovoBonus(bonusAtual.toString());
  };

  const cancelarEdicaoBonus = () => {
    setEditandoBonus(null);
    setNovoBonus('');
  };

  const salvarBonus = async (id: number) => {
    try {
      const valorBonus = parseFloat(novoBonus) || 0;
      const fechamento = fechamentos.find(f => f.id === id);
      if (!fechamento) return;

      // CORREÇÃO: Recalcular valor líquido corretamente: comissão - descontos + bonus
      const novoValorLiquido = fechamento.valor_comissao - (fechamento.descontos || 0) + valorBonus;

      console.log(`[DEBUG] Recalculando valor líquido para motorista ${fechamento.motorista?.nome}:`);
      console.log(`  Comissão: R$ ${fechamento.valor_comissao}`);
      console.log(`  Descontos: R$ ${fechamento.descontos || 0}`);
      console.log(`  Bônus novo: R$ ${valorBonus}`);
      console.log(`  Valor líquido: R$ ${novoValorLiquido}`);

      const fechamentoAtualizado = await fechamentoService.update(id, { 
        bonus: valorBonus,
        valor_liquido: novoValorLiquido
      });
      
      setFechamentos(fechamentos.map(f => f.id === id ? fechamentoAtualizado : f));
      setEditandoBonus(null);
      setNovoBonus('');
      alert('Bônus atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar bônus:', error);
      alert('Erro ao atualizar bônus.');
    }
  };

  const recalcularDescontos = async (id: number) => {
    try {
      const fechamento = fechamentos.find(f => f.id === id);
      if (!fechamento) return;

      // Recalcular descontos buscando vales atualizados
      const fechamentoRecalculado = await fechamentoService.calcularFechamento(
        fechamento.motorista_id, 
        selectedPeriodo
      );

      console.log(`[DEBUG] Recalculando descontos para ${fechamento.motorista?.nome}:`);
      console.log(`  Descontos antigos: R$ ${fechamento.descontos || 0}`);
      console.log(`  Descontos novos: R$ ${fechamentoRecalculado.descontos}`);

      // Manter o bônus atual e recalcular valor líquido
      const bonusAtual = fechamento.bonus || 0;
      const novoValorLiquido = fechamentoRecalculado.valor_comissao - fechamentoRecalculado.descontos + bonusAtual;

      const fechamentoAtualizado = await fechamentoService.update(id, {
        descontos: fechamentoRecalculado.descontos,
        valor_liquido: novoValorLiquido
      });

      setFechamentos(fechamentos.map(f => f.id === id ? fechamentoAtualizado : f));
      alert('Descontos recalculados com sucesso!');
    } catch (error) {
      console.error('Erro ao recalcular descontos:', error);
      alert('Erro ao recalcular descontos.');
    }
  };

  const deletarFechamento = async (id: number, nomeMotorista: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o fechamento do motorista "${nomeMotorista}"?`)) {
      return;
    }

    try {
      await fechamentoService.delete(id);
      setFechamentos(fechamentos.filter(f => f.id !== id));
      alert('Fechamento excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir fechamento:', error);
      alert('Erro ao excluir fechamento. Tente novamente.');
    }
  };

  const gerarRelatorioPDF = async (fechamentoId: number) => {
    try {
      const fechamentoDetalhado = await fechamentoService.getById(fechamentoId);
      if (fechamentoDetalhado) {
        await pdfService.gerarRelatorioFechamento(fechamentoDetalhado);
      } else {
        alert('Fechamento não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      alert('Erro ao gerar relatório PDF.');
    }
  };

  const gerarRelatorioConsolidado = async () => {
    try {
      if (fechamentos.length === 0) {
        alert('Nenhum fechamento disponível para gerar relatório.');
        return;
      }
      
      const periodo = gerarPeriodos().find(p => p.valor === selectedPeriodo)?.nome || selectedPeriodo;
      await pdfService.gerarRelatorioConsolidado(fechamentos, periodo);
    } catch (error) {
      console.error('Erro ao gerar relatório consolidado:', error);
      alert('Erro ao gerar relatório consolidado.');
    }
  };

  const gerarPeriodos = () => {
    const periodos = [];
    const hoje = new Date();
    
    for (let i = 0; i < 12; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mes = (data.getMonth() + 1).toString().padStart(2, '0');
      const ano = data.getFullYear();
      const valor = `${mes}/${ano}`;
      const nome = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      periodos.push({ valor, nome: nome.charAt(0).toUpperCase() + nome.slice(1) });
    }
    
    return periodos;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return '#ffc107';
      case 'Pago': return '#28a745';
      case 'Atrasado': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="fechamento-motoristas">
        <div className="page-header">
          <h1>Fechamento Motoristas Terceiros</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Carregando fechamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fechamento-motoristas">
      <div className="page-header">
        <h1>Fechamento de Motoristas</h1>
        <div className="header-actions">
          <select 
            value={selectedPeriodo}
            onChange={(e) => setSelectedPeriodo(e.target.value)}
            className="periodo-select"
          >
            {gerarPeriodos().map(periodo => (
              <option key={periodo.valor} value={periodo.valor}>
                {periodo.nome}
              </option>
            ))}
          </select>
          <button 
            className="btn-primary"
            onClick={calcularFechamento}
            disabled={calculandoFechamento}
          >
            <Calculator size={20} />
            {calculandoFechamento ? 'Calculando...' : 'Calcular Fechamento'}
          </button>
          {fechamentos.length > 0 && (
            <button 
              className="btn-secondary"
              onClick={gerarRelatorioConsolidado}
              title="Gerar Relatório Consolidado em PDF"
            >
              <FileText size={20} />
              Relatório Consolidado
            </button>
          )}
        </div>
      </div>

      <div className="resumo-periodo">
        <h2>Resumo do Período - {gerarPeriodos().find(p => p.valor === selectedPeriodo)?.nome}</h2>
        <div className="resumo-cards">
          <div className="resumo-card">
            <h3>Total de Motoristas</h3>
            <p className="valor-destaque">{fechamentos.length}</p>
          </div>
          <div className="resumo-card">
            <h3>Total de Fretes</h3>
            <p className="valor-destaque">
              {fechamentos.reduce((sum, f) => sum + f.total_fretes, 0)}
            </p>
          </div>
          <div className="resumo-card">
            <h3>Valor Bruto Total</h3>
            <p className="valor-destaque">
              {formatCurrency(fechamentos.reduce((sum, f) => sum + f.valor_bruto, 0))}
            </p>
          </div>
          <div className="resumo-card">
            <h3>Total de Comissões</h3>
            <p className="valor-destaque">
              {formatCurrency(fechamentos.reduce((sum, f) => sum + f.valor_comissao, 0))}
            </p>
          </div>
          <div className="resumo-card">
            <h3>Total de Bônus</h3>
            <p className="valor-destaque">
              {formatCurrency(fechamentos.reduce((sum, f) => sum + (f.bonus || 0), 0))}
            </p>
          </div>
        </div>
      </div>

      <div className="table-container">
        {fechamentos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Nenhum fechamento encontrado para este período.</p>
            <p>Clique em "Calcular Fechamento" para processar os fretes do período.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Motorista</th>
                <th>Tipo</th>
                <th>Período</th>
                <th>Qtd Fretes</th>
                <th>Valor Bruto</th>
                <th>Comissão</th>
                <th>Descontos</th>
                <th>Bônus</th>
                <th>Valor Líquido</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fechamentos.map((fechamento) => (
                <tr key={fechamento.id}>
                  <td>{fechamento.motorista?.nome || 'Nome não encontrado'}</td>
                  <td>{fechamento.motorista?.tipo_motorista || '-'}</td>
                  <td>{fechamento.periodo}</td>
                  <td>{fechamento.total_fretes}</td>
                  <td>{formatCurrency(fechamento.valor_bruto)}</td>
                  <td>
                    {formatCurrency(fechamento.valor_comissao)}
                    <small style={{ display: 'block', color: '#666' }}>
                      {fechamento.motorista?.porcentagem_comissao 
                        ? `(${fechamento.motorista.porcentagem_comissao}%)`
                        : fechamento.motorista?.tipo_motorista === 'Terceiro' ? '(90%)' : '(10%)'
                      }
                    </small>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{formatCurrency(fechamento.descontos || 0)}</span>
                      <button
                        onClick={() => fechamento.id && recalcularDescontos(fechamento.id)}
                        style={{ 
                          padding: '2px 6px', 
                          fontSize: '10px', 
                          background: '#17a2b8', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                        title="Recalcular descontos baseado nos vales atuais"
                      >
                        ↻
                      </button>
                    </div>
                  </td>
                  <td>
                    {editandoBonus === fechamento.id ? (
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={novoBonus}
                          onChange={(e) => setNovoBonus(e.target.value)}
                          style={{ width: '80px', padding: '2px 4px' }}
                          placeholder="0.00"
                        />
                        <button 
                          onClick={() => fechamento.id && salvarBonus(fechamento.id)}
                          style={{ padding: '2px 6px', fontSize: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px' }}
                        >
                          ✓
                        </button>
                        <button 
                          onClick={cancelarEdicaoBonus}
                          style={{ padding: '2px 6px', fontSize: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div 
                        style={{ cursor: 'pointer', padding: '4px' }}
                        onClick={() => fechamento.id && iniciarEdicaoBonus(fechamento.id, fechamento.bonus || 0)}
                        title="Clique para editar bônus"
                      >
                        {formatCurrency(fechamento.bonus || 0)}
                      </div>
                    )}
                  </td>
                  <td>{formatCurrency(fechamento.valor_liquido)}</td>
                  <td>
                    <select
                      value={fechamento.status}
                      onChange={(e) => fechamento.id && atualizarStatus(fechamento.id, e.target.value)}
                      style={{ 
                        backgroundColor: getStatusColor(fechamento.status),
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px'
                      }}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Pago">Pago</option>
                      <option value="Atrasado">Atrasado</option>
                    </select>
                  </td>
                  <td>
                    <div className="actions">
                      <button 
                        className="btn-action"
                        onClick={() => fechamento.id && gerarRelatorioPDF(fechamento.id)}
                        title="Gerar Relatório PDF"
                      >
                        <FileText size={16} />
                      </button>
                      <button className="btn-action" title="Ver Detalhes">
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn-action"
                        onClick={() => fechamento.id && gerarRelatorioPDF(fechamento.id)}
                        title="Baixar Relatório PDF"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        className="btn-action btn-danger"
                        onClick={() => fechamento.id && deletarFechamento(fechamento.id, fechamento.motorista?.nome || 'Motorista')}
                        title="Excluir Fechamento"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FechamentoMotoristas; 