import { appState } from "./state.js";
import { requestSave } from "./storage.js";
import { buildGraphFromSlidesState } from "./buildGraph.js";

export function exportJsonDownload() {
  try {
    const data = JSON.stringify(appState.slides_state ?? {}, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "slides_state.json";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Export JSON failed:", e);
  }
}

export function importFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      appState.slides_state = parsed;
      requestSave();
      buildGraphFromSlidesState();
    } catch (e) {
      console.error("Import JSON invalide:", e);
      alert("Fichier JSON invalide.");
    }
  };
  reader.readAsText(file);
}
