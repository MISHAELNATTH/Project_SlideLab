import { generateId } from "../utils/ids.js";

/**
 * Schéma JSON (recommandé) :
 * {
 *   "slides": [
 *     { "id": 1, "label": "Slide 1", "x": 100, "y": 100, "buttons": [2, null, 3] }
 *   ]
 * }
 */

export function nodesToJson(nodes) {
  return {
    slides: nodes.map((n) => ({
      id: n.id,
      label: n.label,
      x: n.x,
      y: n.y,
      buttons: n.buttons.map((b) => (b.target ?? null)),
    })),
  };
}

export function jsonToNodes(data) {
  const slides = Array.isArray(data?.slides) ? data.slides : [];
  const nodes = slides.map((s) => {
    const btnTargets = Array.isArray(s.buttons) ? s.buttons : [];
    return {
      id: Number(s.id),
      x: Number(s.x ?? 100),
      y: Number(s.y ?? 100),
      label: String(s.label ?? `Slide ${s.id}`),
      buttons: btnTargets.map((t) => ({
        id: generateId(),
        target: t === null || t === undefined || t === "" ? null : Number(t),
      })),
    };
  });

  // Nettoyage simple : retire les targets qui pointent vers un id inexistant
  const ids = new Set(nodes.map((n) => n.id));
  nodes.forEach((n) => {
    n.buttons.forEach((b) => {
      if (b.target !== null && !ids.has(b.target)) b.target = null;
    });
  });

  return nodes;
}
