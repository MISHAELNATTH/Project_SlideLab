import { dom } from "./dom.js";
import { appState } from "./state.js";
import { linkToSlideIndex } from "./mapping.js";

export function render() {
  renderNodes();
  renderConnections();
}

export function renderNodes() {
  dom.nodesLayer.innerHTML = "";

  appState.nodes.forEach((node) => {
    const isSelected = node.id === appState.selectedNodeId;

    const el = document.createElement("div");
    el.className = `node ${isSelected ? "selected" : ""}`;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;

    const portsCount = node.outputs.length;
    el.style.height = `${Math.max(80, portsCount * 40 + 40)}px`;

    el.addEventListener("mousedown", (e) => {
      // startDrag est attaché dans interactions.js via un handler exporté
      window.__ARBRE_START_DRAG__?.(e, node.id);
    });

    const title = document.createElement("div");
    title.className = "node-title";
    title.innerText = node.label;
    el.appendChild(title);

    const totalHeight = Math.max(80, portsCount * 40 + 40);
    const step = portsCount > 0 ? totalHeight / (portsCount + 1) : totalHeight;

    node.outputs.forEach((out, index) => {
      const port = document.createElement("div");
      port.className = `port ${out.link ? "connected" : ""}`;
      port.style.top = `${step * (index + 1) - 6}px`;
      port.title = out.link ? `${out.name} → slide_${out.link}` : "Non connecté";
      el.appendChild(port);
    });

    dom.nodesLayer.appendChild(el);
  });
}

export function renderConnections() {
  dom.svgLayer.innerHTML = "";

  appState.nodes.forEach((node) => {
    const portsCount = node.outputs.length;
    const totalHeight = Math.max(80, portsCount * 40 + 40);
    const step = portsCount > 0 ? totalHeight / (portsCount + 1) : totalHeight;

    node.outputs.forEach((out, index) => {
      if (!out.link) return;

      const targetSlideIndex = linkToSlideIndex(out.link);
      if (targetSlideIndex == null) return;

      const targetNode = appState.nodes.find((n) => n.slideIndex === targetSlideIndex);
      if (!targetNode) return;

      const startX = node.x + 192;
      const startY = node.y + step * (index + 1);

      const endX = targetNode.x;
      const endY =
        targetNode.y + Math.max(80, targetNode.outputs.length * 40 + 40) / 2;

      const c1x = startX + 120;
      const c2x = endX - 120;

      const d = `M ${startX} ${startY} C ${c1x} ${startY}, ${c2x} ${endY}, ${endX} ${endY}`;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute(
        "class",
        `connection-line ${appState.selectedNodeId === node.id ? "active" : ""}`
      );
      dom.svgLayer.appendChild(path);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "connection-label");

      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2 - 8;

      label.setAttribute("x", String(midX));
      label.setAttribute("y", String(midY));
      label.setAttribute("text-anchor", "middle");
      label.textContent = `${out.name} -> slide_${targetSlideIndex + 1}`;

      dom.svgLayer.appendChild(label);
    });
  });
}
