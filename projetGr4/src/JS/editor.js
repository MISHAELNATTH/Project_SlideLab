import { getElementStyles, getElementClasses, getSlideBackgroundStyle, px } from './styleHelper.js';
// =====================================================
//  DONNÉES ET CONFIGURATION
// =====================================================

export var id=1;

export const state = {
  
  activeSlide: 0,
  slides: [
    { 
      id: cryptoId(), 
      backgroundColor: "#ffffff",
      backgroundGradient: "",
      elements: [
        { id: cryptoId(), type:"text", x:90, y:80, w:520, h:70, html:"Titre de la slide", color: "#111827", fontSize: 28, fontWeight: 800, fontFamily: "Arial", textAlign: "left" },
        { id: cryptoId(), type:"shape", x:90, y:190, w:420, h:160, shapeType: "rectangle", fillColor: "#7c5cff", borderColor: "#37d6ff", opacity: 1 },
        { id: cryptoId(), type:"button", x:90, y:380, w:220, h:50, html:"Clique ici", color: "#ffffff", fontSize: 16, fontWeight: 700, fontFamily: "Arial", textAlign: "center" },
      ]}
  ]
};

// =====================================================
//  SAUVEGARDE/CHARGEMENT (localStorage)
// =====================================================

export function saveState() {
  try {
    localStorage.setItem(
      'slides_state',
      JSON.stringify(state)
    );
    console.log('✓ État sauvegardé');
  } catch (e) {
    console.error('Erreur lors de la sauvegarde:', e);
  }
}

export function loadState() {
  try {
    const saved = localStorage.getItem('slides_state');
    if (saved) {
      const loaded = JSON.parse(saved);
      state.activeSlide = loaded.activeSlide;
      state.slides = loaded.slides;
      console.log('✓ État restauré');
      return true;
    }
  } catch (e) {
    console.error('Erreur lors du chargement:', e);
  }
  return false;
}

export const slideEl   = document.getElementById("slide");
export const thumbsEl  = document.getElementById("thumbs");
export const searchEl  = document.getElementById("toolSearch");
export const zoomChip  = document.getElementById("zoomChip");

export let selectedId = null;

export function setSelectedId(id) {
  selectedId = id;
}

export function getSelectedId() {
  return selectedId;
}

// =====================================================
//  HELPERS
// =====================================================

export function slideId(){
  return "slide-" + id++ + ".html";
}

export function cryptoId(){
  return (crypto?.randomUUID?.() || ("id_" + Math.random().toString(16).slice(2)));
}

function clamp(n, a, b){ 
  return Math.max(a, Math.min(b, n)); 
}

export function getActive(){
  return state.slides[state.activeSlide];
}


function clearSelection(){
  selectedId = null;
  render();
}

function select(id){
  // Fix: Prevent re-rendering if already selected to allow double-click events
  if (selectedId === id) return;
  selectedId = id;
  render();
}

export function getZoom(){
  const m = slideEl.style.transform.match(/scale\(([\d.]+)\)/);
  return m ? parseFloat(m[1]) : 1;
}

export function setZoom(z){
  z = clamp(z, .35, 2);
  slideEl.style.transformOrigin = "middle top";
  slideEl.style.transform = `scale(${z})`;
  zoomChip.textContent = `Zoom: ${Math.round(z*100)}%`;
}

// =====================================================
//  RENDER
// =====================================================

loadState();
export function render(){
  const s = getActive();
  
  // [STRATEGY] Use helper for background
  slideEl.style.background = getSlideBackgroundStyle(s);
  
  // Clear previous elements
  slideEl.querySelectorAll(".el").forEach(n => n.remove());

  s.elements.forEach(e => {
    const node = document.createElement("div");
    
    // [STRATEGY] Use helper for classes
    node.className = getElementClasses(e) + (e.id === selectedId ? " selected" : "");
    node.dataset.id = e.id;

    // [STRATEGY] Use helper for all CSS styles (pos, size, font, color, border...)
    const styles = getElementStyles(e);
    Object.assign(node.style, styles);

    // --- TEXT & BUTTON ---
    if (e.type === "text" || e.type === "button"){
      node.contentEditable = "true";
      node.spellcheck = false;
      node.innerHTML = e.html || (e.type === "text" ? "Texte" : "Bouton");
      
      // --- FIX IS HERE: Defined the toolbar before using it ---
      const toolbar = createTextToolbar(e);
      node.appendChild(toolbar);
    }

    // --- TABLE ---
    if (e.type === "table"){
      const tableEl = document.createElement("table");
      tableEl.className = "data-table";
      
      // Internal Table Styling (Specific to table structure, not container)
      if (e.borderColor) {
        tableEl.style.setProperty('--table-border-color', e.borderColor);
      }
      
      const rows = e.rows || 3;
      const cols = e.cols || 3;
      const data = e.data || Array(rows).fill(null).map(() => Array(cols).fill(""));
      
      for (let i = 0; i < rows; i++) {
        const tr = document.createElement("tr");
        for (let j = 0; j < cols; j++) {
          const cell = i === 0 ? document.createElement("th") : document.createElement("td");
          cell.contentEditable = "true";
          cell.textContent = data[i]?.[j] || (i === 0 ? `Col ${j + 1}` : "");
          cell.dataset.row = i;
          cell.dataset.col = j;
          
          if (i === 0 && e.headerColor) {
            cell.style.background = e.headerColor;
          }
          if (e.borderColor) {
            cell.style.borderColor = e.borderColor;
          }
          
          cell.addEventListener("blur", () => {
            if (!e.data) e.data = Array(rows).fill(null).map(() => Array(cols).fill(""));
            if (!e.data[i]) e.data[i] = Array(cols).fill("");
            e.data[i][j] = cell.textContent;
          });
          
          tr.appendChild(cell);
        }
        tableEl.appendChild(tr);
      }
      
      node.appendChild(tableEl);
      const controls = createTableControls(e);
      node.appendChild(controls);
    }

    // --- SHAPE ---
    if (e.type === "shape"){
      // Visuals (bg, border) are applied to 'node' by styleHelper.
      const controls = createShapeControls(e);
      node.appendChild(controls);
    }

    // --- IMAGE ---
    if (e.type === "image"){
      const wrapper = document.createElement('div');
      wrapper.className = "el-img-wrapper";
      
      let innerContent = "";
      if (e.imageData){
        // Ensure contain to match export
        innerContent = `<img src="${e.imageData}" style="width:100%;height:100%;object-fit:contain;">`;
      } else{
        innerContent = `<div style="padding:12px;text-align:center;line-height:1.2;width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;">
          <span style="font-size:24px;margin-bottom:8px;">📸</span>
          <span style="font-size:13px;font-weight:600;color:#007bff">Double-clique</span>
        </div>`;
      }
      wrapper.innerHTML = innerContent;
      node.appendChild(wrapper);
      node.style.cursor = "pointer";
      
       node.addEventListener("dblclick", (ev) => {
        ev.stopPropagation(); 
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
              e.imageData = loadEvent.target.result;
              render();
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      });
      
      // Drag & Drop events on the node
      node.addEventListener("dragover", (ev) => { ev.preventDefault(); ev.stopPropagation(); });
      node.addEventListener("drop", (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const files = ev.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (event) => {
              e.imageData = event.target.result;
              render();
            };
            reader.readAsDataURL(files[0]);
        }
      });
    }

    // Handles
    ["tl","tr","bl","br"].forEach(pos=>{
      const h = document.createElement("div");
      h.className = "handle h-" + pos;
      h.dataset.handle = pos;
      node.appendChild(h);
    });

    // Event Listeners
    node.addEventListener("mousedown", (ev)=>{
      if (ev.target.classList.contains("handle")) return;
      select(e.id);
    });
    node.addEventListener("mousedown", (ev)=> startMove(ev, e.id));

    slideEl.appendChild(node);
  });
  
  renderThumbs();
  
  // update zoom indicator
  const z = getZoom();
  zoomChip.textContent = `Zoom: ${Math.round(z*100)}%`;

  // auto save
  saveState();
}

// =====================================================
//  THUMBNAILS
// =====================================================
function renderThumbs() {
  thumbsEl.innerHTML = "";
  state.slides.forEach((sl, i) => {
    const t = document.createElement("div");
    t.className = "thumb" + (i === state.activeSlide ? " active" : "");
    
    // Create preview container
    const miniDiv = document.createElement('div');
    miniDiv.className = "mini";
    // Apply background to thumb using helper
    miniDiv.style.background = getSlideBackgroundStyle(sl);

    // Create Label
    const label = document.createElement("div");
    label.className = "label";
    label.innerHTML = `
        <span>Slide ${i+1}</span>
        <span style="color:rgba(255,255,255,.55)">${sl.elements.length} obj.</span>
    `;

    t.appendChild(miniDiv);
    t.appendChild(label);

    t.addEventListener("click", ()=> {
      state.activeSlide = i;
      selectedId = null;
      render();
    });
    thumbsEl.appendChild(t);

    // Render elements inside thumbnail
    const scale = 0.12;
    sl.elements.forEach(e => {
      const node = document.createElement("div");
      
      // Use helper for classes
      node.className = getElementClasses(e);
      
      // Styles for thumbnail (manual scaling needed here)
      node.style.position = "absolute";
      node.style.left = px(e.x * scale);
      node.style.top = px(e.y * scale);
      node.style.width = px((e.w) * scale);
      node.style.height = px((e.h) * scale);
      
      // Apply basic colors/styles
      const styles = getElementStyles(e);
      if(styles.background) node.style.background = styles.background;
      if(styles.color) node.style.color = styles.color;
      if(styles.borderColor) node.style.borderColor = styles.borderColor;
      if(styles.borderWidth) node.style.borderWidth = "1px"; // Scale border
      if(styles.borderStyle) node.style.borderStyle = styles.borderStyle;
      if(styles.opacity) node.style.opacity = styles.opacity;

      node.style.pointerEvents = "none";
      node.style.overflow = "hidden";

      // Simplified content for thumbnail
      if (e.type === "text"){
        node.innerHTML = e.html || "Texte";
        node.style.fontSize = "4px"; // tiny font
      } else if (e.type === "button"){
        node.innerHTML = "";
        node.style.background = e.color === "#ffffff" ? "#111827" : e.color; // Simplified button look
      } else if (e.type === "image" && e.imageData){
        node.innerHTML = `<img src="${e.imageData}" style="width:100%;height:100%;object-fit:contain;">`;
      }

      miniDiv.appendChild(node);
    });
  });
}




// =====================================================
//  TOOLBARS
// =====================================================
function createTextToolbar(element) {
  const toolbar = document.createElement("div");
  toolbar.className = "text-toolbar";
  toolbar.addEventListener("mousedown", (ev) => ev.stopPropagation());
  toolbar.addEventListener("click", (ev) => ev.stopPropagation());
  
  // Color picker
  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = element.color || "#111827";
  colorInput.title = "Couleur du texte";
  colorInput.addEventListener("input", (e) => {
    element.color = e.target.value;
    render();
  });
  
  // Font family
  const fontSelect = document.createElement("select");
  fontSelect.innerHTML = `
    <option value="Arial" ${element.fontFamily === "Arial" ? "selected" : ""}>Arial</option>
    <option value="Georgia" ${element.fontFamily === "Georgia" ? "selected" : ""}>Georgia</option>
    <option value="Times New Roman" ${element.fontFamily === "Times New Roman" ? "selected" : ""}>Times New Roman</option>
    <option value="Courier New" ${element.fontFamily === "Courier New" ? "selected" : ""}>Courier New</option>
    <option value="Verdana" ${element.fontFamily === "Verdana" ? "selected" : ""}>Verdana</option>
  `;
  fontSelect.addEventListener("change", (e) => {
    element.fontFamily = e.target.value;
    render();
  });
  
  // Font size
  const sizeInput = document.createElement("input");
  sizeInput.type = "number";
  sizeInput.value = element.fontSize || 28;
  sizeInput.min = 8;
  sizeInput.max = 120;
  sizeInput.style.width = "60px";
  sizeInput.addEventListener("change", (e) => {
    element.fontSize = parseInt(e.target.value);
    render();
  });
  
  // Bold
  const boldBtn = document.createElement("button");
  boldBtn.innerHTML = "B";
  boldBtn.title = "Gras";
  boldBtn.className = element.fontWeight === "bold" || element.fontWeight >= 700 ? "active" : "";
  boldBtn.addEventListener("click", () => {
    element.fontWeight = element.fontWeight === "bold" || element.fontWeight >= 700 ? 400 : 700;
    render();
  });
  
  // Italic
  const italicBtn = document.createElement("button");
  italicBtn.innerHTML = "I";
  italicBtn.title = "Italique";
  italicBtn.style.fontStyle = "italic";
  italicBtn.addEventListener("click", () => {
    element.fontStyle = element.fontStyle === "italic" ? "normal" : "italic";
    render();
  });
  
  // Alignment
  const alignLeft = document.createElement("button");
  alignLeft.innerHTML = "⫷";
  alignLeft.title = "Aligner à gauche";
  alignLeft.className = element.textAlign === "left" ? "active" : "";
  alignLeft.addEventListener("click", () => {
    element.textAlign = "left";
    render();
  });
  
  const alignCenter = document.createElement("button");
  alignCenter.innerHTML = "≡";
  alignCenter.title = "Centrer";
  alignCenter.className = element.textAlign === "center" ? "active" : "";
  alignCenter.addEventListener("click", () => {
    element.textAlign = "center";
    render();
  });
  
  const alignRight = document.createElement("button");
  alignRight.innerHTML = "⫸";
  alignRight.title = "Aligner à droite";
  alignRight.className = element.textAlign === "right" ? "active" : "";
  alignRight.addEventListener("click", () => {
    element.textAlign = "right";
    render();
  });
  
  toolbar.appendChild(colorInput);
  toolbar.appendChild(fontSelect);
  toolbar.appendChild(sizeInput);
  toolbar.appendChild(document.createElement("div")).className = "divider";
  toolbar.appendChild(boldBtn);
  toolbar.appendChild(italicBtn);
  toolbar.appendChild(document.createElement("div")).className = "divider";
  toolbar.appendChild(alignLeft);
  toolbar.appendChild(alignCenter);
  toolbar.appendChild(alignRight);
  
  return toolbar;
}
window.addEventListener("unhandledrejection", (e) => {
  console.warn("Unhandled promise rejection:", e.reason);
});

function createTableControls(element) {
  const controls = document.createElement("div");
  controls.className = "table-controls";
  controls.addEventListener("mousedown", (ev) => ev.stopPropagation());
  controls.addEventListener("click", (ev) => ev.stopPropagation());
  
  // Add row button
  const addRowBtn = document.createElement("button");
  addRowBtn.innerHTML = "+ Ligne";
  addRowBtn.title = "Ajouter une ligne";
  addRowBtn.addEventListener("click", () => {
    element.rows = (element.rows || 3) + 1;
    if (!element.data) element.data = [];
    element.data.push(Array(element.cols || 3).fill(""));
    render();
  });
  
  // Remove row button
  const removeRowBtn = document.createElement("button");
  removeRowBtn.innerHTML = "- Ligne";
  removeRowBtn.title = "Supprimer une ligne";
  removeRowBtn.addEventListener("click", () => {
    if ((element.rows || 3) > 2) {
      element.rows = (element.rows || 3) - 1;
      if (element.data) element.data.pop();
      render();
    }
  });
  
  // Add column button
  const addColBtn = document.createElement("button");
  addColBtn.innerHTML = "+ Colonne";
  addColBtn.title = "Ajouter une colonne";
  addColBtn.addEventListener("click", () => {
    element.cols = (element.cols || 3) + 1;
    if (!element.data) element.data = Array(element.rows || 3).fill(null).map(() => Array(element.cols).fill(""));
    else element.data.forEach(row => row.push(""));
    render();
  });
  
  // Remove column button
  const removeColBtn = document.createElement("button");
  removeColBtn.innerHTML = "- Colonne";
  removeColBtn.title = "Supprimer une colonne";
  removeColBtn.addEventListener("click", () => {
    if ((element.cols || 3) > 2) {
      element.cols = (element.cols || 3) - 1;
      if (element.data) element.data.forEach(row => row.pop());
      render();
    }
  });
  
  // Border color
  const borderGroup = document.createElement("div");
  borderGroup.className = "control-group";
  
  const borderLabel = document.createElement("label");
  borderLabel.textContent = "Bordure:";
  
  const borderColor = document.createElement("input");
  borderColor.type = "color";
  borderColor.value = element.borderColor || "#cccccc";
  borderColor.addEventListener("input", (e) => {
    element.borderColor = e.target.value;
    render();
  });
  
  borderGroup.appendChild(borderLabel);
  borderGroup.appendChild(borderColor);
  
  // Header color
  const headerGroup = document.createElement("div");
  headerGroup.className = "control-group";
  
  const headerLabel = document.createElement("label");
  headerLabel.textContent = "En-tête:";
  
  const headerColor = document.createElement("input");
  headerColor.type = "color";
  headerColor.value = element.headerColor || "#f3f4f6";
  headerColor.addEventListener("input", (e) => {
    element.headerColor = e.target.value;
    render();
  });
  
  headerGroup.appendChild(headerLabel);
  headerGroup.appendChild(headerColor);
  
  controls.appendChild(addRowBtn);
  controls.appendChild(removeRowBtn);
  controls.appendChild(addColBtn);
  controls.appendChild(removeColBtn);
  controls.appendChild(borderGroup);
  controls.appendChild(headerGroup);
  
  return controls;
}

function createShapeControls(element) {
  const controls = document.createElement("div");
  controls.className = "shape-controls";
  controls.addEventListener("mousedown", (ev) => ev.stopPropagation());
  controls.addEventListener("click", (ev) => ev.stopPropagation());
  
  
  // Shape type selector
  const shapeGroup = document.createElement("div");
  shapeGroup.className = "control-group";
  
  const shapeLabel = document.createElement("label");
  shapeLabel.textContent = "Forme:";
  
  const shapeSelect = document.createElement("select");
  shapeSelect.innerHTML = `
    <option value="rectangle" ${element.shapeType === "rectangle" ? "selected" : ""}>Rectangle</option>
    <option value="circle" ${element.shapeType === "circle" ? "selected" : ""}>Cercle</option>
    <option value="triangle" ${element.shapeType === "triangle" ? "selected" : ""}>Triangle</option>
    <option value="star" ${element.shapeType === "star" ? "selected" : ""}>Étoile</option>
    <option value="diamond" ${element.shapeType === "diamond" ? "selected" : ""}>Losange</option>
  `;
  shapeSelect.addEventListener("change", (e) => {
    element.shapeType = e.target.value;
    render();
  });
  
  shapeGroup.appendChild(shapeLabel);
  shapeGroup.appendChild(shapeSelect);
  
  // Fill color
  const fillGroup = document.createElement("div");
  fillGroup.className = "control-group";
  
  const fillLabel = document.createElement("label");
  fillLabel.textContent = "Remplissage:";
  
  const fillColor = document.createElement("input");
  fillColor.type = "color";
  fillColor.value = element.fillColor || "#7c5cff";
  fillColor.addEventListener("input", (e) => {
    element.fillColor = e.target.value;
    render();
  });
  
  fillGroup.appendChild(fillLabel);
  fillGroup.appendChild(fillColor);
  
  // Border color
  const borderGroup = document.createElement("div");
  borderGroup.className = "control-group";
  
  const borderLabel = document.createElement("label");
  borderLabel.textContent = "Bordure:";
  
  const borderColor = document.createElement("input");
  borderColor.type = "color";
  borderColor.value = element.borderColor || "#37d6ff";
  borderColor.addEventListener("input", (e) => {
    element.borderColor = e.target.value;
    render();
  });
  
  borderGroup.appendChild(borderLabel);
  borderGroup.appendChild(borderColor);
  
  // Opacity
  const opacityGroup = document.createElement("div");
  opacityGroup.className = "control-group";
  
  const opacityLabel = document.createElement("label");
  opacityLabel.textContent = "Opacité:";
  
  const opacityValue = document.createElement("span");
  opacityValue.className = "opacity-value";
  opacityValue.textContent = Math.round((element.opacity !== undefined ? element.opacity : 1) * 100) + "%";
  
  const opacitySlider = document.createElement("input");
  opacitySlider.type = "range";
  opacitySlider.min = 0;
  opacitySlider.max = 1;
  opacitySlider.step = 0.01;
  opacitySlider.value = element.opacity !== undefined ? element.opacity : 1;
  opacitySlider.addEventListener("input", (e) => {
    element.opacity = parseFloat(e.target.value);
    opacityValue.textContent = Math.round(e.target.value * 100) + "%";
    render();
  });
  
  opacityGroup.appendChild(opacityLabel);
  opacityGroup.appendChild(opacitySlider);
  opacityGroup.appendChild(opacityValue);
  
  controls.appendChild(shapeGroup);
  controls.appendChild(fillGroup);
  controls.appendChild(borderGroup);
  controls.appendChild(opacityGroup);
  
  return controls;
}

// =====================================================
//  DRAG & DROP - AJOUTER ÉLÉMENTS
// =====================================================
document.querySelectorAll(".tool").forEach(tool => {
  tool.addEventListener("dragstart", (ev) => {
    ev.dataTransfer.setData("text/plain", tool.dataset.tool);
    ev.dataTransfer.effectAllowed = "copy";
  });
});

slideEl.addEventListener("dragover", (ev)=>{
  ev.preventDefault();
  slideEl.classList.add("dragover");
  ev.dataTransfer.dropEffect = "copy";
});

slideEl.addEventListener("dragleave", ()=>{
  slideEl.classList.remove("dragover");
});

slideEl.addEventListener("drop", (ev)=>{
  ev.preventDefault();
  slideEl.classList.remove("dragover");

  const toolType = ev.dataTransfer.getData("text/plain");
  if (!toolType) return;

  const rect = slideEl.getBoundingClientRect();
  const z = getZoom();
  const x = (ev.clientX - rect.left) / z;
  const y = (ev.clientY - rect.top) / z;

  addFromTool(toolType, x, y);
  render();
});

function addFromTool(toolType, x, y){
  const s = getActive();

  const base = {
    id: cryptoId(),
    x: clamp(x - 80, 0, 960-40),
    y: clamp(y - 20, 0, 540-40),
    w: 260,
    h: 60,
  };

  let el = null;

  if (toolType === "text"){
    el = { ...base, type:"text", w: 520, h: 70, html:"Nouveau texte", color: "#111827", fontSize: 28, fontWeight: 800, fontFamily: "Arial", textAlign: "left" };
  } else if (toolType === "shape"){
    el = { ...base, type:"shape", w: 320, h: 180, shapeType: "rectangle", fillColor: "#7c5cff", borderColor: "#37d6ff", opacity: 1 };
  } else if (toolType === "button"){
    el = { ...base, type:"button", w: 220, h: 54, html:"Bouton", color: "#ffffff", fontSize: 16, fontWeight: 700, fontFamily: "Arial", textAlign: "center" };
  } else if (toolType === "image"){
    el = { ...base, type:"image", w: 360, h: 240 };
  } else if (toolType === "table"){
    el = { ...base, type:"table", w: 400, h: 200, rows: 3, cols: 3, borderColor: "#cccccc", headerColor: "#f3f4f6" };
  } else if (toolType === "twoCols"){
    s.elements.push({ id: cryptoId(), type:"text", x: clamp(x-360,0,820), y: clamp(y-140,0,460), w: 420, h: 60, html:"Titre (2 colonnes)", color: "#111827", fontSize: 28, fontWeight: 800, fontFamily: "Arial", textAlign: "left" });
    s.elements.push({ id: cryptoId(), type:"text", x: clamp(x-360,0,820), y: clamp(y-70,0,470), w: 420, h: 120, html:"Texte descriptif…", color: "#111827", fontSize: 18, fontWeight: 400, fontFamily: "Arial", textAlign: "left" });
    s.elements.push({ id: cryptoId(), type:"image", x: clamp(x+80,0,600), y: clamp(y-140,0,300), w: 320, h: 240 });
    return;
  } else if (toolType === "titleSubtitle"){
    s.elements.push({ id: cryptoId(), type:"text", x: clamp(x-320,0,600), y: clamp(y-120,0,460), w: 700, h: 70, html:"Titre", color: "#111827", fontSize: 36, fontWeight: 800, fontFamily: "Arial", textAlign: "left" });
    s.elements.push({ id: cryptoId(), type:"text", x: clamp(x-320,0,600), y: clamp(y-40,0,490), w: 700, h: 60, html:"Sous-titre", color: "#111827", fontSize: 24, fontWeight: 400, fontFamily: "Arial", textAlign: "left" });
    return;
  }

  if (el){
    s.elements.push(el);
    selectedId = el.id;
  }
}

// =====================================================
//  DÉPLACEMENT D'ÉLÉMENTS
// =====================================================
let move = null;

function startMove(ev, id){
  const target = ev.target.closest(".el");
  if (!target) return;

  // IMPORTANT: si on clique dans un bandeau, on ne drag pas
  if (ev.target.closest(".text-toolbar") || ev.target.closest(".shape-controls") || ev.target.closest(".table-controls")) {
    return;
  }

  if (ev.target.classList.contains("handle")) return;

  const isEditable = (target.classList.contains("text") || target.classList.contains("button"));
  const isTableCell = (ev.target.tagName === "TD" || ev.target.tagName === "TH");
  
  if (isEditable && document.activeElement === target && window.getSelection()?.type === "Range") {
    return;
  }
  
  // Don't drag when editing table cells
  if (isTableCell && document.activeElement === ev.target) {
    return;
  }

  select(id);

  const z = getZoom();
  const s = getActive();
  const el = s.elements.find(e => e.id === id);
  if (!el) return;

  const startX = ev.clientX;
  const startY = ev.clientY;

  move = {
    id,
    startX, startY,
    origX: el.x, origY: el.y,
    zoom: z
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", endMove, { once:true });
}

function onMove(ev){
  if (!move) return;
  const s = getActive();
  const el = s.elements.find(e => e.id === move.id);
  if (!el) return;

  const dx = (ev.clientX - move.startX) / move.zoom;
  const dy = (ev.clientY - move.startY) / move.zoom;

  el.x = clamp(move.origX + dx, 0, 960 - 10);
  el.y = clamp(move.origY + dy, 0, 540 - 10);
  render();
}

function endMove(){
  window.removeEventListener("mousemove", onMove);
  move = null;
}

// =====================================================
//  REDIMENSIONNEMENT D'ÉLÉMENTS
// =====================================================
let resize = null;

function startResize(ev, id, handle){
  ev.stopPropagation();
  ev.preventDefault();
  select(id);

  const z = getZoom();
  const s = getActive();
  const el = s.elements.find(e => e.id === id);
  if (!el) return;

  resize = {
    id, handle,
    startX: ev.clientX,
    startY: ev.clientY,
    origX: el.x, origY: el.y, origW: el.w || 240, origH: el.h || 54,
    zoom: z
  };

  window.addEventListener("mousemove", onResize);
  window.addEventListener("mouseup", endResize, { once:true });
}

function onResize(ev){
  if (!resize) return;
  const s = getActive();
  const el = s.elements.find(e => e.id === resize.id);
  if (!el) return;

  const dx = (ev.clientX - resize.startX) / resize.zoom;
  const dy = (ev.clientY - resize.startY) / resize.zoom;

  let x = resize.origX, y = resize.origY, w = resize.origW, h = resize.origH;

  if (resize.handle.includes("r")) w = clamp(resize.origW + dx, 40, 960);
  if (resize.handle.includes("l")) { w = clamp(resize.origW - dx, 40, 960); x = resize.origX + dx; }
  if (resize.handle.includes("b")) h = clamp(resize.origH + dy, 30, 540);
  if (resize.handle.includes("t")) { h = clamp(resize.origH - dy, 30, 540); y = resize.origY + dy; }

  x = clamp(x, 0, 960 - 20);
  y = clamp(y, 0, 540 - 20);

  el.x = x; el.y = y; el.w = w; el.h = h;
  render();
}

function endResize(){
  window.removeEventListener("mousemove", onResize);
  resize = null;
}

// =====================================================
//  ACTIONS UI - SUPPRESSION, SÉLECTION, CLAVIER
// =====================================================
slideEl.addEventListener("mousedown", (ev)=>{
  if (ev.target === slideEl || ev.target.classList.contains("drop-hint")){
    clearSelection();
  }
});

document.getElementById("deleteBtn").addEventListener("click", deleteSelected);
window.addEventListener("keydown", (ev)=>{
  if (ev.key === "Delete" || ev.key === "Backspace"){
    const a = document.activeElement;
    if (a && (a.classList?.contains("text") || a.classList?.contains("button"))) return;
    deleteSelected();
  }
  if ((ev.ctrlKey || ev.metaKey) && (ev.key === "+" || ev.key === "=")){ ev.preventDefault(); setZoom(getZoom()+0.1); }
  if ((ev.ctrlKey || ev.metaKey) && (ev.key === "-" )){ ev.preventDefault(); setZoom(getZoom()-0.1); }
  if ((ev.ctrlKey || ev.metaKey) && (ev.key === "0" )){ ev.preventDefault(); setZoom(1); }
});

function deleteSelected(){
  if (!selectedId) return;
  const s = getActive();
  s.elements = s.elements.filter(e => e.id !== selectedId);
  selectedId = null;
  render();
}

// =====================================================
//  BACKGROUND CONTROLS
// =====================================================
document.getElementById("bgColorPicker").addEventListener("input", (ev) => {
  const s = getActive();
  s.backgroundColor = ev.target.value;
  s.backgroundGradient = "";
  render();
});


/* =========================
   RESIZABLE BOTTOM BAR
========================== */
const resizerY = document.getElementById("resizerY");

if (resizerY) {
  resizerY.addEventListener("mousedown", initDragBottom);
}

function initDragBottom(e) {
  e.preventDefault();
  window.addEventListener("mousemove", doDragBottom);
  window.addEventListener("mouseup", stopDragBottom);
  resizerY.classList.add("resizing");
  document.body.style.cursor = "ns-resize";
}

function doDragBottom(e) {
  const availableH = window.innerHeight;
  let newH = availableH - e.clientY - 14;
  
  // Limits to prevent breaking the layout
  const minH = 50; // Minimum height for bottom bar
  const maxH = availableH * 0.6; // Maximum 60% of screen height

  if (newH < minH) newH = minH;
  if (newH > maxH) newH = maxH;

  document.documentElement.style.setProperty('--bottom-h', Math.round(newH) + "px");
}

function stopDragBottom() {
  window.removeEventListener("mousemove", doDragBottom);
  window.removeEventListener("mouseup", stopDragBottom);
  resizerY.classList.remove("resizing");
  document.body.style.cursor = "";
}

/* =========================
   RESIZABLE side BAR
========================== */
const resizerX = document.getElementById("resizerX");

if (resizerX) {
  resizerX.addEventListener("mousedown", initDragSide);
}

let dragStartX = 0;
let dragStartWidth = 0;

function initDragSide(e) {
  e.preventDefault();
  dragStartX = e.clientX;
  dragStartWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w'));
  window.addEventListener("mousemove", doDragSide);
  window.addEventListener("mouseup", stopDragSide);
  resizerX.classList.add("resizing");
  // Force cursor globally during drag to prevent flickering
  document.body.style.cursor = "ew-resize";
}

function doDragSide(e) {
  // Calculate the change in mouse position
  const dx = e.clientX - dragStartX;
  let newW = dragStartWidth + dx;
  
  // Limits to prevent breaking the layout
  const minW = 155; // Minimum width for sidebar
  const maxW = window.innerWidth * 0.5; // Maximum 50% of screen width

  if (newW < minW) newW = minW;
  if (newW > maxW) newW = maxW;

  // Update the CSS variable. The CSS Grid will automatically adjust the right part (1fr).
  document.documentElement.style.setProperty('--sidebar-w', Math.round(newW) + "px");
}

function stopDragSide() {
  window.removeEventListener("mousemove", doDragSide);
  window.removeEventListener("mouseup", stopDragSide);
  resizerX.classList.remove("resizing");
  document.body.style.cursor = "";
}
const btnArbre = document.getElementById("btnArbre");

if (btnArbre) {
  btnArbre.addEventListener("click", () => {
    const target = "src/html/arbre.html";
    window.location.href = `${import.meta.env.BASE_URL}${target}`;
  });
}


render();
setZoom(1);

// =====================================================
//  IMPORTS DES MODULES DÉPENDANTS
// =====================================================
import './imporExport.js';
import './present.js';
import './slides.js';

import { initContextMenu } from './contextMenu.js';

initContextMenu(slideEl);