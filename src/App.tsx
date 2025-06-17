import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import CadastroCaminhoes from './pages/CadastroCaminhoes/CadastroCaminhoes';
import CadastroMotoristas from './pages/CadastroMotoristas/CadastroMotoristas';
import ControleFrete from './pages/ControleFrete/ControleFrete';
import ControleAbastecimento from './pages/ControleAbastecimento/ControleAbastecimento';
import FechamentoMotoristas from './pages/FechamentoMotoristas/FechamentoMotoristas';
import CadastroFornecedores from './components/CadastroFornecedores';
import GestaoVales from './components/GestaoVales';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cadastro-caminhoes" element={<CadastroCaminhoes />} />
            <Route path="/cadastro-motoristas" element={<CadastroMotoristas />} />
            <Route path="/controle-frete" element={<ControleFrete />} />
            <Route path="/controle-abastecimento" element={<ControleAbastecimento />} />
            <Route path="/fechamento-motoristas" element={<FechamentoMotoristas />} />
            <Route path="/gestao-vales" element={<GestaoVales />} />
            <Route path="/cadastro-fornecedores" element={<CadastroFornecedores />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App; 