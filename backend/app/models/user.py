from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from pydantic import EmailStr

if TYPE_CHECKING:
    from .course import Course

class UserBase(SQLModel):
    name: str = Field(nullable=False) 
    email: EmailStr = Field(unique=True, index=True, nullable=False)  

class UserCreate(UserBase):
    password: str = Field(min_length=6) 

class UserRead(UserBase):
    id: int

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str = Field(nullable=False)
    
    # Relacionamento: Um usuário pode ser criador de vários cursos 
    courses: List["Course"] = Relationship(back_populates="creator", cascade_delete=True)