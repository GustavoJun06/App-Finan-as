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
    evento.preventDefault(); // evita que o formulário recarregue a página (comportamento padrão do HTML)
    setErro("");
    setCarregando(true);

    try {
      await login(email, senha);
      navigate("/dashboard"); // login deu certo, vai para o dashboard
    } catch (erroCapturado) {
      setErro("E-mail ou senha incorretos");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h1>Entrar</h1>

      {mensagemSucesso && <p style={{ color: "green" }}>{mensagemSucesso}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>E-mail</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Senha</label>
          <br />
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        {erro && <p style={{ color: "red" }}>{erro}</p>}

        <button type="submit" disabled={carregando} style={{ width: "100%", padding: 10 }}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
      </p>
    </div>
  );
}
