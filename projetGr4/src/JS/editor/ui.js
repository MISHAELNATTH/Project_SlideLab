/**
 * ui.js (editor)
 * Initialisation globale de l'interface utilisateur : listeners clavier,
 * gestion des boutons d'import/export, redimensionneurs et navigation.
 * Configure aussi le drag&drop et les raccourcis (zoom, suppression).
 */
// src/JS/editor/ui.js
import { slideEl } from "./dom.js";
import { getActive, setSelectedId, getSelectedId } from "./core.js";
import { render } from "./render.js";
import { getZoom, setZoom } from "./zoom.js";
import { initDragDrop, configureDragDrop } from "./dragDrop.js";

configureDragDrop({ render });

/**
 * clearSelection()
 * Désarçonne la sélection courante (met à null) et force un rendu.
 * Appelée lorsqu'on clique sur le fond de la slide.
 */
function clearSelection() {
  setSelectedId(null);
  render();
}

/**
 * deleteSelected()
 * Supprime l'élément actuellement sélectionné de la slide active.
 * Met à jour l'état en filtrant `elements` puis réaffiche.
 */
function deleteSelected() {
  const selectedId = getSelectedId();
  if (!selectedId) return;
  const s = getActive();
  s.elements = s.elements.filter((e) => e.id !== selectedId);
  setSelectedId(null);
  render();
}

/**
 * initUI()
 * Initialise les listeners globaux de l'éditeur : gestion des imports,
 * suppression via clavier, raccourcis de zoom, redimensionneurs UI,
 * boutons de navigation, et initialisation du drag&drop.
 * Toutes les sous-fonctions liées aux resizers sont définies en scope
 * local pour garder les handlers proches de leur logique.
 */
export function initUI() {
  // Unhandled promises (comme avant)
  window.addEventListener("unhandledrejection", (e) => {
    console.warn("Unhandled promise rejection:", e.reason);
  });

    // Click vide => deselect
  slideEl.addEventListener("mousedown", (ev) => {
    if (ev.target.closest(".pcr-app, .color-picker, .colorPicker, .picker, .vc-sketch, .react-colorful")) {
        return;
    }
    if (ev.target === slideEl || ev.target.classList.contains("drop-hint")) {
        clearSelection();
    }
  });

    // ==============================
    // IMPORT PROJET (JSON)
    // ==============================
    const importBtn = document.getElementById("importProjectBtn");
    const importInput = document.getElementById("importProjectInput");

    if (importBtn && importInput) {
    importBtn.addEventListener("click", () => {
        importInput.value = ""; // reset
        importInput.click();
    });

    importInput.addEventListener("change", () => {
        const file = importInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // Validation minimale
            if (!data || !Array.isArray(data.slides)) {
            alert("Fichier invalide : structure incorrecte");
            return;
            }

            // Remplacement TOTAL de l'état
            localStorage.setItem("slides_state", JSON.stringify(data));

            // Recharge proprement l'éditeur
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'import du projet");
        }
        };

        reader.readAsText(file);
    });
    }



  const deleteBtn = document.getElementById("deleteBtn");
  if (deleteBtn) deleteBtn.addEventListener("click", deleteSelected);

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Delete" || ev.key === "Backspace") {
      const a = document.activeElement;
      if (a && (a.classList?.contains("text") || a.classList?.contains("button"))) return;
      deleteSelected();
    }
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === "+" || ev.key === "=")) {
      ev.preventDefault();
      setZoom(getZoom() + 0.1);
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.key === "-") {
      ev.preventDefault();
      setZoom(getZoom() - 0.1);
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.key === "0") {
      ev.preventDefault();
      setZoom(1);
    }
  });

  // Background
  const bgPicker = document.getElementById("bgColorPicker");
  if (bgPicker) {
    bgPicker.addEventListener("input", (ev) => {
      const s = getActive();
      s.backgroundColor = ev.target.value;
      s.backgroundGradient = "";
      render();
    });
  }

  // Resizable bottom bar
  const resizerY = document.getElementById("resizerY");
  if (resizerY) resizerY.addEventListener("mousedown", initDragBottom);

  /**
   * initDragBottom / doDragBottom / stopDragBottom
   * Contrôlent le redimensionnement vertical de la barre inférieure.
   * - `initDragBottom`: attache les listeners globaux nécessaire au drag
   * - `doDragBottom`: calcule la nouvelle hauteur en respectant des min/max
   * - `stopDragBottom`: enlève les listeners et restaure le curseur
   */
  function initDragBottom(e) {
    e.preventDefault();
    window.addEventListener("mousemove", doDragBottom);
    window.addEventListener("mouseup", stopDragBottom);
    resizerY.classList.add("resizing");
    document.body.style.cursor = "ns-resize";
  }
  function doDragBottom(e) {
    const availableH = window.innerHeight;
    let newH = availableH - e.clientY - 14;
    const minH = 50;
    const maxH = availableH * 0.6;
    if (newH < minH) newH = minH;
    if (newH > maxH) newH = maxH;
    document.documentElement.style.setProperty("--bottom-h", Math.round(newH) + "px");
  }
  function stopDragBottom() {
    window.removeEventListener("mousemove", doDragBottom);
    window.removeEventListener("mouseup", stopDragBottom);
    resizerY.classList.remove("resizing");
    document.body.style.cursor = "";
  }

  // Resizable side bar
  const resizerX = document.getElementById("resizerX");
  let dragStartX = 0;
  let dragStartWidth = 0;

  if (resizerX) resizerX.addEventListener("mousedown", initDragSide);

  /**
   * initDragSide / doDragSide / stopDragSide
   * Mêmes responsabilités que le redimensionnement vertical mais pour
   * la largeur de la sidebar latérale. Calcule la nouvelle largeur en
   * ajoutant le delta au point de départ et respecte des bornes.
   */
  function initDragSide(e) {
    e.preventDefault();
    dragStartX = e.clientX;
    dragStartWidth = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--sidebar-w")
    );
    window.addEventListener("mousemove", doDragSide);
    window.addEventListener("mouseup", stopDragSide);
    resizerX.classList.add("resizing");
    document.body.style.cursor = "ew-resize";
  }
  function doDragSide(e) {
    const dx = e.clientX - dragStartX;
    let newW = dragStartWidth + dx;
    const minW = 155;
    const maxW = window.innerWidth * 0.5;
    if (newW < minW) newW = minW;
    if (newW > maxW) newW = maxW;
    document.documentElement.style.setProperty("--sidebar-w", Math.round(newW) + "px");
  }
  function stopDragSide() {
    window.removeEventListener("mousemove", doDragSide);
    window.removeEventListener("mouseup", stopDragSide);
    resizerX.classList.remove("resizing");
    document.body.style.cursor = "";
  }

  // Navigation vers arbre
  const btnArbre = document.getElementById("btnArbre");
  if (btnArbre) {
    btnArbre.addEventListener("click", () => {
      const target = "src/html/arbre.html";
      window.location.href = `${import.meta.env.BASE_URL}${target}`;
    });
  }

  const homeBtn = document.getElementById("homeBtn");
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      window.location.href = `${import.meta.env.BASE_URL}index.html`;
    });
  }

  // Drag & drop tools
  initDragDrop();
}
