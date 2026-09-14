import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mensagemSucesso = location.state?.mensagem;

  async function handleSubmit(evento) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      await login(email, senha);
      navigate("/dashboard");
    } catch {
      setErro("E-mail ou senha incorretos");
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
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Bem-vindo de volta</h1>
        <p className="text-muted" style={{ marginTop: 0, marginBottom: 24, fontSize: 14 }}>
          Entre para ver seu painel financeiro
        </p>

        {mensagemSucesso && (
          <p className="text-income" style={{ fontSize: 14, marginTop: 0 }}>
            {mensagemSucesso}
          </p>
        )}

        <form onSubmit={handleSubmit}>
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
              style={{ width: "100%" }}
            />
          </div>

          {erro && (
            <p className="text-expense" style={{ fontSize: 14, marginTop: -8, marginBottom: 16 }}>
              {erro}
            </p>
          )}

          <button type="submit" disabled={carregando} className="btn btn-primary" style={{ width: "100%" }}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
