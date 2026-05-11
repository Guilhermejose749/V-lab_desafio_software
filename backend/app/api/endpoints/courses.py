from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List, Optional
from app.db.database import get_session
from app.models.course import CourseCreate, CourseRead, CourseUpdate
from app.models.user import User
from app.crud import crud_course
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
def create_course(
    course_in: CourseCreate, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """Cria um novo curso associado ao usuário logado."""
    return crud_course.create_course(session=session, course_in=course_in, creator_id=current_user.id)

@router.get("/", response_model=List[CourseRead])
def read_courses(
    search: Optional[str] = None,
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """Lista todos os cursos (com busca opcional por nome)."""
    return crud_course.get_all_courses(session=session, search=search)

@router.get("/{id}", response_model=CourseRead)
def read_course(
    id: int, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """Busca detalhes de um curso específico."""
    course = crud_course.get_course_by_id(session=session, course_id=id)
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    return course

@router.patch("/{id}", response_model=CourseRead)
def update_course(
    id: int, 
    course_in: CourseUpdate, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """Atualiza um curso (Apenas o criador tem permissão)."""
    db_course = crud_course.get_course_by_id(session=session, course_id=id)
    if not db_course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    
    # Validação de regra de negócio: É o dono do curso?
    if db_course.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Apenas o criador pode editar este curso")
        
    return crud_course.update_course(session=session, db_course=db_course, course_in=course_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    id: int, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """Exclui um curso (Apenas o criador tem permissão)."""
    db_course = crud_course.get_course_by_id(session=session, course_id=id)
    if not db_course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    
    # Validação de regra de negócio: É o dono do curso?
    if db_course.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Apenas o criador pode excluir este curso")
        
    crud_course.delete_course(session=session, db_course=db_course)
    return None