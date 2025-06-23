import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './components/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import CadastroCaminhoes from './pages/CadastroCaminhoes/CadastroCaminhoes';
import CadastroMotoristas from './pages/CadastroMotoristas/CadastroMotoristas';
import ControleFrete from './pages/ControleFrete/ControleFrete';
import ControleAbastecimento from './pages/ControleAbastecimento/ControleAbastecimento';
import FechamentoMotoristas from './pages/FechamentoMotoristas/FechamentoMotoristas';
import ManutencaoCaminhoes from './pages/ManutencaoCaminhoes/ManutencaoCaminhoes';
import CapaTransporte from './pages/CapaTransporte/CapaTransporte';
import CadastroFornecedores from './components/CadastroFornecedores';
import GestaoVales from './components/GestaoVales';
import GerenciarUsuarios from './components/GerenciarUsuarios/GerenciarUsuarios';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Rota pública de login */}
            <Route path="/login" element={<Login />} />
            
            {/* Rotas protegidas */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/cadastro-caminhoes" element={
              <ProtectedRoute>
                <Layout>
                  <CadastroCaminhoes />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/cadastro-motoristas" element={
              <ProtectedRoute>
                <Layout>
                  <CadastroMotoristas />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/controle-frete" element={
              <ProtectedRoute>
                <Layout>
                  <ControleFrete />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/controle-abastecimento" element={
              <ProtectedRoute>
                <Layout>
                  <ControleAbastecimento />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/fechamento-motoristas" element={
              <ProtectedRoute>
                <Layout>
                  <FechamentoMotoristas />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/manutencao-caminhoes" element={
              <ProtectedRoute>
                <Layout>
                  <ManutencaoCaminhoes />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/capa-transporte" element={
              <ProtectedRoute>
                <Layout>
                  <CapaTransporte />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/gestao-vales" element={
              <ProtectedRoute>
                <Layout>
                  <GestaoVales />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/cadastro-fornecedores" element={
              <ProtectedRoute>
                <Layout>
                  <CadastroFornecedores />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Rota de gerenciamento de usuários - apenas para admin */}
            <Route path="/gerenciar-usuarios" element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <GerenciarUsuarios />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App; 