import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Painel" },
  { to: "/contas", label: "Contas" },
  { to: "/transacoes", label: "Transações" },
  { to: "/metas", label: "Metas" },
];

export default function NavBar() {
  const location = useLocation();

  return (
    <nav style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: "1px solid #ddd" }}>
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          style={{
            fontWeight: location.pathname === link.to ? "bold" : "normal",
            textDecoration: "none",
            color: "#333",
          }}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
