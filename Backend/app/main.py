from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app import models  # importa o arquivo para que o SQLAlchemy "veja" as 5 entidades
from app.routes_auth import router as auth_router
from app.routes_financas import router as financas_router
from app.scheduler import iniciar_agendador

# Cria todas as tabelas no banco com base nas classes definidas em models.py,
# caso ainda não existam
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Finanças App API")

# Autoriza o frontend (rodando em outra porta) a fazer requisições para esta API.
# Sem isso, o navegador bloqueia as respostas por política de segurança (CORS).
import os

# Lista de origens autorizadas a acessar a API. Em desenvolvimento, o frontend
# roda em localhost:5173. Em produção, adicionamos a URL da Vercel via
# variável de ambiente FRONTEND_URL (configurada no Railway).
origens_permitidas = ["http://localhost:5173"]
frontend_url_producao = os.getenv("FRONTEND_URL")
if frontend_url_producao:
    origens_permitidas.append(frontend_url_producao)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origens_permitidas,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, tags=["Autenticação"])
app.include_router(financas_router, tags=["Finanças"])


@app.on_event("startup")
def iniciar_tarefas_em_background():
    iniciar_agendador()


@app.get("/")
def read_root():
    return {"status": "API rodando com sucesso"}