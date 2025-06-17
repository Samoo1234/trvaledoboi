import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Truck, 
  Users, 
  Package, 
  Fuel, 
  Calculator,
  BarChart3,
  Building2
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/',
      icon: BarChart3,
      label: 'Dashboard',
    },
    {
      path: '/cadastro-caminhoes',
      icon: Truck,
      label: 'Cadastro de Caminhões',
    },
    {
      path: '/cadastro-motoristas',
      icon: Users,
      label: 'Cadastro de Motoristas',
    },
    {
      path: '/controle-frete',
      icon: Package,
      label: 'Controle de Frete',
    },
    {
      path: '/controle-abastecimento',
      icon: Fuel,
      label: 'Controle de Abastecimento',
    },
    {
      path: '/cadastro-fornecedores',
      icon: Building2,
      label: 'Cadastro de Fornecedores',
    },
    {
      path: '/fechamento-motoristas',
      icon: Calculator,
      label: 'Fechamento Motoristas Terceiros',
    },
  ];

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <img 
            src="/assets/images/logo.png" 
            alt="Logo da Empresa" 
            className="sidebar-logo"
            onError={(e) => {
              // Se a logo não existir, oculta a imagem
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <h2>Sistema Logística</h2>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar; 