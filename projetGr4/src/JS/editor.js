// src/JS/editor.js
import { getElementStyles, getElementClasses, getSlideBackgroundStyle } from "./styleHelper.js";

// --- Core state & helpers ---
import {
  id,
  state,
  saveState,
  loadState,
  slideId,
  cryptoId,
  clamp,
  getActive,
  setSelectedId,
  getSelectedId,
} from "./editor/core.js";

// --- DOM refs ---
import { slideEl, thumbsEl, searchEl, zoomChip } from "./editor/dom.js";

// --- Zoom ---
import { getZoom, setZoom } from "./editor/zoom.js";

// --- Renderer (main) ---
import { render } from "./editor/render.js";

// --- Configure modules that need render() (avoid circular deps) ---
import { configureToolbars } from "./editor/toolbars.js";
import { configureMoveResize } from "./editor/moveResize.js";
import { configureThumbs } from "./editor/thumbs.js";

configureToolbars({ render });
configureMoveResize({ render });
configureThumbs({ render });

// --- UI init (listeners, resizers, bg, keyboard, etc.) ---
import { initUI } from "./editor/ui.js";

// --- Load then init ---
loadState();
initUI();

// First paint
render();
setZoom(1);

// =====================================================
//  IMPORTS DES MODULES DÉPENDANTS (INCHANGÉS)
// =====================================================
import "./imporExport.js";
import "./present.js";
import "./slides.js";

import { initContextMenu } from "./contextMenu.js";
initContextMenu(slideEl);

// =====================================================
//  EXPORTS (compatibilité avec les autres fichiers)
//  -> On garde exactement les mêmes exports qu’avant.
// =====================================================
export { id };
export { state };
export { saveState, loadState };
export { slideId, cryptoId, clamp };
export { slideEl, thumbsEl, searchEl, zoomChip };

export { getActive };
export { render };

export { getZoom, setZoom };

export { setSelectedId, getSelectedId };

// (optionnel mais pratique si d'autres scripts importent selectedId)
// avant c'était `export let selectedId = null;`
// maintenant on expose via getSelectedId()
