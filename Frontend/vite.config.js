import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Garante que exista apenas UMA cópia do React em toda a árvore de
    // dependências, mesmo que alguma biblioteca (como o recharts) tente
    // resolver o React por um caminho diferente durante o desenvolvimento.
    dedupe: ["react", "react-dom"],
  },
});
