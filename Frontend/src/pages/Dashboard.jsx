import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../services/api";
import AppLayout from "../components/AppLayout";

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        const [respostaDashboard, respostaContas] = await Promise.all([
          api.get("/dashboard"),
          api.get("/contas"),
        ]);
        setDashboard(respostaDashboard.data);
        setContas(respostaContas.data);
      } catch {
        setErro("Não foi possível carregar os dados");
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, []);

  if (carregando) return <AppLayout><p className="text-muted">Carregando...</p></AppLayout>;
  if (erro) return <AppLayout><p className="text-expense">{erro}</p></AppLayout>;

  return (
    <AppLayout>
      <h1 style={{ marginBottom: 24 }}>Meu painel</h1>

      {/* Card hero: único lugar com gradiente forte */}
      <div className="card-hero" style={{ marginBottom: 32 }}>
        <p style={{ margin: 0, opacity: 0.85, fontSize: 14 }}>Saldo total</p>
        <h2 className="num" style={{ fontSize: 36, marginTop: 6 }}>
          R$ {dashboard.saldo_total.toFixed(2)}
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Lista de contas, estilo extrato */}
        <div>
          <h3 style={{ marginBottom: 12, fontSize: 15, color: "var(--text-muted)" }}>MINHAS CONTAS</h3>
          {contas.length === 0 ? (
            <p className="text-muted">Nenhuma conta cadastrada ainda.</p>
          ) : (
            <div className="row-list">
              {contas.map((conta) => (
                <div key={conta.id} className="row-item">
                  <span>{conta.nome}</span>
                  <span className="num">R$ {conta.saldo.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gráfico de gastos por categoria */}
        <div>
          <h3 style={{ marginBottom: 12, fontSize: 15, color: "var(--text-muted)" }}>
            GASTOS POR CATEGORIA
          </h3>
          {dashboard.gastos_por_categoria.length === 0 ? (
            <p className="text-muted">Nenhuma despesa registrada ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dashboard.gastos_por_categoria}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="categoria" stroke="#8b8fb3" fontSize={12} />
                <YAxis stroke="#8b8fb3" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#1e2344",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    color: "#f4f5fa",
                  }}
                  formatter={(valor) => [`R$ ${valor.toFixed(2)}`, "Total"]}
                />
                <Bar dataKey="total" fill="#ff6b6b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
