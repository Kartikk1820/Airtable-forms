import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api":
          env.VITE_API_URL || "https://airtable-forms-backend.onrender.com",
      },
    },
    preview: {
      host: true,
      port: process.env.PORT ? Number(process.env.PORT) : 4173,
      allowedHosts: ["airtable-forms.onrender.com"],
    },
  };
});
