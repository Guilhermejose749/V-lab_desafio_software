import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import { type Course, type Lesson, type ExternalUser } from '../../interfaces';
import './CourseDetails.css'; 

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [instructor, setInstructor] = useState<ExternalUser | null>(null);
  const [allStudents, setAllStudents] = useState<ExternalUser[]>([]);
  const [lessonStatusFilter, setLessonStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Controles de UI
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  
  const [newLesson, setNewLesson] = useState({ title: '', status: 'draft', video_url: '', course_id: Number(id) });

  const fetchLessons = useCallback(async () => {
    try {
      const res = await api.get(`/lessons/course/${id}${lessonStatusFilter ? `?status=${lessonStatusFilter}` : ''}`);
      setLessons(res.data);
    } catch (error) {
      console.error("Erro ao buscar aulas", error);
    }
  }, [id, lessonStatusFilter]);

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); // Limpa erros

    if (newLesson.title.trim().length < 3) {
      return setFormError("O título da aula precisa ter pelo menos 3 letras.");
    }

    try {
      if (editingLessonId) await api.patch(`/lessons/${editingLessonId}`, newLesson);
      else await api.post('/lessons/', newLesson);
      
      setIsAddingLesson(false); 
      setEditingLessonId(null);
      setFormError('');
      setNewLesson({ title: '', status: 'draft', video_url: '', course_id: Number(id) });
      fetchLessons(); 
    } catch (error) { 
      setFormError("Erro ao salvar aula. Verifique os dados e tente novamente.");
    }
  };

  const confirmDeleteLesson = async (lessonId: number) => {
    try { 
      await api.delete(`/lessons/${lessonId}`); 
      setDeletingLessonId(null);
      fetchLessons(); 
    } catch (error) { 
      console.error("Erro ao excluir aula"); 
    }
  };

  const startEditLesson = (lesson: Lesson) => {
    setFormError('');
    setIsAddingLesson(false);
    setDeletingLessonId(null);
    setEditingLessonId(lesson.id);
    setNewLesson({ title: lesson.title, status: lesson.status, video_url: lesson.video_url || '', course_id: Number(id) });
  };

  const cancelEditOrCreate = () => {
    setIsAddingLesson(false);
    setEditingLessonId(null);
    setFormError('');
    setNewLesson({ title: '', status: 'draft', video_url: '', course_id: Number(id) });
  };

  useEffect(() => {
    let isMounted = true; 

    const loadData = async () => {
      try {
        const courseRes = await api.get(`/courses/${id}`);
        if (isMounted) setCourse(courseRes.data);
        fetchLessons();

        const cacheKeyInstructor = `@CourseSphere:instructor_${id}`;
        const cacheKeyStudents = `@CourseSphere:students_${id}`;
        const savedInstructor = sessionStorage.getItem(cacheKeyInstructor);
        const savedStudents = sessionStorage.getItem(cacheKeyStudents);

        if (savedInstructor && savedStudents) {
          if (isMounted) {
            setInstructor(JSON.parse(savedInstructor));
            setAllStudents(JSON.parse(savedStudents));
          }
        } else {
          const externalRes = await fetch('https://randomuser.me/api/?results=51');
          const externalData = await externalRes.json();
          if (isMounted) {
            const checkCacheAgain = sessionStorage.getItem(cacheKeyInstructor);
            if (!checkCacheAgain) {
              setInstructor(externalData.results[0]);
              setAllStudents(externalData.results.slice(1));
              sessionStorage.setItem(cacheKeyInstructor, JSON.stringify(externalData.results[0]));
              sessionStorage.setItem(cacheKeyStudents, JSON.stringify(externalData.results.slice(1)));
            } else {
              setInstructor(JSON.parse(checkCacheAgain));
              setAllStudents(JSON.parse(sessionStorage.getItem(cacheKeyStudents) || '[]'));
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados", error);
      } finally { 
        if (isMounted) setLoading(false); 
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [id, fetchLessons]);

  if (loading) return <p style={{textAlign: 'center', marginTop: '50px'}}>Carregando detalhes do curso...</p>;
  if (!course) return <p style={{textAlign: 'center', marginTop: '50px'}}>Curso não encontrado.</p>;

  // Componente Formulário para a Aula
  const renderLessonForm = (isEdit = false) => (
    <form className="crud-form" onSubmit={handleSaveLesson}>
      <h3 style={{margin: 0}}>{isEdit ? 'Atualizar Aula' : 'Nova Aula'}</h3>
      
      {formError && <span className="inline-error">{formError}</span>}

      <input className="form-input" type="text" placeholder="Título da Aula" required value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} />
      <select className="form-input" value={newLesson.status} onChange={e => setNewLesson({...newLesson, status: e.target.value})}>
        <option value="draft">Rascunho</option>
        <option value="published">Publicada</option>
      </select>
      <input className="form-input" type="url" placeholder="URL do Vídeo (opcional)" value={newLesson.video_url} onChange={e => setNewLesson({...newLesson, video_url: e.target.value})} />
      
      <div style={{display: 'flex', gap: '10px', marginTop: '5px'}}>
        <button className="btn-primary" type="submit">Salvar</button>
        <button className="btn-outline" type="button" onClick={cancelEditOrCreate}>Cancelar</button>
      </div>
    </form>
  );

  return (
    <div className="course-details-container">
      <button className="btn-back" onClick={() => navigate('/')}>← Voltar ao Dashboard</button>

      <section className="course-header-section">
        <h1 className="course-main-title">{course.name}</h1>
        <p className="course-info-text"><strong>Descrição:</strong> {course.description || 'Sem descrição'}</p>
        <p className="course-info-text"><strong>Período:</strong> {course.start_date} até {course.end_date}</p>

        {instructor && (
          <div className="instructor-card">
            <img src={instructor.picture.medium} alt="Instrutor" className="instructor-avatar" />
            <div>
              <span className="instructor-role">Instrutor Convidado</span>
              <h3 className="instructor-name">{instructor.name.first} {instructor.name.last}</h3>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="lessons-header">
          <h2 className="section-title">Aulas</h2>
          <select className="status-filter-select" value={lessonStatusFilter} onChange={(e) => setLessonStatusFilter(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="published">Publicadas</option>
            <option value="draft">Rascunhos</option>
          </select>
        </div>
      
        {user?.id === course.creator_id && (
          <div style={{ marginBottom: '20px' }}>
            {/* Se NÃO estiver criando, mostra o botão de Nova Aula */}
            {!isAddingLesson && (
              <button className="btn-primary" onClick={() => { cancelEditOrCreate(); setIsAddingLesson(true); }}>
                + Adicionar Aula
              </button>
            )}
          
            {/* Formulário de Criação fica no topo da lista */}
            {isAddingLesson && renderLessonForm(false)}
          </div>
        )}
      
        <div>
          {lessons.length === 0 ? (
            <p>Nenhuma aula cadastrada com este filtro.</p>
          ) : (
            lessons.map((lesson) => (
              <div key={lesson.id} className="lesson-card">
                
                {/* INLINE EDIT: Formulário Substitui o cabeçalho da aula */}
                {editingLessonId === lesson.id ? (
                  renderLessonForm(true)
                ) : (
                  // Visualização normal do cabeçalho da aula
                  <div className="lesson-card-header">
                    <div>
                      <h3 className="lesson-title">{lesson.title}</h3>
                      <span className={`badge ${lesson.status}`}>
                        {lesson.status === 'published' ? 'Publicada' : 'Rascunho'}
                      </span>
                      <br/>
                      {lesson.video_url && (
                        <a className="watch-link" href={lesson.video_url} target="_blank" rel="noreferrer">Assistir Vídeo</a>
                      )}
                    </div>

                    {user?.id === course.creator_id && (
                      <div className="action-buttons">
                        {/* INLINE DELETE */}
                        {deletingLessonId === lesson.id ? (
                          <div className="inline-confirm-box">
                            <p className="inline-confirm-text">Excluir aula?</p>
                            <div className="inline-confirm-actions">
                              <button className="btn-danger" onClick={() => confirmDeleteLesson(lesson.id)}>Sim</button>
                              <button className="btn-outline" onClick={() => setDeletingLessonId(null)}>Não</button>
                            </div>
                          </div>
                        ) : (
                          // Botões normais
                          <>
                            <button className="btn-outline" onClick={() => startEditLesson(lesson)}>Editar</button>
                            <button className="btn-danger" onClick={() => { setDeletingLessonId(lesson.id); setEditingLessonId(null); }}>Excluir</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Lista de Alunos */}
                <div className="students-section">
                  <h4 className="students-title">Alunos nesta aula</h4>
                  <div className="students-grid">
                    {allStudents.slice(0, 25).map((student, idx) => (
                      <div key={idx} className="student-item">
                        <img src={student.picture.thumbnail} alt="Avatar" className="student-avatar" />
                        <span className="student-name">{student.name.first}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}