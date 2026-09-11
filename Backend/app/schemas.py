import uuid
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