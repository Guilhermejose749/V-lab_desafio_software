from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.db.database import create_db_and_tables
from app.models import * 
from app.api.router import api_router
from fastapi.middleware.cors import CORSMiddleware
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Executado ao iniciar a aplicação
    create_db_and_tables()
    yield
    # Executado ao encerrar a aplicação (se necessário limpar recursos)

app = FastAPI(
    title="CourseSphere API",
    description="API para gestão colaborativa de cursos online",
    lifespan=lifespan
)

# Adicionando as rotas
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do CourseSphere!"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # aceita local ou do vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)