import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseDetails from '../src/pages/CourseDetails';
import { AuthContext } from '../src/contexts/AuthContext';
import api from '../src/services/api';

vi.mock('../src/services/api');

// Mock do Fetch global para a RandomUser API
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ results: [{ name: { first: 'João', last: 'Silva' }, picture: { medium: '', thumbnail: '' } }] }),
  })
) as any;

const mockUser = { id: 1, email: 'dono@gmail.com' };
const mockCourse = { id: 10, name: 'Curso de Lógica', start_date: '2026-01-01', end_date: '2026-01-10', creator_id: 1 };
const mockLessons = [{ id: 1, title: 'Aula 1', status: 'published', course_id: 10 }];

const renderCourseDetails = () => {
  return render(
    <AuthContext.Provider value={{ user: mockUser, login: vi.fn(), logout: vi.fn(), isAuthenticated: true }}>
      {/* Usamos MemoryRouter para simular o ID "10" na URL */}
      <MemoryRouter initialEntries={['/courses/10']}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetails />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Detalhes do Curso e Aulas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/courses/10') return Promise.resolve({ data: mockCourse });
      if (url.includes('/lessons/course/10')) return Promise.resolve({ data: mockLessons });
      return Promise.reject();
    });
  });

  it('deve carregar e exibir as informações do curso e aulas', async () => {
    renderCourseDetails();
    
    await waitFor(() => {
      expect(screen.getByText('Curso de Lógica')).toBeInTheDocument();
      expect(screen.getByText('Aula 1')).toBeInTheDocument();
      expect(screen.getByText('Publicada')).toBeInTheDocument();
    });
  });

  it('deve permitir criar uma aula validando 3 caracteres', async () => {
    const user = userEvent.setup();
    renderCourseDetails();

    const addLessonBtn = await screen.findByText('+ Adicionar Aula');
    await user.click(addLessonBtn);

    const titleInput = screen.getByPlaceholderText('Título da Aula');
    
    // Tenta salvar com nome curto
    await user.type(titleInput, 'Oi');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    // Deve dar erro inline
    expect(screen.getByText('O título da aula precisa ter pelo menos 3 letras.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();

    // Corrige e salva corretamente
    await user.clear(titleInput);
    await user.type(titleInput, 'Minha Nova Aula');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(api.post).toHaveBeenCalled();
  });
});