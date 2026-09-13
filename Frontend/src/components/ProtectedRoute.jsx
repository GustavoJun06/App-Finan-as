import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Envolve páginas que exigem login. Se não estiver autenticado,
// redireciona automaticamente para a tela de login.
export default function ProtectedRoute({ children }) {
  const { estaAutenticado } = useAuth();

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
