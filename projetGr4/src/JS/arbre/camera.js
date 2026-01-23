/**
 * camera.js
 * Gestion de la caméra (pan/zoom) pour la vue en graphe. Fournit
 * des utilitaires pour appliquer la transformation et installer
 * les contrôles souris (drag sur fond + roulette pour zoom centré).
 */
// camera.js
import { dom } from "./dom.js";
import { appState } from "./state.js";
import { render } from "./render.js";

export const camera = {
  x: 0,
  y: 0,
  zoom: 1,

  isPanning: false,
  start: { x: 0, y: 0 },
};

const ZOOM_MIN = 0.2;
const ZOOM_MAX = 2.5;
const ZOOM_SPEED = 0.001;

export function applyCameraTransform() {
  const t = `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`;
  dom.nodesLayer.style.transform = t;
  dom.svgLayer.style.transform = t;
}

export function installCameraControls() {
  /* ------------------ PAN (drag souris vide) ------------------ */
  dom.canvasEl.addEventListener("mousedown", (e) => {
    // Si on est en train de drag un node → PAS de pan
    if (appState.isDragging) return;

    // Seulement si on clique sur le canvas / fond
    if (
      e.target !== dom.canvasEl &&
      e.target !== dom.nodesLayer &&
      e.target !== dom.svgLayer
    ) return;

    camera.isPanning = true;
    camera.start.x = e.clientX - camera.x;
    camera.start.y = e.clientY - camera.y;
  });

  window.addEventListener("mousemove", (e) => {
    if (!camera.isPanning) return;

    camera.x = e.clientX - camera.start.x;
    camera.y = e.clientY - camera.start.y;

    applyCameraTransform();
  });

  window.addEventListener("mouseup", () => {
    camera.isPanning = false;
  });

  /* ------------------ ZOOM (molette) ------------------ */
  dom.canvasEl.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();

      const rect = dom.canvasEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - camera.x) / camera.zoom;
      const worldY = (mouseY - camera.y) / camera.zoom;

      const delta = -e.deltaY * ZOOM_SPEED;
      const newZoom = Math.min(
        ZOOM_MAX,
        Math.max(ZOOM_MIN, camera.zoom * (1 + delta))
      );

      camera.zoom = newZoom;

      // Recentrage zoom sous la souris
      camera.x = mouseX - worldX * camera.zoom;
      camera.y = mouseY - worldY * camera.zoom;

      applyCameraTransform();
      render();
    },
    { passive: false }
  );
}
