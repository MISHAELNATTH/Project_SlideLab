/**
 * mapping.js (arbre)
 * Petites fonctions de mapping entre représentation interne (index)
 * et valeur de lien affichée (string "1..N").
 */
export function slideIndexToLink(slideIndex) {
  return String(slideIndex + 1); // "1..N"
}

export function linkToSlideIndex(link) {
  if (typeof link !== "string") return null;
  if (!/^\d+$/.test(link)) return null;
  const n = Number(link);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n - 1;
}
