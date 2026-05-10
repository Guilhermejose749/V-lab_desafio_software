from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import date

if TYPE_CHECKING:
    from .user import User
    from .lesson import Lesson

class CourseBase(SQLModel):
    name: str = Field(min_length=3, index=True)
    description: Optional[str] = None
    start_date: date
    end_date: date

class CourseCreate(CourseBase):
    pass

class CourseRead(CourseBase):
    id: int
    creator_id: int

class Course(CourseBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    creator_id: int = Field(foreign_key="user.id")
    
    # Agora o VS Code entende o que é "User" e "Lesson"
    creator: "User" = Relationship(back_populates="courses")
    lessons: List["Lesson"] = Relationship(back_populates="course")