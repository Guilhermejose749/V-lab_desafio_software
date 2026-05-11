import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import { type Course } from '../../interfaces';

export default function Dashboard() {
 
  const { user, logout } = useContext(AuthContext);
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Estados para os Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 
  
  const navigate = useNavigate();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', start_date: '', end_date: '' });

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

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);

    if (end < start) {
      alert("A data de término não pode ser anterior à data de início!");
      return; 
    }

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

  const filteredCourses = courses.filter(course => {
    const matchName = course.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = startDateFilter ? course.start_date >= startDateFilter : true;
    const matchMine = showOnlyMine ? course.creator_id === user?.id : true; 
    
    return matchName && matchDate && matchMine;
  });

  const sortedCourses = filteredCourses.sort((a, b) => a.name.localeCompare(b.name));

  const totalPages = Math.ceil(sortedCourses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCourses = sortedCourses.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDateFilter, showOnlyMine]); 

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      
      {/* Botão de Logout no canto direito */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Dashboard de Cursos</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => { setIsCreating(!isCreating); setEditingCourseId(null); setFormData({ name: '', description: '', start_date: '', end_date: '' }); }}>
            {isCreating ? 'Cancelar' : '+ Novo Curso'}
          </button>
          
          {/* Botão de Deslogar */}
          <button 
            onClick={logout} 
            title="Sair da conta"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '24px',
              padding: '5px'
            }}
          >
            🚪
          </button>
        </div>
      </header>

      {/* Formulário */}
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

      {/* Área de Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', margin: '20px 0', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Buscar por nome:</label>
          <input 
            type="text" placeholder="Ex: Lógica" value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Inicia a partir de:</label>
          <input 
            type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        {/* Filtro de Meus Cursos */}
        <div style={{ display: 'flex', alignItems: 'center', height: '35px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
            <input 
              type="checkbox" 
              checked={showOnlyMine} 
              onChange={(e) => setShowOnlyMine(e.target.checked)} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            ⭐ Meus Cursos
          </label>
        </div>
      </div>

      {/* Lista de Cursos e Paginação */}
      <div style={{ display: 'grid', gap: '15px', minHeight: '300px', alignContent: 'start'}}>
        {currentCourses.map(course => (
          <div key={course.id} style={{ 
            border: '1px solid #ccc', padding: '20px', borderRadius: '8px', 
            display: 'flex', justifyContent: 'space-between', backgroundColor: '#fff'
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 5px 0' }}>
                {course.name} {user?.id === course.creator_id && '⭐'} 
              </h3>
              
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
                {course.description || 'Sem descrição.'}
              </p>

              <div style={{ fontSize: '13px', color: '#888' }}>
                <p style={{ margin: '2px 0' }}>📅 {course.start_date} até {course.end_date}</p>
                <p style={{ margin: '2px 0' }}>👤 <strong>Instrutor:</strong> {course.creator_email}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => navigate(`/courses/${course.id}`)}>Ver Detalhes</button>
              
              {user?.id === course.creator_id && (
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => startEdit(course)} style={{ flex: 1 }}>Editar</button>
                  <button 
                    onClick={() => handleDelete(course.id)} 
                    style={{ flex: 1, backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    Excluir
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

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