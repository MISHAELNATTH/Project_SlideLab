// storage.js
const STORAGE_KEY = "ppt_editor_project_v1";

export function saveProjectToLocal(state) {
  const payload = {
    version: 1,
    savedAt: Date.now(),
    activeSlide: state.activeSlide ?? 0,
    slides: state.slides ?? []
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function loadProjectFromLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.slides)) return null;
    return data;
  } catch {
    return null;
  }
}

export function getStorageKey() {
  return STORAGE_KEY;
}
