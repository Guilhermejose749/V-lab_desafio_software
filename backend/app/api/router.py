from fastapi import APIRouter
from app.api.endpoints import auth, courses, lessons

api_router = APIRouter()

# Rotas de Autenticação
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Rotas de Cursos
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])

# Rotas de Aulas
api_router.include_router(lessons.router, prefix="/lessons", tags=["lessons"])