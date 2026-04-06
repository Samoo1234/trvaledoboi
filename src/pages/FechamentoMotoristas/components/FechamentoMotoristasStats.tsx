import React from 'react';
import { FechamentoMotorista } from '../../../services/fechamentoService';

interface FechamentoMotoristasStatsProps {
  modoFiltro: 'mensal' | 'periodo' | 'motorista';
  selectedPeriodo: string;
  gerarPeriodos: () => Array<{ valor: string; nome: string }>;
  filtrosPeriodo: { dataInicio: string; dataFim: string };
  motoristasSelecionado: number | null;
  motoristas: Array<{ id: number; nome: string; tipo_motorista: string }>;
  filtrosMotorista: { dataInicio: string; dataFim: string };
  filtroTipoMotorista: string;
  dadosTemporarios: boolean;
  fechamentosFiltrados: FechamentoMotorista[];
  formatCurrency: (value: number) => string;
}

const FechamentoMotoristasStats: React.FC<FechamentoMotoristasStatsProps> = ({
  modoFiltro,
  selectedPeriodo,
  gerarPeriodos,
  filtrosPeriodo,
  motoristasSelecionado,
  motoristas,
  filtrosMotorista,
  filtroTipoMotorista,
  dadosTemporarios,
  fechamentosFiltrados,
  formatCurrency
}) => {
  return (
    <>
      <div className="resumo-periodo">
        <h2>
          Resumo do Período - {
            modoFiltro === 'mensal' 
              ? gerarPeriodos().find(p => p.valor === selectedPeriodo)?.nome
              : modoFiltro === 'periodo' && filtrosPeriodo.dataInicio && filtrosPeriodo.dataFim 
                ? `${filtrosPeriodo.dataInicio.split('-').reverse().join('/')} a ${filtrosPeriodo.dataFim.split('-').reverse().join('/')}`
                : modoFiltro === 'motorista' && motoristasSelecionado
                  ? `${filtrosMotorista.dataInicio && filtrosMotorista.dataFim 
                      ? `Período ${filtrosMotorista.dataInicio.split('-').reverse().join('/')} a ${filtrosMotorista.dataFim.split('-').reverse().join('/')} - ` 
                      : 'Histórico - '}${motoristas.find(m => m.id === motoristasSelecionado)?.nome || 'Motorista'}`
                  : modoFiltro === 'periodo' 
                    ? 'Período não selecionado'
                    : 'Motorista não selecionado'
          }
          {filtroTipoMotorista !== 'Todos' && (
            <span style={{ color: '#007bff', fontSize: '0.9em', fontWeight: 'normal' }}>
              {' '}(Filtro: {filtroTipoMotorista})
            </span>
          )}
          {dadosTemporarios && (
            <span style={{ 
              backgroundColor: '#fff3cd', 
              color: '#856404', 
              padding: '4px 8px', 
              borderRadius: '4px', 
              fontSize: '0.8em', 
              fontWeight: 'normal',
              marginLeft: '10px',
              border: '1px solid #ffeaa7'
            }}>
              📊 Dados calculados em tempo real
            </span>
          )}
        </h2>
        <div className="resumo-cards">
          <div className="resumo-card">
            <h3>Total de Motoristas</h3>
            <p className="valor-destaque">{fechamentosFiltrados.length}</p>
          </div>
          <div className="resumo-card">
            <h3>Total de Fretes</h3>
            <p className="valor-destaque">
              {fechamentosFiltrados.reduce((sum, f) => sum + f.total_fretes, 0)}
            </p>
          </div>
          <div className="resumo-card">
            <h3>Valor Bruto Total</h3>
            <p className="valor-destaque">
              {formatCurrency(fechamentosFiltrados.reduce((sum, f) => sum + f.valor_bruto, 0))}
            </p>
          </div>
          <div className="resumo-card">
            <h3>Total de Comissões</h3>
            <p className="valor-destaque">
              {formatCurrency(fechamentosFiltrados.reduce((sum, f) => sum + f.valor_comissao, 0))}
            </p>
          </div>
          <div className="resumo-card">
            <h3>Total de Bônus</h3>
            <p className="valor-destaque">
              {formatCurrency(fechamentosFiltrados.reduce((sum, f) => sum + (f.bonus || 0), 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Aviso para dados temporários */}
      {dadosTemporarios && (
        <div style={{
          backgroundColor: '#e7f3ff', 
          border: '1px solid #b8daff', 
          borderRadius: '4px', 
          padding: '12px', 
          margin: '15px 0',
          fontSize: '14px',
          color: '#004085'
        }}>
          <strong>ℹ️ Informação:</strong> Os dados exibidos foram calculados em tempo real para o período selecionado. 
          Estes são dados temporários e não foram salvos permanentemente. Para salvar um fechamento oficial, 
          utilize o modo "Por Mês" e clique em "Calcular Fechamento".
        </div>
      )}
    </>
  );
};

export default FechamentoMotoristasStats;
