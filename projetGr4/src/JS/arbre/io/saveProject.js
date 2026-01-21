// src/JS/arbre/io/saveProject.js
import { nodesToJson } from "./json.js";
import { downloadJson, saveToLocalStorage } from "./persistence.js";

async function saveProject(store, projectName) {
  const nodes = store.getNodes();

  // Toujours: localStorage
  saveToLocalStorage(nodes);

  // DEV : écriture fichier
  if (import.meta.env.DEV) {
    try {
      const data = {
        slides: nodes.map((n) => ({
          id: n.id,
          label: n.label,
          x: n.x,
          y: n.y,
          buttons: n.buttons.map((b) => (b.target ?? null)),
        })),
      };

      const res = await fetch("/api/save-diapo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, data }),
      });

      if (!res.ok) throw new Error(await res.text());

      console.log(`Sauvegardé dans src/json/${projectName}.json`);
      return;
    } catch (e) {
      console.warn("save file failed (DEV), fallback localStorage only:", e);
      return; // plus de download même si dev échoue
    }
  }

  // ✅ PROD : localStorage uniquement (pas de téléchargement)
  console.log("Sauvegardé en ligne (localStorage uniquement)");
}

