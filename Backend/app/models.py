import uuid
from datetime import date
from sqlalchemy import Column, String, ForeignKey, Numeric, Date, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    senha_hash = Column(String, nullable=False)

    contas = relationship("Conta", back_populates="usuario")
    metas = relationship("Meta", back_populates="usuario")


class Conta(Base):
    __tablename__ = "contas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    nome = Column(String, nullable=False)
    tipo = Column(String, nullable=False)  # ex: "corrente", "cartao", "dinheiro"
    saldo = Column(Numeric(10, 2), default=0)

    usuario = relationship("Usuario", back_populates="contas")
    transacoes = relationship("Transacao", back_populates="conta")


class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String, nullable=False)

    transacoes = relationship("Transacao", back_populates="categoria")


class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conta_id = Column(UUID(as_uuid=True), ForeignKey("contas.id"), nullable=False)
    categoria_id = Column(UUID(as_uuid=True), ForeignKey("categorias.id"), nullable=False)
    valor = Column(Numeric(10, 2), nullable=False)
    tipo = Column(String, nullable=False)  # "receita" ou "despesa"
    data = Column(Date, default=date.today, nullable=False)

    conta = relationship("Conta", back_populates="transacoes")
    categoria = relationship("Categoria", back_populates="transacoes")


class Meta(Base):
    __tablename__ = "metas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    valor_alvo = Column(Numeric(10, 2), nullable=False)
    prazo = Column(Date, nullable=False)

    usuario = relationship("Usuario", back_populates="metas")


class TransacaoRecorrente(Base):
    __tablename__ = "transacoes_recorrentes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conta_id = Column(UUID(as_uuid=True), ForeignKey("contas.id"), nullable=False)
    categoria_id = Column(UUID(as_uuid=True), ForeignKey("categorias.id"), nullable=False)
    valor = Column(Numeric(10, 2), nullable=False)
    tipo = Column(String, nullable=False)  # "receita" ou "despesa"
    dia_do_mes = Column(Integer, nullable=False)  # dia em que a transação deve ser gerada (1-28)
    ativa = Column(Boolean, default=True, nullable=False)
    ultima_execucao = Column(String, nullable=True)  # guarda "AAAA-MM" do último mês processado

    conta = relationship("Conta")
    categoria = relationship("Categoria")