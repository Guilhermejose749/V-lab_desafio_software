from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .course import Course

class LessonBase(SQLModel):
    title: str = Field(min_length=3)
    status: str = Field(default="draft") # draft ou published
    video_url: Optional[str] = None
    course_id: int = Field(foreign_key="course.id")

class LessonCreate(LessonBase):
    pass

class LessonRead(LessonBase):
    id: int

class Lesson(LessonBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Agora o VS Code entende o que é "Course"
    course: "Course" = Relationship(back_populates="lessons")