import React, { useState } from 'react';
import { capaService, TransporteParaCapa, TransporteAgrupado } from '../../services/capaService';
import './CapaTransporte.css';

const CapaTransporte: React.FC = () => {
  const [dataEmbarque, setDataEmbarque] = useState('');
  const [transportes, setTransportes] = useState<TransporteParaCapa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buscarTransportes = async () => {
    if (!dataEmbarque) return;
    
    setLoading(true);
    setError('');
    
    try {
      const transportesEncontrados = await capaService.getTransportesByData(dataEmbarque);
      setTransportes(transportesEncontrados);
    } catch (err) {
      setError('Erro ao buscar transportes: ' + (err as Error).message);
      setTransportes([]);
    } finally {
      setLoading(false);
    }
  };

  const gerarCapa = async () => {
    if (transportes.length === 0) return;
    
    setLoading(true);
    try {
      if (deveAgrupar()) {
        const grupos = agruparTransportes(transportes);
        await capaService.gerarCapaPDFAgrupado(grupos, dataEmbarque);
      } else {
        await capaService.gerarCapaPDFColorido(transportes, dataEmbarque);
      }
    } catch (err) {
      setError('Erro ao gerar PDF: ' + (err as Error).message);
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

  const agruparTransportes = (transportesParaAgrupar: TransporteParaCapa[]): TransporteAgrupado[] => {
    const grupos: { [key: string]: TransporteAgrupado } = {};
    
    transportesParaAgrupar.forEach(transporte => {
      // Normalizar dados para evitar problemas de agrupamento
      const origem = transporte.origem.trim().toUpperCase();
      const destino = transporte.destino.trim().toUpperCase();
      const cliente = transporte.cliente.trim().toUpperCase();
      
      const chaveGrupo = `${origem}-${destino}-${cliente}`;
      
      if (!grupos[chaveGrupo]) {
        grupos[chaveGrupo] = {
          rota: `${transporte.origem} - ${transporte.destino}`, // Manter formato original para exibição
          origem: transporte.origem,
          destino: transporte.destino,
          cliente: transporte.cliente,
          valorTotal: 0,
          transportes: []
        };
      }
      
      grupos[chaveGrupo].transportes.push(transporte);
      grupos[chaveGrupo].valorTotal += transporte.valor_frete;
    });
    
    return Object.values(grupos);
  };

  // Verificar se deve agrupar automaticamente (se há rotas duplicadas com mesmo cliente)
  const deveAgrupar = () => {
    const rotasClientes = new Set();
    for (const transporte of transportes) {
      const origem = transporte.origem.trim().toUpperCase();
      const destino = transporte.destino.trim().toUpperCase();
      const cliente = transporte.cliente.trim().toUpperCase();
      const chave = `${origem}-${destino}-${cliente}`;
      
      if (rotasClientes.has(chave)) {
        return true; // Encontrou rota duplicada com mesmo cliente
      }
      rotasClientes.add(chave);
    }
    return false; // Não há rotas duplicadas com mesmo cliente
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
                  onClick={gerarCapa}
                  disabled={loading}
                  className="btn-gerar-capa"
                >
                  {loading ? 'Gerando...' : 'Gerar Capa PDF'}
                </button>
              </div>
            </div>

            {/* Vista Normal */}
            {!agrupamentoAutomatico && (
              <div className="transportes-lista">
                <div className="transportes-header">
                  <div className="header-rota">Origem / Destino</div>
                  <div className="header-cliente">Cliente</div>
                  <div className="header-motorista">Motorista</div>
                  <div className="header-caminhao">Caminhão</div>
                  <div className="header-valor">Valor</div>
                </div>

                {transportes.map((transporte) => (
                  <div 
                    key={transporte.id} 
                    className={`transporte-item ${getClienteColorClass(transporte.cliente)}`}
                  >
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
                {agruparTransportes(transportes).map((grupo, index) => (
                  <div key={`${grupo.rota}-${grupo.cliente}-${index}`} className={`grupo-transporte ${getClienteColorClass(grupo.cliente)}`}>
                    <div className="grupo-header">
                      <div className="grupo-info">
                        <div className="grupo-rota">📍 {grupo.rota}</div>
                        <div className="grupo-cliente">📋 Cliente: {grupo.cliente}</div>
                      </div>
                    </div>
                    
                    <div className="grupo-transportes">
                      {grupo.transportes.map((transporte, index) => (
                        <div key={transporte.id} className="grupo-item">
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
                ))}
              </div>
            )}

            {/* Resumo */}
            <div className="resumo-section">
              <h4>📋 Resumo Total</h4>
              <div className="resumo-stats">
                <span>Transportes: {transportes.length}</span>
                <span>
                  Valor Total: {formatCurrency(
                    transportes.reduce((sum, t) => sum + t.valor_frete, 0)
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