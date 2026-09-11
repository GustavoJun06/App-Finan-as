import os
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db

# Configuração do algoritmo de hash de senha (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Chave secreta usada para assinar os tokens JWT.
# Em produção, isso DEVE vir de uma variável de ambiente (.env), nunca fixo no código.
SECRET_KEY = os.getenv("SECRET_KEY", "troque-essa-chave-antes-de-ir-para-producao")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # token válido por 24 horas


def hash_senha(senha: str) -> str:
    """Transforma uma senha em texto puro em um hash seguro para salvar no banco."""
    return pwd_context.hash(senha)


def verificar_senha(senha_texto_puro: str, senha_hash: str) -> bool:
    """Compara a senha digitada no login com o hash salvo no banco."""
    return pwd_context.verify(senha_texto_puro, senha_hash)


def criar_token_acesso(dados: dict) -> str:
    """Gera um token JWT contendo os dados fornecidos (geralmente o id do usuário)."""
    dados_para_codificar = dados.copy()
    expira_em = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    dados_para_codificar.update({"exp": expira_em})
    return jwt.encode(dados_para_codificar, SECRET_KEY, algorithm=ALGORITHM)


# Diz ao FastAPI onde fica a rota de login — usado só para gerar a
# documentação automática do "cadeado" no /docs
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def obter_usuario_atual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Função "porteiro": qualquer rota que dependa dela só é executada
    se um token válido for enviado no cabeçalho Authorization.
    Devolve o objeto Usuario correspondente ao token.
    """
    from app import models  # import aqui dentro para evitar import circular

    credenciais_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id = payload.get("sub")
        if usuario_id is None:
            raise credenciais_invalidas
    except JWTError:
        raise credenciais_invalidas

    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if usuario is None:
        raise credenciais_invalidas

    return usuario