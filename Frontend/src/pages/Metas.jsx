import { useEffect, useState } from "react";
import api from "../services/api";
import NavBar from "../components/NavBar";

export default function Metas() {
  const [metas, setMetas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [valorAlvo, setValorAlvo] = useState("");
  const [prazo, setPrazo] = useState("");

  async function carregarMetas() {
    setCarregando(true);
    try {
      const resposta = await api.get("/metas");
      setMetas(resposta.data);
    } catch {
      setErro("Não foi possível carregar as metas");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarMetas();
  }, []);

  async function handleSubmit(evento) {
    evento.preventDefault();
    try {
      await api.post("/metas", { valor_alvo: parseFloat(valorAlvo), prazo });
      setValorAlvo("");
      setPrazo("");
      carregarMetas();
    } catch {
      setErro("Não foi possível criar a meta");
    }
  }

  async function handleExcluir(id) {
    const confirmar = window.confirm("Excluir esta meta?");
    if (!confirmar) return;
    try {
      await api.delete(`/metas/${id}`);
      carregarMetas();
    } catch {
      setErro("Não foi possível excluir a meta");
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif", padding: "0 16px" }}>
      <NavBar />
      <h1>Minhas metas</h1>

      {erro && <p style={{ color: "red" }}>{erro}</p>}

      <form onSubmit={handleSubmit} style={{ marginBottom: 24, display: "flex", gap: 8 }}>
        <input
          type="number"
          step="0.01"
          placeholder="Valor alvo (ex: 5000)"
          value={valorAlvo}
          onChange={(e) => setValorAlvo(e.target.value)}
          required
          style={{ padding: 8, flex: 1 }}
        />
        <input
          type="date"
          value={prazo}
          onChange={(e) => setPrazo(e.target.value)}
          required
          style={{ padding: 8 }}
        />
        <button type="submit">Criar meta</button>
      </form>

      {carregando ? (
        <p>Carregando...</p>
      ) : metas.length === 0 ? (
        <p>Nenhuma meta cadastrada ainda.</p>
      ) : (
        metas.map((meta) => (
          <div
            key={meta.id}
            style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 12 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>R$ {meta.valor_atual.toFixed(2)} de R$ {meta.valor_alvo.toFixed(2)}</strong>
              <button onClick={() => handleExcluir(meta.id)}>Excluir</button>
            </div>
            <p style={{ margin: "4px 0", color: "#666" }}>Prazo: {meta.prazo}</p>

            {/* Barra de progresso simples com CSS puro */}
            <div style={{ background: "#eee", borderRadius: 4, height: 12, overflow: "hidden" }}>
              <div
                style={{
                  width: `${meta.progresso_percentual}%`,
                  background: meta.progresso_percentual >= 100 ? "#22c55e" : "#4f46e5",
                  height: "100%",
                }}
              />
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#666" }}>
              {meta.progresso_percentual}% concluído
            </p>
          </div>
        ))
      )}
    </div>
  );
}
