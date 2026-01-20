export function createStore() {
  const state = {
    nodes: [{ id: 1, x: 100, y: 100, label: "Rectangle 1", buttons: [] }],
    nextNodeId: 2,
    selectedNodeId: null,

    // Dragging state (node)
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    draggedNodeId: null,

    // Camera (pan + zoom)
    camera: { x: 0, y: 0, zoom: 1 },

    // Panning state (background)
    isPanning: false,
    panStart: { x: 0, y: 0 },
    cameraStart: { x: 0, y: 0 },
  };

  return {
    // --- getters ---
    getNodes: () => state.nodes,
    getSelectedNodeId: () => state.selectedNodeId,
    getNextNodeId: () => state.nextNodeId,

    // --- selection ---
    setSelectedNodeId: (id) => {
      state.selectedNodeId = id;
    },

    // --- nodes helpers ---
    findNodeById: (id) => state.nodes.find((n) => n.id === id) || null,
    addNode: (node) => state.nodes.push(node),
    removeNodeById: (id) => {
      state.nodes = state.nodes.filter((n) => n.id !== id);
    },

    // Replace full nodes list (load JSON)
    setNodes: (nodes) => {
      state.nodes = nodes;
    },

    // --- next id ---
    consumeNextNodeId: () => {
      const id = state.nextNodeId;
      state.nextNodeId += 1;
      return id;
    },
    setNextNodeId: (v) => {
      state.nextNodeId = v;
    },

    // --- dragging node ---
    setDragging: (val) => (state.isDragging = val),
    isDragging: () => state.isDragging,
    setDraggedNodeId: (id) => (state.draggedNodeId = id),
    getDraggedNodeId: () => state.draggedNodeId,
    setDragOffset: (x, y) => {
      state.dragOffset.x = x;
      state.dragOffset.y = y;
    },
    getDragOffset: () => state.dragOffset,

    // --- camera ---
    getCamera: () => ({ ...state.camera }),
    setCamera: (cam) => {
      state.camera.x = cam.x;
      state.camera.y = cam.y;
      state.camera.zoom = cam.zoom;
    },

    // --- panning background ---
    setPanning: (v) => (state.isPanning = v),
    isPanning: () => state.isPanning,

    setPanStart: (x, y) => {
      state.panStart.x = x;
      state.panStart.y = y;
    },
    getPanStart: () => ({ ...state.panStart }),

    setCameraStart: (x, y) => {
      state.cameraStart.x = x;
      state.cameraStart.y = y;
    },
    getCameraStart: () => ({ ...state.cameraStart }),

    // access state directly (debug/advanced)
    _state: state,
  };
}
