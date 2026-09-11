import os
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

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