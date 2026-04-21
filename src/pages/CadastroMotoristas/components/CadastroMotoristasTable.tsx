import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Motorista } from '../../../services/motoristaService';

interface CadastroMotoristasTableProps {
  motoristas: Motorista[];
  handleEdit: (motorista: Motorista) => void;
  handleDelete: (id: number) => void;
  formatCpfDisplay: (cpf: string) => string;
  formatTelefoneDisplay: (telefone: string) => string;
}

const CadastroMotoristasTable: React.FC<CadastroMotoristasTableProps> = ({
  motoristas,
  handleEdit,
  handleDelete,
  formatCpfDisplay,
  formatTelefoneDisplay
}) => {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>CNH</th>
            <th>Categoria</th>
            <th>Telefone</th>
            <th>Cidade/UF</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {motoristas.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                Nenhum motorista cadastrado
              </td>
            </tr>
          ) : (
            motoristas.map((motorista) => (
              <tr key={motorista.id}>
                <td>{motorista.nome}</td>
                <td>{formatCpfDisplay(motorista.cpf)}</td>
                <td>{motorista.cnh}</td>
                <td>{motorista.categoria_cnh}</td>
                <td>{formatTelefoneDisplay(motorista.telefone)}</td>
                <td>{motorista.cidade}/{motorista.estado}</td>
                <td>
                  <span className={`tipo ${motorista.tipo_motorista.toLowerCase()}`}>
                    {motorista.tipo_motorista}
                  </span>
                </td>
                <td>
                  <span className={`status ${motorista.status.toLowerCase()}`}>
                    {motorista.status}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button 
                      className="btn-edit" 
                      title="Editar"
                      onClick={() => handleEdit(motorista)}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn-delete" 
                      title="Excluir"
                      onClick={() => motorista.id && handleDelete(motorista.id)}
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

export default CadastroMotoristasTable;
