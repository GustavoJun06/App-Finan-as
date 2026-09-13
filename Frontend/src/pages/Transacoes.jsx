import { useEffect, useState } from "react";
import api from "../services/api";
import NavBar from "../components/NavBar";

export default function Transacoes() {
  const [transacoes, setTransacoes] = useState([]);
  const [contas, setContas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // Campos do formulário de nova transação
  const [contaId, setContaId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("despesa");

  // Campo simples para criar categoria nova rapidamente
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

      // Pré-seleciona a primeira conta/categoria no formulário, se existirem
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
    const confirmar = window.confirm("Excluir esta transação?");
    if (!confirmar) return;
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

  if (carregando) return <p style={{ padding: 24 }}>Carregando...</p>;

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", fontFamily: "sans-serif", padding: "0 16px" }}>
      <NavBar />
      <h1>Transações</h1>

      {erro && <p style={{ color: "red" }}>{erro}</p>}

      {contas.length === 0 ? (
        <p>
          Você precisa criar uma conta antes de lançar transações.{" "}
          <a href="/contas">Criar conta</a>
        </p>
      ) : (
        <>
          {/* Formulário de nova categoria (rápido) */}
          <form onSubmit={handleCriarCategoria} style={{ marginBottom: 16, display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Nova categoria (ex: Alimentação)"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              style={{ padding: 6, flex: 1 }}
            />
            <button type="submit">Adicionar categoria</button>
          </form>

          {/* Formulário de nova transação */}
          <form
            onSubmit={handleCriarTransacao}
            style={{ marginBottom: 24, display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            <select value={contaId} onChange={(e) => setContaId(e.target.value)} style={{ padding: 8 }}>
              {contas.map((conta) => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome}
                </option>
              ))}
            </select>

            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              style={{ padding: 8 }}
              disabled={categorias.length === 0}
            >
              {categorias.length === 0 ? (
                <option>Crie uma categoria primeiro</option>
              ) : (
                categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))
              )}
            </select>

            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ padding: 8 }}>
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>

            <input
              type="number"
              step="0.01"
              placeholder="Valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
              style={{ padding: 8, width: 120 }}
            />

            <button type="submit" disabled={categorias.length === 0}>
              Lançar
            </button>
          </form>

          {/* Lista de transações */}
          {transacoes.length === 0 ? (
            <p>Nenhuma transação lançada ainda.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                  <th>Data</th>
                  <th>Conta</th>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transacoes.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td>{t.data}</td>
                    <td>{nomeDaConta(t.conta_id)}</td>
                    <td>{nomeDaCategoria(t.categoria_id)}</td>
                    <td style={{ color: t.tipo === "receita" ? "green" : "crimson" }}>{t.tipo}</td>
                    <td>R$ {t.valor.toFixed(2)}</td>
                    <td>
                      <button onClick={() => handleExcluir(t.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
