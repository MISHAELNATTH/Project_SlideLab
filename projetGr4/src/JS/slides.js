import {thumbsEl, state, cryptoId, setSelectedId, render, getActive, slideId, setZoom, getZoom} from "./editor.js";
import { generateExportStyle, getElementClasses, getSlideBackgroundStyle } from './styleHelper.js';

// =====================================================
//  HELPERS (local)
// =====================================================
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function escHtml(s = "") {
  // IMPORTANT: on n’échappe PAS le HTML riche des textes (tu utilises innerHTML)
  // Donc on ne s’en sert que si tu veux sécuriser des endroits précis.
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function normalizeHref(href) {
  if (!href) return null;
  const s = String(href).trim();
  if (!s) return null;
  
  // Externe => on garde tel quel
  if (/^https?:\/\//i.test(s)) return s;
  
  // Nos formats internes possibles
  let m = s.match(/^slide-(\d+)\.html$/i);
  if (m) return s;
  
  m = s.match(/^#slide:(\d+)$/i);
  if (m) return s;
  
  m = s.match(/^#slide-(\d+)$/i);
  if (m) return s;
  
  // Sinon on garde (ex: "page.html" ou autre)
  return s;
}
// =====================================================
//  GESTION DES SLIDES
// =====================================================

// add slide
document.getElementById("addSlideBtn").addEventListener("click", () => {
  state.slides.push({ id: slideId(), elements: [] });
  state.activeSlide = state.slides.length - 1;
  setSelectedId(null);
  render();
  thumbsEl.scrollLeft = thumbsEl.scrollWidth;
});

// duplicate slide
document.getElementById("dupSlideBtn").addEventListener("click", () => {
  const s = getActive();
  const clone = JSON.parse(JSON.stringify(s));
  clone.id = slideId();
  clone.elements.forEach((e) => (e.id = slideId()));
  state.slides.splice(state.activeSlide + 1, 0, clone);
  state.activeSlide++;
  setSelectedId(null);
  render();
  thumbsEl.scrollLeft = thumbsEl.scrollWidth;
});

// =====================================================
//  EXPORT HTML (même rendu que l’app)
// =====================================================

function exportBaseCSS() {
  return `
<style>
  :root{
    --slideW: 960;
    --slideH: 540;
    --scale: 1;
  }

  *{ box-sizing:border-box; }
  html, body{ height:100%; margin:0; }

  /* bandes noires */
  body{
    background:#000;
    overflow:hidden;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  }

  /* scène plein écran */
  .stage{
    position:fixed;
    inset:0;
  }

  /* slide en taille "réelle" 960x540, puis scale */
  .slide{
    width: calc(var(--slideW) * 1px);
    height: calc(var(--slideH) * 1px);
    position:absolute;
    left:50%;
    top:50%;

    transform-origin:center;
    transform: translate(-50%, -50%) scale(var(--scale));

    background:#fff;
    overflow:hidden;
    border-radius:0;
    box-shadow:none;
  }

  /* pas de grille en export */
  .slide::before{ content:none !important; }

  /* --- styles des éléments (inchangés) --- */
  .el{
    position:absolute;
    min-width: 120px;
    min-height: 44px;
    padding:12px 14px;
    border-radius:14px;
    border:1px solid rgba(0,0,0,.10);
    background: rgba(255,255,255,.96);
    box-shadow: 0 10px 25px rgba(0,0,0,.12);
    user-select:none;
  }

  .el.text{
    font-size:28px;
    font-weight:800;
    letter-spacing:-.02em;
    color:#111827;
    background: rgba(255,255,255,.92);
    border-radius: 18px;
    box-shadow: 0 14px 30px rgba(0,0,0,.10);
  }

  .el.shape{
    padding:0;
    border-radius:18px;
    background: linear-gradient(135deg, #7c5cff, #37d6ff);
    border:none;
    box-shadow: 0 14px 30px rgba(0,0,0,.10);
  }

  .el.button{
    border-radius:999px;
    background:#111827;
    color:white;
    font-weight:700;
    font-size:16px;
    padding:12px 18px;
    border:none;
    display:flex;
    align-items:center;
    justify-content:center;
    box-shadow: 0 14px 30px rgba(0,0,0,.12);
  }

  .el.image{
    padding:0;
    border-radius:18px;
    overflow:hidden;
    border:1px solid rgba(0,0,0,.12);
    background:#f3f4f6;
    box-shadow: 0 14px 30px rgba(0,0,0,.10);
  }
  .el.image img{
    width:100%;
    height:100%;
    object-fit:contain;  /* --- newly added to fit the image --- */
    display:block;
  }

  /* Table styles */
  .data-table {
    width: 100%;
    height: 100%;
    border-collapse: collapse;
    font-size: 14px;
    font-family: Arial, sans-serif;
    border-radius: 12px;
    overflow: hidden;
  }

  .data-table th,
  .data-table td {
    border: 1px solid #cccccc;
    padding: 8px 12px;
    text-align: left;
    min-width: 60px;
  }

  .data-table th {
    background: #f3f4f6;
    font-weight: 600;
    color: #111827;
  }

  .data-table td {
    background: #ffffff;
    color: #374151;
  }
</style>
`.trim();
}




export function generateSlideHTML(slideIndex) {
  const slide = state.slides[slideIndex];

  // Get slide background style
  const slideBackgroundStyle = getSlideBackgroundStyle(slide);
  const slideBgAttr = slideBackgroundStyle ? ` style="background: ${slideBackgroundStyle};"` : "";

  // --- META qu’on veut sauvegarder dans le HTML ---
  // Position par défaut 0,0 (comme demandé)
  const meta =
  slide.arbre && typeof slide.arbre === "object"
    ? {
        title:
          typeof slide.arbre.title === "string"
            ? slide.arbre.title
            : null,
        pos:
          slide.arbre.pos &&
          typeof slide.arbre.pos.x === "number" &&
          typeof slide.arbre.pos.y === "number"
            ? { x: slide.arbre.pos.x, y: slide.arbre.pos.y }
            : { x: 0, y: 0 }
      }
    : null;

  let html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${meta.title}</title>
${exportBaseCSS()}
</head>
<body>
  <div class="stage">
    <div class="slide" role="img" aria-label="${meta.title}"${slideBgAttr}> 
    
    
`;

  // helper: convertit une href en "slide target"
  // Ici on supporte: "slide-3.html" OU "#slide:3" OU "#slide-3"
  function hrefToTarget(href) {
    if (!href) return null;

    // cas: #slide:3
    let m = href.match(/^#slide:(\d+)$/i);
    if (m) return { kind: "index", index: parseInt(m[1], 10) - 1 };

    // cas: #slide-3
    m = href.match(/^#slide-(\d+)$/i);
    if (m) return { kind: "index", index: parseInt(m[1], 10) - 1 };

    // cas: slide-3.html
    m = href.match(/slide-(\d+)\.html$/i);
    if (m) return { kind: "file", file: href, index: parseInt(m[1], 10) - 1 };

    return { kind: "href", href };
  }

  for (const el of slide.elements) {
    // [STRATEGY] Generate Style String and Classes
    const cssString = generateExportStyle(el);
    const styleAttr = `style="${cssString}"`;
    const classNames = getElementClasses(el);

    if (el.type === "text") {
      const linkAttr = el.link ? ` data-link="${el.link}"` : "";
      html += `      <div class="${classNames}" data-id="${el.id}"${linkAttr} ${styleAttr}>${el.html || "Texte"}</div>\n`;
    }

    else if (el.type === "button") {

      // IMPORTANT :
      // - on force un data-btn-id stable = el.id
      // - on tente de récupérer un href existant dans el.html
      let hrefFromHtml = null;
      try {
        const tmp = document.createElement("div");
        tmp.innerHTML = el.html || "";
        const a = tmp.querySelector("a[href]");
        if (a) hrefFromHtml = a.getAttribute("href");
      } catch {}

      // 2) Nouveau système: priorité à el.link (ta règle)
      const hrefFinal = normalizeHref(el.link) || hrefFromHtml || null;
      const target = hrefToTarget(hrefFinal);

      // 3) Rendu visuel: PAS besoin de mettre <a> dedans.
      const safeInner = (el.html && el.html.trim()) ? el.html : "Bouton";
      const linkAttr = el.link ? ` data-link="${el.link}"` : "";
      html += `      <div class="${classNames}" data-btn-id="${el.id}" data-id="${el.id}"${linkAttr} ${styleAttr}>${safeInner}</div>\n`;
    }

    //   const inner = `      <div class="el button" data-btn-id="${el.id}" ${style}>${safeInner}</div>\n`;
    //   // hrefFinal est déjà normalisé => wrap direct sans renormaliser
    //   if (hrefFinal) {
    //     html += `<a href="${hrefFinal}" style="text-decoration:none;color:inherit;display:contents;">${inner}</a>`;
    //   } else {
    //     html += inner;
    //   }
    // }

    else if (el.type === "shape") {
      const linkAttr = el.link ? ` data-link="${el.link}"` : "";
      html += `      <div class="${classNames}" data-id="${el.id}"${linkAttr} ${styleAttr}></div>\n`;
    }

    else if (el.type === "image") {
      const linkAttr = el.link ? ` data-link="${el.link}"` : "";
      if (el.imageData) {
         html += `      <div class="${classNames}" data-id="${el.id}"${linkAttr} ${styleAttr}><img src="${el.imageData}" style="width:100%;height:100%;object-fit:contain;display:block;"></div>\n`;
      } else {
         html += `      <div class="${classNames}" data-id="${el.id}"${linkAttr} ${styleAttr}></div>\n`;
      }
    
    } else if (el.type === "table") {

      let tableHtml = `<table class="data-table" style="${el.borderColor ? `--table-border-color:${el.borderColor}` : ''}">`;
      const rows = el.rows || 3;
      const cols = el.cols || 3;
      const data = el.data || Array(rows).fill(null).map(() => Array(cols).fill(""));
      
      for(let i=0; i<rows; i++){
        tableHtml += "<tr>";
        for(let j=0; j<cols; j++){
          const tag = (i===0) ? "th" : "td";
          const bg = (i===0 && el.headerColor) ? `background:${el.headerColor};` : "";
          const bd = (el.borderColor) ? `border-color:${el.borderColor};` : "";
          const txt = data[i]?.[j] || "";
          tableHtml += `<${tag} style="${bg}${bd}">${txt}</${tag}>`;
        }
        tableHtml += "</tr>";
      }
      tableHtml += "</table>";
      
      const linkAttr = el.link ? ` data-link="${el.link}"` : "";
      html += `      <div class="${classNames}" data-id="${el.id}"${linkAttr} ${styleAttr}>${tableHtml}</div>\n`;
    }
    
  }

  // On injecte le JSON dans le HTML exporté
  // ⚠️ On doit échapper </script> au cas où
  const metaJson = meta
  ? JSON.stringify(meta).replace(/<\/script/gi, "<\\/script")
  : null;

  html += `    </div>
  </div>

  ${metaJson ? `<script id="slide-meta" type="application/json">${metaJson}</script>` : ""}

  <script>
    (function(){
      const W = 960, H = 540;
      function updateScale(){
        const s = Math.min(window.innerWidth / W, window.innerHeight / H);
        document.documentElement.style.setProperty('--scale', String(s));
      }
      window.addEventListener('resize', updateScale, { passive:true });
      updateScale();
      
      // Rendre les boutons et textes avec liens cliquables
      document.querySelectorAll('.el[data-link]').forEach(el => {
        const link = el.getAttribute('data-link');
        if (!link) return;
        
        el.style.cursor = 'pointer';
        el.onclick = () => {
          // Vérifier si c'est un lien vers une slide ou une URL
          if (!isNaN(link)) {
            // C'est un numéro de slide (1-based)
            const slideIndex = parseInt(link);
            // En file://, on utilise le nom du fichier
            window.location.href = 'slide-' + slideIndex + '.html';
          } else if (link.match(/^slide-\d+\.html$/i)) {
            // C'est déjà un nom de fichier
            window.location.href = link;
          } else {
            // C'est une URL externe
            window.open(link, '_blank');
          }
        };
      });
      
      // Aussi gérer les liens dans les <a> directs
      document.querySelectorAll('.el a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        
        const parent = link.closest('.el');
        if (parent) {
          parent.style.cursor = 'pointer';
          parent.onclick = () => {
            window.location.href = href;
          };
        }
      });
    })();
  </script>
</body>
</html>`;

  return html;
}



// fit
document.getElementById("fitBtn").addEventListener("click", () => {
  const workspace = document.getElementById("workspace");
  const w = workspace.clientWidth - 120; // margins
  const z = clamp(w / 960, 0.35, 1.2);
  setZoom(z);
});

// tool search
document.getElementById("toolSearch").addEventListener("input", (ev) => {
  const q = ev.target.value.trim().toLowerCase();
  document.querySelectorAll(".tool").forEach((t) => {
    const text = t.innerText.toLowerCase();
    t.style.display = text.includes(q) ? "" : "none";
  });
});

// =====================================================
//  SANITIZE (no toolbar in slides_state)
// =====================================================
function sanitizeEditableInnerHTML(elNode) {
  const clone = elNode.cloneNode(true);

  // Supprime l'UI d'édition
  clone.querySelectorAll(".text-toolbar, .handle").forEach((n) => n.remove());

  const raw = clone.innerHTML || "";
  const cutIdx = raw.indexOf('<div class="text-toolbar"');
  const cleaned = (cutIdx === -1 ? raw : raw.slice(0, cutIdx)).trim();

  return cleaned;
}

// persist editable content back to state (ONE listener only)
document.getElementById("slide").addEventListener("input", (ev) => {
  const elNode = ev.target.closest(".el");
  if (!elNode) return;

  const id = elNode.dataset.id;
  const s = getActive();
  const e = s.elements.find((x) => x.id === id);
  if (!e) return;

  if (e.type === "text" || e.type === "button") {
    e.html =
      sanitizeEditableInnerHTML(elNode) ||
      (e.type === "text" ? "Texte" : "Bouton");
  }
});


// basic zoom with trackpad wheel + ctrl
document.getElementById("workspace").addEventListener(
  "wheel",
  (ev) => {
    if (!(ev.ctrlKey || ev.metaKey)) return;
    ev.preventDefault();
    const delta = -Math.sign(ev.deltaY) * 0.06;
    setZoom(getZoom() + delta);
  },
  { passive: false }
);
