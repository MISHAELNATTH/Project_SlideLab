/**
 * dom.js (editor)
 * Références DOM partagées utilisées par l'éditeur (zone de slide,
 * miniatures, input de recherche, indicateur de zoom).
 */
// src/JS/editor/dom.js
/** Référence DOM: zone principale affichant la slide. */
export const slideEl = document.getElementById("slide");

/** Référence DOM: conteneur des miniatures (thumbs). */
export const thumbsEl = document.getElementById("thumbs");

/** Référence DOM: champ de recherche des outils. */
export const searchEl = document.getElementById("toolSearch");

/** Référence DOM: petit affichage du niveau de zoom. */
export const zoomChip = document.getElementById("zoomChip");
