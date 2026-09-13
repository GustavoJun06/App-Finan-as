import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, get_db

# Banco de dados separado, só para os testes (nunca o mesmo do desenvolvimento!)
TEST_DATABASE_URL = "postgresql://financas_user:financas_pass@localhost:5432/financas_test_db"

engine_teste = create_engine(TEST_DATABASE_URL)
SessionLocalTeste = sessionmaker(autocommit=False, autoflush=False, bind=engine_teste)


@pytest.fixture(scope="function")
def db_session():
    """
    Roda antes de CADA teste: cria todas as tabelas do zero, entrega uma
    sessão limpa para o teste usar, e no final apaga tudo (garante que
    um teste nunca interfere no outro).
    """
    Base.metadata.create_all(bind=engine_teste)
    sessao = SessionLocalTeste()
    try:
        yield sessao
    finally:
        sessao.close()
        Base.metadata.drop_all(bind=engine_teste)


@pytest.fixture(scope="function")
def client(db_session):
    """
    Cliente de testes do FastAPI: simula requisições HTTP para a nossa API,
    mas usando o banco de teste em vez do banco real (via dependency_overrides).
    """

    def sobrescrever_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = sobrescrever_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
