import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Se já está autenticado, redireciona para o dashboard
  if (isAuthenticated && !loading) {
    return <Navigate to="/" replace />;
  }

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setLoginError('');

    try {
      await login(formData);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Erro ao fazer login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Limpar erro geral
    if (loginError) {
      setLoginError('');
    }
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="loading-spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo e Branding */}
        <div className="login-brand">
          <img 
            src="/assets/images/logo.png" 
            alt="Vale do Boi" 
            className="login-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <h1 className="login-title">VALE DO BOI</h1>
          <h3 className="login-subtitle-h3">Transportadora de Bovinos</h3>
          <p className="login-subtitle">Sistema de Gestão</p>
        </div>

        {/* Mensagem de erro */}
        {loginError && (
          <div className="alert alert-error">
            <strong>Erro:</strong> {loginError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail size={18} className="field-icon" />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={errors.email ? 'error' : ''}
                placeholder=""
                autoComplete="email"
              />
            </div>
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <div className="input-wrapper">
              <Lock size={18} className="field-icon" />
              <input
                id="senha"
                type={showPassword ? 'text' : 'password'}
                value={formData.senha}
                onChange={(e) => handleChange('senha', e.target.value)}
                className={errors.senha ? 'error' : ''}
                placeholder=""
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.senha && <div className="error-message">{errors.senha}</div>}
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting && <span className="loading-spinner"></span>}
            {isSubmitting ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>



        <div className="login-footer">
          <p>&copy; 2024 Vale do Boi - Sistema de Gestão</p>
        </div>
      </div>
    </div>
  );
};

export default Login; 