import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';

interface Course {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  creator_id: number;
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Estados para os Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  
  // Estados para a Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; 
  
  const navigate = useNavigate();
  
  // Estados para Criar/Editar Curso
  const [isCreating, setIsCreating] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', start_date: '', end_date: '' });

  // Função para buscar cursos
  const fetchCourses = useCallback(async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data);
    } catch (error) {
      console.error("Erro ao buscar cursos", error);
      alert("Falha ao carregar a lista de cursos.");
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Função unificada para Salvar (Criar ou Editar)
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // validando a data de início e término antes de enviar para a API
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);

    if (end < start) {
      alert("A data de término não pode ser anterior à data de início!");
      return;
    }
    // ------------------------------------

    try {
      if (editingCourseId) {
        await api.patch(`/courses/${editingCourseId}`, formData);
      } else {
        await api.post('/courses/', formData);
      }
      setIsCreating(false);
      setEditingCourseId(null);
      setFormData({ name: '', description: '', start_date: '', end_date: '' });
      fetchCourses();
    } catch (error) {
      alert("Erro ao salvar curso no servidor.");
    }
  };

  // Função para Excluir
  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este curso?")) {
      try {
        await api.delete(`/courses/${id}`);
        fetchCourses();
      } catch (error) {
        alert("Erro ao excluir curso.");
      }
    }
  };

  // Prepara o formulário para Edição
  const startEdit = (course: Course) => {
    setEditingCourseId(course.id);
    setFormData({ 
      name: course.name, 
      description: course.description || '', 
      start_date: course.start_date, 
      end_date: course.end_date 
    });
    setIsCreating(true);
  };

  // Filtragem Múltipla
  const filteredCourses = courses.filter(course => {
    const matchName = course.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = startDateFilter ? course.start_date >= startDateFilter : true;
    return matchName && matchDate;
  });

  // Ordenação Lexicográfica 
  const sortedCourses = filteredCourses.sort((a, b) => a.name.localeCompare(b.name));

  // Paginação
  const totalPages = Math.ceil(sortedCourses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCourses = sortedCourses.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDateFilter]);

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Meus Cursos</h2>
        <button onClick={() => { setIsCreating(!isCreating); setEditingCourseId(null); setFormData({ name: '', description: '', start_date: '', end_date: '' }); }}>
          {isCreating ? 'Cancelar' : '+ Novo Curso'}
        </button>
      </header>

      {/* Formulário de Criação/Edição */}
      {isCreating && (
        <form onSubmit={handleSaveCourse} style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px', display: 'grid', gap: '10px' }}>
          <h3>{editingCourseId ? 'Editar Curso' : 'Criar Novo Curso'}</h3>
          <input type="text" placeholder="Nome do Curso" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <textarea placeholder="Descrição" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <input type="date" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
          <input type="date" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
          <button type="submit">Salvar Curso</button>
        </form>
      )}

      {/* Área de Filtros Complexos */}
      <div style={{ display: 'flex', gap: '10px', margin: '20px 0', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Buscar por nome:</label>
          <input 
            type="text" placeholder="Ex: Lógica de Programação" value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Inicia a partir de:</label>
          <input 
            type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Lista de Cursos */}
      <div style={{ display: 'grid', gap: '15px', minHeight: '300px' }}>
        {currentCourses.length === 0 ? (
          <p>Nenhum curso encontrado com esses filtros.</p>
        ) : (
          currentCourses.map(course => (
            <div key={course.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 10px 0' }}>{course.name}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  Início: {course.start_date} | Fim: {course.end_date}
                </p>
                {/* Etiqueta para mostrar que o curso é seu */}
                {user?.id === course.creator_id && <span style={{ fontSize: '12px', color: 'blue' }}>⭐ Seu curso</span>}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <button onClick={() => navigate(`/courses/${course.id}`)}>Ver Detalhes</button>
                {user?.id === course.creator_id && (
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => startEdit(course)} style={{ flex: 1 }}>Editar</button>
                    <button onClick={() => handleDelete(course.id)} style={{ flex: 1, backgroundColor: '#ff4d4f', color: 'white' }}>Excluir</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Anterior</button>
          <span>Página {currentPage} de {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Próxima</button>
        </div>
      )}
    </div>
  );
}