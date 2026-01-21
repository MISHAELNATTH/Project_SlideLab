// src/JS/arbre/index.js
import { getDom } from "./dom.js";
import { createStore } from "./store.js";
import { createActions } from "./actions.js";
import { createRenderer } from "./render/index.js";

import { setupDrag } from "./interactions/drag.js";
import { setupKeyboard } from "./interactions/keyboard.js";
import { setupCanvas } from "./interactions/canvas.js";
import { setupPanZoom } from "./interactions/panzoom.js";

import { generateId } from "./utils/ids.js";

import { jsonToNodes } from "./io/json.js";
import { downloadJson, loadFromLocalStorage, saveToLocalStorage } from "./io/persistence.js";

// Projet courant (tu pourras changer en diapo2, diapo3, etc.)
const PROJECT_NAME = "diapo1";

// ---------- LOAD (DEV file -> LS -> default) ----------
async function loadProjectNodes(projectName) {
  // 1) DEV : lire le fichier src/json/<projectName>.json
  if (import.meta.env.DEV) {
    try {
      const res = await fetch(`/api/load-diapo?name=${encodeURIComponent(projectName)}`, {
        method: "GET",
      });
      if (res.ok) {
        const data = await res.json();
        const nodes = jsonToNodes(data);
        if (nodes.length > 0) return nodes;
      }
    } catch (e) {
      console.warn("load file failed (DEV), fallback localStorage:", e);
    }
  }

  // 2) Fallback localStorage (DEV/PROD)
  const lsNodes = loadFromLocalStorage();
  if (lsNodes && lsNodes.length > 0) return lsNodes;

  // 3) Aucun projet trouvé
  return null;
}

// ---------- SAVE (DEV file -> fallback) ----------
async function saveProject(store, projectName) {
  const nodes = store.getNodes();

  // Toujours: localStorage (rapide et utile même en dev)
  saveToLocalStorage(nodes);

  // DEV : écrire src/json/<projectName>.json
  if (import.meta.env.DEV) {
    try {
      // On envoie directement le JSON "slides" (format nodesToJson)
      // -> on le reconstruit via nodesToJson sans ré-importer pour éviter conflits
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
      console.warn("save file failed (DEV), fallback download:", e);
    }
  }

  // PROD (ou si DEV échoue) : download
  downloadJson(nodes, `${projectName}.json`);
}

// ---------- INIT ----------
export async function initArbre() {
  const dom = getDom();
  const store = createStore();

  let renderer = null;

  const actions = createActions({
    store,
    onChange: () => renderer?.renderAll(),
  });

  renderer = createRenderer({ dom, store, actions });

  // Pan + Zoom
  const panzoom = setupPanZoom({
    dom,
    store,
    onRenderAll: () => renderer.renderAll(),
  });

  // ---- CHARGEMENT PROJET ----
  const nodes = await loadProjectNodes(PROJECT_NAME);

  if (nodes && nodes.length > 0) {
    store.setNodes(nodes);
    store.setSelectedNodeId(null);

    const maxId = Math.max(...nodes.map((n) => n.id));
    store.setNextNodeId(maxId + 1);
  } else {
    // état par défaut
    store.getNodes()[0].buttons = [
      { id: generateId(), target: null },
      { id: generateId(), target: null },
      { id: generateId(), target: null },
    ];
  }

  // ---- LISTENERS ----
  setupCanvas({
    dom,
    store,
    actions,
    panzoom,
    onRenderAll: () => renderer.renderAll(),
  });

  setupDrag({
    dom,
    store,
    onRenderAll: () => renderer.renderAll(),
    actions,
    panzoom,
  });

  setupKeyboard({ store, actions });

  // Ajouter un rectangle
  if (dom.btnAdd) {
    dom.btnAdd.addEventListener("click", () => actions.createNode());
  }

  // Sauvegarder (écrase src/json/diapo1.json en DEV)
  if (dom.btnSave) {
    dom.btnSave.addEventListener("click", () => saveProject(store, PROJECT_NAME));
  }

  // (Optionnel) Import JSON depuis un fichier local
  // Si tu as btnLoad + fileImport dans le HTML/dom.js, tu peux garder ça :
  if (dom.btnLoad && dom.fileImport) {
    dom.btnLoad.addEventListener("click", () => dom.fileImport.click());

    dom.fileImport.addEventListener("change", async () => {
      const file = dom.fileImport.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const importedNodes = jsonToNodes(data);

        if (importedNodes.length > 0) {
          store.setNodes(importedNodes);
          store.setSelectedNodeId(null);

          const maxId = Math.max(...importedNodes.map((n) => n.id));
          store.setNextNodeId(maxId + 1);

          // On sauvegarde aussi en localStorage (et tu peux cliquer "Sauvegarder" ensuite)
          saveToLocalStorage(store.getNodes());
          renderer.renderAll();
        }
      } catch (e) {
        console.error("Import JSON failed:", e);
      } finally {
        dom.fileImport.value = "";
      }
    });
  }

  // ---- FIRST RENDER ----
  renderer.renderAll();
}

// Auto-init
await initArbre();
