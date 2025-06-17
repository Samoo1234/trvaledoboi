import React, { ReactNode, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from '../Sidebar/Sidebar';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="layout">
      <button 
        className="mobile-menu-btn"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      <main className="main-content">
        {children}
      </main>
      
      {sidebarOpen && <div className="overlay" onClick={closeSidebar} />}
    </div>
  );
};

export default Layout; 