// vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

export default defineConfig({
  plugins: [
    checker({
      typescript: { tsconfigPath: "tsconfig.app.json" },
    }),
    react(),
  ],
});
