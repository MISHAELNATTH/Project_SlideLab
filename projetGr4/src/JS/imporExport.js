// imporExport.js
import { thumbsEl, state, cryptoId, setSelectedId, render } from "./editor.js";

// =====================================================
//  IMPORT - FICHIERS HTML (support 2 formats)
// =====================================================

function pickNumberPx(style, prop, fallback = null) {
  // accepte: left: 90px; left:90px; left: 90.5px; left:-10px
  const re = new RegExp(`${prop}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)px`, "i");
  const m = style.match(re);
  if (!m) return fallback;
  return parseFloat(m[1]);
}

function parseSlideHTML(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const elements = [];

  // 1) Nouveau format (identique à l’éditeur): .slide + .el
  const elsNew = doc.querySelectorAll(".slide .el");

  // 2) Ancien format: .slide-container + .slide-element
  const elsOld = doc.querySelectorAll(".slide-container .slide-element");

  const nodes = elsNew.length ? elsNew : elsOld;

  nodes.forEach((node) => {
    const style = node.getAttribute("style") || "";

    const x = pickNumberPx(style, "left", 0);
    const y = pickNumberPx(style, "top", 0);
    const w = pickNumberPx(style, "width", 240);
    const h = pickNumberPx(style, "height", 54);

    let type = "text";
    let html = "";
    let imageData = null;

    // --- nouveau format ---
    if (node.classList.contains("el")) {
      if (node.classList.contains("text")) {
        type = "text";
        html = node.innerHTML || "Texte";
      } else if (node.classList.contains("button")) {
        type = "button";
        html = node.innerHTML || "Bouton";
      } else if (node.classList.contains("shape")) {
        type = "shape";
      } else if (node.classList.contains("image")) {
        type = "image";
        const img = node.querySelector("img");
        if (img?.getAttribute("src")) imageData = img.getAttribute("src");
      }
    }

    // --- ancien format ---
    if (node.classList.contains("slide-element")) {
      if (node.classList.contains("text-element")) {
        type = "text";
        const p = node.querySelector("p");
        html = p ? p.innerHTML : node.innerHTML || "Texte";
      } else if (node.classList.contains("button-element")) {
        type = "button";
        html = node.innerHTML.trim() || "Bouton";
      } else if (node.classList.contains("shape-element")) {
        type = "shape";
      } else if (node.classList.contains("image-element")) {
        type = "image";
        const img = node.querySelector("img");
        if (img?.getAttribute("src")) imageData = img.getAttribute("src");
      }
    }

    const obj = {
      id: cryptoId(),
      type,
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(w),
      h: Math.round(h),
      html
    };

    if (type === "image" && imageData) obj.imageData = imageData;

    elements.push(obj);
  });

  return elements;
}

// load slides from files
function loadSlidesFromFiles(files) {
  const fileArray = Array.from(files).filter((f) => f.name.endsWith(".html"));

  if (fileArray.length === 0) {
    alert("No HTML files selected");
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

        if (index === 0) {
          state.slides[state.activeSlide] = { id: cryptoId(), elements };
        } else {
          state.slides.push({ id: cryptoId(), elements });
        }

        loadedCount++;

        if (loadedCount === fileArray.length) {
          state.activeSlide = 0;
          setSelectedId(null);
          render();
          thumbsEl.scrollLeft = 0;
          alert(`✓ Loaded ${fileArray.length} slide(s)`);
        }
      } catch (error) {
        console.error("Error parsing file:", file.name, error);
      }
    };

    reader.readAsText(file);
  });
}

// open folder button
const fileInput = document.getElementById("fileInput");
document.getElementById("openFolderBtn").addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (ev) => {
  if (ev.target.files.length > 0) {
    loadSlidesFromFiles(ev.target.files);
    ev.target.value = ""; // reset input
  }
});
