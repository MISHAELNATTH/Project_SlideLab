// src/JS/arbre/io/slidesToNodes.js
import { generateId } from "../utils/ids.js";

/**
 * Convertit slides normalisées -> nodes pour ton tableau
 * buttons: [{label,target}] -> node.buttons: [{id,label,target}]
 */
export function slidesToNodes(slides) {
  return slides.map((s) => ({
    id: s.id,
    x: s.x,
    y: s.y,
    label: s.label,
    file: s.file ?? null, // utile au save
    buttons: (s.buttons || []).map((b) => ({
      id: generateId(),
      label: b.label,
      target: b.target ?? null,
    })),
  }));
}

/**
 * Évite les superpositions: si 2 nodes sont à moins de minDist pixels,
 * on les repousse progressivement.
 */
export function resolveCollisions(nodes, minDist = 100) {
  const maxIter = 200;
  const push = 0.5; // intensité du déplacement

  for (let iter = 0; iter < maxIter; iter++) {
    let moved = false;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0 && dist < minDist) {
          const overlap = (minDist - dist) / dist;

          // repousse chacun dans une direction opposée
          const ox = dx * overlap * push;
          const oy = dy * overlap * push;

          a.x -= ox;
          a.y -= oy;
          b.x += ox;
          b.y += oy;

          moved = true;
        }

        // Si dist == 0 (exactement au même endroit), on décale un peu
        if (dist === 0) {
          a.x -= minDist * 0.25;
          b.x += minDist * 0.25;
          moved = true;
        }
      }
    }

    if (!moved) break;
  }
}
