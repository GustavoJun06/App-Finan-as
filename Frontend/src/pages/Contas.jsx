import { useEffect, useState } from "react";
import api from "../services/api";
import NavBar from "../components/NavBar";

export default function Contas() {
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // Estado do formulário (serve tanto para criar quanto para editar)
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("corrente");
  const [editandoId, setEditandoId] = useState(null); // null = criando nova, senão = editando essa conta

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
        // Editando uma conta existente
        await api.put(`/contas/${editandoId}`, { nome, tipo });
      } else {
        // Criando uma conta nova
        await api.post("/contas", { nome, tipo });
      }
      cancelarEdicao();
      carregarContas(); // recarrega a lista para mostrar a mudança
    } catch {
      setErro("Não foi possível salvar a conta");
    }
  }

  async function handleExcluir(id) {
    const confirmar = window.confirm("Tem certeza que deseja excluir esta conta?");
    if (!confirmar) return;

    try {
      await api.delete(`/contas/${id}`);
      carregarContas();
    } catch {
      setErro("Não foi possível excluir a conta");
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif", padding: "0 16px" }}>
      <NavBar />
      <h1>Minhas contas</h1>

      {erro && <p style={{ color: "red" }}>{erro}</p>}

      {/* Formulário de criação/edição */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 24, display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="Nome da conta"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          style={{ padding: 8, flex: 1 }}
        />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ padding: 8 }}>
          <option value="corrente">Conta corrente</option>
          <option value="cartao">Cartão</option>
          <option value="dinheiro">Dinheiro</option>
        </select>
        <button type="submit">{editandoId ? "Salvar" : "Adicionar"}</button>
        {editandoId && (
          <button type="button" onClick={cancelarEdicao}>
            Cancelar
          </button>
        )}
      </form>

      {/* Lista de contas */}
      {carregando ? (
        <p>Carregando...</p>
      ) : contas.length === 0 ? (
        <p>Nenhuma conta cadastrada ainda.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Saldo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contas.map((conta) => (
              <tr key={conta.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>{conta.nome}</td>
                <td>{conta.tipo}</td>
                <td>R$ {conta.saldo.toFixed(2)}</td>
                <td>
                  <button onClick={() => iniciarEdicao(conta)}>Editar</button>{" "}
                  <button onClick={() => handleExcluir(conta.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
