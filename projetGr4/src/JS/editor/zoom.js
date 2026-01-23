/**
 * zoom.js (editor)
 * Helpers pour obtenir et définir le niveau de zoom de l'éditeur.
 * Utilise `clamp` pour limiter la valeur et met à jour l'affichage
 * du `zoomChip` si présent.
 */
// src/JS/editor/zoom.js
import { clamp } from "./core.js";
import { slideEl, zoomChip } from "./dom.js";

/**
 * getZoom()
 * Lit le `transform: scale(...)` appliqué à `slideEl` et retourne
 * la valeur numérique. Si aucun transform n'est trouvé, retourne `1`.
 * Remarque: cette fonction parse la chaîne CSS ; ne modifie pas l'état.
 */
export function getZoom() {
  const m = slideEl?.style?.transform?.match(/scale\(([\d.]+)\)/);
  return m ? parseFloat(m[1]) : 1;
}

/**
 * setZoom(z)
 * Définit le zoom de l'éditeur en appliquant `transform: scale(z)` sur
 * `slideEl`. La valeur est bornée via `clamp` pour éviter des extrêmes.
 * Met à jour `zoomChip` si présent pour un retour visuel immédiat.
 * Paramètre:
 * - z: nombre souhaité (ex: 1.2 pour 120%).
 */
export function setZoom(z) {
  if (!slideEl) return;
  z = clamp(z, 0.35, 2);
  slideEl.style.transformOrigin = "middle top";
  slideEl.style.transform = `scale(${z})`;
  if (zoomChip) zoomChip.textContent = `Zoom: ${Math.round(z * 100)}%`;
}
