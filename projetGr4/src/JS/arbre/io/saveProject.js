// src/JS/arbre/io/saveProject.js
import { nodesToJson } from "./json.js";
import { downloadJson, saveToLocalStorage } from "./persistence.js";

// NAMED EXPORT
export async function saveProjectJson(store, projectName = "diapo1") {
  const data = nodesToJson(store.getNodes());

  // DEV : écriture réelle dans src/json/diapoX.json via Vite middleware
  if (import.meta.env.DEV) {
    try {
      const res = await fetch("/api/save-diapo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, data }),
      });

      if (!res.ok) throw new Error(await res.text());

      console.log(`Sauvegardé: src/json/${projectName}.json`);
      return;
    } catch (err) {
      console.warn("Sauvegarde fichier échouée, fallback :", err);
    }
  }

  // PROD ou fallback
  saveToLocalStorage(store.getNodes());
  //downloadJson(store.getNodes(), `${projectName}.json`);
}
