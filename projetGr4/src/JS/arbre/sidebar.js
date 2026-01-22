import { dom } from "./dom.js";
import { appState } from "./state.js";
import { slideIndexToLink } from "./mapping.js";
import { deleteSlideByIndex, setElementLinkInSlidesState, setSlideTitle } from "./actions.js";
import { renderConnections, renderNodes } from "./render.js";

export function renderSidebar() {
  if (!appState.selectedNodeId) {
    dom.sidebarSubtitle.innerText = "Aucune sélection";
    dom.sidebarContent.innerHTML = `
      <div class="sidebar-empty">
        <p>Sélectionnez une slide (rectangle) pour configurer ses éléments.</p>
      </div>`;
    return;
  }

  const node = appState.nodes.find((n) => n.id === appState.selectedNodeId);
  if (!node) return;

  dom.sidebarSubtitle.innerText = `Édition de ${node.label}`;
  dom.sidebarContent.innerHTML = "";

  // --- Titre slide ---
  const labelGroup = document.createElement("div");
  labelGroup.className = "form-group";

  const label = document.createElement("label");
  label.className = "form-label";
  label.textContent = "Nom de la Slide";

  const input = document.createElement("input");
  input.type = "text";
  input.value = node.label;
  input.className = "form-input";
  input.addEventListener("input", () => {
    node.label = input.value;
    setSlideTitle(node.slideIndex, node.label);
    renderNodes();
    renderConnections();
  });

  labelGroup.appendChild(label);
  labelGroup.appendChild(input);
  dom.sidebarContent.appendChild(labelGroup);

  // --- Supprimer slide ---
  const dangerRow = document.createElement("div");
  dangerRow.className = "form-group";

  const delBtn = document.createElement("button");
  delBtn.className = "btn danger";
  delBtn.type = "button";
  delBtn.textContent = "Supprimer cette slide";

  delBtn.addEventListener("click", () => {
    const ok = confirm(`Supprimer "${node.label}" ?\nCette action est irréversible.`);
    if (!ok) return;
    deleteSlideByIndex(node.slideIndex);
  });

  dangerRow.appendChild(delBtn);
  dom.sidebarContent.appendChild(dangerRow);

  const separator = document.createElement("hr");
  separator.className = "separator";
  dom.sidebarContent.appendChild(separator);

  const connTitle = document.createElement("h3");
  connTitle.className = "section-title";
  connTitle.innerText = "Connexions des éléments";
  dom.sidebarContent.appendChild(connTitle);

  if (node.outputs.length === 0) {
    const empty = document.createElement("p");
    empty.style.color = "var(--color-text-muted)";
    empty.style.fontStyle = "italic";
    empty.style.fontSize = "14px";
    empty.innerText = "Cette slide n’a aucun élément dans arbre.elements.";
    dom.sidebarContent.appendChild(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "connection-list";

  node.outputs.forEach((out) => {
    const row = document.createElement("div");
    row.className = "connection-item";

    const header = document.createElement("div");
    header.className = "connection-header";

    const lab = document.createElement("span");
    lab.className = "connection-label";
    lab.textContent = out.name;

    const dot = document.createElement("div");
    dot.className = `status-dot ${out.link ? "active" : ""}`;

    header.appendChild(lab);
    header.appendChild(dot);

    const select = document.createElement("select");
    select.className = "select-input";

    const externalWrap = document.createElement("div");
    externalWrap.style.marginTop = "8px";
    externalWrap.style.display = "none";

    const externalInput = document.createElement("input");
    externalInput.type = "text";
    externalInput.className = "form-input";
    externalInput.placeholder = "https://... ou texte libre";
    externalWrap.appendChild(externalInput);

    const optNone = document.createElement("option");
    optNone.value = "";
    optNone.textContent = "-- Non connecté --";
    select.appendChild(optNone);

    const optExternal = document.createElement("option");
    optExternal.value = "__external__";
    optExternal.textContent = "Lien externe";
    select.appendChild(optExternal);

    const isInternalLink = typeof out.link === "string" && /^\d+$/.test(out.link);
    const isExternalLink = out.link && !isInternalLink;

    if (isExternalLink) {
      select.value = "__external__";
      externalWrap.style.display = "block";
      externalInput.value = out.link;
    }

    // slides dispo (sauf soi-même)
    appState.nodes.forEach((n) => {
      if (n.slideIndex === node.slideIndex) return;
      const o = document.createElement("option");
      o.value = slideIndexToLink(n.slideIndex);
      o.textContent = `Vers: slide_${n.slideIndex + 1} (${n.label})`;
      if (out.link === o.value) o.selected = true;
      select.appendChild(o);
    });

    select.addEventListener("change", () => {
      if (select.value === "") {
        externalWrap.style.display = "none";
        out.link = null;
        dot.className = "status-dot";
        setElementLinkInSlidesState(node.slideIndex, out.elementIndex, null);
        renderNodes();
        renderConnections();
        return;
      }

      if (select.value === "__external__") {
        externalWrap.style.display = "block";
        const v = typeof out.link === "string" && !/^\d+$/.test(out.link) ? out.link : "";
        externalInput.value = v;

        out.link = v || null;
        dot.className = `status-dot ${out.link ? "active" : ""}`;
        setElementLinkInSlidesState(node.slideIndex, out.elementIndex, out.link);

        renderNodes();
        renderConnections();
        return;
      }

      externalWrap.style.display = "none";
      const newLink = select.value;

      out.link = newLink;
      dot.className = "status-dot active";
      setElementLinkInSlidesState(node.slideIndex, out.elementIndex, newLink);

      renderNodes();
      renderConnections();
    });

    externalInput.addEventListener("input", () => {
      if (select.value !== "__external__") return;

      const v = externalInput.value.trim();
      out.link = v ? v : null;
      dot.className = `status-dot ${out.link ? "active" : ""}`;

      setElementLinkInSlidesState(node.slideIndex, out.elementIndex, out.link);

      renderNodes();
      renderConnections();
    });

    row.appendChild(header);
    row.appendChild(select);
    row.appendChild(externalWrap);
    list.appendChild(row);
  });

  dom.sidebarContent.appendChild(list);
}
