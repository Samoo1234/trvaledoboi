import React, { useState } from 'react';
import { capaService, TransporteParaCapa, TransporteAgrupado } from '../../services/capaService';
import './CapaTransporte.css';

const CapaTransporte: React.FC = () => {
  const [dataEmbarque, setDataEmbarque] = useState('');
  const [transportes, setTransportes] = useState<TransporteParaCapa[]>([]);
  const [transportesSelecionados, setTransportesSelecionados] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const buscarTransportes = async () => {
    if (!dataEmbarque) {
      setError('Por favor, selecione uma data de embarque');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const dados = await capaService.getTransportesByData(dataEmbarque);
      setTransportes(dados);
      setTransportesSelecionados(dados.map(t => t.id)); // Selecionar todos por padrão
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar transportes');
      setTransportes([]);
      setTransportesSelecionados([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTransporteToggle = (id: number) => {
    setTransportesSelecionados(prev => 
      prev.includes(id) 
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
  };

  const handleGrupoToggle = (transportesDoGrupo: TransporteParaCapa[]) => {
    const idsDoGrupo = transportesDoGrupo.map(t => t.id);
    const todosSelecionados = idsDoGrupo.every(id => transportesSelecionados.includes(id));
    
    if (todosSelecionados) {
      // Desmarcar todos do grupo
      setTransportesSelecionados(prev => prev.filter(id => !idsDoGrupo.includes(id)));
    } else {
      // Selecionar todos do grupo
      setTransportesSelecionados(prev => {
        const novosIds = [...prev, ...idsDoGrupo];
        return Array.from(new Set(novosIds));
      });
    }
  };

  const selecionarTodos = () => {
    if (transportesSelecionados.length === transportes.length) {
      setTransportesSelecionados([]);
    } else {
      setTransportesSelecionados(transportes.map(t => t.id));
    }
  };

  const gerarCapa = async () => {
    const transportesFiltrados = transportes.filter(t => 
      transportesSelecionados.includes(t.id)
    );

    if (transportesFiltrados.length === 0) {
      setError('Selecione pelo menos um transporte para gerar a capa');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      if (agrupamentoAutomatico) {
        const grupos = agruparTransportes(transportesFiltrados);
        await capaService.gerarCapaPDFAgrupado(grupos, dataEmbarque);
      } else {
        await capaService.gerarCapaPDFColorido(transportesFiltrados, dataEmbarque);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar capa PDF');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para agrupar transportes por itinerário
  const agruparTransportes = (transportesParaAgrupar: TransporteParaCapa[]): TransporteAgrupado[] => {
    const grupos: { [key: string]: TransporteAgrupado } = {};

    transportesParaAgrupar.forEach(transporte => {
      const chave = `${transporte.origem} - ${transporte.destino}`;
      
      if (!grupos[chave]) {
        grupos[chave] = {
          rota: chave,
          origem: transporte.origem,
          destino: transporte.destino,
          cliente: transporte.cliente,
          valorTotal: 0,
          transportes: []
        };
      }
      
      grupos[chave].transportes.push(transporte);
      grupos[chave].valorTotal += transporte.valor_frete;
    });

    // Ordenar grupos por origem
    return Object.values(grupos).sort((a, b) => a.origem.localeCompare(b.origem));
  };

  // Verificar se deve agrupar automaticamente (se há rotas duplicadas)
  const deveAgrupar = () => {
    const rotas = new Set();
    for (const transporte of transportes) {
      const rota = `${transporte.origem} - ${transporte.destino}`;
      if (rotas.has(rota)) {
        return true; // Encontrou rota duplicada
      }
      rotas.add(rota);
    }
    return false; // Não há rotas duplicadas
  };

  const agrupamentoAutomatico = deveAgrupar();

  const getClienteColorClass = (cliente: string) => {
    return cliente.toUpperCase().includes('BARRA ALIMENTOS') ? 'grupo-barra' : 'grupo-outros';
  };

  return (
    <div className="capa-transporte">
      <div className="capa-header">
        <h1>📄 Geração de Capa de Transporte</h1>
      </div>

      <div className="capa-content">
        {/* Filtros */}
        <div className="filtros-section">
          <div className="filtro-data">
            <label htmlFor="dataEmbarque">📅 Data de Embarque:</label>
            <input
              type="date"
              id="dataEmbarque"
              value={dataEmbarque}
              onChange={(e) => setDataEmbarque(e.target.value)}
            />
            <button 
              onClick={buscarTransportes}
              disabled={loading || !dataEmbarque}
              className="btn-buscar"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* Resultados */}
        {transportes.length > 0 && (
          <div className="resultados-section">
            <div className="resultados-header">
              <h3>📊 Transportes Encontrados: {transportes.length}</h3>
              <div className="acoes">
                <button 
                  onClick={selecionarTodos}
                  className="btn-selecionar-todos"
                >
                  {transportesSelecionados.length === transportes.length 
                    ? 'Desmarcar Todos' 
                    : 'Selecionar Todos'
                  }
                </button>
                <button 
                  onClick={gerarCapa}
                  disabled={loading || transportesSelecionados.length === 0}
                  className="btn-gerar-capa"
                >
                  {loading ? 'Gerando...' : `Gerar Capa PDF (${transportesSelecionados.length})`}
                </button>
              </div>
            </div>

            {/* Vista Normal */}
            {!agrupamentoAutomatico && (
              <div className="transportes-lista">
                <div className="transportes-header">
                  <div className="header-checkbox">Sel.</div>
                  <div className="header-rota">Origem / Destino</div>
                  <div className="header-cliente">Cliente</div>
                  <div className="header-motorista">Motorista</div>
                  <div className="header-caminhao">Caminhão</div>
                  <div className="header-valor">Valor</div>
                </div>

                {transportes.map((transporte) => (
                  <div 
                    key={transporte.id} 
                    className={`transporte-item ${getClienteColorClass(transporte.cliente)} ${transportesSelecionados.includes(transporte.id) ? 'selecionado' : ''}`}
                  >
                    <div className="item-checkbox">
                      <input
                        type="checkbox"
                        checked={transportesSelecionados.includes(transporte.id)}
                        onChange={() => handleTransporteToggle(transporte.id)}
                      />
                    </div>
                    <div className="item-rota">
                      <strong>{transporte.origem}</strong> - <strong>{transporte.destino}</strong>
                    </div>
                    <div className="item-cliente">{transporte.cliente}</div>
                    <div className="item-motorista">{transporte.motorista}</div>
                    <div className="item-caminhao">
                      {transporte.caminhao_placa} ({transporte.caminhao_tipo})
                    </div>
                    <div className="item-valor">{formatCurrency(transporte.valor_frete)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Vista Agrupada */}
            {agrupamentoAutomatico && (
              <div className="transportes-agrupados">
                {agruparTransportes(transportes).map((grupo) => {
                  const todosSelecionados = grupo.transportes.every(t => transportesSelecionados.includes(t.id));
                  const algumSelecionado = grupo.transportes.some(t => transportesSelecionados.includes(t.id));
                  
                  return (
                    <div key={grupo.rota} className={`grupo-transporte ${getClienteColorClass(grupo.cliente)}`}>
                      <div className="grupo-header">
                        <div className="grupo-checkbox">
                          <input
                            type="checkbox"
                            checked={todosSelecionados}
                            ref={input => {
                              if (input) input.indeterminate = algumSelecionado && !todosSelecionados;
                            }}
                            onChange={() => handleGrupoToggle(grupo.transportes)}
                          />
                        </div>
                        <div className="grupo-info">
                          <div className="grupo-rota">📍 {grupo.rota}</div>
                          <div className="grupo-cliente">📋 Cliente: {grupo.cliente}</div>
                          <div className="grupo-valor">💰 Valor Total: {formatCurrency(grupo.valorTotal)}</div>
                        </div>
                      </div>
                      
                      <div className="grupo-transportes">
                        {grupo.transportes.map((transporte, index) => (
                          <div key={transporte.id} className="grupo-item">
                            <div className="item-checkbox">
                              <input
                                type="checkbox"
                                checked={transportesSelecionados.includes(transporte.id)}
                                onChange={() => handleTransporteToggle(transporte.id)}
                              />
                            </div>
                            <div className="item-info">
                              <div className="item-motorista">
                                {index === grupo.transportes.length - 1 ? '└─' : '├─'} 🚛 {transporte.motorista}
                              </div>
                              <div className="item-caminhao">
                                &nbsp;&nbsp;&nbsp;&nbsp;🚚 {transporte.caminhao_placa} - {transporte.caminhao_tipo}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Resumo */}
            <div className="resumo-section">
              <h4>📋 Resumo dos Selecionados</h4>
              <div className="resumo-stats">
                <span>Transportes: {transportesSelecionados.length}</span>
                <span>
                  Valor Total: {formatCurrency(
                    transportes
                      .filter(t => transportesSelecionados.includes(t.id))
                      .reduce((sum, t) => sum + t.valor_frete, 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {!loading && transportes.length === 0 && dataEmbarque && (
          <div className="empty-state">
            <p>📭 Nenhum transporte encontrado para a data selecionada.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CapaTransporte; 