import React, { useState, useMemo } from 'react';
import { Receipt, CheckSquare, Square } from 'lucide-react';
import { Frete } from '../../../services/freteService';
import { formatCurrency, formatDate, getSituacaoClass } from '../utils';

interface ControleFreteReciboProps {
  fretes: Frete[];
  clientesCadastro: { id: number; razao_social: string; cpf_cnpj?: string }[];
  onGerarRecibo: (clienteNome: string, clienteCpfCnpj: string | undefined, fretesSelecionados: Frete[]) => void;
}

export const ControleFreteRecibo: React.FC<ControleFreteReciboProps> = ({
  fretes,
  clientesCadastro,
  onGerarRecibo
}) => {
  // Estados locais de filtros
  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  
  // Estado local de seleção de checkboxes
  const [selecionados, setSelecionados] = useState<number[]>([]);

  // Filtragem local dos fretes: apenas do cliente selecionado, e APENAS com situação = 'Pago'
  const fretesFiltrados = useMemo(() => {
    if (!clienteSelecionado) return [];

    const clienteId = parseInt(clienteSelecionado);
    const clienteObj = clientesCadastro.find(c => c.id === clienteId);
    
    return fretes.filter(f => {
      // 1. Filtrar estritamente por situação 'Pago'
      if (f.situacao !== 'Pago') return false;

      // 2. Filtrar por cliente
      if (!isNaN(clienteId)) {
        if (f.cliente_id !== clienteId) {
          // Fallback para nomes legados se cliente_id não bater
          if (clienteObj && f.cliente !== clienteObj.razao_social) {
            return false;
          }
        }
      } else {
        if (f.cliente !== clienteSelecionado) return false;
      }

      // 3. Filtrar por período de data
      if (dataInicio || dataFim) {
        if (f.data_emissao) {
          const [yFrete, mFrete, dFrete] = f.data_emissao.split('T')[0].split('-').map(Number);
          const dataFreteCalc = new Date(yFrete, mFrete - 1, dFrete).getTime();

          if (dataInicio) {
            const [yIni, mIni, dIni] = dataInicio.split('-').map(Number);
            if (dataFreteCalc < new Date(yIni, mIni - 1, dIni).getTime()) return false;
          }
          
          if (dataFim) {
            const [yFim, mFim, dFim] = dataFim.split('-').map(Number);
            if (dataFreteCalc > new Date(yFim, mFim - 1, dFim).getTime()) return false;
          }
        } else {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(a.data_emissao).getTime() - new Date(b.data_emissao).getTime());
  }, [fretes, clienteSelecionado, clientesCadastro, dataInicio, dataFim]);

  // Resetar seleções ao mudar de cliente ou de filtros
  React.useEffect(() => {
    setSelecionados([]);
  }, [clienteSelecionado, dataInicio, dataFim]);

  // Alternar a seleção de um frete individual
  const toggleSelect = (id: number) => {
    setSelecionados(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Alternar a seleção de todos os fretes visíveis filtrados
  const toggleSelectAll = () => {
    if (selecionados.length === fretesFiltrados.length && fretesFiltrados.length > 0) {
      setSelecionados([]);
    } else {
      setSelecionados(fretesFiltrados.map(f => f.id).filter((id): id is number => typeof id === 'number'));
    }
  };

  // Obter a soma total selecionada
  const valorTotalSelecionado = useMemo(() => {
    return fretesFiltrados
      .filter(f => f.id !== undefined && selecionados.includes(f.id))
      .reduce((sum, f) => sum + (f.valor_frete || 0), 0);
  }, [fretesFiltrados, selecionados]);

  // Disparar geração do recibo consolidado
  const handleGerar = () => {
    if (selecionados.length === 0) {
      alert('Selecione pelo menos um frete para gerar o recibo.');
      return;
    }

    const clienteObj = clientesCadastro.find(c => c.id === parseInt(clienteSelecionado));
    const clienteNome = clienteObj?.razao_social || 'Cliente não identificado';
    const clienteCpfCnpj = clienteObj?.cpf_cnpj;

    const fretesParaRecibo = fretesFiltrados.filter(
      f => f.id !== undefined && selecionados.includes(f.id)
    );

    onGerarRecibo(clienteNome, clienteCpfCnpj, fretesParaRecibo);
  };

  return (
    <div className="recibo-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Seção de Filtros */}
      <div className="acerto-filters">
        <h3>
          <Receipt size={18} style={{ marginRight: '8px' }} />
          Emissão de Recibo de Fretes Pagos
        </h3>
        <div className="filter-row" style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="filter-group" style={{ flex: '1', minWidth: '250px' }}>
            <label>Cliente *</label>
            <select
              value={clienteSelecionado}
              onChange={(e) => setClienteSelecionado(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">Selecione um cliente para gerar recibo</option>
              {clientesCadastro.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.razao_social}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group" style={{ width: '150px' }}>
            <label>Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div className="filter-group" style={{ width: '150px' }}>
            <label>Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        </div>
      </div>

      {/* Banner Informativo / Acumulador */}
      {clienteSelecionado && fretesFiltrados.length > 0 && (
        <div 
          className="recibo-summary-banner" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            backgroundColor: '#fdf3f3', 
            borderLeft: '5px solid #8b0000', 
            padding: '15px 20px', 
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ fontSize: '0.9em', color: '#666' }}>
              Cliente: <strong>{clientesCadastro.find(c => c.id === parseInt(clienteSelecionado))?.razao_social}</strong>
            </span>
            <span style={{ fontSize: '1.1em', color: '#333' }}>
              Selecionados: <strong>{selecionados.length}</strong> de <strong>{fretesFiltrados.length}</strong> fretes pagos no período.
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85em', color: '#666', textTransform: 'uppercase' }}>Valor Total Selecionado</div>
              <div style={{ fontSize: '1.6em', fontWeight: 'bold', color: '#8b0000' }}>
                {formatCurrency(valorTotalSelecionado)}
              </div>
            </div>
            
            <button
              onClick={handleGerar}
              disabled={selecionados.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: selecionados.length === 0 ? '#cccccc' : '#8b0000',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '4px',
                fontSize: '1em',
                fontWeight: 'bold',
                cursor: selecionados.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                boxShadow: '0 2px 4px rgba(139,0,0,0.2)'
              }}
            >
              <Receipt size={18} />
              Gerar Recibo Consolidado
            </button>
          </div>
        </div>
      )}

      {/* Tabela de Seleção */}
      {clienteSelecionado && fretesFiltrados.length > 0 && (
        <div className="table-container">
          <table className="data-table frete-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>
                  <div 
                    onClick={toggleSelectAll} 
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Selecionar Todos"
                  >
                    {selecionados.length === fretesFiltrados.length && fretesFiltrados.length > 0 ? (
                      <CheckSquare size={20} color="#8b0000" />
                    ) : (
                      <Square size={20} color="#666" />
                    )}
                  </div>
                </th>
                <th>Data</th>
                <th>Minuta / CB</th>
                <th>Pecuarista</th>
                <th>Origem → Destino</th>
                <th>Meio Pagto</th>
                <th>Data Pagto</th>
                <th>Situação</th>
                <th style={{ textAlign: 'right' }}>Valor Frete</th>
              </tr>
            </thead>
            <tbody>
              {fretesFiltrados.map((frete) => {
                const isChecked = frete.id !== undefined && selecionados.includes(frete.id);
                return (
                  <tr 
                    key={frete.id} 
                    onClick={() => frete.id !== undefined && toggleSelect(frete.id)}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: isChecked ? '#fffafb' : undefined,
                      transition: 'background-color 0.1s'
                    }}
                  >
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <div 
                        onClick={() => frete.id !== undefined && toggleSelect(frete.id)} 
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {isChecked ? (
                          <CheckSquare size={20} color="#8b0000" />
                        ) : (
                          <Square size={20} color="#666" />
                        )}
                      </div>
                    </td>
                    <td>{formatDate(frete.data_emissao)}</td>
                    <td>{frete.numero_minuta || frete.numero_cb || '-'}</td>
                    <td>{frete.pecuarista}</td>
                    <td>{frete.origem} → {frete.destino}</td>
                    <td>{frete.tipo_pagamento || '-'}</td>
                    <td>{frete.data_pagamento ? formatDate(frete.data_pagamento) : '-'}</td>
                    <td>
                      <span className={`status ${getSituacaoClass(frete.situacao)}`}>
                        {frete.situacao}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {formatCurrency(frete.valor_frete)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Estados Vazios */}
      {clienteSelecionado && fretesFiltrados.length === 0 && (
        <div className="empty-state" style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed #ccc', borderRadius: '4px', color: '#666' }}>
          <Receipt size={40} style={{ marginBottom: '10px', color: '#999' }} />
          <p style={{ fontSize: '1.1em', fontWeight: 'bold' }}>Nenhum frete pago encontrado</p>
          <p style={{ fontSize: '0.9em' }}>
            Não encontramos viagens com o status <strong>"Pago"</strong> para o cliente selecionado no período informado.
          </p>
        </div>
      )}

      {!clienteSelecionado && (
        <div className="empty-state" style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed #ccc', borderRadius: '4px', color: '#666' }}>
          <Receipt size={40} style={{ marginBottom: '10px', color: '#999' }} />
          <p style={{ fontSize: '1.1em', fontWeight: 'bold' }}>Aguardando seleção de cliente</p>
          <p style={{ fontSize: '0.9em' }}>Escolha um cliente acima para listar os fretes quitados e emitir o recibo unificado.</p>
        </div>
      )}
    </div>
  );
};
