import React from 'react';
import { Eye, EyeOff, User, Building } from 'lucide-react';
import { CadastroClientesStatsProps } from '../utils';

const CadastroClientesStats: React.FC<CadastroClientesStatsProps> = ({ estatisticas }) => {
  return (
    <div className="estatisticas">
      <div className="stat-card">
        <div className="stat-icon total">
          <User size={24} />
        </div>
        <div className="stat-content">
          <span className="stat-number">{estatisticas.total}</span>
          <span className="stat-label">Total</span>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon ativo">
          <Eye size={24} />
        </div>
        <div className="stat-content">
          <span className="stat-number">{estatisticas.ativos}</span>
          <span className="stat-label">Ativos</span>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon inativo">
          <EyeOff size={24} />
        </div>
        <div className="stat-content">
          <span className="stat-number">{estatisticas.inativos}</span>
          <span className="stat-label">Inativos</span>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon fisica">
          <User size={24} />
        </div>
        <div className="stat-content">
          <span className="stat-number">{estatisticas.fisicas}</span>
          <span className="stat-label">Físicas</span>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon juridica">
          <Building size={24} />
        </div>
        <div className="stat-content">
          <span className="stat-number">{estatisticas.juridicas}</span>
          <span className="stat-label">Jurídicas</span>
        </div>
      </div>
    </div>
  );
};

export default CadastroClientesStats;
