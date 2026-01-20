import { generateId } from "./utils/ids.js";

export function createActions({ store, onChange }) {
  function refresh() {
    onChange?.();
  }

  function createNode(x = 100, y = 100, select = true) {
    const id = store.consumeNextNodeId();

    const newNode = {
      id,
      x,
      y,
      label: `Rectangle ${store.getNextNodeId()}`, // garde ton style actuel
      buttons: [],
    };

    store.addNode(newNode);

    if (select) {
      selectNode(newNode.id);
    } else {
      refresh();
    }

    return newNode.id;
  }

  function deleteNode(id) {
    store.removeNodeById(id);

    // Remove links pointing to this node
    store.getNodes().forEach((n) => {
      n.buttons.forEach((b) => {
        if (b.target === id) b.target = null;
      });
    });

    if (store.getSelectedNodeId() === id) {
      store.setSelectedNodeId(null);
    }

    refresh();
  }

  function updateNodeButtons(nodeId, count) {
    const node = store.findNodeById(nodeId);
    if (!node) return;

    const currentCount = node.buttons.length;

    if (count > currentCount) {
      for (let i = 0; i < count - currentCount; i++) {
        node.buttons.push({ id: generateId(), target: null });
      }
    } else if (count < currentCount) {
      node.buttons = node.buttons.slice(0, count);
    }

    refresh();
  }

  function linkButton(nodeId, buttonIndex, targetId) {
    const node = store.findNodeById(nodeId);
    if (!node) return;

    if (targetId === "NEW") {
      const newNodeId = createNode(node.x + 300, node.y + buttonIndex * 50, false);
      node.buttons[buttonIndex].target = newNodeId;
    } else {
      node.buttons[buttonIndex].target = targetId ? parseInt(targetId, 10) : null;
    }

    refresh();
  }

  function selectNode(id) {
    store.setSelectedNodeId(id);
    refresh();
  }

  function deselectAll() {
    store.setSelectedNodeId(null);
    refresh();
  }

  function updateLabel(newLabel) {
    const node = store.findNodeById(store.getSelectedNodeId());
    if (!node) return;

    node.label = newLabel;
    refresh();
  }

  return {
    createNode,
    deleteNode,
    updateNodeButtons,
    linkButton,
    selectNode,
    deselectAll,
    updateLabel,
  };
}
