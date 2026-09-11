from fastapi import FastAPI
from app.database import Base, engine
from app import models  # importa o arquivo para que o SQLAlchemy "veja" as 5 entidades
from app.routes_auth import router as auth_router

# Cria todas as tabelas no banco (Usuario, Conta, Categoria, Transacao, Meta)
# com base nas classes definidas em models.py, caso ainda não existam
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Finanças App API")

app.include_router(auth_router, tags=["Autenticação"])


@app.get("/")
def read_root():
    return {"status": "API rodando com sucesso"}