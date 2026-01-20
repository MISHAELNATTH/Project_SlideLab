import { renderNodes } from "./nodes.js";
import { renderConnections } from "./connections.js";
import { renderSidebar } from "./sidebar.js";

export function createRenderer({ dom, store, actions }) {
  function render() {
    renderNodes({ dom, store, actions });
    renderConnections({ dom, store });
  }

  function renderAll() {
    render();
    renderSidebar({ dom, store, actions });
  }

  return { render, renderAll };
}
