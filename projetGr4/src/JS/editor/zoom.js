// src/JS/editor/zoom.js
import { clamp } from "./core.js";
import { slideEl, zoomChip } from "./dom.js";

export function getZoom() {
  const m = slideEl?.style?.transform?.match(/scale\(([\d.]+)\)/);
  return m ? parseFloat(m[1]) : 1;
}

export function setZoom(z) {
  if (!slideEl) return;
  z = clamp(z, 0.35, 2);
  slideEl.style.transformOrigin = "middle top";
  slideEl.style.transform = `scale(${z})`;
  if (zoomChip) zoomChip.textContent = `Zoom: ${Math.round(z * 100)}%`;
}
