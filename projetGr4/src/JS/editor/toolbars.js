/**
 * toolbars.js (editor)
 * Fournit la logique de barres d'outils intégrées aux éléments (formatage
 * texte, couleurs, dropdowns custom, contrôles de table, etc.). Les fonctions
 * exposées créent des conteneurs DOM prêts à l'emploi et évitent la fuite
 * d'événements vers l'éditeur principal.
 */
// src/JS/editor/toolbars.js

let renderFn = null;
/**
 * configureToolbars({ render })
 * Enregistre la fonction `render` pour permettre aux contrôles
 * (ex: color picker change) de déclencher un rerender lorsque nécessaire.
 */
export function configureToolbars({ render }) {
  renderFn = render;
}
function rerender() {
  if (typeof renderFn === "function") renderFn();
}

// =====================================================
//  TEXT FORMATTING HELPERS
// =====================================================
/**
 * applyTextFormatting(command, value)
 * Applique une commande de formatage via `document.execCommand` si
 * une sélection texte est active. Utilisé pour gérer les formats inline
 * lorsque l'utilisateur a sélectionné une portion de texte.
 */
function applyTextFormatting(command, value = null) {
  const selection = window.getSelection();
  if (!selection.toString()) return;

  if (value) document.execCommand(command, false, value);
  else document.execCommand(command, false, null);
}

/**
 * lockPointerEvents(el)
 * Empêche la propagation de divers events pour un élément donné afin
 * d'éviter que les interactions internes (ex: color pickers, dropdowns)
 * déclenchent des handlers globaux (sélection, drag...).
 */
function lockPointerEvents(el) {
  ["pointerdown", "mousedown", "click"].forEach((evt) => {
    el.addEventListener(evt, (e) => {
      e.stopPropagation();
    });
  });
}

/**
 * lockPointerEventsDeep(root)
 * Même principe que `lockPointerEvents` mais en capture pour empêcher
 * complètement la bulle d'events depuis tout le subtree (utile pour
 * les overlays de color picker injectés dynamiquement).
 */
function lockPointerEventsDeep(root) {
  const events = ["pointerdown", "pointermove", "pointerup", "mousedown", "mousemove", "mouseup", "click"];
  events.forEach((evt) => {
    root.addEventListener(evt, (e) => {
      e.stopPropagation();
    }, true); // <- capture: important pour couper avant l'éditeur
  });
}


// =====================================================
//  CUSTOM DROPDOWN HELPER
// =====================================================
function createCustomDropdown(options, initialValue, onChange) {
  const container = document.createElement("div");
  container.className = "custom-dropdown";

  const button = document.createElement("button");
  button.className = "custom-dropdown-button";
  button.textContent =
    options.find((opt) => opt.value === initialValue)?.label || initialValue;

  const menu = document.createElement("div");
  menu.className = "custom-dropdown-menu";
  menu.style.display = "none";
  lockPointerEvents(menu);
  lockPointerEvents(button);

  options.forEach((option) => {
    const item = document.createElement("div");
    item.className = "custom-dropdown-item";
    if (option.value === initialValue) item.classList.add("selected");
    item.textContent = option.label;
    item.addEventListener("click", () => {
      button.textContent = option.label;
      menu.style.display = "none";
      menu
        .querySelectorAll(".custom-dropdown-item")
        .forEach((el) => el.classList.remove("selected"));
      item.classList.add("selected");
      onChange(option.value);
    });
    menu.appendChild(item);
  });

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === "none" ? "flex" : "none";
  });

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) menu.style.display = "none";
  });

  container.appendChild(button);
  container.appendChild(menu);
  return container;
}
/**
 * createTextToolbar(element)
 * Crée la toolbar attachée aux éléments de type `text` ou `button`.
 * Elle contient : color picker, font family dropdown, taille, bold/italic,
 * alignements. Les actions appliquent soit un format sur la sélection
 * (via execCommand) soit modifient directement les propriétés de `element`
 * puis provoquent un rerender.
 */
export function createTextToolbar(element) {
  const toolbar = document.createElement("div");
  toolbar.className = "text-toolbar";
  toolbar.addEventListener("mousedown", (ev) => ev.stopPropagation());
  toolbar.addEventListener("click", (ev) => ev.stopPropagation());

  function lockColorPickerOverlaySoon() {
    // on attend que le picker soit injecté dans le DOM et on coupe
    // la propagation pour éviter des événements qui déclencheraient
    // des comportements globaux (ex: désélection).
    setTimeout(() => {
        const overlay =
        document.querySelector(".pcr-app") ||          // Pickr (très courant)
        document.querySelector(".color-picker") ||
        document.querySelector(".colorPicker") ||
        document.querySelector(".picker") ||
        document.querySelector(".vc-sketch") ||        // vue-color
        document.querySelector(".react-colorful");     // react-colorful

        if (overlay) lockPointerEventsDeep(overlay);
    }, 0);
  }

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = element.color || "#111827";
  colorInput.title = "Couleur du texte";
  
  lockPointerEvents(colorInput);

  colorInput.addEventListener("input", (e) => {
    // Live preview sans rerender (évite fermeture/flash)
    element.color = e.target.value;

    // On met à jour directement le DOM du bloc sélectionné si possible
    const host = colorInput.closest(".el");
    if (host) host.style.color = element.color;
    });

    // Commit (rerender) seulement quand l'utilisateur relâche/valide
    colorInput.addEventListener("change", () => {
    rerender();
  });

  const fontDropdown = createCustomDropdown(
    [
      { value: "Arial", label: "Arial" },
      { value: "Georgia", label: "Georgia" },
      { value: "Times New Roman", label: "Times New Roman" },
      { value: "Courier New", label: "Courier New" },
      { value: "Verdana", label: "Verdana" },
    ],
    element.fontFamily || "Arial",
    (fontValue) => {
      const selection = window.getSelection();
      if (selection.toString()) applyTextFormatting("fontName", fontValue);
      else {
        element.fontFamily = fontValue;
        rerender();
      }
    }
  );

  const sizeInput = document.createElement("input");
  sizeInput.type = "number";
  sizeInput.value = element.fontSize || 28;
  sizeInput.min = 8;
  sizeInput.max = 120;
  sizeInput.style.width = "60px";
  sizeInput.addEventListener("change", (e) => {
    const selection = window.getSelection();
    if (selection.toString()) {
      try {
        const range = selection.getRangeAt(0);
        const span = document.createElement("span");
        span.style.fontSize = e.target.value + "px";
        range.surroundContents(span);
      } catch (err) {
        applyTextFormatting("fontSize", 7);
      }
    } else {
      element.fontSize = parseInt(e.target.value);
      rerender();
    }
  });

  const boldBtn = document.createElement("button");
  boldBtn.innerHTML = "B";
  boldBtn.title = "Gras";
  boldBtn.className =
    element.fontWeight === "bold" || element.fontWeight >= 700 ? "active" : "";
  boldBtn.addEventListener("click", () => {
    const selection = window.getSelection();
    if (selection.toString()) applyTextFormatting("bold");
    else {
      element.fontWeight =
        element.fontWeight === "bold" || element.fontWeight >= 700 ? 400 : 700;
      rerender();
    }
  });

  const italicBtn = document.createElement("button");
  italicBtn.innerHTML = "I";
  italicBtn.title = "Italique";
  italicBtn.style.fontStyle = "italic";
  italicBtn.addEventListener("click", () => {
    const selection = window.getSelection();
    if (selection.toString()) applyTextFormatting("italic");
    else {
      element.fontStyle = element.fontStyle === "italic" ? "normal" : "italic";
      rerender();
    }
  });

  const alignLeft = document.createElement("button");
  alignLeft.innerHTML = "⫷";
  alignLeft.title = "Aligner à gauche";
  alignLeft.className = element.textAlign === "left" ? "active" : "";
  alignLeft.addEventListener("click", () => {
    const selection = window.getSelection();
    if (selection.toString()) applyTextFormatting("justifyLeft");
    else {
      element.textAlign = "left";
      rerender();
    }
  });

  const alignCenter = document.createElement("button");
  alignCenter.innerHTML = "≡";
  alignCenter.title = "Centrer";
  alignCenter.className = element.textAlign === "center" ? "active" : "";
  alignCenter.addEventListener("click", () => {
    const selection = window.getSelection();
    if (selection.toString()) applyTextFormatting("justifyCenter");
    else {
      element.textAlign = "center";
      rerender();
    }
  });

  const alignRight = document.createElement("button");
  alignRight.innerHTML = "⫸";
  alignRight.title = "Aligner à droite";
  alignRight.className = element.textAlign === "right" ? "active" : "";
  alignRight.addEventListener("click", () => {
    const selection = window.getSelection();
    if (selection.toString()) applyTextFormatting("justifyRight");
    else {
      element.textAlign = "right";
      rerender();
    }
  });

  toolbar.appendChild(colorInput);
  toolbar.appendChild(fontDropdown);
  lockPointerEvents(fontDropdown);
  toolbar.appendChild(sizeInput);
  toolbar.appendChild(document.createElement("div")).className = "divider";
  toolbar.appendChild(boldBtn);
  toolbar.appendChild(italicBtn);
  toolbar.appendChild(document.createElement("div")).className = "divider";
  toolbar.appendChild(alignLeft);
  toolbar.appendChild(alignCenter);
  toolbar.appendChild(alignRight);

  return toolbar;
}

export function createTableControls(element) {
  const controls = document.createElement("div");
  controls.className = "table-controls";
  controls.addEventListener("mousedown", (ev) => ev.stopPropagation());
  controls.addEventListener("click", (ev) => ev.stopPropagation());

  const addRowBtn = document.createElement("button");
  addRowBtn.innerHTML = "+ Ligne";
  addRowBtn.addEventListener("click", () => {
    element.rows = (element.rows || 3) + 1;
    if (!element.data) element.data = [];
    element.data.push(Array(element.cols || 3).fill(""));
    rerender();
  });
  controls.appendChild(addRowBtn);

  const removeRowBtn = document.createElement("button");
  removeRowBtn.innerHTML = "- Ligne";
  removeRowBtn.addEventListener("click", () => {
    if ((element.rows || 3) > 1) {
      element.rows = (element.rows || 3) - 1;
      if (element.data) element.data.pop();
      rerender();
    }
  });
  controls.appendChild(removeRowBtn);

  const div1 = document.createElement("div");
  div1.className = "divider";
  controls.appendChild(div1);

  const addColBtn = document.createElement("button");
  addColBtn.innerHTML = "+ Colonne";
  addColBtn.addEventListener("click", () => {
    element.cols = (element.cols || 3) + 1;
    if (!element.data)
      element.data = Array(element.rows || 3)
        .fill(null)
        .map(() => Array(element.cols).fill(""));
    else element.data.forEach((row) => row.push(""));
    rerender();
  });
  controls.appendChild(addColBtn);

  const removeColBtn = document.createElement("button");
  removeColBtn.innerHTML = "- Colonne";
  removeColBtn.addEventListener("click", () => {
    if ((element.cols || 3) > 1) {
      element.cols = (element.cols || 3) - 1;
      if (element.data) element.data.forEach((row) => row.pop());
      rerender();
    }
  });
  controls.appendChild(removeColBtn);

  const div2 = document.createElement("div");
  div2.className = "divider";
  controls.appendChild(div2);

  const borderColor = document.createElement("input");
  borderColor.type = "color";
  borderColor.value = element.borderColor || "#cccccc";
  borderColor.addEventListener("input", (e) => {
    element.borderColor = e.target.value;
    rerender();
  });

  borderColor.addEventListener("pointerdown", () => {
    lockColorPickerOverlaySoon();
  });

  controls.appendChild(borderColor);

  const headerColor = document.createElement("input");
  headerColor.type = "color";
  headerColor.value = element.headerColor || "#f3f4f6";
  headerColor.addEventListener("input", (e) => {
    element.headerColor = e.target.value;
    rerender();
  });
  controls.appendChild(headerColor);

  return controls;
}

export function createShapeControls(element) {
  const controls = document.createElement("div");
  controls.className = "shape-controls";
  controls.addEventListener("mousedown", (ev) => ev.stopPropagation());
  controls.addEventListener("click", (ev) => ev.stopPropagation());

  function lockColorPickerOverlaySoon() {
    // on attend que le picker soit injecté dans le DOM
    setTimeout(() => {
        const overlay =
        document.querySelector(".pcr-app") ||          // Pickr (très courant)
        document.querySelector(".color-picker") ||
        document.querySelector(".colorPicker") ||
        document.querySelector(".picker") ||
        document.querySelector(".vc-sketch") ||        // vue-color
        document.querySelector(".react-colorful");     // react-colorful

        if (overlay) lockPointerEventsDeep(overlay);
    }, 0);
  }


  const shapeGroup = document.createElement("div");
  shapeGroup.className = "control-group";

  const shapeLabel = document.createElement("label");
  shapeLabel.textContent = "Forme:";

  const shapeDropdown = createCustomDropdown(
    [
      { value: "rectangle", label: "Rectangle" },
      { value: "circle", label: "Cercle" },
      { value: "triangle", label: "Triangle" },
      { value: "star", label: "Étoile" },
      { value: "diamond", label: "Losange" },
    ],
    element.shapeType || "rectangle",
    (shapeValue) => {
      element.shapeType = shapeValue;
      rerender();
    }
  );

  shapeGroup.appendChild(shapeLabel);
  shapeGroup.appendChild(shapeDropdown);

  const fillGroup = document.createElement("div");
  fillGroup.className = "control-group";

  const fillLabel = document.createElement("label");
  fillLabel.textContent = "Remplissage:";

  const fillColor = document.createElement("input");
  fillColor.type = "color";
  fillColor.value = element.fillColor || "#7c5cff";

  lockPointerEvents(fillColor);

  fillColor.addEventListener("pointerdown", () => {
    lockColorPickerOverlaySoon();
  });

  // Live preview sans rerender (sinon le picker se ferme)
  fillColor.addEventListener("input", (e) => {
    element.fillColor = e.target.value;

    const host = fillColor.closest(".el");
    const shape = host?.querySelector(".shape-content-wrapper");
    if (shape) shape.style.background = element.fillColor;
  });

  // Commit (rerender) seulement quand tu relâches / valides
  fillColor.addEventListener("change", () => {
    rerender();
  });


  fillGroup.appendChild(fillLabel);
  fillGroup.appendChild(fillColor);

  const borderGroup = document.createElement("div");
  borderGroup.className = "control-group";

  const borderLabel = document.createElement("label");
  borderLabel.textContent = "Bordure:";

  const borderColor = document.createElement("input");
  borderColor.type = "color";
  borderColor.value = element.borderColor || "#37d6ff";

  lockPointerEvents(borderColor);

  borderColor.addEventListener("pointerdown", () => {
    lockColorPickerOverlaySoon();
  });

  // Live preview sans rerender (sinon le picker se ferme)
  borderColor.addEventListener("input", (e) => {
    element.borderColor = e.target.value;

    const host = borderColor.closest(".el");
    const shape = host?.querySelector(".shape-content-wrapper");
    if (shape) shape.style.borderColor = element.borderColor;
  });

  // Commit (rerender) seulement quand tu relâches / valides
  borderColor.addEventListener("change", () => {
    rerender();
  });


  borderGroup.appendChild(borderLabel);
  borderGroup.appendChild(borderColor);

  const opacityGroup = document.createElement("div");
  opacityGroup.className = "control-group";

  const opacityLabel = document.createElement("label");
  opacityLabel.textContent = "Opacité:";

  const opacityValue = document.createElement("span");
  opacityValue.className = "opacity-value";
  opacityValue.textContent =
    Math.round((element.opacity !== undefined ? element.opacity : 1) * 100) +
    "%";

  const opacitySlider = document.createElement("input");
  opacitySlider.type = "range";
  opacitySlider.min = 0;
  opacitySlider.max = 1;
  opacitySlider.step = 0.01;
  opacitySlider.value = element.opacity !== undefined ? element.opacity : 1;

  lockPointerEvents(opacitySlider);
  lockPointerEvents(opacityGroup); // optionnel mais utile

    // Live update sans rerender pendant le drag
  opacitySlider.addEventListener("input", (e) => {
    element.opacity = parseFloat(e.target.value);
    opacityValue.textContent = Math.round(element.opacity * 100) + "%";

    // Update direct du visuel de la shape (sans reconstruire la toolbar)
    const host = opacitySlider.closest(".el");
    const shape = host?.querySelector(".shape-content-wrapper");
    if (shape) shape.style.opacity = element.opacity;
    });

    // Commit après le drag
    opacitySlider.addEventListener("change", () => {
    rerender();
  });


  opacityGroup.appendChild(opacityLabel);
  opacityGroup.appendChild(opacitySlider);
  opacityGroup.appendChild(opacityValue);

  controls.appendChild(shapeGroup);
  controls.appendChild(fillGroup);
  controls.appendChild(borderGroup);
  controls.appendChild(opacityGroup);

  return controls;
}
