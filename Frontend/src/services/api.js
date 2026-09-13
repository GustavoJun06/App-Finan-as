import axios from "axios";

// Endereço base da nossa API (o backend FastAPI rodando localmente)
const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
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
