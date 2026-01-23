/**
 * dom.js (arbre)
 * Sélecteurs DOM et petits helpers pour valider la présence des éléments
 * essentiels de l'interface d'édition de graphe (canvas, layers, sidebar).
 */
export const dom = {
  nodesLayer: document.getElementById("nodes-layer"),
  svgLayer: document.getElementById("svg-layer"),
  sidebarContent: document.getElementById("properties-content"),
  sidebarSubtitle: document.getElementById("sidebar-subtitle"),
  canvasEl: document.getElementById("canvas"),

  btnAdd: document.getElementById("btnAdd"),
  btnSave: document.getElementById("btnSave"),
  btnLoad: document.getElementById("btnLoad"),
};

export function assertDom() {
  const { nodesLayer, svgLayer, sidebarContent, sidebarSubtitle, canvasEl } = dom;
  if (!nodesLayer || !svgLayer || !sidebarContent || !sidebarSubtitle || !canvasEl) {
    throw new Error("DOM manquant : nodes-layer/svg-layer/properties-content/sidebar-subtitle/canvas");
  }
}

/**
 * assertDom()
 * Vérifie que les éléments DOM essentiels pour l'éditeur d'arbre
 * sont présents. Lance une exception explicite si l'un des éléments
 * requis est manquant, facilitant le debug à l'initialisation.
 */
