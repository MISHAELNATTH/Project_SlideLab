/**
 * mapping.js (arbre)
 * Petites fonctions de mapping entre représentation interne (index)
 * et valeur de lien affichée (string "1..N").
 */
/**
 * slideIndexToLink(slideIndex)
 * Convertit un index 0-based en la valeur de lien affichée (string "1..N").
 */
export function slideIndexToLink(slideIndex) {
  return String(slideIndex + 1); // "1..N"
}

/**
 * linkToSlideIndex(link)
 * Parse une valeur de lien (string) et retourne l'index 0-based correspondant
 * ou `null` si la valeur n'est pas un lien interne numérique valide.
 */
export function linkToSlideIndex(link) {
  if (typeof link !== "string") return null;
  if (!/^\d+$/.test(link)) return null;
  const n = Number(link);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n - 1;
}
