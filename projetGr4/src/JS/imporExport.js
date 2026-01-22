import { thumbsEl, state, slideId, setSelectedId, render, slideEl } from "./editor.js";
import { generateSlideHTML } from "./slides.js";

// =====================================================
//  HELPERS
// =====================================================

function pickNumberPx(style, prop, fallback = null) {
  // accepte: left: 90px; left:90px; left: 90.5px; left:-10px
  const re = new RegExp(`${prop}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)px`, "i");
  const m = style.match(re);
  if (!m) return fallback;
  return parseFloat(m[1]);
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function stripAfterTextToolbar(rawHtml) {
  if (!rawHtml) return rawHtml;

  // Coupe dès la première occurrence de <div class="text-toolbar">
  const idx = rawHtml.indexOf('<div class="text-toolbar"');
  if (idx === -1) return rawHtml;

  return rawHtml.slice(0, idx);
}

function cleanEditableHtml(node) {
  const clone = node.cloneNode(true);

  // supprime toolbars + handles si présents
  clone.querySelectorAll(".text-toolbar, .handle").forEach((el) => el.remove());

  // puis on coupe au cas où une toolbar serait restée en texte brut
  return stripAfterTextToolbar(clone.innerHTML);
}


/**
 * Convertit un href vers une "cible slide" (si détectable)
 * Supporte:
 *  - "slide-3.html"
 *  - "#slide:3"
 *  - "#slide-3"
 */
function hrefToTarget(href) {
  if (!href) return null;

  let m = href.match(/^#slide:(\d+)$/i);
  if (m) return { kind: "index", index: parseInt(m[1], 10) - 1 };

  m = href.match(/^#slide-(\d+)$/i);
  if (m) return { kind: "index", index: parseInt(m[1], 10) - 1 };

  m = href.match(/slide-(\d+)\.html$/i);
  if (m) {
    return {
      kind: "file",
      file: href,
      index: parseInt(m[1], 10) - 1
    };
  }

  return { kind: "href", href };
}

function hrefToLinkValue(href) {
  if (!href) return null;
  const s = String(href).trim();
  if (!s) return null;

  // Externe => on garde tel quel
  if (/^https?:\/\//i.test(s)) return s;

  // Nos formats internes possibles
  let m = s.match(/^slide-(\d+)\.html$/i);
  if (m) return m[1]; // ✅ "slide-2.html" -> "2"

  m = s.match(/^#slide:(\d+)$/i);
  if (m) return m[1]; // ✅ "#slide:2" -> "2"

  m = s.match(/^#slide-(\d+)$/i);
  if (m) return m[1]; // ✅ "#slide-2" -> "2"

  // Sinon on garde (ex: "page.html" ou autre)
  return s;
}


/**
 * Lit le meta JSON si présent dans:
 * <script id="slide-meta" type="application/json">...</script>
 */
function readSlideMeta(doc) {
  const metaNode = doc.querySelector('#slide-meta[type="application/json"]');
  if (!metaNode) return null;

  const meta = safeJsonParse(metaNode.textContent || "");
  if (!meta || typeof meta !== "object") return null;

  // normalisation minimale
  const title =
    typeof meta.title === "string" && meta.title.trim()
      ? meta.title.trim()
      : null;

  const pos =
    meta.pos &&
    typeof meta.pos === "object" &&
    typeof meta.pos.x === "number" &&
    typeof meta.pos.y === "number"
      ? { x: meta.pos.x, y: meta.pos.y }
      : { x: 0, y: 0 };

  const buttonsMeta = Array.isArray(meta.buttons) ? meta.buttons : [];

  return {
    title,
    pos
  };
}

// =====================================================
//  PARSE HTML -> { elements, meta }
// =====================================================

function parseSlideHTML(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  const meta = readSlideMeta(doc);

  const elements = [];

  // 1) Nouveau format: .stage .slide .el
  const elsNew = doc.querySelectorAll(".slide .el");

  // 2) Ancien format: .slide-container .slide-element
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

    // on essaie de garder l'id existant si export l’a mis (utile pour boutons)
    let id =
      node.getAttribute("data-id") ||
      node.getAttribute("data-btn-id") ||
      slideId();
    
    // --- Link detection ---
    // l'élément contient un <a href="..."> (ancien bouton ou wrapper interne)
    let link = null;
    const aInside = node.querySelector?.("a[href]");
    if (aInside) link = aInside.getAttribute("href");

    // l'élément est englobé par un <a href="..."> (wrapper externe)
    if (!link) {
      const aParent = node.closest?.("a[href]");
      if (aParent) link = aParent.getAttribute("href");
    }

    link = hrefToLinkValue(link);



    // --- nouveau format (.el) ---
    if (node.classList.contains("el")) {
      if (node.classList.contains("text")) {
        type = "text";
        html = cleanEditableHtml(node) || "Texte";
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

    // --- ancien format (.slide-element) ---
    if (node.classList.contains("slide-element")) {
      if (node.classList.contains("text-element")) {
        type = "text";
        const p = node.querySelector("p");
        html = cleanEditableHtml(node) || "Texte";
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
      id,
      type,
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(w),
      h: Math.round(h),
      link,
      html
    };

    if (type === "image" && imageData) obj.imageData = imageData;

    elements.push(obj);
  });

  // Si meta.buttons n’existe pas, on peut le reconstituer depuis le DOM (optionnel)
  // utile quand tu importes un vieux HTML sans meta.
  let buttonsMeta = meta?.buttonsMeta ?? null;
  if (!buttonsMeta) {
    const buttonNodes = elsNew.length
      ? doc.querySelectorAll(".slide .el.button")
      : doc.querySelectorAll(".slide-container .slide-element.button-element");

    buttonsMeta = Array.from(buttonNodes).map((btn) => {
      const buttonId =
        btn.getAttribute("data-btn-id") ||
        btn.getAttribute("data-id") ||
        slideId();

      const a = btn.querySelector("a[href]");
      const href = a ? a.getAttribute("href") : null;

      return {
        buttonId,
        href,
        target: hrefToTarget(href)
      };
    });
  }

  return {
    meta: {
      title: meta?.title ?? null,
      pos: meta?.pos ?? { x: 0, y: 0 },
      buttonsMeta
    },
    elements
  };
}

// =====================================================
//  LOAD SLIDES FROM FILES
// =====================================================

function loadSlidesFromFiles(files) {
  const fileArray = Array.from(files).filter((f) => f.name.endsWith(".html"));

  if (fileArray.length === 0) {
    alert("No HTML files selected");
    return;
  }

  // tri pour un ordre stable
  fileArray.sort((a, b) => a.name.localeCompare(b.name));

  let loadedCount = 0;

  fileArray.forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const htmlContent = e.target.result;

        const parsed = parseSlideHTML(htmlContent);
        const elements = parsed.elements;
        const meta = parsed.meta;

       const slideObj = {
        id: slideId(),
        elements,
        arbre: {
          title: meta.title ?? file.name.replace(/\.html$/i, ""),
          pos: meta.pos ?? { x: 0, y: 0 }
        }
      };


        // Replace or add slide
        if (index === 0) {
          state.slides[state.activeSlide] = slideObj;
        } else {
          state.slides.push(slideObj);
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

// =====================================================
//  UI: open folder button
// =====================================================

const fileInput = document.getElementById("fileInput");

document.getElementById("openFolderBtn").addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (ev) => {
  if (ev.target.files && ev.target.files.length > 0) {
    loadSlidesFromFiles(ev.target.files);
    ev.target.value = ""; // reset input
  }
});


// export all slides as HTML files to download
document.getElementById("exportBtn").addEventListener("click", () => {
  
  state.slides.forEach((slide, index) => {
    const html = generateSlideHTML(index);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = state.slides.length === 1 ? "slide.html" : `slide-${index + 1}.html`;

    setTimeout(() => {
      a.click();
      URL.revokeObjectURL(url);
    }, index * 200);
  });
  
});