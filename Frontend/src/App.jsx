import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import Contas from "./pages/Contas";
import Transacoes from "./pages/Transacoes";
import Metas from "./pages/Metas";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Rota raiz: redireciona direto para o dashboard (que por sua vez
          redireciona para login se não estiver autenticado) */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/contas"
        element={
          <ProtectedRoute>
            <Contas />
          </ProtectedRoute>
        }
      />

      <Route
        path="/transacoes"
        element={
          <ProtectedRoute>
            <Transacoes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/metas"
        element={
          <ProtectedRoute>
            <Metas />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
