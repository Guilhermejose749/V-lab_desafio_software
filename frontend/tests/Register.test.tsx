import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Register from '../src/pages/Register';
import api from '../src/services/api';
import React from 'react';

vi.mock('../src/services/api');

describe('Página de Registro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve bloquear o registro se a senha tiver menos de 6 caracteres', async () => {
    const user = userEvent.setup();
    render(<BrowserRouter><Register /></BrowserRouter>);

    await user.type(screen.getByPlaceholderText(/nome completo/i), 'Novo Usuário');
    await user.type(screen.getByPlaceholderText(/seu email/i), 'novo@gmail.com');
    await user.type(screen.getByPlaceholderText(/sua senha/i), '12345'); // 5 caracteres apenas
    
    await user.click(screen.getByRole('button', { name: /registrar/i }));

    // A API não deve ser chamada
    expect(api.post).not.toHaveBeenCalled();
    // O erro deve aparecer na tela
    expect(screen.getByText('A senha deve ter pelo menos 6 caracteres.')).toBeInTheDocument();
  });

  it('deve simular um registro com sucesso', async () => {
    const user = userEvent.setup();
    // Simula o window.alert para não travar o teste
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    (api.post as any).mockResolvedValueOnce({ data: { id: 1 } });

    render(<BrowserRouter><Register /></BrowserRouter>);

    await user.type(screen.getByPlaceholderText(/nome completo/i), 'Novo Usuário');
    await user.type(screen.getByPlaceholderText(/seu email/i), 'novo@gmail.com');
    await user.type(screen.getByPlaceholderText(/sua senha/i), '123456');
    
    await user.click(screen.getByRole('button', { name: /registrar/i }));

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Novo Usuário',
      email: 'novo@gmail.com',
      password: '123456'
    });
  });
});