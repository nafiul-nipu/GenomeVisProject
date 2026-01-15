// vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/GenomeVisProject/",
  plugins: [
    checker({
      typescript: { tsconfigPath: "tsconfig.app.json" },
    }),
    react(),
    tailwindcss(),
  ],
});
