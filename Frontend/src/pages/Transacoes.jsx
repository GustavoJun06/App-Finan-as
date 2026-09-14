import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import api from "../services/api";
import AppLayout from "../components/AppLayout";

export default function Transacoes() {
  const [transacoes, setTransacoes] = useState([]);
  const [contas, setContas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [contaId, setContaId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("despesa");
  const [novaCategoria, setNovaCategoria] = useState("");

  async function carregarTudo() {
    setCarregando(true);
    try {
      const [respTransacoes, respContas, respCategorias] = await Promise.all([
        api.get("/transacoes"),
        api.get("/contas"),
        api.get("/categorias"),
      ]);
      setTransacoes(respTransacoes.data);
      setContas(respContas.data);
      setCategorias(respCategorias.data);
      if (respContas.data.length > 0) setContaId((atual) => atual || respContas.data[0].id);
      if (respCategorias.data.length > 0) setCategoriaId((atual) => atual || respCategorias.data[0].id);
    } catch {
      setErro("Não foi possível carregar os dados");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  async function handleCriarTransacao(evento) {
    evento.preventDefault();
    try {
      await api.post("/transacoes", {
        conta_id: contaId,
        categoria_id: categoriaId,
        valor: parseFloat(valor),
        tipo,
      });
      setValor("");
      carregarTudo();
    } catch {
      setErro("Não foi possível criar a transação");
    }
  }

  async function handleCriarCategoria(evento) {
    evento.preventDefault();
    if (!novaCategoria.trim()) return;
    try {
      await api.post("/categorias", { nome: novaCategoria });
      setNovaCategoria("");
      carregarTudo();
    } catch {
      setErro("Não foi possível criar a categoria");
    }
  }

  async function handleExcluir(id) {
    if (!window.confirm("Excluir esta transação?")) return;
    try {
      await api.delete(`/transacoes/${id}`);
      carregarTudo();
    } catch {
      setErro("Não foi possível excluir a transação");
    }
  }

  function nomeDaConta(id) {
    return contas.find((c) => c.id === id)?.nome ?? "—";
  }
  function nomeDaCategoria(id) {
    return categorias.find((c) => c.id === id)?.nome ?? "—";
  }

  if (carregando) return <AppLayout><p className="text-muted">Carregando...</p></AppLayout>;

  return (
    <AppLayout>
      <h1 style={{ marginBottom: 24 }}>Transações</h1>

      {erro && <p className="text-expense">{erro}</p>}

      {contas.length === 0 ? (
        <p className="text-muted">
          Você precisa criar uma conta antes de lançar transações.{" "}
          <a href="/contas">Criar conta</a>
        </p>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <form onSubmit={handleCriarCategoria} style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                placeholder="Nova categoria (ex: Alimentação)"
                className="input"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-ghost">Adicionar categoria</button>
            </form>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <form
              onSubmit={handleCriarTransacao}
              style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}
            >
              <select value={contaId} onChange={(e) => setContaId(e.target.value)} className="input">
                {contas.map((conta) => (
                  <option key={conta.id} value={conta.id}>{conta.nome}</option>
                ))}
              </select>

              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="input"
                disabled={categorias.length === 0}
              >
                {categorias.length === 0 ? (
                  <option>Crie uma categoria primeiro</option>
                ) : (
                  categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
                  ))
                )}
              </select>

              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input">
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>

              <input
                type="number"
                step="0.01"
                placeholder="Valor"
                className="input"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
                style={{ width: 120 }}
              />

              <button type="submit" disabled={categorias.length === 0} className="btn btn-primary">
                Lançar
              </button>
            </form>
          </div>

          {transacoes.length === 0 ? (
            <p className="text-muted">Nenhuma transação lançada ainda.</p>
          ) : (
            <div className="row-list">
              {transacoes.map((t) => (
                <div key={t.id} className="row-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{nomeDaCategoria(t.categoria_id)}</div>
                    <div className="text-muted" style={{ fontSize: 13 }}>
                      {nomeDaConta(t.conta_id)} · {t.data}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span className={`num ${t.tipo === "receita" ? "text-income" : "text-expense"}`}>
                      {t.tipo === "receita" ? "+" : "−"} R$ {t.valor.toFixed(2)}
                    </span>
                    <button onClick={() => handleExcluir(t.id)} className="btn btn-ghost" style={{ padding: 8 }}>
                      <Trash2 size={15} color="var(--accent-expense)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
