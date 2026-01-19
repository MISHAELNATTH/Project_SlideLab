import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs";

export default defineConfig(({ command }) => {
  const repoName = "Projet-Informatique-S6-GR4";

  // 🔍 récupère automatiquement tous les .html dans src/html
  const pagesDir = resolve(__dirname, "src/html");
  const htmlPages = fs
    .readdirSync(pagesDir)
    .filter((file) => file.endsWith(".html"))
    .reduce((inputs, file) => {
      const name = file.replace(".html", "");
      inputs[name] = resolve(pagesDir, file);
      return inputs;
    }, {});

  return {
    plugins: [react()],
    base: command === "serve" ? "/" : `/${repoName}/`,
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "index.html"),
          ...htmlPages,
        },
      },
    },
  };
});
