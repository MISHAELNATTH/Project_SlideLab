export function renderNodes({ dom, store }) {
  const { nodesLayer } = dom;
  const nodes = store.getNodes();
  const selectedNodeId = store.getSelectedNodeId();
  const cam = store.getCamera();

  nodesLayer.innerHTML = "";

  nodes.forEach((node) => {
    const isSelected = node.id === selectedNodeId;

    // monde -> écran (canvas coords)
    const screenX = (node.x - cam.x) * cam.zoom;
    const screenY = (node.y - cam.y) * cam.zoom;

    const el = document.createElement("div");
    el.className = `node ${isSelected ? "selected" : ""}`;
    el.style.left = `${screenX}px`;
    el.style.top = `${screenY}px`;

    // On scale le node (simple et efficace)
    el.style.transform = `scale(${cam.zoom})`;
    el.style.transformOrigin = "top left";

    // hauteur "monde" (sera scalée par transform)
    el.style.height = `${Math.max(80, node.buttons.length * 40 + 40)}px`;

    // Drag node: on dispatch un event global (comme avant)
    el.addEventListener("mousedown", (e) => {
      const ev = new CustomEvent("arbre:startDrag", {
        detail: { originalEvent: e, nodeId: node.id },
      });
      window.dispatchEvent(ev);
    });

    const title = document.createElement("div");
    title.className = "node-title";
    title.innerText = node.label;
    el.appendChild(title);

    node.buttons.forEach((btn, index) => {
      const port = document.createElement("div");
      port.className = `port ${btn.target ? "connected" : ""}`;

      const totalHeight = Math.max(80, node.buttons.length * 40 + 40);
      const step = totalHeight / (node.buttons.length + 1);
      port.style.top = `${step * (index + 1) - 6}px`;

      port.title = btn.target ? `Vers Rectangle ${btn.target}` : "Non connecté";
      el.appendChild(port);
    });

    nodesLayer.appendChild(el);
  });
}
