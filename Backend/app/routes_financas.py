import uuid
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