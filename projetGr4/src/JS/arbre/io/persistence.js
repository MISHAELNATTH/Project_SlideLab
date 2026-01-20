import { nodesToJson, jsonToNodes } from "./json.js";

const LS_KEY = "arbre_slides_json_v1";

export function saveToLocalStorage(nodes) {
  const data = nodesToJson(nodes);
  localStorage.setItem(LS_KEY, JSON.stringify(data, null, 2));
}

export function loadFromLocalStorage() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    return jsonToNodes(data);
  } catch {
    return null;
  }
}

export function downloadJson(nodes, filename = "slides.json") {
  const data = nodesToJson(nodes);
  const text = JSON.stringify(data, null, 2);
  const blob = new Blob([text], { type: "application/json" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
