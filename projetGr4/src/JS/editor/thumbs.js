/**
 * thumbs.js (editor)
 * Génération des miniatures (thumbs) de chaque slide. Convertit les
 * éléments en petits blocs stylés pour l'affichage horizontal et
 * fournit la navigation vers la slide sélectionnée.
 */
// src/JS/editor/thumbs.js
import { thumbsEl } from "./dom.js";
import { state, setSelectedId } from "./core.js";
import { getSlideBackgroundStyle, getElementStyles, getElementClasses } from "../styleHelper.js";

let renderFn = null;
/**
 * configureThumbs({ render })
 * Enregistre la fonction `render` utilisée pour déclencher le re-rendu
 * depuis la miniature (quand l'utilisateur clique pour naviguer).
 */
export function configureThumbs({ render }) {
  renderFn = render;
}
function rerender() {
  if (typeof renderFn === "function") renderFn();
}

/**
 * renderThumbs()
 * Reconstruit l'ensemble des miniatures à partir de `state.slides`.
 * Le rendu est une version scalée de la slide (transform: scale)
 * et utilise `getElementClasses` / `getElementStyles` pour assurer
 * un rendu cohérent avec l'éditeur.
 */
export function renderThumbs() {
  thumbsEl.innerHTML = "";
  state.slides.forEach((sl, i) => {
    const t = document.createElement("div");
    t.className = "thumb" + (i === state.activeSlide ? " active" : "");

    const miniWrapper = document.createElement("div");
    miniWrapper.className = "mini";

    const miniDiv = document.createElement("div");
    miniDiv.style.position = "absolute";
    miniDiv.style.width = "960px";
    miniDiv.style.height = "540px";
    miniDiv.style.top = "0";
    miniDiv.style.left = "0";
    miniDiv.style.transformOrigin = "top left";

    const scale = 104 / 960;
    miniDiv.style.transform = `scale(${scale})`;
    miniDiv.style.background = getSlideBackgroundStyle(sl);

    sl.elements.forEach((e) => {
      const node = document.createElement("div");
      node.className = getElementClasses(e);
      Object.assign(node.style, getElementStyles(e));

      if (e.type === "text" || e.type === "button") {
        node.innerHTML = e.html || (e.type === "text" ? "Texte" : "Bouton");
      }

      if (e.type === "table") {
        const wrapper = document.createElement("div");
        Object.assign(wrapper.style, {
          width: "100%",
          height: "100%",
          overflow: "hidden",
          position: "relative",
        });

        const tableEl = document.createElement("table");
        tableEl.className = "data-table";
        Object.assign(tableEl.style, {
          width: "100%",
          height: "100%",
          tableLayout: "fixed",
          borderCollapse: "collapse",
        });

        if (e.borderColor) tableEl.style.setProperty("--table-border-color", e.borderColor);

        const rows = e.rows || 3;
        const cols = e.cols || 3;
        const data = e.data || Array(rows).fill(null).map(() => Array(cols).fill(""));

        for (let r = 0; r < rows; r++) {
          const tr = document.createElement("tr");
          for (let c = 0; c < cols; c++) {
            const cell = r === 0 ? document.createElement("th") : document.createElement("td");
            cell.innerHTML = data[r]?.[c] || "";
            if (r === 0 && e.headerColor) cell.style.background = e.headerColor;
            if (e.borderColor) cell.style.borderColor = e.borderColor;
            tr.appendChild(cell);
          }
          tableEl.appendChild(tr);
        }

        wrapper.appendChild(tableEl);
        node.appendChild(wrapper);
      }

      if (e.type === "image") {
        const wrapper = document.createElement("div");
        wrapper.className = "el-img-wrapper";
        wrapper.innerHTML = e.imageData
          ? `<img src="${e.imageData}" style="width:100%;height:100%;object-fit:contain;">`
          : `<div style="width:100%;height:100%;background:#eee;"></div>`;
        node.appendChild(wrapper);
      }

      node.style.pointerEvents = "none"; // thumbs are non-interactive internement
      miniDiv.appendChild(node);
    });

    miniWrapper.appendChild(miniDiv);
    t.appendChild(miniWrapper);

    const label = document.createElement("div");
    label.className = "label";
    label.innerHTML = `
      <span>Slide ${i + 1}</span>
      <span style="color:rgba(255,255,255,.55)">${sl.elements.length} obj.</span>
    `;
    t.appendChild(label);

    // Au clic sur une miniature, on bascule la slide active et on rerender
    t.addEventListener("click", () => {
      state.activeSlide = i;
      setSelectedId(null);
      rerender();
    });

    thumbsEl.appendChild(t);
  });
}
