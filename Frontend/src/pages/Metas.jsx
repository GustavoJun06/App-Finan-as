import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import api from "../services/api";
import AppLayout from "../components/AppLayout";

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
    if (!window.confirm("Excluir esta meta?")) return;
    try {
      await api.delete(`/metas/${id}`);
      carregarMetas();
    } catch {
      setErro("Não foi possível excluir a meta");
    }
  }

  return (
    <AppLayout>
      <h1 style={{ marginBottom: 24 }}>Minhas metas</h1>

      {erro && <p className="text-expense">{erro}</p>}

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="number"
            step="0.01"
            placeholder="Valor alvo (ex: 5000)"
            className="input"
            value={valorAlvo}
            onChange={(e) => setValorAlvo(e.target.value)}
            required
            style={{ flex: 1, minWidth: 160 }}
          />
          <input
            type="date"
            className="input"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">Criar meta</button>
        </form>
      </div>

      {carregando ? (
        <p className="text-muted">Carregando...</p>
      ) : metas.length === 0 ? (
        <p className="text-muted">Nenhuma meta cadastrada ainda.</p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {metas.map((meta) => (
            <div key={meta.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <span className="num" style={{ fontSize: 18 }}>
                    R$ {meta.valor_atual.toFixed(2)}
                  </span>
                  <span className="text-muted"> de R$ {meta.valor_alvo.toFixed(2)}</span>
                  <div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
                    Prazo: {meta.prazo}
                  </div>
                </div>
                <button onClick={() => handleExcluir(meta.id)} className="btn btn-ghost" style={{ padding: 8 }}>
                  <Trash2 size={15} color="var(--accent-expense)" />
                </button>
              </div>

              <div
                style={{
                  background: "var(--bg-surface-alt)",
                  borderRadius: 4,
                  height: 10,
                  overflow: "hidden",
                  marginTop: 16,
                }}
              >
                <div
                  style={{
                    width: `${meta.progresso_percentual}%`,
                    background:
                      meta.progresso_percentual >= 100 ? "var(--accent-income)" : "var(--accent-primary)",
                    height: "100%",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <p className="text-muted num" style={{ margin: "6px 0 0", fontSize: 13 }}>
                {meta.progresso_percentual}% concluído
              </p>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
