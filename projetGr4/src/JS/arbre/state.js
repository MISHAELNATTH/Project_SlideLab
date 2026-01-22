// State runtime (source unique = slides_state localStorage)
export const appState = {
  slides_state: null,   // chargé au démarrage
  nodes: [],            // dérivé de slides_state
  selectedNodeId: null,

  // Drag
  isDragging: false,
  dragOffset: { x: 0, y: 0 },
  draggedNodeId: null,
};
