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

      // points en "monde"
      const startWorldX = node.x + 192;
      const startWorldY = node.y + step * (index + 1);

      const endWorldX = targetNode.x;
      const endWorldY =
        targetNode.y + Math.max(80, targetNode.buttons.length * 40 + 40) / 2;

      // monde -> écran (canvas coords)
      const startX = (startWorldX - cam.x) * cam.zoom;
      const startY = (startWorldY - cam.y) * cam.zoom;
      const endX = (endWorldX - cam.x) * cam.zoom;
      const endY = (endWorldY - cam.y) * cam.zoom;

      const controlPointX1 = startX + 100 * cam.zoom;
      const controlPointX2 = endX - 100 * cam.zoom;

      const d = `M ${startX} ${startY} C ${controlPointX1} ${startY}, ${controlPointX2} ${endY}, ${endX} ${endY}`;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute(
        "class",
        `connection-line ${selectedNodeId === node.id ? "active" : ""}`
      );

      svgLayer.appendChild(path);
    });
  });
}
