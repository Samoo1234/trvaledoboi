import React from 'react';
import { Abastecimento } from '../../../services/abastecimentoService';
import { formatarData, formatarMoeda } from '../utils';

interface ControleAbastecimentoTableProps {
  abastecimentos: Abastecimento[];
  loading: boolean;
  handleEdit: (abastecimento: Abastecimento) => void;
  handleDelete: (id: number) => void;
}

export const ControleAbastecimentoTable: React.FC<ControleAbastecimentoTableProps> = ({
  abastecimentos,
  loading,
  handleEdit,
  handleDelete
}) => {
  return (
    <>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Mês</th>
              <th>Combustível</th>
              <th>Qtd (L)</th>
              <th>Posto/Tanque</th>
              <th>Caminhão</th>
              <th>Motorista</th>
              <th>KM</th>
              <th>Valor</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {abastecimentos.map(abastecimento => (
              <tr key={abastecimento.id}>
                <td>{formatarData(abastecimento.data_abastecimento)}</td>
                <td>{abastecimento.mes}</td>
                <td>{abastecimento.combustivel}</td>
                <td>{abastecimento.quantidade_litros.toFixed(2)}</td>
                <td>{abastecimento.posto_tanque}</td>
                <td>{abastecimento.caminhao?.placa}</td>
                <td>{abastecimento.motorista?.nome}</td>
                <td>{abastecimento.km_rodado || '-'}</td>
                <td>{abastecimento.preco_total ? formatarMoeda(abastecimento.preco_total) : '-'}</td>
                <td>
                  <div className="actions">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEdit(abastecimento)}
                    >
                      Editar
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(abastecimento.id!)}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {abastecimentos.length === 0 && !loading && (
        <div className="empty-state">
          <p>Nenhum abastecimento encontrado.</p>
        </div>
      )}
    </>
  );
};
