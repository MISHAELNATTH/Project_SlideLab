import { appState } from "./state.js";
import { render } from "./render.js";
import { renderSidebar } from "./sidebar.js";

export function buildGraphFromSlidesState() {
  const ss = appState.slides_state;

  if (!ss || !Array.isArray(ss.slides)) {
    appState.nodes = [];
    appState.selectedNodeId = null;
    render();
    renderSidebar();
    return;
  }

  appState.nodes = ss.slides.map((slide, slideIndex) => {
    if (!slide.arbre) slide.arbre = {};
    if (!slide.arbre.pos) slide.arbre.pos = {};
    const a = slide.arbre;

    const defaultX = 100 + slideIndex * 260;
    const defaultY = 120 + (slideIndex % 4) * 160;

    const xStored = a.pos.x;
    const yStored = a.pos.y;

    const x = typeof xStored === "number" ? xStored : defaultX;
    const y = typeof yStored === "number" ? yStored : defaultY;

    // écrit dans slides_state (création/correction)
    a.pos.x = x;
    a.pos.y = y;

    const title = a.title || `Slide ${slideIndex + 1}`;
    const outputs = Array.isArray(slide.elements) ? slide.elements : [];

    return {
      id: slideIndex + 1, // id visuel (1..N)
      slideIndex,
      slideId: slide.id,

      x, y,

      label: title,
      outputs: outputs.map((el, elementIndex) => ({
        elementIndex,
        elementId: el.id,
        name: el.type || "element",
        link: el.link ?? null,
      })),
    };
  });

  // reset sélection si plus valide
  if (appState.selectedNodeId != null) {
    const exists = appState.nodes.some((n) => n.id === appState.selectedNodeId);
    if (!exists) appState.selectedNodeId = null;
  }

  render();
  renderSidebar();
}
