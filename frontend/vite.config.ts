import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // <-- PASUL 1: ADAUGĂ IMPORTUL ĂSTA

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 5173,
      host: "0.0.0.0",
    },
    // PASUL 2: ADAUGĂ tailwindcss() ÎN ARRAY-UL DE PLUGINS, ÎNAINTE SAU DUPĂ react()
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
