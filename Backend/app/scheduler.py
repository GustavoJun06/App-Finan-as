from datetime import date
from decimal import Decimal
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app import models


def processar_recorrencias(db: Session) -> int:
    """
    Verifica todas as recorrências ativas e, para cada uma cujo dia_do_mes
    já chegou (e que ainda não foi processada neste mês), gera a transação
    correspondente e atualiza o saldo da conta.

    Retorna quantas transações foram geradas.
    """
    hoje = date.today()
    mes_atual = hoje.strftime("%Y-%m")  # ex: "2026-09"

    recorrencias_ativas = (
        db.query(models.TransacaoRecorrente)
        .filter(models.TransacaoRecorrente.ativa == True)  # noqa: E712
        .all()
    )

    quantidade_gerada = 0

    for recorrencia in recorrencias_ativas:
        # Já foi processada neste mês? Pula.
        if recorrencia.ultima_execucao == mes_atual:
            continue

        # O dia configurado ainda não chegou neste mês? Pula por enquanto.
        if hoje.day < recorrencia.dia_do_mes:
            continue

        conta = recorrencia.conta

        nova_transacao = models.Transacao(
            conta_id=recorrencia.conta_id,
            categoria_id=recorrencia.categoria_id,
            valor=recorrencia.valor,
            tipo=recorrencia.tipo,
            data=hoje,
        )
        db.add(nova_transacao)

        valor_decimal = Decimal(str(recorrencia.valor))
        if recorrencia.tipo == "receita":
            conta.saldo += valor_decimal
        else:
            conta.saldo -= valor_decimal

        recorrencia.ultima_execucao = mes_atual
        quantidade_gerada += 1

    db.commit()
    return quantidade_gerada


def _job_diario():
    """Função chamada automaticamente pelo agendador todos os dias."""
    db = SessionLocal()
    try:
        quantidade = processar_recorrencias(db)
        if quantidade:
            print(f"[scheduler] {quantidade} transação(ões) recorrente(s) gerada(s).")
    finally:
        db.close()


def iniciar_agendador():
    """Configura e inicia o agendador em background, chamado uma vez no startup da API."""
    scheduler = BackgroundScheduler()
    # Roda todos os dias à meia-noite e um minuto
    scheduler.add_job(_job_diario, "cron", hour=0, minute=1)
    scheduler.start()
    return scheduler