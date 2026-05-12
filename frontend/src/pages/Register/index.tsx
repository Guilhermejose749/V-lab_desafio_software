import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import './Register.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const handleRegister = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', { name, email, password });
      setSuccess('Usuário criado com sucesso! Redirecionando...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao registrar usuário.');
    setLoading(false); }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Registrar</h2>
        
        {/* Mensagens de Feedback */}
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        
        {!success ? (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="input-wrapper">
              <input 
                className="auth-input"
                type="text" 
                placeholder="Seu nome completo" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="input-wrapper">
              <input 
                className="auth-input"
                type="email" 
                placeholder="Seu email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className={`input-wrapper ${error ? 'has-error' : ''}`}>
              <input 
                className="auth-input"
                type="password" 
                placeholder="Sua senha (min 6 caracteres)" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                minLength={6}
              />
            </div>
            <button className="auth-submit-btn" type="submit" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Registrar'}
            </button>
          </form>
        ) : (
          <div className="loader-container">
            {/* Um simples spinner ou ícone de check pode ir aqui */}
            <div className="simple-loader"></div>
          </div>
        )}

        <p className="auth-footer-link">
          Já tem uma conta? <Link to="/login">Voltar para o Login</Link>
        </p>
      </div>
    </div>
  );
}