/**
 * core.js (editor)
 * Fonctions et état de base pour l'éditeur : génération d'identifiants,
 * gestion du `state` minimal (slides, activeSlide) et API pour sélection
 * (`setSelectedId` / `getSelectedId`). C'est la source utility-level
 * utilisée par les autres modules de l'éditeur.
 */
// src/JS/editor/core.js

export let id = 1;

export function cryptoId() {
  return crypto?.randomUUID?.() || "id_" + Math.random().toString(16).slice(2);
}

export function slideId() {
  return "slide-" + id++ + ".html";
}

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export const state = {
  activeSlide: 0,
  slides: [
    {
      id: cryptoId(),
      backgroundColor: "#ffffff",
      backgroundGradient: "",
      elements: [
        {
          id: cryptoId(),
          type: "text",
          x: 90,
          y: 80,
          w: 520,
          h: 70,
          html: "Titre de la slide",
          color: "#111827",
          fontSize: 28,
          fontWeight: 800,
          fontFamily: "Arial",
          textAlign: "left",
        },
        {
          id: cryptoId(),
          type: "shape",
          x: 90,
          y: 190,
          w: 420,
          h: 160,
          shapeType: "rectangle",
          fillColor: "#7c5cff",
          borderColor: "#37d6ff",
          opacity: 1,
        },
        {
          id: cryptoId(),
          type: "button",
          x: 90,
          y: 380,
          w: 220,
          h: 50,
          html: "Clique ici",
          color: "#ffffff",
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "Arial",
          textAlign: "center",
        },
      ],
    },
  ],
};

export function saveState() {
  try {
    localStorage.setItem("slides_state", JSON.stringify(state));
    console.log("✓ État sauvegardé");
  } catch (e) {
    console.error("Erreur lors de la sauvegarde:", e);
  }
}

export function loadState() {
  try {
    const saved = localStorage.getItem("slides_state");
    if (saved) {
      const loaded = JSON.parse(saved);
      state.activeSlide = loaded.activeSlide;
      state.slides = loaded.slides;
      console.log("✓ État restauré");
      return true;
    }
  } catch (e) {
    console.error("Erreur lors du chargement:", e);
  }
  return false;
}

export function getActive() {
  return state.slides[state.activeSlide];
}

// --- selection ---
let selectedId = null;

export function setSelectedId(v) {
  selectedId = v;
}
export function getSelectedId() {
  return selectedId;
}
