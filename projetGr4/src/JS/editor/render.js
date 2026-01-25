/**
 * render.js (editor)
 * Rendu principal de la slide : création des nœuds DOM pour chaque élément,
 * liaison des toolbars, handles, upload d'images, et sauvegarde d'état.
 * Sépare logique par type d'élément pour rester lisible et maintenable.
 */
// src/JS/editor/render.js
import { getElementStyles, getElementClasses, getSlideBackgroundStyle } from "../styleHelper.js";
import { slideEl, zoomChip } from "./dom.js";
import { getActive, saveState, getSelectedId } from "./core.js";
import { getZoom } from "./zoom.js";
import { createTextToolbar, createTableControls, createShapeControls } from "./toolbars.js";
import { startMove, startResize } from "./moveResize.js";
import { renderThumbs } from "./thumbs.js";

/**
 * render()
 * Fonction principale qui reconstruit la DOM de la slide courante à partir
 * de l'objet `state`. Pour chaque élément de `s.elements` on créé un
 * conteneur avec les styles/classes appropriés puis on ajoute la logique
 * spécifique selon le type (text/button/table/shape/image).
 *
 * Points importants :
 * - Les toolbars sont ajoutées dynamiquement pour l'édition inline
 * - Les handles tl/tr/bl/br déclenchent `startResize`
 * - Les événements d'upload d'image et de drop sont gérés localement
 * - On sauvegarde l'état (`saveState`) à la fin du rendu
 */
export function render() {
  const s = getActive();

  // Applique le background déclaré pour la slide
  slideEl.style.background = getSlideBackgroundStyle(s);

  // Supprime les anciens éléments (reconstruction complète)
  slideEl.querySelectorAll(".el").forEach((n) => n.remove());

  s.elements.forEach((e) => {
    const node = document.createElement("div");

    // Classe + sélection
    node.className = getElementClasses(e) + (e.id === getSelectedId() ? " selected" : "");
    node.dataset.id = e.id;

    // Applique les styles (position/size/font...)
    Object.assign(node.style, getElementStyles(e));

    // --- Texte / Bouton ---
    if (e.type === "text" || e.type === "button") {
      // Contenu editable en place + toolbar d'édition
      node.contentEditable = "true";
      node.spellcheck = false;
      node.innerHTML = e.html || (e.type === "text" ? "Texte" : "Bouton");
      node.appendChild(createTextToolbar(e));
    }

    // --- Table ---
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

      // Initialise `e.data` si absent pour éviter erreurs lors du blur
      if (!e.data) {
        e.data = [];
        for (let i = 0; i < rows; i++) {
          e.data[i] = [];
          for (let j = 0; j < cols; j++) e.data[i][j] = i === 0 ? `Col ${j + 1}` : "";
        }
      }

      for (let i = 0; i < rows; i++) {
        const tr = document.createElement("tr");
        for (let j = 0; j < cols; j++) {
          const cell = i === 0 ? document.createElement("th") : document.createElement("td");
          cell.contentEditable = "true";
          cell.spellcheck = false;
          cell.innerHTML = e.data[i]?.[j] || (i === 0 ? `Col ${j + 1}` : "");
          cell.dataset.row = i;
          cell.dataset.col = j;

          if (i === 0 && e.headerColor) cell.style.background = e.headerColor;
          if (e.borderColor) cell.style.borderColor = e.borderColor;

          // Lors d'un blur, on persiste la valeur éditée dans `e.data`
          cell.addEventListener("blur", () => {
            if (!e.data) e.data = Array(rows).fill(null).map(() => Array(cols).fill(""));
            if (!e.data[i]) e.data[i] = Array(cols).fill("");
            e.data[i][j] = cell.innerHTML || cell.textContent;
          });

          tr.appendChild(cell);
        }
        tableEl.appendChild(tr);
      }

      wrapper.appendChild(tableEl);
      node.appendChild(wrapper);

      node.appendChild(createTextToolbar(e));
      node.appendChild(createTableControls(e));
    }

    // --- Shape ---
    if (e.type === "shape") {
      const shapeWrapper = document.createElement("div");
      shapeWrapper.className = "shape-content-wrapper";

      if (e.fillColor) shapeWrapper.style.background = e.fillColor;
      if (e.borderColor) {
        shapeWrapper.style.borderColor = e.borderColor;
        shapeWrapper.style.borderWidth = "2px";
        shapeWrapper.style.borderStyle = "solid";
      }
      if (e.opacity !== undefined) shapeWrapper.style.opacity = e.opacity;

      node.appendChild(shapeWrapper);
      node.appendChild(createShapeControls(e));
    }

    // --- Image ---
    if (e.type === "image") {
      const wrapper = document.createElement("div");
      wrapper.className = "el-img-wrapper";

      wrapper.innerHTML = e.imageData
        ? `<img src="${e.imageData}" style="width:100%;height:100%;object-fit:contain;">`
        : `<div style="padding:12px;text-align:center;line-height:1.2;width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;">
             <span style="font-size:24px;margin-bottom:8px;">📸</span>
             <span style="font-size:13px;font-weight:600;color:#007bff">Double-clique</span>
           </div>`;

      node.appendChild(wrapper);
      node.style.cursor = "pointer";

      // Double-clic pour ouvrir un file picker et charger une image en base64
      node.addEventListener("dblclick", (ev) => {
        ev.stopPropagation();
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            e.imageData = loadEvent.target.result;
            render();
          };
          reader.readAsDataURL(file);
        };
        input.click();
      });

      // Autorise le drop d'une image directement sur l'élément
      node.addEventListener("dragover", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      });
      node.addEventListener("drop", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
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

    // --- Handles de redimensionnement ---
    ["tl", "tr", "bl", "br"].forEach((pos) => {
      const h = document.createElement("div");
      h.className = "handle h-" + pos;
      h.dataset.handle = pos;
      h.addEventListener("mousedown", (ev) => startResize(ev, e.id, pos));
      node.appendChild(h);
    });

    // startMove est lié pour initier le déplacement (séparé pour la logique)
    node.addEventListener("mousedown", (ev) => {
      if (ev.target.classList.contains("handle")) return;
    });
    node.addEventListener("mousedown", (ev) => startMove(ev, e.id));

    slideEl.appendChild(node);
  });

  // Re-génère les miniatures et met à jour l'affichage du zoom
  renderThumbs();

  const z = getZoom();
  if (zoomChip) zoomChip.textContent = `Zoom: ${Math.round(z * 100)}%`;

  // Persist l'état après modifications/ajouts
  saveState();
}
