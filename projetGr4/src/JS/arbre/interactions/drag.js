export function setupDrag({ dom, store, onRenderAll, actions, panzoom }) {
  // Drag node en coords MONDE (zoom-aware)
  function startDrag(e, nodeId) {
    if (e.button !== 0) return;
    e.stopPropagation();

    // Stop pan si on commence à drag un node
    store.setPanning(false);

    actions.selectNode(nodeId);

    store.setDragging(true);
    store.setDraggedNodeId(nodeId);

    const node = store.findNodeById(nodeId);
    if (!node) return;

    // offset en coords monde : world(mouse) - node(world)
    const w = panzoom.utils.screenToWorld(e.clientX, e.clientY);
    store.setDragOffset(w.x - node.x, w.y - node.y);
  }

  window.addEventListener("arbre:startDrag", (ev) => {
    const { originalEvent, nodeId } = ev.detail || {};
    if (!originalEvent || !nodeId) return;
    startDrag(originalEvent, nodeId);
  });

  window.addEventListener("mousemove", (e) => {
    if (store.isDragging() && store.getDraggedNodeId() !== null) {
      const node = store.findNodeById(store.getDraggedNodeId());
      if (!node) return;

      const w = panzoom.utils.screenToWorld(e.clientX, e.clientY);
      const off = store.getDragOffset();

      node.x = w.x - off.x;
      node.y = w.y - off.y;

      onRenderAll();
    }
  });

  window.addEventListener("mouseup", () => {
    store.setDragging(false);
    store.setDraggedNodeId(null);
  });
}
