def test_cadastro_cria_usuario_com_sucesso(client):
    resposta = client.post(
        "/cadastro",
        json={"nome": "Maria Teste", "email": "maria@teste.com", "senha": "senha123"},
    )

    assert resposta.status_code == 201
    dados = resposta.json()
    assert dados["nome"] == "Maria Teste"
    assert dados["email"] == "maria@teste.com"
    assert "senha" not in dados  # a senha nunca deve aparecer na resposta


def test_cadastro_com_email_duplicado_falha(client):
    dados_usuario = {"nome": "Maria Teste", "email": "maria@teste.com", "senha": "senha123"}

    # Primeira vez: deve funcionar
    client.post("/cadastro", json=dados_usuario)

    # Segunda vez, mesmo e-mail: deve falhar
    resposta = client.post("/cadastro", json=dados_usuario)

    assert resposta.status_code == 400


def test_login_com_credenciais_corretas_devolve_token(client):
    client.post(
        "/cadastro",
        json={"nome": "Maria Teste", "email": "maria@teste.com", "senha": "senha123"},
    )

    resposta = client.post(
        "/login",
        data={"username": "maria@teste.com", "password": "senha123"},
    )

    assert resposta.status_code == 200
    assert "access_token" in resposta.json()


def test_login_com_senha_errada_falha(client):
    client.post(
        "/cadastro",
        json={"nome": "Maria Teste", "email": "maria@teste.com", "senha": "senha123"},
    )

    resposta = client.post(
        "/login",
        data={"username": "maria@teste.com", "password": "senha_errada"},
    )

    assert resposta.status_code == 401
