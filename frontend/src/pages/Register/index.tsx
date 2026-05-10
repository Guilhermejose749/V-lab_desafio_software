import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    // Validação básica de tamanho de senha solicitada no edital
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // Registro aceita JSON normal, igual configuramos no Pydantic
      await api.post('/auth/register', {
        name,
        email,
        password
      });
      
      alert('Usuário criado com sucesso! Faça login para continuar.');
      navigate('/login');
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao registrar usuário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h2>Registrar Novo Usuário</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Seu nome completo" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
        <input 
          type="email" 
          placeholder="Seu email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Sua senha (min 6 caracteres)" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          minLength={6}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Registrar'}
        </button>
      </form>

      <p style={{ marginTop: '20px' }}>
        Já tem uma conta? <Link to="/login">Voltar para o Login</Link>
      </p>
    </div>
  );
}