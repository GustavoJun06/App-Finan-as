import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(evento) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      await api.post("/cadastro", { nome, email, senha });
      navigate("/login", { state: { mensagem: "Cadastro realizado! Faça login para continuar." } });
    } catch (erroCapturado) {
      const detalhe = erroCapturado.response?.data?.detail;
      setErro(detalhe || "Não foi possível concluir o cadastro");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ fontSize: 24, marginBottom: 4 }}>💰</div>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Criar conta</h1>
        <p className="text-muted" style={{ marginTop: 0, marginBottom: 24, fontSize: 14 }}>
          Comece a organizar suas finanças
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label>Nome</label>
            <input
              type="text"
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>E-mail</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label>Senha</label>
            <input
              type="password"
              className="input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              style={{ width: "100%" }}
            />
          </div>

          {erro && (
            <p className="text-expense" style={{ fontSize: 14, marginTop: -8, marginBottom: 16 }}>
              {erro}
            </p>
          )}

          <button type="submit" disabled={carregando} className="btn btn-primary" style={{ width: "100%" }}>
            {carregando ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
