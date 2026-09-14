import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Wallet, ArrowLeftRight, Target, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/contas", label: "Contas", icon: Wallet },
  { to: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { to: "/metas", label: "Metas", icon: Target },
];

export default function AppLayout({ children }) {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar fixa */}
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-subtle)",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 18, padding: "0 8px", marginBottom: 32 }}>
          💰 Finanças
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {links.map(({ to, label, icon: Icon }) => {
            const ativo = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  color: ativo ? "white" : "var(--text-muted)",
                  background: ativo ? "var(--accent-primary)" : "transparent",
                }}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="btn btn-ghost"
          style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </aside>

      {/* Conteúdo da página */}
      <main style={{ flex: 1, padding: "32px 40px", maxWidth: 1000 }}>{children}</main>
    </div>
  );
}
