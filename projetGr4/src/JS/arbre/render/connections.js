function cubicBezierPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

export function renderConnections({ dom, store }) {
  const { svgLayer } = dom;
  const nodes = store.getNodes();
  const selectedNodeId = store.getSelectedNodeId();
  const cam = store.getCamera();

  svgLayer.innerHTML = "";

  nodes.forEach((node) => {
    const totalHeight = Math.max(80, node.buttons.length * 40 + 40);
    const step = totalHeight / (node.buttons.length + 1);

    node.buttons.forEach((btn, index) => {
      if (!btn.target) return;

      const targetNode = nodes.find((n) => n.id === btn.target);
      if (!targetNode) return;

      // ---- Points en "monde" ----
      const startWorldX = node.x + 192;
      const startWorldY = node.y + step * (index + 1);

      const endWorldX = targetNode.x;
      const endWorldY =
        targetNode.y + Math.max(80, targetNode.buttons.length * 40 + 40) / 2;

      // ---- Monde -> écran (coords canvas/SVG) ----
      const startX = (startWorldX - cam.x) * cam.zoom;
      const startY = (startWorldY - cam.y) * cam.zoom;
      const endX = (endWorldX - cam.x) * cam.zoom;
      const endY = (endWorldY - cam.y) * cam.zoom;

      // Control points (scale avec zoom)
      const c1x = startX + 100 * cam.zoom;
      const c1y = startY;
      const c2x = endX - 100 * cam.zoom;
      const c2y = endY;

      const d = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;

      // ---- Courbe ----
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute(
        "class",
        `connection-line ${selectedNodeId === node.id ? "active" : ""}`
      );
      svgLayer.appendChild(path);

      // ---- Label (au-dessus) ----
      // nom_du_bouton : si tu ajoutes plus tard btn.label, il sera utilisé
      const buttonName = btn.label ? String(btn.label) : `Bouton ${index + 1}`;
      const labelText = `${buttonName} S${node.id} -> S${targetNode.id}`;

      // point au milieu de la courbe
      const mid = cubicBezierPoint(
        { x: startX, y: startY },
        { x: c1x, y: c1y },
        { x: c2x, y: c2y },
        { x: endX, y: endY },
        0.5
      );

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", String(mid.x));
      // petit décalage au-dessus (scale avec zoom pour rester “visuel”)
      text.setAttribute("y", String(mid.y - 10 * cam.zoom));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("class", "connection-label");
      text.textContent = labelText;

      svgLayer.appendChild(text);
    });
  });
}
