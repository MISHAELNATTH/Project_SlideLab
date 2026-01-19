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
const nodesLayer = document.getElementById('nodes-layer');
const svgLayer = document.getElementById('svg-layer');
const sidebarContent = document.getElementById('properties-content');
const sidebarSubtitle = document.getElementById('sidebar-subtitle');

// --- Initialization ---
// Initialize with 3 buttons on the first node as requested
nodes[0].buttons = [
    { id: generateId(), target: null },
    { id: generateId(), target: null },
    { id: generateId(), target: null }
];

render();

// --- Core Functions ---

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function createNode(x = 100, y = 100, select = true) {
    const newNode = {
        id: nextNodeId++,
        x: x,
        y: y,
        label: `Rectangle ${nextNodeId}`,
        buttons: []
    };
    nodes.push(newNode);
    if (select) {
        selectNode(newNode.id);
    }
    render();
    return newNode.id;
}

function deleteNode(id) {
    // Remove node
    nodes = nodes.filter(n => n.id !== id);
    
    // Remove links pointing to this node
    nodes.forEach(n => {
        n.buttons.forEach(b => {
            if (b.target === id) b.target = null;
        });
    });

    if (selectedNodeId === id) {
        selectedNodeId = null;
        renderSidebar();
    }
    render();
}

function updateNodeButtons(nodeId, count) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const currentCount = node.buttons.length;
    if (count > currentCount) {
        // Add buttons
        for (let i = 0; i < count - currentCount; i++) {
            node.buttons.push({ id: generateId(), target: null });
        }
    } else if (count < currentCount) {
        // Remove buttons (from the end)
        node.buttons = node.buttons.slice(0, count);
    }
    render();
    renderSidebar(); // Refresh sidebar to show new button inputs
}

function linkButton(nodeId, buttonIndex, targetId) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Handle "Create New" magic value
    if (targetId === 'NEW') {
        // Create a new node to the right of the current one, don't select it automatically
        const newNodeId = createNode(node.x + 300, node.y + (buttonIndex * 50), false);
        node.buttons[buttonIndex].target = newNodeId;
        // Refresh sidebar to show the new node name in the select box instead of "Create New"
        renderSidebar();
    } else {
        node.buttons[buttonIndex].target = targetId ? parseInt(targetId) : null;
    }
    render();
}

function selectNode(id) {
    selectedNodeId = id;
    render();
    renderSidebar();
}

function deselectAll(e) {
    // Check if clicked element is canvas or helper text (not a node or button)
    if (e.target.id === 'canvas' || e.target.classList.contains('help-text') || e.target.id === 'nodes-layer') {
        selectedNodeId = null;
        render();
        renderSidebar();
    }
}

// --- Rendering ---

function render() {
    renderNodes();
    renderConnections();
}

function renderNodes() {
    nodesLayer.innerHTML = '';
    
    nodes.forEach(node => {
        const isSelected = node.id === selectedNodeId;
        
        // Node Container
        const el = document.createElement('div');
        el.className = `node ${isSelected ? 'selected' : ''}`;
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;
        el.style.height = `${Math.max(80, node.buttons.length * 40 + 40)}px`; // Dynamic height based on buttons
        el.onmousedown = (e) => startDrag(e, node.id);

        // Label
        const title = document.createElement('div');
        title.className = "node-title";
        title.innerText = node.label;
        el.appendChild(title);

        // Ports (Buttons visual representation)
        node.buttons.forEach((btn, index) => {
            const port = document.createElement('div');
            port.className = `port ${btn.target ? 'connected' : ''}`;
            // Distribute ports vertically
            const totalHeight = Math.max(80, node.buttons.length * 40 + 40);
            const step = totalHeight / (node.buttons.length + 1);
            port.style.top = `${step * (index + 1) - 6}px`;
            
            // Tooltip
            port.title = btn.target ? `Vers Rectangle ${btn.target}` : "Non connecté";
            
            el.appendChild(port);
        });

        nodesLayer.appendChild(el);
    });
}

function renderConnections() {
    svgLayer.innerHTML = '';

    nodes.forEach(node => {
        const nodeEl = nodesLayer.children[nodes.indexOf(node)];
        if (!nodeEl) return;

        const totalHeight = Math.max(80, node.buttons.length * 40 + 40);
        const step = totalHeight / (node.buttons.length + 1);

        node.buttons.forEach((btn, index) => {
            if (btn.target) {
                const targetNode = nodes.find(n => n.id === btn.target);
                if (targetNode) {
                    // Calculate Start Point (The Port)
                    const startX = node.x + 192; // Node width is 192px
                    const startY = node.y + (step * (index + 1));

                    // Calculate End Point (Target Node Center-Left)
                    const endX = targetNode.x;
                    const endY = targetNode.y + (Math.max(80, targetNode.buttons.length * 40 + 40) / 2);

                    // Bezier Curve Control Points
                    const controlPointX1 = startX + 100;
                    const controlPointX2 = endX - 100;

                    const d = `M ${startX} ${startY} C ${controlPointX1} ${startY}, ${controlPointX2} ${endY}, ${endX} ${endY}`;

                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("d", d);
                    path.setAttribute("class", `connection-line ${selectedNodeId === node.id ? 'active' : ''}`);
                    
                    svgLayer.appendChild(path);
                }
            }
        });
    });
}

function renderSidebar() {
    if (!selectedNodeId) {
        sidebarSubtitle.innerText = "Aucune sélection";
        sidebarContent.innerHTML = `
            <div class="sidebar-empty">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <p>Sélectionnez un rectangle pour configurer ses boutons et connexions.</p>
            </div>`;
        return;
    }

    const node = nodes.find(n => n.id === selectedNodeId);
    sidebarSubtitle.innerText = `Édition de ${node.label}`;

    sidebarContent.innerHTML = '';

    // 1. Rename Input
    const labelGroup = document.createElement('div');
    labelGroup.className = "form-group";
    labelGroup.innerHTML = `
        <label class="form-label">Nom du Rectangle</label>
        <input type="text" value="${node.label}" oninput="updateLabel(this.value)" class="form-input">
    `;
    sidebarContent.appendChild(labelGroup);

    // 2. Number of buttons slider/input
    const countGroup = document.createElement('div');
    countGroup.className = "form-group";
    countGroup.innerHTML = `
        <label class="form-label">Nombre de boutons (Sorties)</label>
        <div class="slider-container">
            <input type="range" min="0" max="10" value="${node.buttons.length}" oninput="updateNodeButtons(${node.id}, parseInt(this.value))" class="slider-input">
            <span class="badge">${node.buttons.length}</span>
        </div>
    `;
    sidebarContent.appendChild(countGroup);

    // 3. Separator
    const separator = document.createElement('hr');
    separator.className = "separator";
    sidebarContent.appendChild(separator);

    // 4. List of connections
    const connTitle = document.createElement('h3');
    connTitle.className = "section-title";
    connTitle.innerText = "Connexions";
    sidebarContent.appendChild(connTitle);

    if (node.buttons.length === 0) {
        const empty = document.createElement('p');
        empty.style.color = "var(--color-text-muted)";
        empty.style.fontStyle = "italic";
        empty.style.fontSize = "14px";
        empty.innerText = "Ce rectangle n'a aucun bouton de sortie.";
        sidebarContent.appendChild(empty);
    } else {
        const buttonList = document.createElement('div');
        buttonList.className = "connection-list";

        node.buttons.forEach((btn, index) => {
            const row = document.createElement('div');
            row.className = "connection-item";
            
            // Build options for select
            let options = `<option value="">-- Non connecté --</option>`;
            options += `<option value="NEW" class="text-blue">+ Créer nouveau</option>`;
            
            nodes.forEach(other => {
                if (other.id !== node.id) {
                    const selected = btn.target === other.id ? 'selected' : '';
                    options += `<option value="${other.id}" ${selected}>Vers: ${other.label}</option>`;
                }
            });

            row.innerHTML = `
                <div class="connection-header">
                    <span class="connection-label">Bouton ${index + 1}</span>
                    <div class="status-dot ${btn.target ? 'active' : ''}"></div>
                </div>
                <select onchange="linkButton(${node.id}, ${index}, this.value)" class="select-input">
                    ${options}
                </select>
            `;
            buttonList.appendChild(row);
        });
        sidebarContent.appendChild(buttonList);
    }

    // 5. Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = "btn-delete";
    deleteBtn.innerText = "Supprimer ce rectangle";
    deleteBtn.onclick = () => deleteNode(node.id);
    sidebarContent.appendChild(deleteBtn);
}

function updateLabel(newLabel) {
    const node = nodes.find(n => n.id === selectedNodeId);
    if (node) {
        node.label = newLabel;
        render();
    }
}

// --- Drag & Drop Logic ---

function startDrag(e, nodeId) {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation(); // Prevent deselecting
    
    selectedNodeId = nodeId;
    render(); // To highlight selection immediately
    renderSidebar();

    isDragging = true;
    draggedNodeId = nodeId;
    
    const node = nodes.find(n => n.id === nodeId);
    dragOffset.x = e.clientX - node.x;
    dragOffset.y = e.clientY - node.y;
}

window.addEventListener('mousemove', (e) => {
    if (isDragging && draggedNodeId !== null) {
        const node = nodes.find(n => n.id === draggedNodeId);
        if (node) {
            node.x = e.clientX - dragOffset.x;
            node.y = e.clientY - dragOffset.y;
            render(); // Re-render to update lines and position
        }
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
    draggedNodeId = null;
});

// --- Keyboard Shortcuts ---
window.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if focusing an input
        if (document.activeElement.tagName === 'INPUT') return;
        if (selectedNodeId) {
            deleteNode(selectedNodeId);
        }
    }
});