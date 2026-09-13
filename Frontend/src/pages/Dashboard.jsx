import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import NavBar from "../components/NavBar";

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const { logout } = useAuth();

  // useEffect com array vazio [] no final = roda uma única vez,
  // quando o componente é montado na tela (parecido com "ao carregar a página")
  useEffect(() => {
    async function carregarDados() {
      try {
        // Busca os dois endpoints em paralelo (mais rápido que um de cada vez)
        const [respostaDashboard, respostaContas] = await Promise.all([
          api.get("/dashboard"),
          api.get("/contas"),
        ]);
        setDashboard(respostaDashboard.data);
        setContas(respostaContas.data);
      } catch (erroCapturado) {
        setErro("Não foi possível carregar os dados");
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  if (carregando) return <p style={{ padding: 24 }}>Carregando...</p>;
  if (erro) return <p style={{ padding: 24, color: "red" }}>{erro}</p>;

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", fontFamily: "sans-serif", padding: "0 16px" }}>
      <NavBar />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Meu painel financeiro</h1>
        <button onClick={logout}>Sair</button>
      </div>

      {/* Card de saldo total */}
      <div style={{ background: "#f0f0f0", padding: 20, borderRadius: 8, marginBottom: 24 }}>
        <p style={{ margin: 0, color: "#666" }}>Saldo total</p>
        <h2 style={{ margin: "4px 0 0" }}>
          R$ {dashboard.saldo_total.toFixed(2)}
        </h2>
      </div>

      {/* Lista de contas */}
      <h3>Minhas contas</h3>
      {contas.length === 0 ? (
        <p>Nenhuma conta cadastrada ainda.</p>
      ) : (
        <ul>
          {contas.map((conta) => (
            <li key={conta.id}>
              {conta.nome} ({conta.tipo}) — R$ {conta.saldo.toFixed(2)}
            </li>
          ))}
        </ul>
      )}

      {/* Gráfico de gastos por categoria */}
      <h3 style={{ marginTop: 32 }}>Gastos por categoria</h3>
      {dashboard.gastos_por_categoria.length === 0 ? (
        <p>Nenhuma despesa registrada ainda.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dashboard.gastos_por_categoria}>
            <XAxis dataKey="categoria" />
            <YAxis />
            <Tooltip formatter={(valor) => `R$ ${valor.toFixed(2)}`} />
            <Bar dataKey="total" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
