import uuid
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter()


# ==================== CONTAS ====================

@router.post("/contas", response_model=schemas.ContaResponse, status_code=status.HTTP_201_CREATED)
def criar_conta(
    dados: schemas.ContaCreate,
    usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    nova_conta = models.Conta(
        nome=dados.nome,
        tipo=dados.tipo,
        usuario_id=usuario_atual.id,
    )
    db.add(nova_conta)
    db.commit()
    db.refresh(nova_conta)
    return nova_conta


@router.get("/contas", response_model=list[schemas.ContaResponse])
def listar_contas(
    usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    return db.query(models.Conta).filter(models.Conta.usuario_id == usuario_atual.id).all()


@router.put("/contas/{conta_id}", response_model=schemas.ContaResponse)
def atualizar_conta(
    conta_id: uuid.UUID,
    dados: schemas.ContaCreate,
    usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    conta = (
        db.query(models.Conta)
        .filter(models.Conta.id == conta_id, models.Conta.usuario_id == usuario_atual.id)
        .first()
    )
    if not conta:
        raise HTTPException(status_code=404, detail="Conta não encontrada")

    conta.nome = dados.nome
    conta.tipo = dados.tipo
    db.commit()
    db.refresh(conta)
    return conta


@router.delete("/contas/{conta_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_conta(
    conta_id: uuid.UUID,
    usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    conta = (
        db.query(models.Conta)
        .filter(models.Conta.id == conta_id, models.Conta.usuario_id == usuario_atual.id)
        .first()
    )
    if not conta:
        raise HTTPException(status_code=404, detail="Conta não encontrada")

    db.delete(conta)
    db.commit()


# ==================== CATEGORIAS ====================
# Categorias não têm "dono" (são compartilhadas por todos os usuários),
# mas ainda exigimos login para criar/editar, para evitar uso indevido.

@router.post("/categorias", response_model=schemas.CategoriaResponse, status_code=status.HTTP_201_CREATED)
def criar_categoria(
    dados: schemas.CategoriaCreate,
    usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    nova_categoria = models.Categoria(nome=dados.nome)
    db.add(nova_categoria)
    db.commit()
    db.refresh(nova_categoria)
    return nova_categoria


@router.get("/categorias", response_model=list[schemas.CategoriaResponse])
def listar_categorias(
    usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    return db.query(models.Categoria).all()


# ==================== TRANSAÇÕES ====================

def _buscar_conta_do_usuario(conta_id: uuid.UUID, usuario_id: uuid.UUID, db: Session) -> models.Conta:
    """Busca uma conta garantindo que ela pertence ao usuário logado."""
    conta = (
        db.query(models.Conta)
        .filter(models.Conta.id == conta_id, models.Conta.usuario_id == usuario_id)
        .first()
    )
    if not conta:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    return conta


@router.post("/transacoes", response_model=schemas.TransacaoResponse, status_code=status.HTTP_201_CREATED)
def criar_transacao(
    dados: schemas.TransacaoCreate,
    usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    if dados.tipo not in ("receita", "despesa"):
        raise HTTPException(status_code=422, detail="tipo deve ser 'receita' ou 'despesa'")

    # Garante que a conta pertence ao usuário logado (evita lançar
    # transação na conta de outra pessoa)
    conta = _buscar_conta_do_usuario(dados.conta_id, usuario_atual.id, db)

    categoria = db.query(models.Categoria).filter(models.Categoria.id == dados.categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")

    nova_transacao = models.Transacao(
        conta_id=dados.conta_id,
        categoria_id=dados.categoria_id,
        valor=dados.valor,
        tipo=dados.tipo,
        data=dados.data or date.today(),
    )
    db.add(nova_transacao)

    # Atualiza o saldo da conta: receita soma, despesa subtrai
    # (convertendo para Decimal, que é o tipo usado no banco para valores monetários)
    valor_decimal = Decimal(str(dados.valor))
    if dados.tipo == "receita":
        conta.saldo += valor_decimal
    else:
        conta.saldo -= valor_decimal

    db.commit()
    db.refresh(nova_transacao)
    return nova_transacao


@router.get("/transacoes", response_model=list[schemas.TransacaoResponse])
def listar_transacoes(
    conta_id: uuid.UUID | None = None,
    categoria_id: uuid.UUID | None = None,
    data_inicio: date | None = None,
    data_fim: date | None = None,
    usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    # Começamos filtrando só transações de contas que pertencem ao usuário logado
    query = (
        db.query(models.Transacao)
        .join(models.Conta)
        .filter(models.Conta.usuario_id == usuario_atual.id)
    )

    if conta_id:
        query = query.filter(models.Transacao.conta_id == conta_id)
    if categoria_id:
        query = query.filter(models.Transacao.categoria_id == categoria_id)
    if data_inicio:
        query = query.filter(models.Transacao.data >= data_inicio)
    if data_fim:
        query = query.filter(models.Transacao.data <= data_fim)

    return query.order_by(models.Transacao.data.desc()).all()


@router.delete("/transacoes/{transacao_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_transacao(
    transacao_id: uuid.UUID,
    usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    transacao = (
        db.query(models.Transacao)
        .join(models.Conta)
        .filter(models.Transacao.id == transacao_id, models.Conta.usuario_id == usuario_atual.id)
        .first()
    )
    if not transacao:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    # Reverte o efeito da transação no saldo antes de apagar
    conta = transacao.conta
    valor_decimal = Decimal(str(transacao.valor))
    if transacao.tipo == "receita":
        conta.saldo -= valor_decimal
    else:
        conta.saldo += valor_decimal

    db.delete(transacao)
    db.commit()