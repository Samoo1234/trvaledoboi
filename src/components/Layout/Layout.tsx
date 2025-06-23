import React, { ReactNode, useState } from 'react';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../Sidebar/Sidebar';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  };

  return (
    <div className="layout">
      <header className="header">
        <button 
          className="mobile-menu-btn"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <div className="header-title">
          <h1>
            <span className="full-title">Vale do Boi - Sistema de Gestão</span>
            <span className="short-title">Vale do Boi</span>
          </h1>
        </div>
        
        <div className="user-menu">
          <button 
            className="user-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <User size={18} />
            <span>{user?.nome}</span>
          </button>
          
          {userMenuOpen && (
            <div className="user-dropdown">
              <div className="user-info">
                <strong>{user?.nome}</strong>
                <span>{user?.email}</span>
                <span className={`user-type ${user?.tipo_usuario.toLowerCase()}`}>
                  {user?.tipo_usuario}
                </span>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={16} />
                Sair
              </button>
            </div>
          )}
        </div>
      </header>
      
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      <main className="main-content">
        {children}
      </main>
      
      {sidebarOpen && <div className="overlay" onClick={closeSidebar} />}
      {userMenuOpen && <div className="overlay" onClick={() => setUserMenuOpen(false)} />}
    </div>
  );
};

export default Layout; 