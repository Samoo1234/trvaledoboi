import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Manutencao } from '../../../services/manutencaoService';
import { formatDisplayDate } from '../../../services/dateUtils';
import { formatCurrency, getTipoColor } from '../utils';

interface ManutencaoCaminhoesTableProps {
  manutencoes: Manutencao[];
  handleEdit: (manutencao: Manutencao) => void;
  handleDelete: (id: number, descricao: string) => void;
}

export const ManutencaoCaminhoesTable: React.FC<ManutencaoCaminhoesTableProps> = ({
  manutencoes,
  handleEdit,
  handleDelete
}) => {
  if (manutencoes.length === 0) {
    return (
      <div className="table-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Nenhuma manutenção encontrada para os filtros selecionados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Caminhão</th>
            <th>Tipo</th>
            <th>Descrição do Serviço</th>
            <th>Valor</th>
            <th>Oficina</th>
            <th>KM</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {manutencoes.map((manutencao) => (
            <tr key={manutencao.id}>
              <td>{formatDisplayDate(manutencao.data_manutencao)}</td>
              <td>
                <strong>{manutencao.caminhao?.placa}</strong><br />
                <small>{manutencao.caminhao?.modelo}</small>
              </td>
              <td>
                <span 
                  className="tipo-badge"
                  style={{ backgroundColor: getTipoColor(manutencao.tipo_manutencao) }}
                >
                  {manutencao.tipo_manutencao}
                </span>
              </td>
              <td className="descricao-cell">
                {manutencao.descricao_servico}
                {manutencao.observacoes && (
                  <small><br />Obs: {manutencao.observacoes}</small>
                )}
              </td>
              <td className="valor-cell">{formatCurrency(manutencao.valor_servico)}</td>
              <td>{manutencao.oficina_responsavel || '-'}</td>
              <td>{manutencao.km_caminhao ? `${manutencao.km_caminhao} km` : '-'}</td>
              <td>
                <div className="actions">
                  <button 
                    className="btn-action"
                    onClick={() => handleEdit(manutencao)}
                    title="Editar Manutenção"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="btn-action btn-danger"
                    onClick={() => manutencao.id && handleDelete(manutencao.id, manutencao.descricao_servico)}
                    title="Excluir Manutenção"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
