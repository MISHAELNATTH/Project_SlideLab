/**
 * interactions.js (arbre)
 * Gère les interactions de l'utilisateur avec la vue graphe : désélection
 * en cliquant sur le canvas, début de drag d'un node, et écouteurs globaux
 * pour déplacer/relâcher les nodes. Expose `installInteractions`.
 */
import { dom } from "./dom.js";
import { appState } from "./state.js";
import { render } from "./render.js";
import { renderSidebar } from "./sidebar.js";
import { setSlidePos } from "./actions.js";

export function deselectAll(e) {
  if (
    e.target.id === "canvas" ||
    e.target.classList.contains("help-text") ||
    e.target.id === "nodes-layer" ||
    e.target.id === "svg-layer"
  ) {
    appState.selectedNodeId = null;
    render();
    renderSidebar();
  }
}

/**
 * deselectAll(e)
 * Handler utilisé lorsque l'utilisateur clique sur le canvas/fond.
 * Si le clic cible le fond, on efface la sélection courante et on
 * redessine la vue + la sidebar.
 */

export function startDrag(e, nodeId) {
  if (e.button !== 0) return;
  e.stopPropagation();

  appState.selectedNodeId = nodeId;
  render();
  renderSidebar();

  appState.isDragging = true;
  appState.draggedNodeId = nodeId;

  const node = appState.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  appState.dragOffset.x = e.clientX - node.x;
  appState.dragOffset.y = e.clientY - node.y;
}

/**
 * startDrag(e, nodeId)
 * Déclenché par un mousedown sur un node :
 * - vérifie le bouton (uniquement bouton gauche)
 * - marque l'élément comme sélectionné
 * - initialise l'état de drag (`isDragging`, `draggedNodeId`, `dragOffset`)
 * L'état initial stocke l'offset souris→node pour que le déplacement soit
 * fluide et reprenne la position relative d'origine.
 */

/**
 * Installe listeners globaux (mousemove/up) + expose startDrag pour render.js
 */
export function installInteractions() {
  dom.canvasEl.addEventListener("mousedown", deselectAll);

  // Petit pont pour éviter les imports circulaires dans render.js
  window.__ARBRE_START_DRAG__ = startDrag;

  window.addEventListener("mousemove", (e) => {
    if (!appState.isDragging || appState.draggedNodeId == null) return;

    const node = appState.nodes.find((n) => n.id === appState.draggedNodeId);
    if (!node) return;

    node.x = e.clientX - appState.dragOffset.x;
    node.y = e.clientY - appState.dragOffset.y;

    // persist pos dans slides_state (arbre.pos)
    setSlidePos(node.slideIndex, node.x, node.y);

    render();
  });

  window.addEventListener("mouseup", () => {
    appState.isDragging = false;
    appState.draggedNodeId = null;
  });
}

/**
 * installInteractions()
 * Installe les listeners globaux nécessaires à l'édition du graphe :
 * - click sur canvas pour désélection
 * - expose `__ARBRE_START_DRAG__` pour éviter import circulaire
 * - écoute mousemove/up pour suivre le drag des nodes
 */
