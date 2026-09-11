from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app import models, schemas, auth

router = APIRouter()


@router.post("/cadastro", response_model=schemas.UsuarioResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_usuario(dados: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    # Transforma a senha em texto puro em um hash seguro
    senha_hash = auth.hash_senha(dados.senha)

    novo_usuario = models.Usuario(
        nome=dados.nome,
        email=dados.email,
        senha_hash=senha_hash,
    )

    db.add(novo_usuario)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado")

    db.refresh(novo_usuario)
    return novo_usuario


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # O formulário padrão do OAuth2 usa os nomes "username" e "password",
    # mas no nosso caso o "username" enviado é, na prática, o e-mail
    usuario = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()

    # Mensagem de erro genérica de propósito: não revela se o problema foi
    # o e-mail não existir ou a senha estar errada (boa prática de segurança)
    credenciais_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="E-mail ou senha incorretos",
    )

    if not usuario:
        raise credenciais_invalidas

    if not auth.verificar_senha(form_data.password, usuario.senha_hash):
        raise credenciais_invalidas

    token = auth.criar_token_acesso(dados={"sub": str(usuario.id)})
    return schemas.Token(access_token=token)


@router.get("/me", response_model=schemas.UsuarioResponse)
def ler_usuario_atual(usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual)):
    """Rota protegida de exemplo: só funciona se um token válido for enviado."""
    return usuario_atual