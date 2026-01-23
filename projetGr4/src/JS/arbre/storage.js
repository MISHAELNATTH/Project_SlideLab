/**
 * storage.js
 * Chargement / sauvegarde du `slides_state` dans localStorage.
 * Expose également un utilitaire `debounce` et `requestSave` pour
 * regrouper les écritures et éviter d'écrire trop fréquemment.
 */
import { appState } from "./state.js";

export const STORAGE_KEY = "slides_state";

export function loadSlidesStateFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("slides_state invalide dans localStorage (JSON parse):", e);
    return null;
  }
}

export function saveSlidesStateToLocalStorage(slides_state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slides_state));
    console.log("✓ slides_state sauvegardé");
  } catch (e) {
    console.error("Erreur save localStorage:", e);
  }
}

export function debounce(fn, ms = 200) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export const requestSave = debounce(() => {
  if (!appState.slides_state) return;
  saveSlidesStateToLocalStorage(appState.slides_state);
}, 200);
