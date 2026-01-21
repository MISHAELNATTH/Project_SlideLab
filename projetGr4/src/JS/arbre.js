/* ============================================================================
  arbre.js (refonte complète)
  - Source unique: localStorage.getItem('slides_state')
  - 1 slide => 1 node (rectangle)
  - slide.arbre.elements => sorties (ports)
  - Chaque port a un <select> vers une autre slide (link = (indexCible+1) en string)
  - Dessine SVG + label: "NomObjet -> slide_X"
  - Persiste:
      • links (arbre.elements[].link + slide.elements[].link si elementId match)
      • titres (arbre.title)
      • positions (arbre.pos)
============================================================================ */

/* =========================
   DOM
========================= */
const nodesLayer = document.getElementById("nodes-layer");
const svgLayer = document.getElementById("svg-layer");
const sidebarContent = document.getElementById("properties-content");
const sidebarSubtitle = document.getElementById("sidebar-subtitle");
const canvasEl = document.getElementById("canvas");

const btnAdd = document.getElementById("btnAdd");
const btnSave = document.getElementById("btnSave");
const btnLoad = document.getElementById("btnLoad");
const fileImport = document.getElementById("fileImport");

if (!nodesLayer || !svgLayer || !sidebarContent || !sidebarSubtitle || !canvasEl) {
  throw new Error("DOM manquant : nodes-layer/svg-layer/properties-content/sidebar-subtitle/canvas");
}

/* =========================
   Storage helpers
========================= */
const STORAGE_KEY = "slides_state";

function loadSlidesStateFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.error("slides_state invalide dans localStorage (JSON parse):", e);
    return null;
  }
}

function saveSlidesStateToLocalStorage(slides_state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slides_state));
    console.log("✓ slides_state sauvegardé");
  } catch (e) {
    console.error("Erreur save localStorage:", e);
  }
}

// Auto-save (debounced)
function debounce(fn, ms = 200) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

const requestSave = debounce(() => {
  if (!slides_state) return;
  saveSlidesStateToLocalStorage(slides_state);
}, 200);

function deleteSlideByIndex(deleteIndex) {
  if (!slides_state?.slides?.length) return;

  const deletedLinkNumber = deleteIndex + 1; // link "1..N"

  // 1) Supprimer la slide
  slides_state.slides.splice(deleteIndex, 1);

  // 2) nettoie/renumérote tous les links
  cleanupLinksAfterSlideDelete(slides_state, deleteIndex);

  // 3) sauve + rebuild
  saveSlidesStateToLocalStorage(slides_state);
  selectedNodeId = null;
  buildGraphFromSlidesState();
}


/* =========================
   State runtime
========================= */
let slides_state = loadSlidesStateFromLocalStorage(); // SOURCE UNIQUE
let nodes = []; // nodes dérivés
let selectedNodeId = null;

// Drag
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let draggedNodeId = null;

/* =========================
   Mapping link <-> slide
========================= */
function slideIndexToLink(slideIndex) {
  return String(slideIndex + 1); // "1..N"
}
function linkToSlideIndex(link) {
  if (typeof link !== "string") return null;
  if (!/^\d+$/.test(link)) return null; // ✅ uniquement des chiffres
  const n = Number(link);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n - 1;
}


/* =========================
   Update helpers (writes into slides_state + persist)
========================= */
function setSlideTitle(srcSlideIndex, newTitle) {
  const s = slides_state?.slides?.[srcSlideIndex];
  if (!s) return;
  if (!s.arbre) s.arbre = {};
  s.arbre.title = newTitle;
  requestSave();

}

function setSlidePos(srcSlideIndex, x, y) {
  const s = slides_state?.slides?.[srcSlideIndex];
  if (!s) return;
  if (!s.arbre) s.arbre = {};
  if (!s.arbre.pos) s.arbre.pos = { x: 0, y: 0 };
  s.arbre.pos.x = x;
  s.arbre.pos.y = y;
  requestSave();
}

function setElementLinkInSlidesState(srcSlideIndex, elementIndex, newLink) {
  const slide = slides_state?.slides?.[srcSlideIndex];
  if (!slide || !Array.isArray(slide.elements)) return;

  const el = slide.elements[elementIndex];
  if (!el) return;

  el.link = newLink;

  requestSave(); // ou saveSlidesStateToLocalStorage(slides_state)
}

/* =========================
   Build graph (nodes) from slides_state
========================= */
function buildGraphFromSlidesState() {
  if (!slides_state || !Array.isArray(slides_state.slides)) {
    nodes = [];
    selectedNodeId = null;
    render();
    renderSidebar();
    return;
  }

  nodes = slides_state.slides.map((slide, slideIndex) => {
    if (!slide.arbre) slide.arbre = {};
    if (!slide.arbre.pos) slide.arbre.pos = {};
    const a = slide.arbre;
    const defaultX = 100 + slideIndex * 260;
    const defaultY = 120 + (slideIndex % 4) * 160;

    const xStored = a.pos.x;
    const yStored = a.pos.y;

    const x = (typeof xStored === "number") ? xStored : defaultX;
    const y = (typeof yStored === "number") ? yStored : defaultY;

    // 🔥 on écrit dans slides_state (création ou correction)
    a.pos.x = x;
    a.pos.y = y;
    const title = a.title || `Slide ${slideIndex + 1}`;
    const outputs = Array.isArray(slide.elements) ? slide.elements : [];

    return {
      // identifiants
      id: slideIndex + 1, // id visuel (1..N)
      slideIndex,
      slideId: slide.id,

      // layout
      x: x,
      y: y,


      // data
      label: title,
      outputs: outputs.map((el, elementIndex) => ({
        elementIndex,
        elementId: el.id,              // id réel de l’élément
        name: el.type || "element",    // nommé selon son type
        link: el.link ?? null
      })),
    };
  });

  // reset sélection si plus valide
  if (selectedNodeId != null) {
    const exists = nodes.some((n) => n.id === selectedNodeId);
    if (!exists) selectedNodeId = null;
  }

  render();
  renderSidebar();
}

/* =========================
   Render
========================= */
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

    const portsCount = node.outputs.length;
    el.style.height = `${Math.max(80, portsCount * 40 + 40)}px`;

    el.addEventListener("mousedown", (e) => startDrag(e, node.id));

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

    nodesLayer.appendChild(el);
  });
}

function renderConnections() {
  svgLayer.innerHTML = "";

  nodes.forEach((node) => {
    const portsCount = node.outputs.length;
    const totalHeight = Math.max(80, portsCount * 40 + 40);
    const step = portsCount > 0 ? totalHeight / (portsCount + 1) : totalHeight;

    node.outputs.forEach((out, index) => {
      if (!out.link) return;

      const targetSlideIndex = linkToSlideIndex(out.link);
      if (targetSlideIndex == null) return;

      const targetNode = nodes.find((n) => n.slideIndex === targetSlideIndex);
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
      path.setAttribute("class", `connection-line ${selectedNodeId === node.id ? "active" : ""}`);
      svgLayer.appendChild(path);

      // label "nomObjet -> slide_X"
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "connection-label");

      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2 - 8;

      label.setAttribute("x", String(midX));
      label.setAttribute("y", String(midY));
      label.setAttribute("text-anchor", "middle");
      label.textContent = `${out.name} -> slide_${targetSlideIndex + 1}`;

      svgLayer.appendChild(label);
    });
  });
}

/* =========================
   Sidebar
========================= */
/**
 * Nettoie tous les liens (elements[].link) après suppression d'une slide.
 * Règles:
 *  - si link === deletedIndex+1 => link = null
 *  - si link > deletedIndex+1 => link = link-1 (car renumérotation)
 *
 * @param {object} slides_state
 * @param {number} deletedIndex index (0-based) de la slide supprimée
 */
function cleanupLinksAfterSlideDelete(slides_state, deletedIndex) {
  const deletedLink = deletedIndex + 1; // link "1..N" (avant suppression)

  if (!slides_state?.slides?.length) return;

  slides_state.slides.forEach((slide) => {
    if (!Array.isArray(slide.elements)) return;

    slide.elements.forEach((el) => {
      if (!el || el.link == null) return;

      const n = parseInt(el.link, 10);
      if (!Number.isFinite(n) || n <= 0) {
        el.link = null;
        return;
      }

      if (n === deletedLink) {
        // pointait vers la slide supprimée
        el.link = null;
      } else if (n > deletedLink) {
        // pointait vers une slide après => décale
        el.link = String(n - 1);
      }
    });
  });
}



function renderSidebar() {
  if (!selectedNodeId) {
    sidebarSubtitle.innerText = "Aucune sélection";
    sidebarContent.innerHTML = `
      <div class="sidebar-empty">
        <p>Sélectionnez une slide (rectangle) pour configurer ses éléments.</p>
      </div>`;
    return;
  }

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return;

  sidebarSubtitle.innerText = `Édition de ${node.label}`;
  sidebarContent.innerHTML = "";

  // --- Titre slide ---
  const labelGroup = document.createElement("div");
  labelGroup.className = "form-group";

  const label = document.createElement("label");
  label.className = "form-label";
  label.textContent = "Nom de la Slide";

  const input = document.createElement("input");
  input.type = "text";
  input.value = node.label;
  input.className = "form-input";
  input.addEventListener("input", () => {
    node.label = input.value;
    setSlideTitle(node.slideIndex, node.label); // persist
    renderNodes();
    renderConnections();
    // on ne reconstruit pas tout: juste rendu
  });

  labelGroup.appendChild(label);
  labelGroup.appendChild(input);
  sidebarContent.appendChild(labelGroup);

  // --- Bouton supprimer slide ---



  const dangerRow = document.createElement("div");
  dangerRow.className = "form-group";

  const delBtn = document.createElement("button");
  delBtn.className = "btn danger"; // si t'as pas de style, ça marche quand même
  delBtn.type = "button";
  delBtn.textContent = "Supprimer cette slide";

  delBtn.addEventListener("click", () => {
    const ok = confirm(`Supprimer "${node.label}" ?\nCette action est irréversible.`);
    if (!ok) return;
    deleteSlideByIndex(node.slideIndex);
  });

  dangerRow.appendChild(delBtn);
  sidebarContent.appendChild(dangerRow);


  // Separator
  const separator = document.createElement("hr");
  separator.className = "separator";
  sidebarContent.appendChild(separator);

  // --- Connexions ---
  const connTitle = document.createElement("h3");
  connTitle.className = "section-title";
  connTitle.innerText = "Connexions des éléments";
  sidebarContent.appendChild(connTitle);

  if (node.outputs.length === 0) {
    const empty = document.createElement("p");
    empty.style.color = "var(--color-text-muted)";
    empty.style.fontStyle = "italic";
    empty.style.fontSize = "14px";
    empty.innerText = "Cette slide n’a aucun élément dans arbre.elements.";
    sidebarContent.appendChild(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "connection-list";

  node.outputs.forEach((out) => {
    const row = document.createElement("div");
    row.className = "connection-item";

    const header = document.createElement("div");
    header.className = "connection-header";

    const lab = document.createElement("span");
    lab.className = "connection-label";
    lab.textContent = out.name;

    const dot = document.createElement("div");
    dot.className = `status-dot ${out.link ? "active" : ""}`;

    header.appendChild(lab);
    header.appendChild(dot);

    const select = document.createElement("select");
    select.className = "select-input";

    const externalWrap = document.createElement("div");
    externalWrap.style.marginTop = "8px";
    externalWrap.style.display = "none";

    const externalInput = document.createElement("input");
    externalInput.type = "text";
    externalInput.className = "form-input";
    externalInput.placeholder = "https://... ou texte libre";

    externalWrap.appendChild(externalInput);

    // none
    const optNone = document.createElement("option");
    optNone.value = "";
    optNone.textContent = "-- Non connecté --";
    select.appendChild(optNone);

    // external
    const optExternal = document.createElement("option");
    optExternal.value = "__external__";
    optExternal.textContent = "Lien externe";
    select.appendChild(optExternal);

    const isInternalLink = (typeof out.link === "string" && /^\d+$/.test(out.link));
    const isExternalLink = (out.link && !isInternalLink);

    if (isExternalLink) {
      select.value = "__external__";
      externalWrap.style.display = "block";
      externalInput.value = out.link;
    }

    // slides dispo (sauf soi-même)
    nodes.forEach((n) => {
      if (n.slideIndex === node.slideIndex) return;
      const o = document.createElement("option");
      o.value = slideIndexToLink(n.slideIndex); // "1..N"
      o.textContent = `Vers: slide_${n.slideIndex + 1} (${n.label})`;
      if (out.link === o.value) o.selected = true;
      select.appendChild(o);
    });

    // change => persist + redraw
    select.addEventListener("change", () => {
      // Cas "non connecté"
      if (select.value === "") {
        externalWrap.style.display = "none";
        out.link = null;
        dot.className = "status-dot";
        setElementLinkInSlidesState(node.slideIndex, out.elementIndex, null);
        renderNodes();
        renderConnections();
        return;
      }

      // Cas "Lien externe"
      if (select.value === "__external__") {
        externalWrap.style.display = "block";

        // si vide, on initialise à "" (ou garde l'existant)
        const v = typeof out.link === "string" && !/^\d+$/.test(out.link) ? out.link : "";
        externalInput.value = v;

        out.link = v || null;
        dot.className = `status-dot ${out.link ? "active" : ""}`;
        setElementLinkInSlidesState(node.slideIndex, out.elementIndex, out.link);

        renderNodes();
        renderConnections();
        return;
      }

      // Cas lien interne (vers une slide)
      externalWrap.style.display = "none";
      const newLink = select.value; // "1..N"

      out.link = newLink;
      dot.className = `status-dot active`;
      setElementLinkInSlidesState(node.slideIndex, out.elementIndex, newLink);

      renderNodes();
      renderConnections();
    });

    externalInput.addEventListener("input", () => {
      // seulement si le mode externe est actif
      if (select.value !== "__external__") return;

      const v = externalInput.value.trim();
      out.link = v ? v : null;
      dot.className = `status-dot ${out.link ? "active" : ""}`;

      setElementLinkInSlidesState(node.slideIndex, out.elementIndex, out.link);

      renderNodes();
      renderConnections();
    });

    row.appendChild(header);
    row.appendChild(select);
    row.appendChild(externalWrap);
    list.appendChild(row);
  });

  sidebarContent.appendChild(list);
}

/* =========================
   Selection / Drag
========================= */
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
  if (!isDragging || draggedNodeId == null) return;

  const node = nodes.find((n) => n.id === draggedNodeId);
  if (!node) return;

  node.x = e.clientX - dragOffset.x;
  node.y = e.clientY - dragOffset.y;

  // persist pos dans slides_state (arbre.pos)
  setSlidePos(node.slideIndex, node.x, node.y);

  render();
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  draggedNodeId = null;
});

/* =========================
   Buttons: Add / Save / Import
========================= */
function uuid() {
  // simple uuid-ish
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function addSlide() {
  if (!slides_state) {
    slides_state = { activeSlide: 0, slides: [] };
  }
  if (!Array.isArray(slides_state.slides)) slides_state.slides = [];

  const idx = slides_state.slides.length;

  slides_state.slides.push({
    id: uuid(),
    backgroundColor: "#ffffff",
    backgroundGradient: "",
    elements: [],
    arbre: {
      title: `Slide ${idx + 1}`,
      pos: { x: 100 + idx * 260, y: 120 + (idx % 4) * 160 },
    },
  });

  requestSave();
  buildGraphFromSlidesState();
}

function exportJsonDownload() {
  // téléchargement d’un JSON (en plus du localStorage)
  try {
    const data = JSON.stringify(slides_state ?? {}, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "slides_state.json";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Export JSON failed:", e);
  }
}

function importFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      slides_state = parsed;
      requestSave();
      buildGraphFromSlidesState();
    } catch (e) {
      console.error("Import JSON invalide:", e);
      alert("Fichier JSON invalide.");
    }
  };
  reader.readAsText(file);
}

/* =========================
   Listeners
========================= */
canvasEl.addEventListener("mousedown", deselectAll);

if (btnAdd) btnAdd.addEventListener("click", addSlide);

if (btnSave) {
  btnSave.addEventListener("click", () => {
    // On force une sauvegarde du dernier état runtime (déjà persist souvent)
    requestSave();
    exportJsonDownload(); // optionnel, mais pratique
  });
}

if (btnLoad) {
  btnLoad.addEventListener("click", () => {
    const target = "src/html/editor.html";
    window.location.href = `${import.meta.env.BASE_URL}${target}`;
  });
}

/* =========================
   Init
========================= */
buildGraphFromSlidesState();
