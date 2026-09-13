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
      // Diferente do login, o cadastro é enviado como JSON comum
      // (bate com o schema UsuarioCreate do backend)
      await api.post("/cadastro", { nome, email, senha });

      // Cadastro deu certo: manda para o login com uma mensagem de sucesso
      navigate("/login", { state: { mensagem: "Cadastro realizado! Faça login para continuar." } });
    } catch (erroCapturado) {
      const detalhe = erroCapturado.response?.data?.detail;
      setErro(detalhe || "Não foi possível concluir o cadastro");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h1>Criar conta</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Nome</label>
          <br />
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

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
            minLength={6}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        {erro && <p style={{ color: "red" }}>{erro}</p>}

        <button type="submit" disabled={carregando} style={{ width: "100%", padding: 10 }}>
          {carregando ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  );
}
