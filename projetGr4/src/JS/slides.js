import { thumbsEl, state, zoomChip, cryptoId, setSelectedId, render, setZoom, getZoom, getActive} from './editor.js';
// =====================================================
//  GESTION DES SLIDES
// =====================================================


// add slide
document.getElementById("addSlideBtn").addEventListener("click", ()=>{
  state.slides.push({ id: cryptoId(), elements: [] });
  state.activeSlide = state.slides.length - 1;
  setSelectedId(null);
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
  setSelectedId(null);
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
document.getElementById("toolSearch").addEventListener("input", (ev)=>{
  const q = ev.target.value.trim().toLowerCase();
  document.querySelectorAll(".tool").forEach(t=>{
    const text = t.innerText.toLowerCase();
    t.style.display = text.includes(q) ? "" : "none";
  });
});

// persist editable content back to state
document.getElementById("slide").addEventListener("input", (ev)=>{
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