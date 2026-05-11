import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Como estamos na pasta raiz/tests, precisamos entrar no /src/ primeiro
import Login from '../src/pages/Login';
import { AuthContext } from '../src/contexts/AuthContext';
import api from '../src/services/api';

// 2. O caminho do mock fica EXATAMENTE igual ao import da api ali em cima!
vi.mock('../src/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockLogin = vi.fn();

const renderLogin = () => {
  return render(
    <AuthContext.Provider value={{ user: null, login: mockLogin, logout: vi.fn(), isAuthenticated: false }}>
      <BrowserRouter><Login /></BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('Página de Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve simular um usuário digitando e fazendo login com sucesso', async () => {
    const user = userEvent.setup();
    (api.post as any).mockResolvedValueOnce({ data: { access_token: 'fake-jwt-token' } });

    renderLogin();

    const emailInput = screen.getByPlaceholderText(/seu email/i);
    const passwordInput = screen.getByPlaceholderText(/sua senha/i);
    const submitBtn = screen.getByRole('button', { name: /entrar/i });

    // Simulando digitação real
    await user.type(emailInput, 'teste@gmail.com');
    await user.type(passwordInput, 'minhasenha123');

    expect(emailInput).toHaveValue('teste@gmail.com');
    expect(passwordInput).toHaveValue('minhasenha123');

    // Simulando clique
    await user.click(submitBtn);

    expect(api.post).toHaveBeenCalledWith('/auth/login', expect.any(URLSearchParams));
    expect(mockLogin).toHaveBeenCalledWith('fake-jwt-token');
  });

  it('deve exibir mensagem de erro se a API rejeitar', async () => {
    const user = userEvent.setup();
    (api.post as any).mockRejectedValueOnce({ response: { data: { detail: 'Credenciais inválidas' } } });

    renderLogin();

    await user.type(screen.getByPlaceholderText(/seu email/i), 'errado@gmail.com');
    await user.type(screen.getByPlaceholderText(/sua senha/i), '123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    const errorMessage = await screen.findByText('Credenciais inválidas');
    expect(errorMessage).toBeInTheDocument();
  });
});