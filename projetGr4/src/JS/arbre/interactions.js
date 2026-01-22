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
