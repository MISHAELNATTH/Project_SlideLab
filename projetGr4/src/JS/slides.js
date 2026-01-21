// slides.js
import {
  thumbsEl,
  state,
  cryptoId,
  setSelectedId,
  render,
  setZoom,
  getZoom,
  getActive
} from "./editor.js";

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

// =====================================================
//  GESTION DES SLIDES
// =====================================================

// add slide
document.getElementById("addSlideBtn").addEventListener("click", () => {
  state.slides.push({ id: cryptoId(), elements: [] });
  state.activeSlide = state.slides.length - 1;
  setSelectedId(null);
  render();
  thumbsEl.scrollLeft = thumbsEl.scrollWidth;
});

// duplicate slide
document.getElementById("dupSlideBtn").addEventListener("click", () => {
  const s = getActive();
  const clone = JSON.parse(JSON.stringify(s));
  clone.id = cryptoId();
  clone.elements.forEach((e) => (e.id = cryptoId()));
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
</style>
`.trim();
}




function generateSlideHTML(slideIndex) {
  const slide = state.slides[slideIndex];

  let html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Slide ${slideIndex + 1}</title>
${exportBaseCSS()}
</head>
<body>
  <div class="stage">
    <div class="slide" role="img" aria-label="Slide ${slideIndex + 1}">
`;

  for (const el of slide.elements) {
    const left = Math.round(el.x ?? 0);
    const top = Math.round(el.y ?? 0);
    const w = Math.round(el.w ?? 240);
    const h = Math.round(el.h ?? 54);

    const style = `style="left:${left}px;top:${top}px;width:${w}px;height:${h}px;"`;

    if (el.type === "text") {
      html += `      <div class="el text" ${style}>${el.html || "Texte"}</div>\n`;
    } else if (el.type === "button") {
      html += `      <div class="el button" ${style}>${el.html || "Bouton"}</div>\n`;
    } else if (el.type === "shape") {
      html += `      <div class="el shape" ${style}></div>\n`;
    } else if (el.type === "image") {
      if (el.imageData) {
        html += `      <div class="el image" ${style}><img src="${el.imageData}" alt=""></div>\n`;
      } else {
        html += `      <div class="el image" ${style}></div>\n`;
      }
    }
  }

  html += `    </div>
  </div>

  <script>
    (function(){
      const W = 960, H = 540; // taille "réelle" de ta slide

      function updateScale(){
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const s = Math.min(vw / W, vh / H); // FIT => bandes noires conservées
        document.documentElement.style.setProperty('--scale', String(s));
      }

      window.addEventListener('resize', updateScale, { passive: true });
      updateScale();
    })();
  </script>
</body>
</html>`;

  return html;
}


// export all slides as HTML files to download
document.getElementById("exportBtn").addEventListener("click", () => {
  if (state.slides.length === 1) {
    const html = generateSlideHTML(0);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "slide.html";
    a.click();
    URL.revokeObjectURL(url);
  } else {
    state.slides.forEach((_, index) => {
      const html = generateSlideHTML(index);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `slide-${index + 1}.html`;

      setTimeout(() => {
        a.click();
        URL.revokeObjectURL(url);
      }, index * 200);
    });
  }
});

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

// persist editable content back to state
document.getElementById("slide").addEventListener("input", (ev) => {
  const elNode = ev.target.closest(".el");
  if (!elNode) return;
  const id = elNode.dataset.id;
  const s = getActive();
  const e = s.elements.find((x) => x.id === id);
  if (!e) return;
  if (e.type === "text" || e.type === "button") {
    e.html = elNode.innerHTML;
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
