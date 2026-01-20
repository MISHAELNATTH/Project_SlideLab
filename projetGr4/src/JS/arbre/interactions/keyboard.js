export function setupKeyboard({ store, actions }) {
  window.addEventListener("keydown", (e) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      if (document.activeElement && document.activeElement.tagName === "INPUT") return;

      const selected = store.getSelectedNodeId();
      if (selected) actions.deleteNode(selected);
    }
  });
}
