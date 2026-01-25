/**
 * moveResize.js (editor)
 * Gestion du déplacement et du redimensionnement des éléments sur la slide.
 * Expose `startMove` et `startResize` utilisés par le rendu pour
 * installer les listeners mousedown sur chaque élément.
 */
// src/JS/editor/moveResize.js
import { getActive, clamp, getSelectedId, setSelectedId } from "./core.js";
import { getZoom } from "./zoom.js";

let renderFn = null;
/**
 * configureMoveResize({ render })
 * Enregistre la fonction `render` transmise par le module appelant afin
 * de pouvoir forcer le rendu lors des opérations de déplacement/redim.
 */
export function configureMoveResize({ render }) {
  renderFn = render;
}
function rerender() {
  if (typeof renderFn === "function") renderFn();
}

// Etat temporaire pour le drag / resize en cours
let move = null;
let resize = null;

/**
 * select(id)
 * Sélectionne localement un élément si différent de la sélection courante
 * et provoque un rerender. Centralise la logique de sélection utilisée
 * par les handlers de move/resize.
 */
function select(id) {
  if (getSelectedId() === id) return;
  setSelectedId(id);
  rerender();
}

/**
 * startMove(ev, id)
 * Démarre le déplacement d'un élément :
 * - ignore les mousedown provenant des toolbars ou handles
 * - empêche le drag si l'utilisateur est en train d'éditer du texte
 * - capture la position de départ (clientX/clientY) et la position
 *   originale de l'élément afin de calculer les deltas en `onMove`.
 * - prend en compte le `zoom` actuel pour convertir correctement
 *   les mouvements de la souris en déplacement sur la slide.
 */
export function startMove(ev, id) {
  const target = ev.target.closest(".el");
  if (!target) return;

  // IMPORTANT: ne pas drag depuis les toolbars
  if (
    ev.target.closest(".text-toolbar") ||
    ev.target.closest(".shape-controls") ||
    ev.target.closest(".table-controls")
  ) {
    return;
  }

  if (ev.target.classList.contains("handle")) return;

  const isEditable = target.classList.contains("text") || target.classList.contains("button");
  const isTableCell = ev.target.tagName === "TD" || ev.target.tagName === "TH";

  // Si l'utilisateur est en train de sélectionner/éditer du texte, on ne démarre pas le drag
  if (isEditable && document.activeElement === target && window.getSelection()?.type === "Range") return;
  if (isTableCell && document.activeElement === ev.target) return;

  select(id);

  const z = getZoom();
  const s = getActive();
  const el = s.elements.find((e) => e.id === id);
  if (!el) return;

  // Stocke l'état initial pour pouvoir calculer le déplacement relatif
  move = {
    id,
    startX: ev.clientX,
    startY: ev.clientY,
    origX: el.x,
    origY: el.y,
    zoom: z,
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", endMove, { once: true });
}

/**
 * onMove(ev)
 * Calcul des nouvelles coordonnées pendant le drag. Le delta de la souris
 * est divisé par le `zoom` capturé au démarrage pour obtenir le déplacement
 * réel en coordonnées de la slide. Les valeurs sont clampées pour rester
 * dans la zone 960x540 moins une marge.
 */
function onMove(ev) {
  if (!move) return;
  const s = getActive();
  const el = s.elements.find((e) => e.id === move.id);
  if (!el) return;

  const dx = (ev.clientX - move.startX) / move.zoom;
  const dy = (ev.clientY - move.startY) / move.zoom;

  el.x = clamp(move.origX + dx, 0, 960 - 10);
  el.y = clamp(move.origY + dy, 0, 540 - 10);
  rerender();
}

/**
 * endMove()
 * Termine l'opération de déplacement : enlève le listener `mousemove`
 * et réinitialise l'état temporaire.
 */
function endMove() {
  window.removeEventListener("mousemove", onMove);
  move = null;
}

/**
 * startResize(ev, id, handle)
 * Démarre un redimensionnement depuis un des handle (tl/tr/bl/br). Stocke
 * la taille et position originales ainsi que le `handle` utilisé pour
 * déterminer quels côtés bouger.
 */
export function startResize(ev, id, handle) {
  ev.stopPropagation();
  ev.preventDefault();
  select(id);

  const z = getZoom();
  const s = getActive();
  const el = s.elements.find((e) => e.id === id);
  if (!el) return;

  resize = {
    id,
    handle,
    startX: ev.clientX,
    startY: ev.clientY,
    origX: el.x,
    origY: el.y,
    origW: el.w || 240,
    origH: el.h || 54,
    zoom: z,
  };

  window.addEventListener("mousemove", onResize);
  window.addEventListener("mouseup", endResize, { once: true });
}

/**
 * onResize(ev)
 * Calcule la nouvelle largeur/hauteur et, si nécessaire, la nouvelle
 * position (pour les handles gauche/haut). Utilise `clamp` pour maintenir
 * des tailles raisonnables et empêche les éléments de sortir du canevas.
 */
function onResize(ev) {
  if (!resize) return;
  const s = getActive();
  const el = s.elements.find((e) => e.id === resize.id);
  if (!el) return;

  const dx = (ev.clientX - resize.startX) / resize.zoom;
  const dy = (ev.clientY - resize.startY) / resize.zoom;

  let x = resize.origX,
    y = resize.origY,
    w = resize.origW,
    h = resize.origH;

  // Ajustements selon le handle (droite/gauche/bas/haut)
  if (resize.handle.includes("r")) w = clamp(resize.origW + dx, 40, 960);
  if (resize.handle.includes("l")) {
    w = clamp(resize.origW - dx, 40, 960);
    x = resize.origX + dx;
  }
  if (resize.handle.includes("b")) h = clamp(resize.origH + dy, 30, 540);
  if (resize.handle.includes("t")) {
    h = clamp(resize.origH - dy, 30, 540);
    y = resize.origY + dy;
  }

  // On s'assure que la position reste dans le canevas
  x = clamp(x, 0, 960 - 20);
  y = clamp(y, 0, 540 - 20);

  el.x = x;
  el.y = y;
  el.w = w;
  el.h = h;
  rerender();
}

/**
 * endResize()
 * Termine l'opération de redimensionnement et nettoie l'état.
 */
function endResize() {
  window.removeEventListener("mousemove", onResize);
  resize = null;
}
