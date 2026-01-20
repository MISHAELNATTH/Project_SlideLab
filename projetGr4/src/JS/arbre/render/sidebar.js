export function renderSidebar({ dom, store, actions }) {
  const { sidebarContent, sidebarSubtitle } = dom;

  const selectedNodeId = store.getSelectedNodeId();
  const nodes = store.getNodes();

  if (!selectedNodeId) {
    sidebarSubtitle.innerText = "Aucune sélection";
    sidebarContent.innerHTML = `
      <div class="sidebar-empty">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p>Sélectionnez un rectangle pour configurer ses boutons et connexions.</p>
      </div>`;
    return;
  }

  const node = store.findNodeById(selectedNodeId);
  if (!node) {
    sidebarSubtitle.innerText = "Aucune sélection";
    sidebarContent.innerHTML = "";
    return;
  }

  sidebarSubtitle.innerText = `Édition de ${node.label}`;
  sidebarContent.innerHTML = "";

  // 1) Rename
  const labelGroup = document.createElement("div");
  labelGroup.className = "form-group";

  const label = document.createElement("label");
  label.className = "form-label";
  label.textContent = "Nom du Rectangle";

  const input = document.createElement("input");
  input.type = "text";
  input.value = node.label;
  input.className = "form-input";
  input.addEventListener("input", () => actions.updateLabel(input.value));

  labelGroup.appendChild(label);
  labelGroup.appendChild(input);
  sidebarContent.appendChild(labelGroup);

  // 2) Buttons count (range + badge)
  const countGroup = document.createElement("div");
  countGroup.className = "form-group";

  const countLabel = document.createElement("label");
  countLabel.className = "form-label";
  countLabel.textContent = "Nombre de boutons (Sorties)";

  const sliderContainer = document.createElement("div");
  sliderContainer.className = "slider-container";

  const range = document.createElement("input");
  range.type = "range";
  range.min = "0";
  range.max = "10";
  range.value = String(node.buttons.length);
  range.className = "slider-input";

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = String(node.buttons.length);

  range.addEventListener("input", () => {
    const v = parseInt(range.value, 10);
    badge.textContent = String(v);
    actions.updateNodeButtons(node.id, v);
  });

  sliderContainer.appendChild(range);
  sliderContainer.appendChild(badge);

  countGroup.appendChild(countLabel);
  countGroup.appendChild(sliderContainer);
  sidebarContent.appendChild(countGroup);

  // Separator
  const separator = document.createElement("hr");
  separator.className = "separator";
  sidebarContent.appendChild(separator);

  // 3) Connections
  const connTitle = document.createElement("h3");
  connTitle.className = "section-title";
  connTitle.innerText = "Connexions";
  sidebarContent.appendChild(connTitle);

  if (node.buttons.length === 0) {
    const empty = document.createElement("p");
    empty.style.color = "var(--color-text-muted)";
    empty.style.fontStyle = "italic";
    empty.style.fontSize = "14px";
    empty.innerText = "Ce rectangle n'a aucun bouton de sortie.";
    sidebarContent.appendChild(empty);
  } else {
    const buttonList = document.createElement("div");
    buttonList.className = "connection-list";

    node.buttons.forEach((btn, index) => {
      const row = document.createElement("div");
      row.className = "connection-item";

      const header = document.createElement("div");
      header.className = "connection-header";

      const lab = document.createElement("span");
      lab.className = "connection-label";
      lab.textContent = `Bouton ${index + 1}`;

      const dot = document.createElement("div");
      dot.className = `status-dot ${btn.target ? "active" : ""}`;

      header.appendChild(lab);
      header.appendChild(dot);

      const select = document.createElement("select");
      select.className = "select-input";

      // options
      const optNone = document.createElement("option");
      optNone.value = "";
      optNone.textContent = "-- Non connecté --";
      select.appendChild(optNone);

      const optNew = document.createElement("option");
      optNew.value = "NEW";
      optNew.textContent = "+ Créer nouveau";
      select.appendChild(optNew);

      nodes.forEach((other) => {
        if (other.id === node.id) return;
        const o = document.createElement("option");
        o.value = String(other.id);
        o.textContent = `Vers: ${other.label}`;
        if (btn.target === other.id) o.selected = true;
        select.appendChild(o);
      });

      select.addEventListener("change", () => {
        actions.linkButton(node.id, index, select.value);
      });

      row.appendChild(header);
      row.appendChild(select);
      buttonList.appendChild(row);
    });

    sidebarContent.appendChild(buttonList);
  }

  // 4) Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn-delete";
  deleteBtn.innerText = "Supprimer ce rectangle";
  deleteBtn.addEventListener("click", () => actions.deleteNode(node.id));
  sidebarContent.appendChild(deleteBtn);
}
