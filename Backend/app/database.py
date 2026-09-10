import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Carrega as variáveis do arquivo .env (como a DATABASE_URL)
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# "engine" é o objeto que sabe como conversar com o banco de dados
engine = create_engine(DATABASE_URL)

# "SessionLocal" é uma fábrica de sessões: cada vez que uma rota da API
# precisa acessar o banco, ela pede uma sessão nova daqui
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# "Base" é a classe da qual todos os nossos modelos (tabelas) vão herdar
Base = declarative_base()


# Função auxiliar que o FastAPI vai usar para abrir e fechar
# a conexão com o banco automaticamente em cada requisição
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()