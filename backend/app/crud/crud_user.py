from sqlmodel import Session, select
from app.models.user import User, UserCreate
from app.core.security import get_password_hash

def get_user_by_email(session: Session, email: str) -> User | None:
    """Busca um usuário no banco pelo email."""
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()

def create_user(session: Session, user_create: UserCreate) -> User:
    """Cria um novo usuário no banco, transformando a senha em hash."""
    # Gera o hash da senha enviada
    hashed_password = get_password_hash(user_create.password)
    
    # Cria o objeto do modelo do banco (User) e não o de entrada (UserCreate)
    db_user = User(
        name=user_create.name,
        email=user_create.email,
        hashed_password=hashed_password
    )
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    return db_user