/**
 * core.js (editor)
 * Fonctions et état de base pour l'éditeur : génération d'identifiants,
 * gestion du `state` minimal (slides, activeSlide) et API pour sélection
 * (`setSelectedId` / `getSelectedId`). C'est la source utility-level
 * utilisée par les autres modules de l'éditeur.
 */
// src/JS/editor/core.js

export let id = 1;

/**
 * cryptoId()
 * Retourne un identifiant pseudo-unique utilisable pour les slides
 * et éléments. Utilise `crypto.randomUUID` si disponible, sinon
 * génère une chaîne probabiliste. Ne garantit pas l'unicité absolue
 * mais est suffisante pour ce contexte d'éditeur côté client.
 */
export function cryptoId() {
  return crypto?.randomUUID?.() || "id_" + Math.random().toString(16).slice(2);
}

/**
 * slideId()
 * Génère un identifiant lisible pour un fichier slide (ex: "slide-2.html").
 * Incrémente un compteur local `id`. Utile pour duplication/création rapide.
 */
export function slideId() {
  return "slide-" + id++ + ".html";
}

/**
 * clamp(n, a, b)
 * Limite la valeur `n` entre `a` et `b` inclus. Utilisé pour fixer
 * des bornes sur positions, tailles, et zooms afin d'éviter des valeurs
 * invalides ou hors écran.
 */
export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

/**
 * `state` - état applicatif de l'éditeur
 * Structure minimale conservée en localStorage et utilisée partout.
 * - `activeSlide`: index de la slide courante
 * - `slides`: tableau des slides avec leurs éléments
 */
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

/**
 * saveState()
 * Sauvegarde l'objet `state` dans `localStorage` sous la clé
 * `slides_state`. Enrobe dans un try/catch pour éviter que
 * l'application ne plante si l'espace est plein.
 */
export function saveState() {
  try {
    localStorage.setItem("slides_state", JSON.stringify(state));
    console.log("✓ État sauvegardé");
  } catch (e) {
    console.error("Erreur lors de la sauvegarde:", e);
  }
}

/**
 * loadState()
 * Tente de restaurer l'état depuis `localStorage`. Si un état valide
 * est trouvé, remplace les propriétés principales (`activeSlide` et
 * `slides`) et retourne `true`. Sinon retourne `false`.
 */
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

/**
 * getActive()
 * Renvoie la slide active (objet) depuis `state.slides`.
 * Usage récurrent dans le rendu et les handlers pour manipuler la slide courante.
 */
export function getActive() {
  return state.slides[state.activeSlide];
}

// --- selection ---
let selectedId = null;

/**
 * setSelectedId(v)
 * Définit l'identifiant sélectionné dans l'éditeur. Aucune autre
 * logique n'est exécutée ici (le rendu se base sur `getSelectedId`).
 */
export function setSelectedId(v) {
  selectedId = v;
}

/**
 * getSelectedId()
 * Renvoie l'identifiant de l'élément actuellement sélectionné, ou `null`
 * s'il n'y a pas de sélection.
 */
export function getSelectedId() {
  return selectedId;
}
