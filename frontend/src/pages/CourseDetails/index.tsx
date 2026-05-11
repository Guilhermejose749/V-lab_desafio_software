import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import { type Course, type Lesson, type ExternalUser } from '../../interfaces';

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

  // Estados para Criar/Editar Aula
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [newLesson, setNewLesson] = useState({ title: '', status: 'draft', video_url: '', course_id: Number(id) });

  // Função para buscar aulas isolada (usada após editar/excluir)
  const fetchLessons = useCallback(async () => {
    try {
      const res = await api.get(`/lessons/course/${id}${lessonStatusFilter ? `?status=${lessonStatusFilter}` : ''}`);
      setLessons(res.data);
    } catch (error) {
      console.error("Erro ao buscar aulas", error);
    }
  }, [id, lessonStatusFilter]);

  // Função Unificada para Salvar (Criar ou Editar Aula)
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLessonId) {
        await api.patch(`/lessons/${editingLessonId}`, newLesson);
      } else {
        await api.post('/lessons/', newLesson);
      }
      setIsAddingLesson(false);
      setEditingLessonId(null);
      setNewLesson({ title: '', status: 'draft', video_url: '', course_id: Number(id) });
      fetchLessons(); // Atualiza sem recarregar a página
    } catch (error) {
      alert("Erro ao salvar aula.");
    }
  };

  // Função de Excluir Aula
  const handleDeleteLesson = async (lessonId: number) => {
    if (window.confirm("Deseja realmente excluir esta aula?")) {
      try {
        await api.delete(`/lessons/${lessonId}`);
        fetchLessons();
      } catch (error) {
        alert("Erro ao excluir aula.");
      }
    }
  };

  // Prepara formulário de aula para edição
  const startEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setNewLesson({ title: lesson.title, status: lesson.status, video_url: lesson.video_url || '', course_id: Number(id) });
    setIsAddingLesson(true);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Busca do curso
        const courseRes = await api.get(`/courses/${id}`);
        setCourse(courseRes.data);
        
        // Busca de aulas
        fetchLessons();

        // Lógica de Cache para API Externa
        const cacheKeyInstructor = `@CourseSphere:instructor_${id}`;
        const cacheKeyStudents = `@CourseSphere:students_${id}`;
        
        const savedInstructor = sessionStorage.getItem(cacheKeyInstructor);
        const savedStudents = sessionStorage.getItem(cacheKeyStudents);

        if (savedInstructor && savedStudents) {
          setInstructor(JSON.parse(savedInstructor));
          setAllStudents(JSON.parse(savedStudents));
        } else {
          const externalRes = await fetch('https://randomuser.me/api/?results=51');
          const externalData = await externalRes.json();
          const newInstructor = externalData.results[0];
          const newStudents = externalData.results.slice(1);

          setInstructor(newInstructor);
          setAllStudents(newStudents);
          sessionStorage.setItem(cacheKeyInstructor, JSON.stringify(newInstructor));
          sessionStorage.setItem(cacheKeyStudents, JSON.stringify(newStudents));
        }
      } catch (error) {
        console.error("Erro ao carregar dados", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, fetchLessons]);

  if (loading) return <p>Carregando detalhes do curso...</p>;
  if (!course) return <p>Curso não encontrado.</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <button onClick={() => navigate('/')}>← Voltar ao Dashboard</button>

      <section style={{ marginTop: '20px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
        <h1>{course.name}</h1>
        <p><strong>Descrição:</strong> {course.description || 'Sem descrição'}</p>
        <p><strong>Período:</strong> {course.start_date} até {course.end_date}</p>

        {instructor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '20px', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
            <img src={instructor.picture.medium} alt="Instrutor" style={{ borderRadius: '50%', width: '60px' }} />
            <div>
              <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Instrutor Convidado</span>
              <h3 style={{ margin: 0 }}>{instructor.name.first} {instructor.name.last}</h3>
            </div>
          </div>
        )}
      </section>

      <section style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Aulas</h2>
          <select value={lessonStatusFilter} onChange={(e) => setLessonStatusFilter(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="published">Publicadas</option>
            <option value="draft">Rascunhos</option>
          </select>
        </div>
      
        {/* Apenas o criador pode adicionar aulas */}
        {user?.id === course.creator_id && (
          <div style={{ marginTop: '20px' }}>
            <button onClick={() => { setIsAddingLesson(!isAddingLesson); setEditingLessonId(null); setNewLesson({ title: '', status: 'draft', video_url: '', course_id: Number(id) }); }}>
              {isAddingLesson ? 'Cancelar' : '+ Adicionar Aula'}
            </button>
          
            {isAddingLesson && (
              <form onSubmit={handleSaveLesson} style={{ padding: '15px', border: '1px dashed #666', marginTop: '10px', borderRadius: '8px', display: 'grid', gap: '10px' }}>
                <h3>{editingLessonId ? 'Editar Aula' : 'Nova Aula'}</h3>
                <input type="text" placeholder="Título da Aula" required value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} />
                <select value={newLesson.status} onChange={e => setNewLesson({...newLesson, status: e.target.value})}>
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicada</option>
                </select>
                <input type="url" placeholder="URL do Vídeo (opcional)" value={newLesson.video_url} onChange={e => setNewLesson({...newLesson, video_url: e.target.value})} />
                <button type="submit">Salvar Aula</button>
              </form>
            )}
          </div>
        )}
      
        <div style={{ marginTop: '20px' }}>
          {lessons.length === 0 ? (
            <p>Nenhuma aula cadastrada com este filtro.</p>
          ) : (
            lessons.map((lesson) => (
              <div key={lesson.id} style={{ border: '1px solid #ddd', margin: '15px 0', padding: '20px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 10px 0' }}>{lesson.title}</h3>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', 
                      backgroundColor: lesson.status === 'published' ? '#e6fffa' : '#fff5f5',
                      color: lesson.status === 'published' ? '#2c7a7b' : '#c53030'
                    }}>
                      {lesson.status === 'published' ? 'Publicada' : 'Rascunho'}
                    </span>
                    {lesson.video_url && (
                      <p style={{ fontSize: '14px', marginTop: '10px' }}>
                        <a href={lesson.video_url} target="_blank" rel="noreferrer">Assistir Vídeo</a>
                      </p>
                    )}
                  </div>

                  {/* Apenas o criador pode editar e excluir as aulas */}
                  {user?.id === course.creator_id && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => startEditLesson(lesson)}>Editar</button>
                      <button onClick={() => handleDeleteLesson(lesson.id)} style={{ backgroundColor: '#ff4d4f', color: 'white' }}>Excluir</button>
                    </div>
                  )}
                </div>

                {/* Lista de Alunos na Aula */}
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Alunos nesta aula</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    {allStudents.slice(0, 25).map((student, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={student.picture.thumbnail} alt="Avatar" style={{ borderRadius: '50%', width: '30px', height: '30px', objectFit: 'cover' }} />
                        <span style={{ fontSize: '13px' }}>{student.name.first}</span>
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