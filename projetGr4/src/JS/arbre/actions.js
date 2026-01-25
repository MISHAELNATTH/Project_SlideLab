/**
 * actions.js
 * Ce fichier contient des utilitaires et actions manipulant l'état des "slides"
 * et les données spécifiques au module "arbre" (titre, position, liens entre slides).
 * Les fonctions exportées sont de petites opérations atomiques (ajout/suppression,
 * mise à jour de propriété) et provoquent une sauvegarde / rebuild lorsque nécessaire.
 *
 * Principales fonctions:
 * - uuid(): génère un identifiant unique pour slides/éléments
 * - setSlideTitle, setSlidePos: mettent à jour le titre/position de la slide
 * - setElementLinkInSlidesState: met à jour le lien d'un élément
 * - cleanupLinksAfterSlideDelete: renumérote/clean les liens après suppression
 * - deleteSlideByIndex, addSlide: suppriment/ajoutent des slides et déclenchent save
 */
import { appState } from "./state.js";
import { requestSave, saveSlidesStateToLocalStorage } from "./storage.js";
import { buildGraphFromSlidesState } from "./buildGraph.js";

export function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * setSlideTitle(srcSlideIndex, newTitle)
 * Met à jour le titre interne (`arbre.title`) d'une slide identifiée
 * par son index source `srcSlideIndex` dans `appState.slides_state.slides`.
 * Effet de bord : déclenche `requestSave()` pour persister la modification
 * de manière asynchrone.
 */

export function setSlideTitle(srcSlideIndex, newTitle) {
  const s = appState.slides_state?.slides?.[srcSlideIndex];
  if (!s) return;
  if (!s.arbre) s.arbre = {};
  s.arbre.title = newTitle;
  requestSave();
}

/**
 * setSlidePos(srcSlideIndex, x, y)
 * Met à jour la position stockée (`arbre.pos`) d'une slide utilisée
 * pour l'affichage dans la vue graphe. Crée les structures manquantes
 * si nécessaire puis appelle `requestSave()`.
 */

export function setSlidePos(srcSlideIndex, x, y) {
  const s = appState.slides_state?.slides?.[srcSlideIndex];
  if (!s) return;
  if (!s.arbre) s.arbre = {};
  if (!s.arbre.pos) s.arbre.pos = { x: 0, y: 0 };
  s.arbre.pos.x = x;
  s.arbre.pos.y = y;
  requestSave();
}

/**
 * setElementLinkInSlidesState(srcSlideIndex, elementIndex, newLink)
 * Met à jour la propriété `link` d'un élément donné (index d'élément)
 * dans la slide `srcSlideIndex`. Vérifications : existence de la slide
 * et du tableau `elements`.
 * Effet de bord : `requestSave()`.
 */

export function setElementLinkInSlidesState(srcSlideIndex, elementIndex, newLink) {
  const slide = appState.slides_state?.slides?.[srcSlideIndex];
  if (!slide || !Array.isArray(slide.elements)) return;

  const el = slide.elements[elementIndex];
  if (!el) return;

  el.link = newLink;
  requestSave();
}

/**
 * Nettoie les links (elements[].link) après suppression d'une slide.
 */
export function cleanupLinksAfterSlideDelete(slides_state, deletedIndex) {
  const deletedLink = deletedIndex + 1; // link "1..N" (avant suppression)
  if (!slides_state?.slides?.length) return;

  slides_state.slides.forEach((slide) => {
    if (!Array.isArray(slide.elements)) return;

    slide.elements.forEach((el) => {
      if (!el || el.link == null) return;

      const n = parseInt(el.link, 10);
      if (!Number.isFinite(n) || n <= 0) {
        el.link = null;
        return;
      }

      if (n === deletedLink) el.link = null;
      else if (n > deletedLink) el.link = String(n - 1);
    });
  });
}

/**
 * deleteSlideByIndex(deleteIndex)
 * Supprime la slide à l'index `deleteIndex` dans `appState.slides_state.slides`.
 * Procédure :
 *  1) retirer la slide
 *  2) renumérotation/nettoyage des liens internes via `cleanupLinksAfterSlideDelete`
 *  3) forcer une sauvegarde synchrone via `saveSlidesStateToLocalStorage`
 *  4) reset sélection et rebuild du graphe
 * Cette fonction a des effets globaux sur l'état de l'application.
 */

export function deleteSlideByIndex(deleteIndex) {
  if (!appState.slides_state?.slides?.length) return;

  // 1) Supprimer la slide
  appState.slides_state.slides.splice(deleteIndex, 1);

  // 2) Nettoie/renumérote tous les links
  cleanupLinksAfterSlideDelete(appState.slides_state, deleteIndex);

  // 3) Sauve + rebuild
  saveSlidesStateToLocalStorage(appState.slides_state);
  appState.selectedNodeId = null;
  buildGraphFromSlidesState();
}

/**
 * addSlide()
 * Ajoute une nouvelle slide par défaut à la fin de `slides_state.slides`.
 * Initialise `arbre.title` et `arbre.pos` pour permettre son affichage
 * immédiat dans la vue graphe. Déclenche `requestSave()` et rebuild.
 */

export function addSlide() {
  if (!appState.slides_state) {
    appState.slides_state = { activeSlide: 0, slides: [] };
  }
  if (!Array.isArray(appState.slides_state.slides)) appState.slides_state.slides = [];

  const idx = appState.slides_state.slides.length;

  appState.slides_state.slides.push({
    id: uuid(),
    backgroundColor: "#ffffff",
    backgroundGradient: "",
    elements: [],
    arbre: {
      title: `Slide ${idx + 1}`,
      pos: { x: 100 + idx * 260, y: 120 + (idx % 4) * 160 },
    },
  });

  requestSave();
  buildGraphFromSlidesState();
}
