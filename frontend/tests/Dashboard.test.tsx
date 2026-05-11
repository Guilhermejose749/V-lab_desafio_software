import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../src/pages/Dashboard';
import { AuthContext } from '../src/contexts/AuthContext';
import api from '../src/services/api';
import React from 'react';
vi.mock('../src/services/api');

const mockUser = { id: 1, email: 'dono@gmail.com' };
const mockCourses = [
  { id: 1, name: 'Curso Base', start_date: '2026-05-01', end_date: '2026-05-10', creator_id: 1, creator_email: 'dono@gmail.com' }
];

const renderDashboard = () => {
  return render(
    <AuthContext.Provider value={{ user: mockUser, login: vi.fn(), logout: vi.fn(), isAuthenticated: true }}>
      <BrowserRouter><Dashboard /></BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('Dashboard de Cursos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockResolvedValue({ data: mockCourses });
  });

  it('deve listar os cursos da API', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Curso Base ⭐')).toBeInTheDocument();
    });
  });

  it('deve permitir a criação de um novo curso preenchendo o formulário', async () => {
    const user = userEvent.setup();
    (api.post as any).mockResolvedValueOnce({ data: { id: 2 } });
    
    renderDashboard();

    // 1. Clica no botão para abrir o form
    const newCourseBtn = await screen.findByText('+ Novo Curso');
    await user.click(newCourseBtn);

    // 2. O formulário deve aparecer
    expect(screen.getByText('Criar Novo Curso')).toBeInTheDocument();

    // 3. Usuário preenche os dados
    await user.type(screen.getByPlaceholderText('Nome do Curso'), 'React Testes');
    await user.type(screen.getByPlaceholderText('Descrição'), 'Aprenda a testar');
    
    const dateInputs = screen.getAllByDisplayValue('');
    await user.type(dateInputs[0], '2026-08-01'); // start_date
    await user.type(dateInputs[1], '2026-08-30'); // end_date

    // 4. Submete o form
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    // 5. Verifica se chamou a API corretamente
    expect(api.post).toHaveBeenCalledWith('/courses/', {
      name: 'React Testes',
      description: 'Aprenda a testar',
      start_date: '2026-08-01',
      end_date: '2026-08-30'
    });
  });
});