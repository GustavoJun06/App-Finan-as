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

    conta = transacao.conta
    valor_decimal = Decimal(str(transacao.valor))
    if transacao.tipo == "receita":
        conta.saldo -= valor_decimal
    else:
        conta.saldo += valor_decimal

    db.delete(transacao)
    db.commit()


# ==================== METAS ====================

def _calcular_saldo_total(usuario_id: uuid.UUID, db: Session) -> Decimal:
    contas = db.query(models.Conta).filter(models.Conta.usuario_id == usuario_id).all()
    return sum((conta.saldo for conta in contas), Decimal("0"))


def _montar_resposta_meta(meta: models.Meta, saldo_total: Decimal) -> schemas.MetaResponse:
    valor_atual = float(saldo_total)
    valor_alvo = float(meta.valor_alvo)
    progresso = (valor_atual / valor_alvo * 100) if valor_alvo > 0 else 0
    progresso = min(progresso, 100)

    return schemas.MetaResponse(
        id=meta.id,
        valor_alvo=valor_alvo,
        prazo=meta.prazo,
        valor_atual=valor_atual,
        progresso_percentual=round(progresso, 2),
    )


@router.post("/metas", response_model=schemas.MetaResponse, status_code=status.HTTP_201_CREATED)
def criar_meta(
    dados: schemas.MetaCreate,
    usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    nova_meta = models.Meta(
        valor_alvo=Decimal(str(dados.valor_alvo)),
        prazo=dados.prazo,
        usuario_id=usuario_atual.id,
    )
    db.add(nova_meta)
    db.commit()
    db.refresh(nova_meta)

    saldo_total = _calcular_saldo_total(usuario_atual.id, db)
    return _montar_resposta_meta(nova_meta, saldo_total)


@router.get("/metas", response_model=list[schemas.MetaResponse])
def listar_metas(
    usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    metas = db.query(models.Meta).filter(models.Meta.usuario_id == usuario_atual.id).all()
    saldo_total = _calcular_saldo_total(usuario_atual.id, db)
    return [_montar_resposta_meta(meta, saldo_total) for meta in metas]


@router.delete("/metas/{meta_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_meta(
    meta_id: uuid.UUID,
    usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    meta = (
        db.query(models.Meta)
        .filter(models.Meta.id == meta_id, models.Meta.usuario_id == usuario_atual.id)
        .first()
    )
    if not meta:
        raise HTTPException(status_code=404, detail="Meta não encontrada")

    db.delete(meta)
    db.commit()


# ==================== DASHBOARD ====================

@router.get("/dashboard", response_model=schemas.DashboardResponse)
def obter_dashboard(
    usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    saldo_total = _calcular_saldo_total(usuario_atual.id, db)

    transacoes = (
        db.query(models.Transacao)
        .join(models.Conta)
        .filter(models.Conta.usuario_id == usuario_atual.id)
        .all()
    )

    totais_por_categoria: dict[str, Decimal] = {}
    for transacao in transacoes:
        if transacao.tipo != "despesa":
            continue
        nome_categoria = transacao.categoria.nome
        totais_por_categoria[nome_categoria] = (
            totais_por_categoria.get(nome_categoria, Decimal("0")) + transacao.valor
        )

    gastos_por_categoria = [
        schemas.ResumoPorCategoria(categoria=nome, total=float(total))
        for nome, total in totais_por_categoria.items()
    ]

    resumo_mensal: dict[str, dict[str, Decimal]] = {}
    for transacao in transacoes:
        chave_mes = transacao.data.strftime("%Y-%m")
        if chave_mes not in resumo_mensal:
            resumo_mensal[chave_mes] = {"receitas": Decimal("0"), "despesas": Decimal("0")}

        if transacao.tipo == "receita":
            resumo_mensal[chave_mes]["receitas"] += transacao.valor
        else:
            resumo_mensal[chave_mes]["despesas"] += transacao.valor

    evolucao_mensal = [
        schemas.ResumoMensal(
            mes=mes,
            receitas=float(valores["receitas"]),
            despesas=float(valores["despesas"]),
        )
        for mes, valores in sorted(resumo_mensal.items())
    ]

    return schemas.DashboardResponse(
        saldo_total=float(saldo_total),
        gastos_por_categoria=gastos_por_categoria,
        evolucao_mensal=evolucao_mensal,
    )


# ==================== TRANSAÇÕES RECORRENTES ====================

@router.post(
    "/recorrencias",
    response_model=schemas.TransacaoRecorrenteResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_recorrencia(
    dados: schemas.TransacaoRecorrenteCreate,
    usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    if dados.tipo not in ("receita", "despesa"):
        raise HTTPException(status_code=422, detail="tipo deve ser 'receita' ou 'despesa'")
    if not (1 <= dados.dia_do_mes <= 28):
        raise HTTPException(status_code=422, detail="dia_do_mes deve estar entre 1 e 28")

    # Confirma que a conta pertence ao usuário logado
    _buscar_conta_do_usuario(dados.conta_id, usuario_atual.id, db)

    categoria = db.query(models.Categoria).filter(models.Categoria.id == dados.categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")

    nova_recorrencia = models.TransacaoRecorrente(
        conta_id=dados.conta_id,
        categoria_id=dados.categoria_id,
        valor=Decimal(str(dados.valor)),
        tipo=dados.tipo,
        dia_do_mes=dados.dia_do_mes,
    )
    db.add(nova_recorrencia)
    db.commit()
    db.refresh(nova_recorrencia)
    return nova_recorrencia


@router.get("/recorrencias", response_model=list[schemas.TransacaoRecorrenteResponse])
def listar_recorrencias(
    usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.TransacaoRecorrente)
        .join(models.Conta)
        .filter(models.Conta.usuario_id == usuario_atual.id)
        .all()
    )


@router.delete("/recorrencias/{recorrencia_id}", status_code=status.HTTP_204_NO_CONTENT)
def desativar_recorrencia(
    recorrencia_id: uuid.UUID,
    usuario_atual: models.Usuario = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    """Em vez de apagar de vez, marcamos como inativa (preserva o histórico)."""
    recorrencia = (
        db.query(models.TransacaoRecorrente)
        .join(models.Conta)
        .filter(
            models.TransacaoRecorrente.id == recorrencia_id,
            models.Conta.usuario_id == usuario_atual.id,
        )
        .first()
    )
    if not recorrencia:
        raise HTTPException(status_code=404, detail="Recorrência não encontrada")

    recorrencia.ativa = False
    db.commit()


@router.post("/recorrencias/processar", status_code=status.HTTP_200_OK)
def processar_recorrencias_manualmente(db: Session = Depends(get_db)):
    """
    Rota manual para forçar o processamento das recorrências (útil para testes,
    já que o job automático só roda uma vez por dia).
    """
    from app.scheduler import processar_recorrencias

    quantidade = processar_recorrencias(db)
    return {"transacoes_geradas": quantidade}