import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Frete } from '../../../services/freteService';
import { Caminhao } from '../../../services/caminhaoService';
import { Motorista } from '../../../services/motoristaService';
import { Reboque } from '../../../services/reboqueService';
import { FreteCaminhao } from '../../../services/freteCaminhaoService';
import { FreteMotorista } from '../../../services/freteMotoristaService';
import { getSituacaoClass, formatDate, formatCurrency, calcularValoresPorCaminhao } from '../utils';

interface ControleFreteTableProps {
  fretesFiltrados: Frete[];
  fretesSelecionados: number[];
  vinculosCaminhoes: { [freteId: number]: FreteCaminhao[] };
  vinculosMotoristas: { [freteId: number]: FreteMotorista[] };
  caminhoes: Caminhao[];
  motoristas: Motorista[];
  reboques: Reboque[];
  filtroSituacao: string;
  toggleSelecionarTodos: () => void;
  toggleSelecionarFrete: (id: number) => void;
  handleEdit: (frete: Frete) => void;
  handleDelete: (id: number) => void;
}

export const ControleFreteTable: React.FC<ControleFreteTableProps> = ({
  fretesFiltrados,
  fretesSelecionados,
  vinculosCaminhoes,
  vinculosMotoristas,
  caminhoes,
  motoristas,
  reboques,
  filtroSituacao,
  toggleSelecionarTodos,
  toggleSelecionarFrete,
  handleEdit,
  handleDelete
}) => {
  return (
    <div className="table-container">
      <div className="scroll-indicator">
        ← Arraste para ver mais colunas →
      </div>
      <table className="data-table frete-table">
        <thead>
          <tr>
            <th>Situação</th>
            <th>Data</th>
            <th>Pecuarista</th>
            <th>Origem</th>
            <th>Destino</th>
            <th>Nº Minuta</th>
            <th>Nº CB</th>
            <th>Cliente</th>
            <th>Placa</th>
            <th>Tipo de Veículo</th>
            <th>Motorista</th>
            <th>Faixa</th>
            <th>Total KM</th>
            <th>Valor Frete</th>
            <th>Valores Detalhados</th>
            <th>Tipo Pagamento</th>
            <th>Data Pagamento</th>
            <th>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={fretesSelecionados.length === fretesFiltrados.length && fretesFiltrados.length > 0}
                  onChange={toggleSelecionarTodos}
                  title="Selecionar todos"
                  style={{ cursor: 'pointer' }}
                />
                Ações
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {fretesFiltrados.length === 0 ? (
            <tr>
              <td colSpan={18} style={{ textAlign: 'center', padding: '2rem' }}>
                {filtroSituacao ? `Nenhum frete com situação "${filtroSituacao}"` : 'Nenhum frete cadastrado'}
              </td>
            </tr>
          ) : (
            fretesFiltrados.map((frete) => (
              <tr key={frete.id}>
                <td>
                  <span className={`situacao ${getSituacaoClass(frete.situacao)}`}>
                    {frete.situacao}
                  </span>
                </td>
                <td>{formatDate(frete.data_emissao)}</td>
                <td>{frete.pecuarista}</td>
                <td>{frete.origem}</td>
                <td>{frete.destino}</td>
                <td>{frete.numero_minuta || '-'}</td>
                <td>{frete.numero_cb || '-'}</td>
                <td>{frete.clienteData?.razao_social || frete.cliente || '-'}</td>
                <td>
                  {vinculosCaminhoes[frete.id!] && vinculosCaminhoes[frete.id!].length > 0 ? (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {vinculosCaminhoes[frete.id!].map((v, i) => {
                        const cam = caminhoes.find(c => c.id === v.caminhao_id);
                        return (
                          <li key={i}>{cam ? cam.placa : v.caminhao_id}</li>
                        );
                      })}
                    </ul>
                  ) : '-'}
                </td>
                <td>
                  {vinculosCaminhoes[frete.id!] && vinculosCaminhoes[frete.id!].length > 0 ? (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {vinculosCaminhoes[frete.id!].map((item, i) => (
                        <li key={i}>
                          {item.configuracao === 'Truck'
                            ? 'Truck'
                            : `${item.configuracao}${item.reboque_id ? ` (${reboques.find(r => r.id === item.reboque_id)?.placa || ''})` : ''}`}
                        </li>
                      ))}
                    </ul>
                  ) : '-'}
                </td>
                <td>
                  {vinculosMotoristas[frete.id!] && vinculosMotoristas[frete.id!].length > 0 ? (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {vinculosMotoristas[frete.id!].map((v, i) => {
                        const mot = motoristas.find(m => m.id === v.motorista_id);
                        return (
                          <li key={i}>{mot ? mot.nome : v.motorista_id}</li>
                        );
                      })}
                    </ul>
                  ) : '-'}
                </td>
                <td>{frete.faixa || '-'}</td>
                <td>{frete.total_km || '-'}</td>
                <td>{formatCurrency(frete.valor_frete)}</td>
                <td>
                  {(() => {
                    const { valoresIndividuais, total } = calcularValoresPorCaminhao(frete.id!, vinculosCaminhoes, reboques);
                    if (valoresIndividuais.length === 0) {
                      return '-';
                    }
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {valoresIndividuais.map((item, index) => (
                          <div key={index} style={{ fontSize: '0.9em' }}>
                            {formatCurrency(item.valor)} ({item.descricao})
                          </div>
                        ))}
                        {valoresIndividuais.length > 1 && (
                          <>
                            <div style={{ borderTop: '1px solid #ddd', margin: '2px 0' }}></div>
                            <div style={{ fontSize: '0.9em', fontWeight: 'bold' }}>
                              Total: {formatCurrency(total)}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td>{frete.situacao === 'Pago' ? (frete.tipo_pagamento || '-') : '-'}</td>
                <td>{frete.situacao === 'Pago' ? (frete.data_pagamento ? formatDate(frete.data_pagamento) : '-') : '-'}</td>
                <td>
                  <div className="actions">
                    <input
                      type="checkbox"
                      checked={fretesSelecionados.includes(frete.id!)}
                      onChange={() => frete.id && toggleSelecionarFrete(frete.id)}
                      title="Selecionar para arquivar"
                      style={{ cursor: 'pointer', marginRight: '8px' }}
                    />
                    <button
                      className="btn-edit"
                      title="Editar"
                      onClick={() => handleEdit(frete)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn-delete"
                      title="Excluir"
                      onClick={() => frete.id && handleDelete(frete.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
