// =====================================================
//  DONNÉES ET CONFIGURATION
// =====================================================

export const state = {
  activeSlide: 0,
  slides: [
    { id: cryptoId(), elements: [
      { id: cryptoId(), type:"text", x:90, y:80, w:520, h:70, html:"Titre de la slide" },
      { id: cryptoId(), type:"shape", x:90, y:190, w:420, h:160 },
      { id: cryptoId(), type:"button", x:90, y:380, w:220, h:50, html:"Clique ici" },
    ]}
  ]
};

// =====================================================
//  SAUVEGARDE/CHARGEMENT (localStorage)
// =====================================================

export function saveState() {
  try {
    localStorage.setItem('slides_state', JSON.stringify(state));
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

export function cryptoId(){
  return (crypto?.randomUUID?.() || ("id_" + Math.random().toString(16).slice(2)));
}

function clamp(n, a, b){ 
  return Math.max(a, Math.min(b, n)); 
}

export function getActive(){
  return state.slides[state.activeSlide];
}

function px(n){ 
  return Math.round(n) + "px"; 
}

function clearSelection(){
  selectedId = null;
  render();
}

function select(id){
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
// Charger l'état sauvegardé si disponible
loadState();
export function render(){
  // Render slide elements
  slideEl.querySelectorAll(".el").forEach(n => n.remove());
  const s = getActive();

  s.elements.forEach(e => {
    const node = document.createElement("div");
    node.className = "el " + e.type + (e.id === selectedId ? " selected" : "");
    node.dataset.id = e.id;
    node.style.left = px(e.x);
    node.style.top  = px(e.y);

    if (e.type === "shape" || e.type === "image"){
      node.style.width  = px(e.w);
      node.style.height = px(e.h);
    } else {
      node.style.width  = px(e.w || 240);
      node.style.height = px(e.h || 54);
    }

    if (e.type === "text"){
      node.contentEditable = "true";
      node.spellcheck = false;
      node.innerHTML = e.html || "Texte";
    }

    if (e.type === "button"){
      node.contentEditable = "true";
      node.spellcheck = false;
      node.innerHTML = e.html || "Bouton";
    }

    if (e.type === "image"){
      // if (e.imageData){
      //   // afficher l'image réelle
      //   node.innerHTML = `<img src="${e.imageData}" style="width:100%;height:100%;object-fit:cntain;">`;
      // } else{
      //   // afficher le placeholder
      //   node.innerHTML = `<div style="padding:12px;text-align:center;line-height:1.2;cursor:pointer;width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;">
      //     <span style="font-size:24px;margin-bottom:8px;">📸</span>
      //     <span style="font-size:13px;font-weight:600;color:#007bff">Dépose une image</span>
      //     <span style="font-size:11px;color:#999;margin-top:4px">ou clique pour parcourir</span>
      //   </div>`;
      // }

      // We wrap the content in a wrapper to handle 'overflow:hidden' and 'border-radius'
      // while allowing the handles (children of 'node') to sit outside visible area.
      const wrapper = document.createElement('div');
      wrapper.className = "el-img-wrapper";
      
      let innerContent = "";
      if (e.imageData){
        // Changed object-fit to contain to fit image without cropping
        innerContent = `<img src="${e.imageData}" style="width:100%;height:100%;object-fit:contain;">`;
      } else{
        // Placeholder
        innerContent = `<div style="padding:12px;text-align:center;line-height:1.2;width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;">
          <span style="font-size:24px;margin-bottom:8px;">📸</span>
          <span style="font-size:13px;font-weight:600;color:#007bff">Dépose ou double-clique</span>
        </div>`;
      }
      wrapper.innerHTML = innerContent;
      node.appendChild(wrapper);

      // autoriser le drag & drop d'images
      node.style.cursor = "pointer";
      
      node.addEventListener("dragover", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        node.style.opacity = "0.7";
        node.style.background = "rgba(0,123,255,0.1)";
      });
      
      node.addEventListener("dragleave", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        node.style.opacity = "1";
        node.style.background = "";
      });
      
      node.addEventListener("drop", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        node.style.opacity = "1";
        node.style.background = "";
        
        const files = ev.dataTransfer.files;
        if (files.length > 0) {
          const file = files[0];
          if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (event) => {
              e.imageData = event.target.result;
              render();
            };
            reader.readAsDataURL(file);
          }
        }
      });

      // 2. Double Click to Upload
      node.addEventListener("dblclick", (ev) => {
        ev.stopPropagation(); // prevent other dblclick handlers
        
        // Create a temporary file input
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (file && file.type.startsWith("image/")) {
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
    }

    // handles
    ["tl","tr","bl","br"].forEach(pos=>{
      const h = document.createElement("div");
      h.className = "handle h-" + pos;
      h.dataset.handle = pos;
      node.appendChild(h);
    });

    // select
    node.addEventListener("mousedown", (ev)=>{
      // si on clique une poignée -> géré par resize
      if (ev.target.classList.contains("handle")) return;
      select(e.id);
    });

    // drag move element
    node.addEventListener("mousedown", (ev)=> startMove(ev, e.id));

    slideEl.appendChild(node);
  });

  // thumbs
  thumbsEl.innerHTML = "";
  state.slides.forEach((sl, i) => {
    const t = document.createElement("div");
    t.className = "thumb" + (i === state.activeSlide ? " active" : "");
    t.innerHTML = `
      <div class="mini"></div>
      <div class="label">
        <span>Slide ${i+1}</span>
        <span style="color:rgba(255,255,255,.55)">${sl.elements.length} obj.</span>
      </div>
    `;
    t.addEventListener("click", ()=> {
      state.activeSlide = i;
      selectedId = null;
      render();
    });
    thumbsEl.appendChild(t);

    // render thumbnail preview
    const miniDiv = t.querySelector('.mini');
    const scale = 0.12; // scale factor for thumbnail
    
    sl.elements.forEach(e => {
      const node = document.createElement("div");
      node.className = "el " + e.type;
      node.style.left = px(e.x * scale);
      node.style.top = px(e.y * scale);
      node.style.pointerEvents = "none";
      node.style.opacity = "0.8";

      if (e.type === "shape" || e.type === "image"){
        node.style.width = px(e.w * scale);
        node.style.height = px(e.h * scale);
      } else {
        node.style.width = px((e.w || 240) * scale);
        node.style.height = px((e.h || 54) * scale);
      }

      if (e.type === "text"){
        node.innerHTML = e.html || "Texte";
        node.style.fontSize = "8px";
        node.style.overflow = "hidden";
      } else if (e.type === "button"){
        node.innerHTML = e.html || "Bouton";
        node.style.fontSize = "8px";
        node.style.overflow = "hidden";
      } else if (e.type === "image"){
        if (e.imageData) {
          node.innerHTML = `<img src="${e.imageData}" style="width:100%;height:100%;object-fit:contain;">`;
        } else {
          node.innerHTML = `<div style="font-size:6px;padding:2px;">📸</div>`;
        }
      }

      miniDiv.appendChild(node);
    });
  });

  // attach resize listeners after nodes exist
  slideEl.querySelectorAll(".el.selected .handle").forEach(h=>{
    h.addEventListener("mousedown", (ev)=> startResize(ev, h.closest(".el")?.dataset?.id, h.dataset.handle));
  });

  // update zoom indicator
  const z = getZoom();
  zoomChip.textContent = `Zoom: ${Math.round(z*100)}%`;
  // auto-save
  saveState();
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

  // position relative to slide (account for zoom)
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
    el = { ...base, type:"text", w: 520, h: 70, html:"Nouveau texte" };
  } else if (toolType === "shape"){
    el = { ...base, type:"shape", w: 320, h: 180 };
  } else if (toolType === "button"){
    el = { ...base, type:"button", w: 220, h: 54, html:"Bouton" };
  } else if (toolType === "image"){
    el = { ...base, type:"image", w: 360, h: 240 };
  } else if (toolType === "twoCols"){
    s.elements.push({ id: cryptoId(), type:"text", x: clamp(x-360,0,820), y: clamp(y-140,0,460), w: 420, h: 60, html:"Titre (2 colonnes)" });
    s.elements.push({ id: cryptoId(), type:"text", x: clamp(x-360,0,820), y: clamp(y-70,0,470), w: 420, h: 120, html:"Texte descriptif…" });
    s.elements.push({ id: cryptoId(), type:"image", x: clamp(x+80,0,600), y: clamp(y-140,0,300), w: 320, h: 240 });
    return;
  } else if (toolType === "titleSubtitle"){
    s.elements.push({ id: cryptoId(), type:"text", x: clamp(x-320,0,600), y: clamp(y-120,0,460), w: 700, h: 70, html:"Titre" });
    s.elements.push({ id: cryptoId(), type:"text", x: clamp(x-320,0,600), y: clamp(y-40,0,490), w: 700, h: 60, html:"Sous-titre" });
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
  if (ev.target.classList.contains("handle")) return;

  // évite de déplacer pendant l'édition de texte si on sélectionne un curseur
  const isEditable = (target.classList.contains("text") || target.classList.contains("button"));
  if (isEditable && document.activeElement === target && window.getSelection()?.type === "Range") {
    // user is selecting text
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

  // handles: tl,tr,bl,br
  if (resize.handle.includes("r")) w = clamp(resize.origW + dx, 40, 960);
  if (resize.handle.includes("l")) { w = clamp(resize.origW - dx, 40, 960); x = resize.origX + dx; }
  if (resize.handle.includes("b")) h = clamp(resize.origH + dy, 30, 540);
  if (resize.handle.includes("t")) { h = clamp(resize.origH - dy, 30, 540); y = resize.origY + dy; }

  // clamp to slide bounds
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
// click outside to unselect
slideEl.addEventListener("mousedown", (ev)=>{
  if (ev.target === slideEl || ev.target.classList.contains("drop-hint")){
    clearSelection();
  }
});

// delete selected
document.getElementById("deleteBtn").addEventListener("click", deleteSelected);
window.addEventListener("keydown", (ev)=>{
  if (ev.key === "Delete" || ev.key === "Backspace"){
    // ne pas supprimer si on écrit dans un editable
    const a = document.activeElement;
    if (a && (a.classList?.contains("text") || a.classList?.contains("button"))) return;
    deleteSelected();
  }
  // zoom shortcuts
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
  // Force cursor globally during drag to prevent flickering
  document.body.style.cursor = "ns-resize";
}

function doDragBottom(e) {
  // Calculate available height from bottom of screen
  // Window Height - Mouse Y Position - App Bottom Padding (14px)
  const availableH = window.innerHeight;
  let newH = availableH - e.clientY - 14;
  
  // Limits to prevent breaking the layout
  const minH = 50; // Minimum height for bottom bar
  const maxH = availableH * 0.6; // Maximum 60% of screen height

  if (newH < minH) newH = minH;
  if (newH > maxH) newH = maxH;

  // Update the CSS variable. The CSS Grid will automatically adjust the top part (1fr).
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



render();
setZoom(1);

// =====================================================
//  IMPORTS DES MODULES DÉPENDANTS (après initialisation)
// =====================================================
import './imporExport.js';
import './present.js';
import './slides.js';

import { initContextMenu } from './contextMenu.js';

initContextMenu(slideEl);

