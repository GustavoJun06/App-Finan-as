import axios from "axios";

// Endereço base da nossa API. Em desenvolvimento, usa o backend local;
// em produção, o Vite substitui isso automaticamente pela variável
// VITE_API_URL configurada no serviço de deploy (Vercel).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
});

// Interceptor: antes de CADA requisição sair, verifica se existe um token
// salvo, e se existir, adiciona automaticamente no cabeçalho Authorization.
// Assim, não precisamos adicionar o token manualmente em cada chamada.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;