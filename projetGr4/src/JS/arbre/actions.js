import { appState } from "./state.js";
import { requestSave, saveSlidesStateToLocalStorage } from "./storage.js";
import { buildGraphFromSlidesState } from "./buildGraph.js";

export function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function setSlideTitle(srcSlideIndex, newTitle) {
  const s = appState.slides_state?.slides?.[srcSlideIndex];
  if (!s) return;
  if (!s.arbre) s.arbre = {};
  s.arbre.title = newTitle;
  requestSave();
}

export function setSlidePos(srcSlideIndex, x, y) {
  const s = appState.slides_state?.slides?.[srcSlideIndex];
  if (!s) return;
  if (!s.arbre) s.arbre = {};
  if (!s.arbre.pos) s.arbre.pos = { x: 0, y: 0 };
  s.arbre.pos.x = x;
  s.arbre.pos.y = y;
  requestSave();
}

export function setElementLinkInSlidesState(srcSlideIndex, elementIndex, newLink) {
  const slide = appState.slides_state?.slides?.[srcSlideIndex];
  if (!slide || !Array.isArray(slide.elements)) return;

  const el = slide.elements[elementIndex];
  if (!el) return;

  el.link = newLink;
  requestSave();
}

/**
 * Nettoie les links (elements[].link) après suppression d'une slide.
 */
export function cleanupLinksAfterSlideDelete(slides_state, deletedIndex) {
  const deletedLink = deletedIndex + 1; // link "1..N" (avant suppression)
  if (!slides_state?.slides?.length) return;

  slides_state.slides.forEach((slide) => {
    if (!Array.isArray(slide.elements)) return;

    slide.elements.forEach((el) => {
      if (!el || el.link == null) return;

      const n = parseInt(el.link, 10);
      if (!Number.isFinite(n) || n <= 0) {
        el.link = null;
        return;
      }

      if (n === deletedLink) el.link = null;
      else if (n > deletedLink) el.link = String(n - 1);
    });
  });
}

export function deleteSlideByIndex(deleteIndex) {
  if (!appState.slides_state?.slides?.length) return;

  // 1) Supprimer la slide
  appState.slides_state.slides.splice(deleteIndex, 1);

  // 2) Nettoie/renumérote tous les links
  cleanupLinksAfterSlideDelete(appState.slides_state, deleteIndex);

  // 3) Sauve + rebuild
  saveSlidesStateToLocalStorage(appState.slides_state);
  appState.selectedNodeId = null;
  buildGraphFromSlidesState();
}

export function addSlide() {
  if (!appState.slides_state) {
    appState.slides_state = { activeSlide: 0, slides: [] };
  }
  if (!Array.isArray(appState.slides_state.slides)) appState.slides_state.slides = [];

  const idx = appState.slides_state.slides.length;

  appState.slides_state.slides.push({
    id: uuid(),
    backgroundColor: "#ffffff",
    backgroundGradient: "",
    elements: [],
    arbre: {
      title: `Slide ${idx + 1}`,
      pos: { x: 100 + idx * 260, y: 120 + (idx % 4) * 160 },
    },
  });

  requestSave();
  buildGraphFromSlidesState();
}
