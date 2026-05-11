import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import { type Course } from '../../interfaces';
import './Dashboard.css';
import logoutIcon from '../../assets/logout.png';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const [courses, setCourses] = useState<Course[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 
  
  const navigate = useNavigate();
  
  // Controles de UI
  const [isCreating, setIsCreating] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  
  const [formData, setFormData] = useState({ name: '', description: '', start_date: '', end_date: '' });

  const fetchCourses = useCallback(async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data);
    } catch (error) {
      console.error("Erro ao buscar cursos", error);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); // Limpa erros anteriores

    // Validações Naturais
    if (formData.name.trim().length < 3) {
      return setFormError("O nome do curso precisa ter pelo menos 3 letras.");
    }
    
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      return setFormError("A data de término não pode ser antes do início.");
    }

    try {
      if (editingCourseId) await api.patch(`/courses/${editingCourseId}`, formData);
      else await api.post('/courses/', formData);
      
      // Reseta tudo em caso de sucesso
      setIsCreating(false);
      setEditingCourseId(null);
      setFormError('');
      setFormData({ name: '', description: '', start_date: '', end_date: '' });
      fetchCourses(); 
    } catch (error) {
      setFormError("Ocorreu um erro ao tentar salvar o curso. Tente novamente.");
    }
  };

  const confirmDelete = async (id: number) => {
    try { 
      await api.delete(`/courses/${id}`); 
      setDeletingCourseId(null);
      fetchCourses(); 
    } catch (error) { 
      console.error("Erro ao excluir curso", error); 
    }
  };

  const startEdit = (course: Course) => {
    setFormError('');
    setIsCreating(false); 
    setDeletingCourseId(null); 
    setEditingCourseId(course.id);
    setFormData({ name: course.name, description: course.description || '', start_date: course.start_date, end_date: course.end_date });
  };

  const cancelEditOrCreate = () => {
    setIsCreating(false);
    setEditingCourseId(null);
    setFormError('');
    setFormData({ name: '', description: '', start_date: '', end_date: '' });
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

  useEffect(() => { setCurrentPage(1); }, [searchTerm, startDateFilter, showOnlyMine]); 

  // Componente interno do Formulário (Reutilizado para criar e editar)
  const renderCourseForm = (isEdit = false) => (
    <form className="crud-form" onSubmit={handleSaveCourse}>
      <h3>{isEdit ? 'Atualizar Curso' : 'Criar Novo Curso'}</h3>
      
      {formError && <span className="inline-error">{formError}</span>}
      
      <input className="form-input" type="text" placeholder="Nome do Curso" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      <textarea className="form-input" placeholder="Descrição" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
      <div style={{display: 'flex', gap: '15px'}}>
        <input className="form-input" type="date" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
        <input className="form-input" type="date" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
      </div>
      <div style={{display: 'flex', gap: '10px'}}>
        <button className="btn btn-primary" type="submit">Salvar</button>
        <button className="btn btn-secondary" type="button" onClick={cancelEditOrCreate}>Cancelar</button>
      </div>
    </form>
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2 className="dashboard-title">Dashboard de Cursos</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => { cancelEditOrCreate(); setIsCreating(true); }}>
            + Novo Curso
          </button>
          <button className="btn-logout" onClick={logout} title="Sair da conta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={logoutIcon} alt="Sair" width="24" height="24" />
          </button>
        </div>
      </header>

      {/* Se estiver criando (não editando), o formulário aparece no topo */}
      {isCreating && renderCourseForm(false)}

      <div className="filters-card">
        <div className="filter-group">
          <label className="filter-label">Buscar por nome:</label>
          <input className="filter-input" type="text" placeholder="Ex: Lógica" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="filter-group">
          <label className="filter-label">Inicia a partir de:</label>
          <input className="filter-input" type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
        </div>
        <label className="filter-checkbox-group">
          <input type="checkbox" checked={showOnlyMine} onChange={(e) => setShowOnlyMine(e.target.checked)} />
          ⭐ Meus Cursos
        </label>
      </div>

      <div className="courses-list">
        {currentCourses.map(course => (
          <div key={course.id} className="course-card">
            
            {/* INLINE EDIT: Se estiver editando ESSE curso, mostra o form dentro do card */}
            {editingCourseId === course.id ? (
               renderCourseForm(true)
            ) : (
              // Modo Visualização Normal
              <>
                <div className="course-info">
                  <h3 className="course-title">{course.name} {user?.id === course.creator_id && '⭐'}</h3>
                  <p className="course-desc">{course.description || 'Sem descrição.'}</p>
                  <div className="course-meta">
                    <span>📅 {course.start_date} até {course.end_date}</span>
                    <span>👤 <strong>Instrutor:</strong> {course.creator_email}</span>
                  </div>
                </div>
                
                <div className="course-actions">
                  {/* INLINE DELETE: Confirmação de exclusão dentro do card */}
                  {deletingCourseId === course.id ? (
                    <div className="inline-confirm-box">
                      <p className="inline-confirm-text">Deseja mesmo excluir?</p>
                      <div className="inline-confirm-actions">
                        <button className="btn btn-danger" onClick={() => confirmDelete(course.id)}>Sim</button>
                        <button className="btn btn-secondary" onClick={() => setDeletingCourseId(null)}>Não</button>
                      </div>
                    </div>
                  ) : (
                    // Botões normais
                    <>
                      <button className="btn btn-secondary" onClick={() => navigate(`/courses/${course.id}`)}>Ver Detalhes</button>
                      {user?.id === course.creator_id && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-secondary" onClick={() => startEdit(course)} style={{flex: 1}}>Editar</button>
                          <button className="btn btn-danger" onClick={() => { setDeletingCourseId(course.id); setEditingCourseId(null); }}>Excluir</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Anterior</button>
          <span style={{fontWeight: 600, fontSize: '14px'}}>Página {currentPage} de {totalPages}</span>
          <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Próxima</button>
        </div>
      )}
    </div>
  );
}