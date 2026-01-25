/**
 * state.js (arbre)
 * État runtime pour le module "arbre" : representation des nodes,
 * sélection courante et état de drag. La source de vérité principale
 * reste `slides_state` qui est chargée dans `appState.slides_state`.
 */
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
