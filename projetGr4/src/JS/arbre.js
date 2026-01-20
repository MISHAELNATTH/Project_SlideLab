// --- State Management ---
let nodes = [
  { id: 1, x: 100, y: 100, label: "Rectangle 1", buttons: [] }
];
let nextNodeId = 2;
let selectedNodeId = null;

// Dragging state
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let draggedNodeId = null;

// --- DOM Elements ---
const nodesLayer = document.getElementById("nodes-layer");
const svgLayer = document.getElementById("svg-layer");
const sidebarContent = document.getElementById("properties-content");
const sidebarSubtitle = document.getElementById("sidebar-subtitle");
const canvasEl = document.getElementById("canvas");
const btnAdd = document.getElementById("btnAdd");

// Safety checks (utile si HTML pas à jour)
if (!nodesLayer || !svgLayer || !sidebarContent || !sidebarSubtitle || !canvasEl) {
  throw new Error("DOM manquant : vérifie nodes-layer/svg-layer/properties-content/sidebar-subtitle/canvas");
}

// --- Listeners globaux (DOM, pas inline) ---
canvasEl.addEventListener("mousedown", deselectAll);

if (btnAdd) {
  btnAdd.addEventListener("click", () => createNode());
}

// --- Initialization ---
nodes[0].buttons = [
  { id: generateId(), target: null },
  { id: generateId(), target: null },
  { id: generateId(), target: null }
];

render();
renderSidebar();

// --- Core Functions ---
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function createNode(x = 100, y = 100, select = true) {
  const newNode = {
    id: nextNodeId++,
    x,
    y,
    label: `Rectangle ${nextNodeId}`,
    buttons: []
  };

  nodes.push(newNode);

  if (select) {
    selectNode(newNode.id);
  } else {
    render();
    renderSidebar();
  }

  return newNode.id;
}

function deleteNode(id) {
  nodes = nodes.filter((n) => n.id !== id);

  // Remove links pointing to this node
  nodes.forEach((n) => {
    n.buttons.forEach((b) => {
      if (b.target === id) b.target = null;
    });
  });

  if (selectedNodeId === id) {
    selectedNodeId = null;
  }

  render();
  renderSidebar();
}

function updateNodeButtons(nodeId, count) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return;

  const currentCount = node.buttons.length;

  if (count > currentCount) {
    for (let i = 0; i < count - currentCount; i++) {
      node.buttons.push({ id: generateId(), target: null });
    }
  } else if (count < currentCount) {
    node.buttons = node.buttons.slice(0, count);
  }

  render();
  renderSidebar();
}

function linkButton(nodeId, buttonIndex, targetId) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return;

  if (targetId === "NEW") {
    const newNodeId = createNode(node.x + 300, node.y + buttonIndex * 50, false);
    node.buttons[buttonIndex].target = newNodeId;
  } else {
    node.buttons[buttonIndex].target = targetId ? parseInt(targetId, 10) : null;
  }

  render();
  renderSidebar();
}

function selectNode(id) {
  selectedNodeId = id;
  render();
  renderSidebar();
}

function deselectAll(e) {
  if (
    e.target.id === "canvas" ||
    e.target.classList.contains("help-text") ||
    e.target.id === "nodes-layer" ||
    e.target.id === "svg-layer"
  ) {
    selectedNodeId = null;
    render();
    renderSidebar();
  }
}

function updateLabel(newLabel) {
  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return;
  node.label = newLabel;
  render();
  renderSidebar();
}

// --- Rendering ---
function render() {
  renderNodes();
  renderConnections();
}

function renderNodes() {
  nodesLayer.innerHTML = "";

  nodes.forEach((node) => {
    const isSelected = node.id === selectedNodeId;

    const el = document.createElement("div");
    el.className = `node ${isSelected ? "selected" : ""}`;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    el.style.height = `${Math.max(80, node.buttons.length * 40 + 40)}px`;

    // ✅ DOM listener (au lieu de el.onmousedown = ...)
    el.addEventListener("mousedown", (e) => startDrag(e, node.id));

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

function renderConnections() {
  svgLayer.innerHTML = "";

  nodes.forEach((node) => {
    const totalHeight = Math.max(80, node.buttons.length * 40 + 40);
    const step = totalHeight / (node.buttons.length + 1);

    node.buttons.forEach((btn, index) => {
      if (!btn.target) return;

      const targetNode = nodes.find((n) => n.id === btn.target);
      if (!targetNode) return;

      const startX = node.x + 192;
      const startY = node.y + step * (index + 1);

      const endX = targetNode.x;
      const endY = targetNode.y + Math.max(80, targetNode.buttons.length * 40 + 40) / 2;

      const controlPointX1 = startX + 100;
      const controlPointX2 = endX - 100;

      const d = `M ${startX} ${startY} C ${controlPointX1} ${startY}, ${controlPointX2} ${endY}, ${endX} ${endY}`;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("class", `connection-line ${selectedNodeId === node.id ? "active" : ""}`);

      svgLayer.appendChild(path);
    });
  });
}

function renderSidebar() {
  if (!selectedNodeId) {
    sidebarSubtitle.innerText = "Aucune sélection";
    sidebarContent.innerHTML = `
      <div class="sidebar-empty">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p>Sélectionnez un rectangle pour configurer ses boutons et connexions.</p>
      </div>`;
    return;
  }

  const node = nodes.find((n) => n.id === selectedNodeId);
  sidebarSubtitle.innerText = `Édition de ${node.label}`;
  sidebarContent.innerHTML = "";

  // 1) Rename
  const labelGroup = document.createElement("div");
  labelGroup.className = "form-group";

  const label = document.createElement("label");
  label.className = "form-label";
  label.textContent = "Nom du Rectangle";

  const input = document.createElement("input");
  input.type = "text";
  input.value = node.label;
  input.className = "form-input";
  input.addEventListener("input", () => updateLabel(input.value));

  labelGroup.appendChild(label);
  labelGroup.appendChild(input);
  sidebarContent.appendChild(labelGroup);

  // 2) Buttons count (range + badge)
  const countGroup = document.createElement("div");
  countGroup.className = "form-group";

  const countLabel = document.createElement("label");
  countLabel.className = "form-label";
  countLabel.textContent = "Nombre de boutons (Sorties)";

  const sliderContainer = document.createElement("div");
  sliderContainer.className = "slider-container";

  const range = document.createElement("input");
  range.type = "range";
  range.min = "0";
  range.max = "10";
  range.value = String(node.buttons.length);
  range.className = "slider-input";

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = String(node.buttons.length);

  range.addEventListener("input", () => {
    const v = parseInt(range.value, 10);
    badge.textContent = String(v);
    updateNodeButtons(node.id, v);
  });

  sliderContainer.appendChild(range);
  sliderContainer.appendChild(badge);

  countGroup.appendChild(countLabel);
  countGroup.appendChild(sliderContainer);
  sidebarContent.appendChild(countGroup);

  // Separator
  const separator = document.createElement("hr");
  separator.className = "separator";
  sidebarContent.appendChild(separator);

  // 3) Connections
  const connTitle = document.createElement("h3");
  connTitle.className = "section-title";
  connTitle.innerText = "Connexions";
  sidebarContent.appendChild(connTitle);

  if (node.buttons.length === 0) {
    const empty = document.createElement("p");
    empty.style.color = "var(--color-text-muted)";
    empty.style.fontStyle = "italic";
    empty.style.fontSize = "14px";
    empty.innerText = "Ce rectangle n'a aucun bouton de sortie.";
    sidebarContent.appendChild(empty);
  } else {
    const buttonList = document.createElement("div");
    buttonList.className = "connection-list";

    node.buttons.forEach((btn, index) => {
      const row = document.createElement("div");
      row.className = "connection-item";

      const header = document.createElement("div");
      header.className = "connection-header";

      const lab = document.createElement("span");
      lab.className = "connection-label";
      lab.textContent = `Bouton ${index + 1}`;

      const dot = document.createElement("div");
      dot.className = `status-dot ${btn.target ? "active" : ""}`;

      header.appendChild(lab);
      header.appendChild(dot);

      const select = document.createElement("select");
      select.className = "select-input";

      // options
      const optNone = document.createElement("option");
      optNone.value = "";
      optNone.textContent = "-- Non connecté --";
      select.appendChild(optNone);

      const optNew = document.createElement("option");
      optNew.value = "NEW";
      optNew.textContent = "+ Créer nouveau";
      select.appendChild(optNew);

      nodes.forEach((other) => {
        if (other.id === node.id) return;
        const o = document.createElement("option");
        o.value = String(other.id);
        o.textContent = `Vers: ${other.label}`;
        if (btn.target === other.id) o.selected = true;
        select.appendChild(o);
      });

      // listener
      select.addEventListener("change", () => {
        linkButton(node.id, index, select.value);
      });

      row.appendChild(header);
      row.appendChild(select);
      buttonList.appendChild(row);
    });

    sidebarContent.appendChild(buttonList);
  }

  // 4) Delete button (DOM listener)
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn-delete";
  deleteBtn.innerText = "Supprimer ce rectangle";
  deleteBtn.addEventListener("click", () => deleteNode(node.id));
  sidebarContent.appendChild(deleteBtn);
}

// --- Drag & Drop Logic ---
function startDrag(e, nodeId) {
  if (e.button !== 0) return;
  e.stopPropagation();

  selectedNodeId = nodeId;
  render();
  renderSidebar();

  isDragging = true;
  draggedNodeId = nodeId;

  const node = nodes.find((n) => n.id === nodeId);
  dragOffset.x = e.clientX - node.x;
  dragOffset.y = e.clientY - node.y;
}

window.addEventListener("mousemove", (e) => {
  if (isDragging && draggedNodeId !== null) {
    const node = nodes.find((n) => n.id === draggedNodeId);
    if (node) {
      node.x = e.clientX - dragOffset.x;
      node.y = e.clientY - dragOffset.y;
      render();
    }
  }
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  draggedNodeId = null;
});

// --- Keyboard Shortcuts ---
window.addEventListener("keydown", (e) => {
  if (e.key === "Delete" || e.key === "Backspace") {
    if (document.activeElement && document.activeElement.tagName === "INPUT") return;
    if (selectedNodeId) deleteNode(selectedNodeId);
  }
});
