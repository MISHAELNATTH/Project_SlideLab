// =====================================================
//  IMPORTS (TOUJOURS EN HAUT)
// =====================================================
import { loadProjectFromLocal, saveProjectToLocal } from "./storage.js";
import "./imporExport.js";
import "./present.js";
import "./slides.js";
import { initContextMenu } from "./contextMenu.js";

// =====================================================
//  HELPERS (AVANT state)
// =====================================================
export function cryptoId() {
  return (crypto?.randomUUID?.() || ("id_" + Math.random().toString(16).slice(2)));
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function px(n) {
  return Math.round(n) + "px";
}

// =====================================================
//  DOM (AVANT render / AVANT init)
// =====================================================
export const slideEl  = document.getElementById("slide");
export const thumbsEl = document.getElementById("thumbs");
export const searchEl = document.getElementById("toolSearch");
export const zoomChip = document.getElementById("zoomChip");

// =====================================================
//  STATE (après cryptoId)
// =====================================================
export const state = {
  activeSlide: 0,
  slides: [
    {
      id: cryptoId(),
      elements: [
        { id: cryptoId(), type:"text",   x:90, y:80,  w:520, h:70,  html:"Titre de la slide" },
        { id: cryptoId(), type:"shape",  x:90, y:190, w:420, h:160 },
        { id: cryptoId(), type:"button", x:90, y:380, w:220, h:50,  html:"Clique ici" },
      ]
    }
  ]
};

// =====================================================
//  SELECTION
// =====================================================
export let selectedId = null;
export function setSelectedId(id) { selectedId = id; }
export function getSelectedId() { return selectedId; }

// =====================================================
//  SLIDE HELPERS
// =====================================================
export function getActive() {
  return state.slides[state.activeSlide];
}

// =====================================================
//  ZOOM
// =====================================================
export function getZoom() {
  const m = slideEl?.style?.transform?.match(/scale\(([\d.]+)\)/);
  return m ? parseFloat(m[1]) : 1;
}

export function setZoom(z) {
  z = clamp(z, 0.35, 2);
  // "center top" (pas "middle top")
  slideEl.style.transformOrigin = "center top";
  slideEl.style.transform = `scale(${z})`;
  if (zoomChip) zoomChip.textContent = `Zoom: ${Math.round(z * 100)}%`;
}

// =====================================================
//  PERSISTENCE (UNIFIÉE: storage.js)
// =====================================================
export function saveState() {
  try {
    saveProjectToLocal(state);
    console.log("✓ État sauvegardé (localStorage)");
  } catch (e) {
    console.error("Erreur lors de la sauvegarde:", e);
  }
}

export function loadState() {
  try {
    const saved = loadProjectFromLocal();
    if (!saved) return false;

    state.slides = saved.slides ?? state.slides;
    state.activeSlide = saved.activeSlide ?? 0;

    console.log("✓ État restauré (localStorage)");
    return true;
  } catch (e) {
    console.error("Erreur lors du chargement:", e);
    return false;
  }
}

// =====================================================
//  RENDER (NE DOIT PAS ÊTRE APPELÉ AVANT slideEl)
// =====================================================
export function render() {
  if (!slideEl || !thumbsEl) return;

  // Render slide elements
  slideEl.querySelectorAll(".el").forEach(n => n.remove());
  const s = getActive();

  s.elements.forEach(e => {
    const node = document.createElement("div");
    node.className = "el " + e.type + (e.id === selectedId ? " selected" : "");
    node.dataset.id = e.id;
    node.style.left = px(e.x);
    node.style.top  = px(e.y);

    if (e.type === "shape" || e.type === "image") {
      node.style.width  = px(e.w);
      node.style.height = px(e.h);
    } else {
      node.style.width  = px(e.w || 240);
      node.style.height = px(e.h || 54);
    }

    if (e.type === "text" || e.type === "button") {
      node.contentEditable = "true";
      node.spellcheck = false;
      node.innerHTML = e.html || (e.type === "text" ? "Texte" : "Bouton");
    }

    if (e.type === "image") {
      if (e.imageData) {
        node.innerHTML = `<img src="${e.imageData}" style="width:100%;height:100%;object-fit:cover;">`;
      } else {
        node.innerHTML = `<div style="padding:12px;text-align:center;line-height:1.2;cursor:pointer;width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;">
          <span style="font-size:24px;margin-bottom:8px;">📸</span>
          <span style="font-size:13px;font-weight:600;color:#007bff">Dépose une image</span>
          <span style="font-size:11px;color:#999;margin-top:4px">ou clique pour parcourir</span>
        </div>`;
      }
      node.style.cursor = "pointer";

      node.addEventListener("dragover", (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        node.style.opacity = "0.7";
        node.style.background = "rgba(0,123,255,0.1)";
      });
      node.addEventListener("dragleave", (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        node.style.opacity = "1";
        node.style.background = "";
      });
      node.addEventListener("drop", (ev) => {
        ev.preventDefault(); ev.stopPropagation();
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
      if (ev.target.classList.contains("handle")) return;
      selectedId = e.id;
      render();
    });

    // IMPORTANT: startMove doit exister plus bas dans ton fichier (tu le gardes)
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

    // thumbnail preview
    const miniDiv = t.querySelector(".mini");
    const scale = 0.12;

    sl.elements.forEach(e => {
      const node = document.createElement("div");
      node.className = "el " + e.type;
      node.style.left = px(e.x * scale);
      node.style.top  = px(e.y * scale);
      node.style.pointerEvents = "none";
      node.style.opacity = "0.8";

      if (e.type === "shape" || e.type === "image") {
        node.style.width  = px(e.w * scale);
        node.style.height = px(e.h * scale);
      } else {
        node.style.width  = px((e.w || 240) * scale);
        node.style.height = px((e.h || 54) * scale);
      }

      if (e.type === "text" || e.type === "button") {
        node.innerHTML = e.html || (e.type === "text" ? "Texte" : "Bouton");
        node.style.fontSize = "8px";
        node.style.overflow = "hidden";
      } else if (e.type === "image") {
        node.innerHTML = e.imageData
          ? `<img src="${e.imageData}" style="width:100%;height:100%;object-fit:cover;">`
          : `<div style="font-size:6px;padding:2px;">📸</div>`;
      }

      miniDiv.appendChild(node);
    });
  });

  // update zoom indicator
  const z = getZoom();
  if (zoomChip) zoomChip.textContent = `Zoom: ${Math.round(z*100)}%`;

  // auto-save
  saveState();
}

// =====================================================
//  INITIALISATION (APRES TOUT)
// =====================================================
function init() {
  // 1) Charge projet sauvegardé (si dispo)
  loadState();

  // 2) Render
  render();
  setZoom(1);

  // 3) Context menu
  initContextMenu();
}

init();
