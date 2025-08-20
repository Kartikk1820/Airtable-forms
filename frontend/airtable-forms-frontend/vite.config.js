import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import dotenv from "dotenv";

dotenv.config();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": process.env.VITE_API_URL,
    },
  },
  preview: {
    host: true,
    port: process.env.PORT ? Number(process.env.PORT) : 4173,
    allowedHosts: ["airtable-forms.onrender.com"],
  },
});
