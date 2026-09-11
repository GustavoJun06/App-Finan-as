import uuid
from datetime import date
from pydantic import BaseModel, EmailStr


# Schema usado quando alguém se CADASTRA (dados que chegam na API)
class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str


# Schema usado quando devolvemos dados de um usuário (nunca inclui a senha!)
class UsuarioResponse(BaseModel):
    id: uuid.UUID
    nome: str
    email: EmailStr

    class Config:
        from_attributes = True  # permite converter direto de um objeto SQLAlchemy


# Schema do token JWT devolvido após login bem-sucedido
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Conta ----------

class ContaCreate(BaseModel):
    nome: str
    tipo: str  # ex: "corrente", "cartao", "dinheiro"


class ContaResponse(BaseModel):
    id: uuid.UUID
    nome: str
    tipo: str
    saldo: float

    class Config:
        from_attributes = True


# ---------- Categoria ----------

class CategoriaCreate(BaseModel):
    nome: str


class CategoriaResponse(BaseModel):
    id: uuid.UUID
    nome: str

    class Config:
        from_attributes = True


# ---------- Transação ----------

class TransacaoCreate(BaseModel):
    conta_id: uuid.UUID
    categoria_id: uuid.UUID
    valor: float
    tipo: str  # "receita" ou "despesa"
    data: date | None = None  # se não informado, usamos a data de hoje


class TransacaoResponse(BaseModel):
    id: uuid.UUID
    conta_id: uuid.UUID
    categoria_id: uuid.UUID
    valor: float
    tipo: str
    data: date

    class Config:
        from_attributes = True


# ---------- Meta ----------

class MetaCreate(BaseModel):
    valor_alvo: float
    prazo: date


class MetaResponse(BaseModel):
    id: uuid.UUID
    valor_alvo: float
    prazo: date
    valor_atual: float  # calculado: saldo total das contas do usuário
    progresso_percentual: float  # calculado: valor_atual / valor_alvo * 100