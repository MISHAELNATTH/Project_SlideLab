/**
 * storage.js
 * Chargement / sauvegarde du `slides_state` dans localStorage.
 * Expose également un utilitaire `debounce` et `requestSave` pour
 * regrouper les écritures et éviter d'écrire trop fréquemment.
 */
import { appState } from "./state.js";

export const STORAGE_KEY = "slides_state";

/**
 * loadSlidesStateFromLocalStorage()
 * Lit la clé `STORAGE_KEY` dans `localStorage` et tente de parser le JSON.
 * Retourne l'objet parsé ou `null` si absent / invalide.
 */
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

/**
 * saveSlidesStateToLocalStorage(slides_state)
 * Sérialise `slides_state` et l'écrit dans `localStorage`.
 * Enrobe l'opération dans un try/catch pour éviter les erreurs (quota plein).
 */
export function saveSlidesStateToLocalStorage(slides_state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slides_state));
    console.log("✓ slides_state sauvegardé");
  } catch (e) {
    console.error("Erreur save localStorage:", e);
  }
}

/**
 * debounce(fn, ms)
 * Retourne une version débouncée de `fn` qui attend `ms` millisecondes
 * après le dernier appel avant d'exécuter `fn`. Utilisé pour regrouper
 * plusieurs modifications en une seule écriture localStorage.
 */
export function debounce(fn, ms = 200) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/**
 * requestSave
 * Instance débouncée utilisée par les autres modules pour demander
 * une sauvegarde asynchrone de `appState.slides_state`.
 */
export const requestSave = debounce(() => {
  if (!appState.slides_state) return;
  saveSlidesStateToLocalStorage(appState.slides_state);
}, 200);
