export function getDom() {
  const nodesLayer = document.getElementById("nodes-layer");
  const svgLayer = document.getElementById("svg-layer");
  const sidebarContent = document.getElementById("properties-content");
  const sidebarSubtitle = document.getElementById("sidebar-subtitle");
  const canvasEl = document.getElementById("canvas");
  const btnAdd = document.getElementById("btnAdd");

  // Optionnels (save/load)
  const btnSave = document.getElementById("btnSave");
  const btnLoad = document.getElementById("btnLoad");
  const fileImport = document.getElementById("fileImport");
  const btnEdit = document.getElementById("btnEdit");

  if (!nodesLayer || !svgLayer || !sidebarContent || !sidebarSubtitle || !canvasEl) {
    throw new Error(
      "DOM manquant : vérifie nodes-layer/svg-layer/properties-content/sidebar-subtitle/canvas"
    );
  }

  return {
    nodesLayer,
    svgLayer,
    sidebarContent,
    sidebarSubtitle,
    canvasEl,
    btnAdd,
    btnSave,
    btnLoad,
    fileImport,
    btnEdit,
  };
}
