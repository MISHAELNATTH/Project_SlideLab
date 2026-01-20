import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs";
import path from "path";

export default defineConfig(({ command }) => {
  const repoName = "Projet-Informatique-S6-GR4";

  // récupère automatiquement tous les .html dans src/html
  const pagesDir = resolve(__dirname, "src/html");
  const htmlPages = fs
    .readdirSync(pagesDir)
    .filter((file) => file.endsWith(".html"))
    .reduce((inputs, file) => {
      const name = file.replace(".html", "");
      inputs[name] = resolve(__dirname, "src/html", file);
      return inputs;
    }, {});

  // Plugin DEV uniquement : permet d'écraser src/json/diapoX.json
  const saveDiapoPlugin = {
    name: "save-diapo-json",
    configureServer(server) {
      server.middlewares.use("/api/save-slide-meta", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }

        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            const payload = JSON.parse(body || "{}");
            const updates = Array.isArray(payload?.updates) ? payload.updates : [];

            if (!updates.length) {
              res.statusCode = 400;
              res.end("Missing updates");
              return;
            }

            const results = [];

            for (const u of updates) {
              const file = String(u?.file || "");
              const meta = u?.meta;

              if (!file || !meta) continue;

              // sécurise un minimum le chemin
              const safeFile = file.replace(/\\/g, "/");
              const absPath = path.resolve(process.cwd(), safeFile);

              if (!fs.existsSync(absPath)) {
                results.push({ file, ok: false, error: "File not found" });
                continue;
              }

              const html = fs.readFileSync(absPath, "utf-8");

              // Remplace le contenu du script slide-meta
              const jsonText = JSON.stringify(meta, null, 2);

              const replaced = html.replace(
                /<script\s+id=["']slide-meta["'][^>]*>[\s\S]*?<\/script>/i,
                `<script id="slide-meta" type="application/json">\n${jsonText}\n</script>`
              );

              if (replaced === html) {
                results.push({ file, ok: false, error: "slide-meta script not found" });
                continue;
              }

              fs.writeFileSync(absPath, replaced, "utf-8");
              results.push({ file, ok: true });
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, results }));
          } catch (e) {
            res.statusCode = 500;
            res.end("Save slide-meta failed: " + (e?.message || "unknown"));
          }
        });
      });

      server.middlewares.use("/api/load-diapo", (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }

        try {
          const url = new URL(req.url, "http://localhost");
          const name = String(url.searchParams.get("name") || "diapo1");
          const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "");
          const filePath = path.resolve(process.cwd(), "src/json", `${safeName}.json`);

          if (!fs.existsSync(filePath)) {
            res.statusCode = 404;
            res.end("Not found");
            return;
          }

          const content = fs.readFileSync(filePath, "utf-8");
          res.setHeader("Content-Type", "application/json");
          res.end(content);
        } catch (e) {
          res.statusCode = 500;
          res.end("Load failed: " + (e?.message || "unknown"));
        }
      });


      server.middlewares.use("/api/save-diapo", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }

        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            const payload = JSON.parse(body || "{}");
            const name = String(payload?.name || "diapo1"); // diapo1, diapo2, ...
            const data = payload?.data;

            if (!data) {
              res.statusCode = 400;
              res.end("Missing data");
              return;
            }

            const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "");
            const outPath = path.resolve(process.cwd(), "src/json", `${safeName}.json`);

            fs.mkdirSync(path.dirname(outPath), { recursive: true });
            fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, path: outPath }));
          } catch (e) {
            res.statusCode = 500;
            res.end("Save failed: " + (e?.message || "unknown"));
          }
        });
      });
    },
  };

  return {
    plugins: [
      react(),
      // uniquement en dev
      ...(command === "serve" ? [saveDiapoPlugin] : []),
    ],
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
