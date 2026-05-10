from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List, Optional
from app.db.database import get_session
from app.models.lesson import LessonCreate, LessonRead
from app.models.user import User
from app.crud import crud_lesson, crud_course
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=LessonRead, status_code=status.HTTP_201_CREATED)
def create_lesson(
    lesson_in: LessonCreate, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """Cria uma nova aula (apenas se for o criador do curso)."""
    # 1. Verifica se o curso existe
    course = crud_course.get_course_by_id(session=session, course_id=lesson_in.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")
    
    # 2. Regra de Negócio: O usuário logado é o dono do curso?
    if course.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Você só pode adicionar aulas aos cursos que você criou.")
        
    return crud_lesson.create_lesson(session=session, lesson_in=lesson_in)

@router.get("/course/{course_id}", response_model=List[LessonRead])
def read_lessons_for_course(
    course_id: int, 
    status: Optional[str] = None, # Filtro opcional (ex: ?status=published)
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """Lista as aulas de um curso (com filtro opcional por status)."""
    # Opcional: verificar se o curso existe antes de tentar listar
    course = crud_course.get_course_by_id(session=session, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")
        
    return crud_lesson.get_lessons_by_course(session=session, course_id=course_id, status=status)

@router.patch("/{id}", response_model=LessonRead)
def update_lesson(
    id: int,
    lesson_in: LessonCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Atualiza os dados de uma aula (apenas se for o criador do curso)."""
    db_lesson = crud_lesson.get_lesson_by_id(session=session, lesson_id=id)
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")
        
    # Busca o curso para checar a propriedade
    course = crud_course.get_course_by_id(session=session, course_id=db_lesson.course_id)
    if course.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Apenas o criador do curso pode editar aulas.")
        
    return crud_lesson.update_lesson(session=session, db_lesson=db_lesson, lesson_in=lesson_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(
    id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Exclui uma aula (apenas se for o criador do curso)."""
    db_lesson = crud_lesson.get_lesson_by_id(session=session, lesson_id=id)
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")
        
    # Busca o curso para checar a propriedade
    course = crud_course.get_course_by_id(session=session, course_id=db_lesson.course_id)
    if course.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Apenas o criador do curso pode excluir aulas.")
        
    crud_lesson.delete_lesson(session=session, db_lesson=db_lesson)
    return None