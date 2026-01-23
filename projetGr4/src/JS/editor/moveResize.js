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
export function configureMoveResize({ render }) {
  renderFn = render;
}
function rerender() {
  if (typeof renderFn === "function") renderFn();
}

let move = null;
let resize = null;

function select(id) {
  if (getSelectedId() === id) return;
  setSelectedId(id);
  rerender();
}

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

  if (isEditable && document.activeElement === target && window.getSelection()?.type === "Range") return;
  if (isTableCell && document.activeElement === ev.target) return;

  select(id);

  const z = getZoom();
  const s = getActive();
  const el = s.elements.find((e) => e.id === id);
  if (!el) return;

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

function endMove() {
  window.removeEventListener("mousemove", onMove);
  move = null;
}

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

  x = clamp(x, 0, 960 - 20);
  y = clamp(y, 0, 540 - 20);

  el.x = x;
  el.y = y;
  el.w = w;
  el.h = h;
  rerender();
}

function endResize() {
  window.removeEventListener("mousemove", onResize);
  resize = null;
}
