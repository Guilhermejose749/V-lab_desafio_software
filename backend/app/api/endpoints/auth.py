from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.db.database import get_session
from app.models.user import UserCreate, UserRead
from app.crud.crud_user import get_user_by_email, create_user
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import verify_password, create_access_token
router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, session: Session = Depends(get_session)):
    """
    Registra um novo usuário no sistema.
    """
    # Verifica se o email já está cadastrado no banco
    user_exists = get_user_by_email(session=session, email=user_in.email)
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email já está registrado no sistema."
        )
    
    # Cria o usuário usando a função do CRUD
    new_user = create_user(session=session, user_create=user_in)
    
    # Retorna o usuário criado com UserRead (sem a senha)
    return new_user


@router.post("/login")
def login(
    session: Session = Depends(get_session),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """Verifica credenciais e retorna o token de acesso."""
    user = get_user_by_email(session, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user.email, user_id=user.id)
    return {"access_token": access_token, "token_type": "bearer"}