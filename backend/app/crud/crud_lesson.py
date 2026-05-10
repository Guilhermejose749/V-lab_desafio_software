from sqlmodel import Session, select
from app.models.lesson import Lesson, LessonCreate
from typing import List, Optional

def create_lesson(session: Session, lesson_in: LessonCreate) -> Lesson:
    """Cria uma nova aula no banco."""
    db_lesson = Lesson.model_validate(lesson_in)
    session.add(db_lesson)
    session.commit()
    session.refresh(db_lesson)
    return db_lesson

def get_lessons_by_course(session: Session, course_id: int, status: Optional[str] = None) -> List[Lesson]:
    """Retorna todas as aulas de um curso específico, com filtro opcional de status."""
    statement = select(Lesson).where(Lesson.course_id == course_id)
    if status:
        statement = statement.where(Lesson.status == status)
    return session.exec(statement).all()

def get_lesson_by_id(session: Session, lesson_id: int) -> Lesson | None:
    """Busca uma aula específica pelo ID."""
    return session.get(Lesson, lesson_id)

def update_lesson(session: Session, db_lesson: Lesson, lesson_in: LessonCreate) -> Lesson:
    """Atualiza os dados de uma aula existente."""
    lesson_data = lesson_in.model_dump(exclude_unset=True)
    for key, value in lesson_data.items():
        setattr(db_lesson, key, value)
    
    session.add(db_lesson)
    session.commit()
    session.refresh(db_lesson)
    return db_lesson

def delete_lesson(session: Session, db_lesson: Lesson) -> None:
    """Remove uma aula do banco de dados."""
    session.delete(db_lesson)
    session.commit()