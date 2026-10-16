import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import reslandContent from "./plugins/resland-content";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// base "./" + HashRouter: the static build works from any sub-path (GitHub Pages project sites, Vercel, file server).
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), reslandContent(repoRoot)],
  build: {
    chunkSizeWarningLimit: 1500,
  },
});
