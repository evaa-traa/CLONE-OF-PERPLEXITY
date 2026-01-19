import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/chat": "http://localhost:3000",
      "/models": "http://localhost:3000"
    }
  },
  build: {
    outDir: path.resolve(__dirname, "../server/public"),
    emptyOutDir: true
  }
});
