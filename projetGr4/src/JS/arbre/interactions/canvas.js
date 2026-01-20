export function setupCanvas({ dom, store, actions, panzoom, onRenderAll }) {
  const { canvasEl } = dom;

  function isBackgroundTarget(target) {
    if (!target) return false;
    // si on clique sur un node => pas background
    if (target.closest && target.closest(".node")) return false;

    return (
      target.id === "canvas" ||
      target.classList.contains("help-text") ||
      target.id === "nodes-layer" ||
      target.id === "svg-layer"
    );
  }

  canvasEl.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return; // clic gauche seulement

    if (isBackgroundTarget(e.target)) {
      // Deselect (comme avant)
      actions.deselectAll();

      // Start pan
      panzoom.startPan(e);
      onRenderAll();
    }
  });
}
