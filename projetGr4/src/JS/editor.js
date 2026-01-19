// region données initiales et helpers

/* =========================
       Données
    ========================== */
const state = {
  activeSlide: 0,
  slides: [
    { id: cryptoId(), elements: [
      // un petit contenu de départ
      { id: cryptoId(), type:"text", x:90, y:80, w:520, h:70, html:"Titre de la slide" },
      { id: cryptoId(), type:"shape", x:90, y:190, w:420, h:160 },
      { id: cryptoId(), type:"button", x:90, y:380, w:220, h:50, html:"Clique ici" },
    ]}
  ]

};

const slideEl   = document.getElementById("slide");
const thumbsEl  = document.getElementById("thumbs");
const searchEl  = document.getElementById("toolSearch");
const zoomChip  = document.getElementById("zoomChip");

let selectedId = null;

/* =========================
    Helpers
========================== */
function cryptoId(){
  return (crypto?.randomUUID?.() || ("id_" + Math.random().toString(16).slice(2)));
}

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function getActive(){
  return state.slides[state.activeSlide];
}

function px(n){ return Math.round(n) + "px"; }

function clearSelection(){
  selectedId = null;
  render();
}

function select(id){
  selectedId = id;
  render();
}

function getSelected(){
  const s = getActive();
  return s.elements.find(e => e.id === selectedId) || null;
}
// endregion

// region rendu
/* =========================
    Rendu
========================== */
function render(){
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
      node.innerHTML = `<div style="padding:12px;text-align:center;line-height:1.2">
        IMAGE<br><span style="font-size:12px;font-weight:600;color:#9ca3af">dépose une vraie image plus tard</span>
      </div>`;
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
        node.innerHTML = `<div style="font-size:6px;padding:2px;">IMG</div>`;
      }

      miniDiv.appendChild(node);
    });
  });

  // attach resize listeners after nodes exist
  slideEl.querySelectorAll(".el.selected .handle").forEach(h=>{
    h.addEventListener("mousedown", (ev)=> startResize(ev, h.closest(".el")?.dataset?.id, h.dataset.handle));
  });

  // update zoom indicator based on CSS scale (if any)
  const z = getZoom();
  zoomChip.textContent = `Zoom: ${Math.round(z*100)}%`;
}

function getZoom(){
  const m = slideEl.style.transform.match(/scale\(([\d.]+)\)/);
  return m ? parseFloat(m[1]) : 1;
}

function setZoom(z){
  z = clamp(z, .35, 2);
  slideEl.style.transformOrigin = "top left";
  slideEl.style.transform = `scale(${z})`;
  zoomChip.textContent = `Zoom: ${Math.round(z*100)}%`;
}
// endregion


// region interactions
/* =========================
    Drag & Drop depuis la sidebar
========================== */
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
    // ajoute un mini-layout
    const gid = cryptoId();
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
// endregion

// region déplacement

/* =========================
    Déplacement d'élément
========================== */
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

// endregion


// region redimensionnement

/* =========================
    Resize
========================== */
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

// endregion

// region UI actions

/* =========================
    UI actions
========================== */
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

// parse HTML slide file and extract elements
function parseSlideHTML(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const elements = [];

  const slideElements = doc.querySelectorAll('.slide-element');
  
  slideElements.forEach(el => {
    const style = el.getAttribute('style') || '';
    
    // Extract position and size from inline styles
    const leftMatch = style.match(/left:\s*(\d+)px/);
    const topMatch = style.match(/top:\s*(\d+)px/);
    const widthMatch = style.match(/width:\s*(\d+)px/);
    const heightMatch = style.match(/height:\s*(\d+)px/);
    
    const x = leftMatch ? parseInt(leftMatch[1]) : 0;
    const y = topMatch ? parseInt(topMatch[1]) : 0;
    const w = widthMatch ? parseInt(widthMatch[1]) : 240;
    const h = heightMatch ? parseInt(heightMatch[1]) : 54;
    
    // Determine element type from class
    let type = 'text';
    let html = '';
    
    if (el.classList.contains('text-element')) {
      type = 'text';
      const p = el.querySelector('p');
      html = p ? p.innerHTML : 'Texte';
    } else if (el.classList.contains('button-element')) {
      type = 'button';
      html = el.innerHTML.trim();
    } else if (el.classList.contains('image-element')) {
      type = 'image';
      html = '';
    } else if (el.classList.contains('shape-element')) {
      type = 'shape';
      html = '';
    }
    
    elements.push({
      id: cryptoId(),
      type,
      x,
      y,
      w,
      h,
      html
    });
  });
  
  return elements;
}

// load slides from files
function loadSlidesFromFiles(files) {
  const fileArray = Array.from(files).filter(f => f.name.endsWith('.html'));
  
  if (fileArray.length === 0) {
    alert('No HTML files selected');
    return;
  }
  
  // Sort files by name to load in order
  fileArray.sort((a, b) => a.name.localeCompare(b.name));
  
  let loadedCount = 0;
  
  fileArray.forEach((file, index) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const htmlContent = e.target.result;
        const elements = parseSlideHTML(htmlContent);
        
        // Replace or add slide
        if (index === 0) {
          // First file: replace current slide
          state.slides[state.activeSlide] = {
            id: cryptoId(),
            elements
          };
        } else {
          // Subsequent files: add as new slides
          state.slides.push({
            id: cryptoId(),
            elements
          });
        }
        
        loadedCount++;
        
        // Once all files are loaded, render
        if (loadedCount === fileArray.length) {
          state.activeSlide = 0;
          selectedId = null;
          render();
          thumbsEl.scrollLeft = 0;
          alert(`✓ Loaded ${fileArray.length} slide(s)`);
        }
      } catch (error) {
        console.error('Error parsing file:', file.name, error);
      }
    };
    
    reader.readAsText(file);
  });
}

// open folder button
const fileInput = document.getElementById('fileInput');
document.getElementById('openFolderBtn').addEventListener('click', ()=>{
  fileInput.click();
});

fileInput.addEventListener('change', (ev)=>{
  if (ev.target.files.length > 0) {
    loadSlidesFromFiles(ev.target.files);
    ev.target.value = ''; // reset input
  }
});

// add slide
document.getElementById("addSlideBtn").addEventListener("click", ()=>{
  state.slides.push({ id: cryptoId(), elements: [] });
  state.activeSlide = state.slides.length - 1;
  selectedId = null;
  render();
  thumbsEl.scrollLeft = thumbsEl.scrollWidth;
});

// duplicate slide
document.getElementById("dupSlideBtn").addEventListener("click", ()=>{
  const s = getActive();
  const clone = JSON.parse(JSON.stringify(s));
  clone.id = cryptoId();
  clone.elements.forEach(e => e.id = cryptoId());
  state.slides.splice(state.activeSlide+1, 0, clone);
  state.activeSlide++;
  selectedId = null;
  render();
  thumbsEl.scrollLeft = thumbsEl.scrollWidth;
});

// generate HTML for a slide
function generateSlideHTML(slideIndex) {
  const slide = state.slides[slideIndex];
  const baseCSS = `
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white; }
  .slide-container { position: relative; width: 960px; height: 540px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .slide-element { position: absolute; }
  .text-element, .button-element { display: flex; align-items: center; justify-content: center; }
  .shape-element { border: 2px solid #333; border-radius: 4px; }
  .image-element { border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; background: #f5f5f5; color: #999; }
  .button-element { background: #007bff; color: white; border: none; cursor: pointer; border-radius: 4px; font-weight: 600; }
  .button-element:hover { background: #0056b3; }
  h1, h2, h3, h4, h5, h6 { margin: 0; }
  p { margin: 0; }
</style>
  `;

  let htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Slide ${slideIndex + 1}</title>
${baseCSS}
</head>
<body>
<div class="slide-container">
`;

  slide.elements.forEach(el => {
    const style = `style="left: ${el.x}px; top: ${el.y}px; width: ${el.w || 240}px; height: ${el.h || 54}px;"`;
    
    if (el.type === "text") {
      htmlContent += `    <div class="slide-element text-element" ${style}>\n      <p>${el.html || "Texte"}</p>\n    </div>\n`;
    } else if (el.type === "button") {
      htmlContent += `    <button class="slide-element button-element" ${style}>${el.html || "Bouton"}</button>\n`;
    } else if (el.type === "image") {
      htmlContent += `    <div class="slide-element image-element" ${style}>\n      <img src="" alt="Image placeholder" style="max-width: 100%; max-height: 100%; object-fit: cover;">\n    </div>\n`;
    } else if (el.type === "shape") {
      htmlContent += `    <div class="slide-element shape-element" ${style}></div>\n`;
    }
  });

  htmlContent += `  </div>
</body>
</html>`;

  return htmlContent;
}

// export all slides as HTML files to download
document.getElementById("exportBtn").addEventListener("click", ()=>{
  if (state.slides.length === 1) {
    // Single slide: download directly
    const html = generateSlideHTML(0);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'slide.html';
    a.click();
    URL.revokeObjectURL(url);
  } else {
    // Multiple slides: download each one with slight delay
    state.slides.forEach((slide, index) => {
      const html = generateSlideHTML(index);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `slide-${index + 1}.html`;
      
      setTimeout(() => {
        a.click();
        URL.revokeObjectURL(url);
      }, index * 300);
    });
  }
});

// fit
document.getElementById("fitBtn").addEventListener("click", ()=>{
  // fit slide in workspace width
  const workspace = document.getElementById("workspace");
  const w = workspace.clientWidth - 120; // margins
  const z = clamp(w / 960, .35, 1.2);
  setZoom(z);
});

// tool search
searchEl.addEventListener("input", ()=>{
  const q = searchEl.value.trim().toLowerCase();
  document.querySelectorAll(".tool").forEach(t=>{
    const text = t.innerText.toLowerCase();
    t.style.display = text.includes(q) ? "" : "none";
  });
});

// persist editable content back to state
slideEl.addEventListener("input", (ev)=>{
  const elNode = ev.target.closest(".el");
  if (!elNode) return;
  const id = elNode.dataset.id;
  const s = getActive();
  const e = s.elements.find(x => x.id === id);
  if (!e) return;
  if (e.type === "text" || e.type === "button"){
    e.html = elNode.innerHTML;
  }
});

// basic zoom with trackpad wheel + ctrl
document.getElementById("workspace").addEventListener("wheel", (ev)=>{
  if (!(ev.ctrlKey || ev.metaKey)) return;
  ev.preventDefault();
  const delta = -Math.sign(ev.deltaY) * 0.06;
  setZoom(getZoom() + delta);
}, { passive:false });

// init
render();
setZoom(1);

// endregion UI actions