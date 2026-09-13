def _criar_usuario_e_autenticar(client, email="maria@teste.com"):
    """Função auxiliar: cadastra um usuário e devolve os cabeçalhos já autenticados."""
    client.post("/cadastro", json={"nome": "Maria Teste", "email": email, "senha": "senha123"})
    resposta_login = client.post("/login", data={"username": email, "password": "senha123"})
    token = resposta_login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_criar_conta_exige_autenticacao(client):
    resposta = client.post("/contas", json={"nome": "Conta Corrente", "tipo": "corrente"})
    assert resposta.status_code == 401  # sem token, deve ser recusado


def test_criar_e_listar_conta(client):
    headers = _criar_usuario_e_autenticar(client)

    resposta_criar = client.post(
        "/contas", json={"nome": "Conta Corrente", "tipo": "corrente"}, headers=headers
    )
    assert resposta_criar.status_code == 201
    assert resposta_criar.json()["saldo"] == 0

    resposta_listar = client.get("/contas", headers=headers)
    assert resposta_listar.status_code == 200
    assert len(resposta_listar.json()) == 1


def test_usuario_nao_ve_conta_de_outro_usuario(client):
    headers_maria = _criar_usuario_e_autenticar(client, email="maria@teste.com")
    headers_joao = _criar_usuario_e_autenticar(client, email="joao@teste.com")

    client.post("/contas", json={"nome": "Conta da Maria", "tipo": "corrente"}, headers=headers_maria)

    # João não deve ver a conta da Maria
    resposta = client.get("/contas", headers=headers_joao)
    assert resposta.status_code == 200
    assert len(resposta.json()) == 0


def _criar_conta_e_categoria(client, headers):
    """Função auxiliar: cria uma conta e uma categoria, devolve os IDs."""
    conta = client.post("/contas", json={"nome": "Conta Corrente", "tipo": "corrente"}, headers=headers).json()
    categoria = client.post("/categorias", json={"nome": "Alimentação"}, headers=headers).json()
    return conta["id"], categoria["id"]


def test_transacao_receita_aumenta_saldo(client):
    headers = _criar_usuario_e_autenticar(client)
    conta_id, categoria_id = _criar_conta_e_categoria(client, headers)

    client.post(
        "/transacoes",
        json={"conta_id": conta_id, "categoria_id": categoria_id, "valor": 500, "tipo": "receita"},
        headers=headers,
    )

    conta_atualizada = client.get("/contas", headers=headers).json()[0]
    assert conta_atualizada["saldo"] == 500


def test_transacao_despesa_diminui_saldo(client):
    headers = _criar_usuario_e_autenticar(client)
    conta_id, categoria_id = _criar_conta_e_categoria(client, headers)

    # Primeiro entra uma receita de 500...
    client.post(
        "/transacoes",
        json={"conta_id": conta_id, "categoria_id": categoria_id, "valor": 500, "tipo": "receita"},
        headers=headers,
    )
    # ...depois uma despesa de 150
    client.post(
        "/transacoes",
        json={"conta_id": conta_id, "categoria_id": categoria_id, "valor": 150, "tipo": "despesa"},
        headers=headers,
    )

    conta_atualizada = client.get("/contas", headers=headers).json()[0]
    assert conta_atualizada["saldo"] == 350  # 500 - 150


def test_excluir_transacao_reverte_saldo(client):
    headers = _criar_usuario_e_autenticar(client)
    conta_id, categoria_id = _criar_conta_e_categoria(client, headers)

    transacao = client.post(
        "/transacoes",
        json={"conta_id": conta_id, "categoria_id": categoria_id, "valor": 500, "tipo": "receita"},
        headers=headers,
    ).json()

    # Confirma que o saldo subiu
    conta = client.get("/contas", headers=headers).json()[0]
    assert conta["saldo"] == 500

    # Exclui a transação
    resposta_delete = client.delete(f"/transacoes/{transacao['id']}", headers=headers)
    assert resposta_delete.status_code == 204

    # Saldo deve voltar para 0
    conta_apos_exclusao = client.get("/contas", headers=headers).json()[0]
    assert conta_apos_exclusao["saldo"] == 0


def test_meta_calcula_progresso_corretamente(client):
    headers = _criar_usuario_e_autenticar(client)
    conta_id, categoria_id = _criar_conta_e_categoria(client, headers)

    # Saldo da conta vai para 250
    client.post(
        "/transacoes",
        json={"conta_id": conta_id, "categoria_id": categoria_id, "valor": 250, "tipo": "receita"},
        headers=headers,
    )

    resposta_meta = client.post(
        "/metas", json={"valor_alvo": 1000, "prazo": "2026-12-31"}, headers=headers
    )

    assert resposta_meta.status_code == 201
    dados = resposta_meta.json()
    assert dados["valor_atual"] == 250
    assert dados["progresso_percentual"] == 25.0  # 250 / 1000 * 100
