// src/JS/editor/dragDrop.js
import { slideEl } from "./dom.js";
import { getZoom } from "./zoom.js";
import { getActive, clamp, cryptoId, setSelectedId } from "./core.js";

let renderFn = null;
export function configureDragDrop({ render }) {
  renderFn = render;
}
function rerender() {
  if (typeof renderFn === "function") renderFn();
}

export function initDragDrop() {
  document.querySelectorAll(".tool").forEach((tool) => {
    tool.addEventListener("dragstart", (ev) => {
      ev.dataTransfer.setData("text/plain", tool.dataset.tool);
      ev.dataTransfer.effectAllowed = "copy";
    });
  });

  slideEl.addEventListener("dragover", (ev) => {
    ev.preventDefault();
    slideEl.classList.add("dragover");
    ev.dataTransfer.dropEffect = "copy";
  });

  slideEl.addEventListener("dragleave", () => {
    slideEl.classList.remove("dragover");
  });

  slideEl.addEventListener("drop", (ev) => {
    ev.preventDefault();
    slideEl.classList.remove("dragover");

    const toolType = ev.dataTransfer.getData("text/plain");
    if (!toolType) return;

    const rect = slideEl.getBoundingClientRect();
    const z = getZoom();
    const x = (ev.clientX - rect.left) / z;
    const y = (ev.clientY - rect.top) / z;

    addFromTool(toolType, x, y);
    rerender();
  });
}

function addFromTool(toolType, x, y) {
  const s = getActive();

  const base = {
    id: cryptoId(),
    x: clamp(x - 80, 0, 960 - 40),
    y: clamp(y - 20, 0, 540 - 40),
    w: 260,
    h: 60,
  };

  let el = null;

  if (toolType === "text") {
    el = {
      ...base,
      type: "text",
      w: 520,
      h: 70,
      html: "Nouveau texte",
      color: "#111827",
      fontSize: 28,
      fontWeight: 800,
      fontFamily: "Arial",
      textAlign: "left",
    };
  } else if (toolType === "shape") {
    el = {
      ...base,
      type: "shape",
      w: 320,
      h: 180,
      shapeType: "rectangle",
      fillColor: "#7c5cff",
      borderColor: "#37d6ff",
      opacity: 1,
    };
  } else if (toolType === "button") {
    el = {
      ...base,
      type: "button",
      w: 220,
      h: 54,
      html: "Bouton",
      color: "#ffffff",
      fontSize: 16,
      fontWeight: 700,
      fontFamily: "Arial",
      textAlign: "center",
    };
  } else if (toolType === "image") {
    el = { ...base, type: "image", w: 360, h: 240 };
  } else if (toolType === "table") {
    el = {
      ...base,
      type: "table",
      w: 400,
      h: 200,
      rows: 3,
      cols: 3,
      borderColor: "#cccccc",
      headerColor: "#f3f4f6",
    };
  } else if (toolType === "twoCols") {
    s.elements.push({
      id: cryptoId(),
      type: "text",
      x: clamp(x - 360, 0, 820),
      y: clamp(y - 140, 0, 460),
      w: 420,
      h: 60,
      html: "Titre (2 colonnes)",
      color: "#111827",
      fontSize: 28,
      fontWeight: 800,
      fontFamily: "Arial",
      textAlign: "left",
    });
    s.elements.push({
      id: cryptoId(),
      type: "text",
      x: clamp(x - 360, 0, 820),
      y: clamp(y - 70, 0, 470),
      w: 420,
      h: 120,
      html: "Texte descriptif…",
      color: "#111827",
      fontSize: 18,
      fontWeight: 400,
      fontFamily: "Arial",
      textAlign: "left",
    });
    s.elements.push({
      id: cryptoId(),
      type: "image",
      x: clamp(x + 80, 0, 600),
      y: clamp(y - 140, 0, 300),
      w: 320,
      h: 240,
    });
    return;
  } else if (toolType === "titleSubtitle") {
    s.elements.push({
      id: cryptoId(),
      type: "text",
      x: clamp(x - 320, 0, 600),
      y: clamp(y - 120, 0, 460),
      w: 700,
      h: 70,
      html: "Titre",
      color: "#111827",
      fontSize: 36,
      fontWeight: 800,
      fontFamily: "Arial",
      textAlign: "left",
    });
    s.elements.push({
      id: cryptoId(),
      type: "text",
      x: clamp(x - 320, 0, 600),
      y: clamp(y - 40, 0, 490),
      w: 700,
      h: 60,
      html: "Sous-titre",
      color: "#111827",
      fontSize: 24,
      fontWeight: 400,
      fontFamily: "Arial",
      textAlign: "left",
    });
    return;
  }

  if (el) {
    s.elements.push(el);
    setSelectedId(el.id);
  }
}
