from sqlmodel import create_engine, Session, SQLModel
from app.core.config import settings

# Criação do Engine do banco de dados. 
engine = create_engine(settings.DATABASE_URL, echo=True)

def get_session():
    """Dependência para injetar a sessão do banco de dados nas rotas."""
    with Session(engine) as session:
        yield session

def create_db_and_tables():
    """Cria todas as tabelas no banco de dados baseado nos modelos registrados."""
    SQLModel.metadata.create_all(engine)