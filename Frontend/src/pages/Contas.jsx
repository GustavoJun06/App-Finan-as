import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import api from "../services/api";
import AppLayout from "../components/AppLayout";

export default function Contas() {
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("corrente");
  const [editandoId, setEditandoId] = useState(null);

  async function carregarContas() {
    setCarregando(true);
    try {
      const resposta = await api.get("/contas");
      setContas(resposta.data);
    } catch {
      setErro("Não foi possível carregar as contas");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarContas();
  }, []);

  function iniciarEdicao(conta) {
    setEditandoId(conta.id);
    setNome(conta.nome);
    setTipo(conta.tipo);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setNome("");
    setTipo("corrente");
  }

  async function handleSubmit(evento) {
    evento.preventDefault();
    try {
      if (editandoId) {
        await api.put(`/contas/${editandoId}`, { nome, tipo });
      } else {
        await api.post("/contas", { nome, tipo });
      }
      cancelarEdicao();
      carregarContas();
    } catch {
      setErro("Não foi possível salvar a conta");
    }
  }

  async function handleExcluir(id) {
    if (!window.confirm("Tem certeza que deseja excluir esta conta?")) return;
    try {
      await api.delete(`/contas/${id}`);
      carregarContas();
    } catch {
      setErro("Não foi possível excluir a conta");
    }
  }

  return (
    <AppLayout>
      <h1 style={{ marginBottom: 24 }}>Minhas contas</h1>

      {erro && <p className="text-expense">{erro}</p>}

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label>Nome da conta</label>
            <input
              type="text"
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input">
              <option value="corrente">Conta corrente</option>
              <option value="cartao">Cartão</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            {editandoId ? "Salvar" : "Adicionar"}
          </button>
          {editandoId && (
            <button type="button" onClick={cancelarEdicao} className="btn btn-ghost">
              Cancelar
            </button>
          )}
        </form>
      </div>

      {carregando ? (
        <p className="text-muted">Carregando...</p>
      ) : contas.length === 0 ? (
        <p className="text-muted">Nenhuma conta cadastrada ainda.</p>
      ) : (
        <div className="row-list">
          {contas.map((conta) => (
            <div key={conta.id} className="row-item">
              <div>
                <div style={{ fontWeight: 600 }}>{conta.nome}</div>
                <div className="text-muted" style={{ fontSize: 13 }}>{conta.tipo}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span className="num">R$ {conta.saldo.toFixed(2)}</span>
                <button onClick={() => iniciarEdicao(conta)} className="btn btn-ghost" style={{ padding: 8 }}>
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleExcluir(conta.id)} className="btn btn-ghost" style={{ padding: 8 }}>
                  <Trash2 size={15} color="var(--accent-expense)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
