import { createContext, useContext, useState } from "react";
import api from "../services/api";

// Cria o "contexto" - um canal de dados que qualquer componente
// dentro dele pode acessar, sem precisar passar props manualmente
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Ao carregar a aplicação, verifica se já existe um token salvo
  // de uma sessão anterior (assim o usuário continua logado ao recarregar a página)
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const estaAutenticado = !!token; // converte para true/false

  async function login(email, senha) {
    // O backend espera os campos no formato de formulário (OAuth2),
    // não em JSON - por isso montamos um FormData aqui
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", senha);

    const resposta = await api.post("/login", formData);
    const novoToken = resposta.data.access_token;

    localStorage.setItem("token", novoToken);
    setToken(novoToken);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ estaAutenticado, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado: em vez de todo componente escrever
// "useContext(AuthContext)", eles só chamam "useAuth()"
export function useAuth() {
  return useContext(AuthContext);
}
