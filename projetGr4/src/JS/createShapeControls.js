/**
 * createShapeControls.js
 * Fournit des barres d'outils dynamiques pour les types d'éléments
 * (texte, tableau, etc.). Chaque fonction crée un conteneur DOM
 * avec contrôles (couleur, taille, alignement...) et lie les events
 * pour modifier l'élément en mémoire puis appeler `render()`.
 */
import { render } from "./editor.js";

// =====================================================
//  TOOLBARS
// =====================================================
export function createTextToolbar(element) {
  const toolbar = document.createElement("div");
  toolbar.className = "text-toolbar";
  toolbar.addEventListener("mousedown", (ev) => ev.stopPropagation());
  toolbar.addEventListener("click", (ev) => ev.stopPropagation());
  
  // Color picker
  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = element.color || "#111827";
  colorInput.title = "Couleur du texte";
  colorInput.addEventListener("input", (e) => {
    element.color = e.target.value;
    render();
  });
  
  // Font family
  const fontSelect = document.createElement("select");
  fontSelect.innerHTML = `
    <option value="Arial" ${element.fontFamily === "Arial" ? "selected" : ""}>Arial</option>
    <option value="Georgia" ${element.fontFamily === "Georgia" ? "selected" : ""}>Georgia</option>
    <option value="Times New Roman" ${element.fontFamily === "Times New Roman" ? "selected" : ""}>Times New Roman</option>
    <option value="Courier New" ${element.fontFamily === "Courier New" ? "selected" : ""}>Courier New</option>
    <option value="Verdana" ${element.fontFamily === "Verdana" ? "selected" : ""}>Verdana</option>
  `;
  fontSelect.addEventListener("change", (e) => {
    element.fontFamily = e.target.value;
    render();
  });
  
  // Font size
  const sizeInput = document.createElement("input");
  sizeInput.type = "number";
  sizeInput.value = element.fontSize || 28;
  sizeInput.min = 8;
  sizeInput.max = 120;
  sizeInput.style.width = "60px";
  sizeInput.addEventListener("change", (e) => {
    element.fontSize = parseInt(e.target.value);
    render();
  });
  
  // Bold
  const boldBtn = document.createElement("button");
  boldBtn.innerHTML = "B";
  boldBtn.title = "Gras";
  boldBtn.className = element.fontWeight === "bold" || element.fontWeight >= 700 ? "active" : "";
  boldBtn.addEventListener("click", () => {
    element.fontWeight = element.fontWeight === "bold" || element.fontWeight >= 700 ? 400 : 700;
    render();
  });
  
  // Italic
  const italicBtn = document.createElement("button");
  italicBtn.innerHTML = "I";
  italicBtn.title = "Italique";
  italicBtn.style.fontStyle = "italic";
  italicBtn.addEventListener("click", () => {
    element.fontStyle = element.fontStyle === "italic" ? "normal" : "italic";
    render();
  });
  
  // Alignment
  const alignLeft = document.createElement("button");
  alignLeft.innerHTML = "⫷";
  alignLeft.title = "Aligner à gauche";
  alignLeft.className = element.textAlign === "left" ? "active" : "";
  alignLeft.addEventListener("click", () => {
    element.textAlign = "left";
    render();
  });
  
  const alignCenter = document.createElement("button");
  alignCenter.innerHTML = "≡";
  alignCenter.title = "Centrer";
  alignCenter.className = element.textAlign === "center" ? "active" : "";
  alignCenter.addEventListener("click", () => {
    element.textAlign = "center";
    render();
  });
  
  const alignRight = document.createElement("button");
  alignRight.innerHTML = "⫸";
  alignRight.title = "Aligner à droite";
  alignRight.className = element.textAlign === "right" ? "active" : "";
  alignRight.addEventListener("click", () => {
    element.textAlign = "right";
    render();
  });
  
  toolbar.appendChild(colorInput);
  toolbar.appendChild(fontSelect);
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
window.addEventListener("unhandledrejection", (e) => {
  console.warn("Unhandled promise rejection:", e.reason);
});

export function createTableControls(element) {
  const controls = document.createElement("div");
  controls.className = "table-controls";
  controls.addEventListener("mousedown", (ev) => ev.stopPropagation());
  controls.addEventListener("click", (ev) => ev.stopPropagation());
  
  // Add row button
  const addRowBtn = document.createElement("button");
  addRowBtn.innerHTML = "+ Ligne";
  addRowBtn.title = "Ajouter une ligne";
  addRowBtn.addEventListener("click", () => {
    element.rows = (element.rows || 3) + 1;
    if (!element.data) element.data = [];
    element.data.push(Array(element.cols || 3).fill(""));
    render();
  });
  
  // Remove row button
  const removeRowBtn = document.createElement("button");
  removeRowBtn.innerHTML = "- Ligne";
  removeRowBtn.title = "Supprimer une ligne";
  removeRowBtn.addEventListener("click", () => {
    if ((element.rows || 3) > 2) {
      element.rows = (element.rows || 3) - 1;
      if (element.data) element.data.pop();
      render();
    }
  });
  
  // Add column button
  const addColBtn = document.createElement("button");
  addColBtn.innerHTML = "+ Colonne";
  addColBtn.title = "Ajouter une colonne";
  addColBtn.addEventListener("click", () => {
    element.cols = (element.cols || 3) + 1;
    if (!element.data) element.data = Array(element.rows || 3).fill(null).map(() => Array(element.cols).fill(""));
    else element.data.forEach(row => row.push(""));
    render();
  });
  
  // Remove column button
  const removeColBtn = document.createElement("button");
  removeColBtn.innerHTML = "- Colonne";
  removeColBtn.title = "Supprimer une colonne";
  removeColBtn.addEventListener("click", () => {
    if ((element.cols || 3) > 2) {
      element.cols = (element.cols || 3) - 1;
      if (element.data) element.data.forEach(row => row.pop());
      render();
    }
  });
  
  // Border color
  const borderGroup = document.createElement("div");
  borderGroup.className = "control-group";
  
  const borderLabel = document.createElement("label");
  borderLabel.textContent = "Bordure:";
  
  const borderColor = document.createElement("input");
  borderColor.type = "color";
  borderColor.value = element.borderColor || "#cccccc";
  borderColor.addEventListener("input", (e) => {
    element.borderColor = e.target.value;
    render();
  });
  
  borderGroup.appendChild(borderLabel);
  borderGroup.appendChild(borderColor);
  
  // Header color
  const headerGroup = document.createElement("div");
  headerGroup.className = "control-group";
  
  const headerLabel = document.createElement("label");
  headerLabel.textContent = "En-tête:";
  
  const headerColor = document.createElement("input");
  headerColor.type = "color";
  headerColor.value = element.headerColor || "#f3f4f6";
  headerColor.addEventListener("input", (e) => {
    element.headerColor = e.target.value;
    render();
  });
  
  headerGroup.appendChild(headerLabel);
  headerGroup.appendChild(headerColor);
  
  controls.appendChild(addRowBtn);
  controls.appendChild(removeRowBtn);
  controls.appendChild(addColBtn);
  controls.appendChild(removeColBtn);
  controls.appendChild(borderGroup);
  controls.appendChild(headerGroup);
  
  return controls;
}

export function createShapeControls(element) {
  const controls = document.createElement("div");
  controls.className = "shape-controls";
  controls.addEventListener("mousedown", (ev) => ev.stopPropagation());
  controls.addEventListener("click", (ev) => ev.stopPropagation());
  
  
  // Shape type selector
  const shapeGroup = document.createElement("div");
  shapeGroup.className = "control-group";
  
  const shapeLabel = document.createElement("label");
  shapeLabel.textContent = "Forme:";
  
  const shapeSelect = document.createElement("select");
  shapeSelect.innerHTML = `
    <option value="rectangle" ${element.shapeType === "rectangle" ? "selected" : ""}>Rectangle</option>
    <option value="circle" ${element.shapeType === "circle" ? "selected" : ""}>Cercle</option>
    <option value="triangle" ${element.shapeType === "triangle" ? "selected" : ""}>Triangle</option>
    <option value="star" ${element.shapeType === "star" ? "selected" : ""}>Étoile</option>
    <option value="diamond" ${element.shapeType === "diamond" ? "selected" : ""}>Losange</option>
  `;
  shapeSelect.addEventListener("change", (e) => {
    element.shapeType = e.target.value;
    render();
  });
  
  shapeGroup.appendChild(shapeLabel);
  shapeGroup.appendChild(shapeSelect);
  
  // Fill color
  const fillGroup = document.createElement("div");
  fillGroup.className = "control-group";
  
  const fillLabel = document.createElement("label");
  fillLabel.textContent = "Remplissage:";
  
  const fillColor = document.createElement("input");
  fillColor.type = "color";
  fillColor.value = element.fillColor || "#7c5cff";
  fillColor.addEventListener("input", (e) => {
    element.fillColor = e.target.value;
    render();
  });
  
  fillGroup.appendChild(fillLabel);
  fillGroup.appendChild(fillColor);
  
  // Border color
  const borderGroup = document.createElement("div");
  borderGroup.className = "control-group";
  
  const borderLabel = document.createElement("label");
  borderLabel.textContent = "Bordure:";
  
  const borderColor = document.createElement("input");
  borderColor.type = "color";
  borderColor.value = element.borderColor || "#37d6ff";
  borderColor.addEventListener("input", (e) => {
    element.borderColor = e.target.value;
    render();
  });
  
  borderGroup.appendChild(borderLabel);
  borderGroup.appendChild(borderColor);
  
  // Opacity
  const opacityGroup = document.createElement("div");
  opacityGroup.className = "control-group";
  
  const opacityLabel = document.createElement("label");
  opacityLabel.textContent = "Opacité:";
  
  const opacityValue = document.createElement("span");
  opacityValue.className = "opacity-value";
  opacityValue.textContent = Math.round((element.opacity !== undefined ? element.opacity : 1) * 100) + "%";
  
  const opacitySlider = document.createElement("input");
  opacitySlider.type = "range";
  opacitySlider.min = 0;
  opacitySlider.max = 1;
  opacitySlider.step = 0.01;
  opacitySlider.value = element.opacity !== undefined ? element.opacity : 1;
  opacitySlider.addEventListener("input", (e) => {
    element.opacity = parseFloat(e.target.value);
    opacityValue.textContent = Math.round(e.target.value * 100) + "%";
    render();
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