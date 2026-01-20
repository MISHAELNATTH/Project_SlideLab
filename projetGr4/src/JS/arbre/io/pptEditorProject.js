// src/JS/arbre/io/pptEditorProject.js

const LS_KEY = "ppt_editor_project_v1";

/**
 * Essaie d'extraire une liste de slides depuis ppt_editor_project_v1
 * Format de sortie standardisé:
 * [
 *   { id: 1, label: "Slide 1", x: 100, y: 100, buttons: [{ label?:string, target:number|null }], file?: string }
 * ]
 */
export function loadSlidesFromPptEditorLocalStorage() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  // Heuristiques: où peuvent être les slides ?
  const candidates =
    data?.slides ||
    data?.pages ||
    data?.nodes ||
    data?.documents ||
    data?.project?.slides ||
    data?.project?.pages ||
    data?.project?.nodes;

  if (!Array.isArray(candidates)) return null;

  const slides = candidates
    .map((s, idx) => normalizeSlide(s, idx))
    .filter(Boolean);

  if (slides.length === 0) return null;
  return slides;
}

function normalizeSlide(s, idx) {
  // id
  const id =
    numberOrNull(s?.id) ??
    numberOrNull(s?.slideId) ??
    numberOrNull(s?.index) ??
    (idx + 1);

  // label
  const label =
    (typeof s?.label === "string" && s.label) ||
    (typeof s?.title === "string" && s.title) ||
    (typeof s?.name === "string" && s.name) ||
    `Slide ${id}`;

  // position
  const x = numberOrNull(s?.x) ?? numberOrNull(s?.pos?.x) ?? 100 + idx * 60;
  const y = numberOrNull(s?.y) ?? numberOrNull(s?.pos?.y) ?? 100 + idx * 40;

  // file (pour écrire le bon fichier au save)
  const file =
    (typeof s?.file === "string" && s.file) ||
    (typeof s?.path === "string" && s.path) ||
    (typeof s?.url === "string" && s.url) ||
    null;

  // boutons / connexions
  // cas 1: s.buttons = [ {target, label}, ... ]
  if (Array.isArray(s?.buttons)) {
    const buttons = s.buttons.map((b, i) => ({
      label: typeof b?.label === "string" ? b.label : `Bouton ${i + 1}`,
      target: numberOrNull(b?.target) ?? numberOrNull(b?.to) ?? null,
    }));
    return { id, label, x, y, buttons, file };
  }

  // cas 2: s.outputs = [{to: id}, ...]
  if (Array.isArray(s?.outputs)) {
    const buttons = s.outputs.map((b, i) => ({
      label: typeof b?.label === "string" ? b.label : `Bouton ${i + 1}`,
      target: numberOrNull(b?.target) ?? numberOrNull(b?.to) ?? null,
    }));
    return { id, label, x, y, buttons, file };
  }

  // cas 3: s.links = [2, null, 3]
  if (Array.isArray(s?.links)) {
    const buttons = s.links.map((t, i) => ({
      label: `Bouton ${i + 1}`,
      target: numberOrNull(t),
    }));
    return { id, label, x, y, buttons, file };
  }

  // sinon: aucun bouton
  return { id, label, x, y, buttons: [], file };
}

function numberOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
