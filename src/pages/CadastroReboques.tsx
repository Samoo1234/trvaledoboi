import React, { useState, useEffect } from 'react';
import { reboqueService, Reboque } from '../services/reboqueService';

const CadastroReboques: React.FC = () => {
  const [reboques, setReboques] = useState<Reboque[]>([]);
  const [placa, setPlaca] = useState('');
  const [conjunto, setConjunto] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReboques();
  }, []);

  const loadReboques = async () => {
    setLoading(true);
    try {
      const data = await reboqueService.getAll();
      setReboques(data);
    } catch (error) {
      setReboques([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa || !conjunto) {
      alert('Preencha todos os campos!');
      return;
    }
    try {
      await reboqueService.create({ caminhao_id: null as any, placa, conjunto });
      setPlaca('');
      setConjunto('');
      await loadReboques();
      alert('Reboque cadastrado com sucesso!');
    } catch (error) {
      alert('Erro ao cadastrar reboque.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Deseja remover este reboque?')) {
      try {
        await reboqueService.delete(id);
        await loadReboques();
      } catch (error) {
        alert('Erro ao remover reboque.');
      }
    }
  };

  return (
    <div className="cadastro-reboques">
      <div className="page-header">
        <h1>Cadastro de Reboques</h1>
      </div>
      <div className="form-container" style={{ maxWidth: 600, margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Placa do reboque</label>
              <input
                type="text"
                placeholder="Ex: ABC-1234"
                value={placa}
                onChange={e => setPlaca(e.target.value)}
                maxLength={10}
                required
              />
            </div>
            <div className="form-group">
              <label>Tipo de conjunto</label>
              <input
                type="text"
                placeholder="Ex: JULIETA"
                value={conjunto}
                onChange={e => setConjunto(e.target.value)}
                maxLength={30}
                required
              />
            </div>
            <div className="form-group" style={{ alignSelf: 'flex-end' }}>
              <button type="submit" className="btn-primary">Cadastrar</button>
            </div>
          </div>
        </form>
      </div>
      <div className="form-container" style={{ maxWidth: 600, margin: '2rem auto 0 auto' }}>
        <h2 style={{ marginBottom: 16 }}>Reboques cadastrados</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : reboques.length === 0 ? (
          <p>Nenhum reboque cadastrado.</p>
        ) : (
          <table className="data-table clean-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Conjunto</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {reboques.map(reb => (
                <tr key={reb.id}>
                  <td>{reb.placa}</td>
                  <td>{reb.conjunto}</td>
                  <td>
                    <button onClick={() => handleDelete(reb.id!)} className="btn-delete">Remover</button>
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

export default CadastroReboques; 