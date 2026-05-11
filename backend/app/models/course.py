from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import date
from pydantic import model_validator

if TYPE_CHECKING:
    from .user import User
    from .lesson import Lesson

class CourseBase(SQLModel):
    name: str = Field(min_length=3, index=True)
    description: Optional[str] = None
    start_date: date
    end_date: date

class CourseCreate(CourseBase):    
    @model_validator(mode='after')
    def check_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("A data de término não pode ser anterior à data de início")
        return self

class CourseRead(CourseBase):
    id: int
    creator_id: int
    creator_email: str

class CourseUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    
class Course(CourseBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    creator_id: int = Field(foreign_key="user.id", ondelete="CASCADE")
    
    creator: "User" = Relationship(back_populates="courses")
    lessons: List["Lesson"] = Relationship(back_populates="course", cascade_delete=True)
 
    @property
    def creator_email(self) -> str:
        """Propriedade dinâmica que o FastAPI vai ler para preencher o CourseRead."""
        return self.creator.email if self.creator else "email@desconhecido.com"