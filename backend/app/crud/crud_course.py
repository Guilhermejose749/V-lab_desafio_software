from sqlmodel import Session, select
from app.models.course import Course, CourseCreate
from sqlalchemy.orm import joinedload
from typing import List, Optional

def create_course(session: Session, course_in: CourseCreate, creator_id: int) -> Course:
    """Cria um curso injetando o ID do usuário criador."""
    db_course = Course.model_validate(course_in, update={"creator_id": creator_id})
    session.add(db_course)
    session.commit()
    session.refresh(db_course)
    return db_course

def get_all_courses(session: Session, search: Optional[str] = None) -> List[Course]:
    """Retorna todos os cursos, com filtro opcional por nome."""
    statement = select(Course).options(joinedload(Course.creator))
    if search:
        statement = statement.where(Course.name.contains(search))
    return session.exec(statement).all()

def get_course_by_id(session: Session, course_id: int) -> Course | None:
    """Busca um curso específico pelo ID."""
    return session.get(Course, course_id)

def update_course(session: Session, db_course: Course, course_in: CourseCreate) -> Course:
    """Atualiza os dados de um curso existente."""
    course_data = course_in.model_dump(exclude_unset=True)
    for key, value in course_data.items():
        setattr(db_course, key, value)
    
    session.add(db_course)
    session.commit()
    session.refresh(db_course)
    return db_course

def delete_course(session: Session, db_course: Course) -> None:
    """Remove um curso do banco de dados."""
    session.delete(db_course)
    session.commit()