import { state, render, getActive, cryptoId, getSelectedId, setSelectedId } from './editor.js';
import { generateSlideHTML } from './slides.js';

/* =====================================================
    VARIABLES
===================================================== */
const menu = document.getElementById('contextMenu');
let internalClipboard = null; // Stores { type: 'element'|'slide', data: ... }
let targetElementId = null;   // ID of the element right-clicked (if any)

/* =====================================================
    INIT LISTENER
===================================================== */
// ACCEPT slideEl AS ARGUMENT to avoid circular dependency issues
export function initContextMenu(slideElement) {
  if (!slideElement) {
    console.error("Context Menu: slideElement is missing!");
    return;
  }
  
  // Prevent default context menu on the slide area
  slideElement.addEventListener('contextmenu', handleContextMenu);
  
  // Close menu on click anywhere else
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('visible')) {
      menu.classList.remove('visible');
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") menu.classList.remove('visible');
  });
}

/* =====================================================
    HANDLE RIGHT CLICK
===================================================== */
function handleContextMenu(ev) {
  ev.preventDefault();

  // 1. Determine Target
  const elNode = ev.target.closest('.el');
  targetElementId = elNode ? elNode.dataset.id : null;

  // If clicked an element, select it visually
  if (targetElementId) {
    setSelectedId(targetElementId);
    render();
  } else {
    // If clicked bg, deselect everything
    setSelectedId(null);
    render();
  }

  // 2. Generate Menu Items
  const items = targetElementId ? getElementOptions() : getSlideOptions();

  // 3. Render Menu HTML
  menu.innerHTML = items.map(item => {
    if (item.type === 'divider') return `<div class="context-divider"></div>`;
    return `
      <div class="context-item ${item.danger ? 'danger' : ''}" data-action="${item.action}">
        <span class="context-icon">${item.icon || ''}</span>
        <span>${item.label}</span>
      </div>
    `;
  }).join('');

  // 4. Attach Click Events to Items
  menu.querySelectorAll('.context-item').forEach(node => {
    node.addEventListener('click', () => {
      const action = node.dataset.action;
      executeAction(action);
      menu.classList.remove('visible');
    });
  });

  // 5. Position and Show
  // Calculate position relative to viewport
  const { clientX: mouseX, clientY: mouseY } = ev;
  
  menu.style.top = `${mouseY}px`;
  menu.style.left = `${mouseX}px`;
  menu.classList.add('visible');

  // Prevent menu going off-screen
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = `${window.innerWidth - rect.width - 10}px`;
  if (rect.bottom > window.innerHeight) menu.style.top = `${window.innerHeight - rect.height - 10}px`;
}

/* =====================================================
    OPTIONS GENERATORS
===================================================== */
function getSlideOptions() {
  return [
    { label: "Coller", action: "paste", icon: "📋" },
    { type: "divider" },
    { label: "Dupliquer la page", action: "dupPage", icon: "📄" },
    { label: "Nouvelle page", action: "addPage", icon: "➕" },
    { type: "divider" },
    { label: "Télécharger la page", action: "downloadPage", icon: "⬇️" },
    { label: "Supprimer la page", action: "deletePage", icon: "🗑️", danger: true }
  ];
}

function getElementOptions() {
  return [
    { label: "Copier", action: "copy", icon: "📄" },
    { label: "Coller", action: "paste", icon: "📋" },
    { type: "divider" },
    { label: "Mettre au premier plan", action: "front", icon: "⇈" },
    { label: "Avancer", action: "forward", icon: "↑" },
    { label: "Reculer", action: "backward", icon: "↓" },
    { label: "Mettre à l'arrière plan", action: "back", icon: "⇊" },
    { type: "divider" },
    { label: "Ajouter un lien", action: "link", icon: "🔗" },
    { type: "divider" },
    { label: "Supprimer", action: "delete", icon: "🗑️", danger: true }
  ];
}

/* =====================================================
    EXECUTE ACTIONS
===================================================== */
function executeAction(action) {
  const s = getActive();

  switch(action) {
    // --- CLIPBOARD ---
    case 'copy':
      if (targetElementId) {
        const el = s.elements.find(e => e.id === targetElementId);
        if (el) {
          internalClipboard = { type: 'element', data: JSON.parse(JSON.stringify(el)) };
        }
      } else {
        // Copy Slide (if needed in future)
      }
      break;

    case 'paste':
      if (!internalClipboard) return;
      
      if (internalClipboard.type === 'element') {
        const newEl = JSON.parse(JSON.stringify(internalClipboard.data));
        newEl.id = cryptoId();
        // Offset slightly so it doesn't overlap perfectly
        newEl.x += 20;
        newEl.y += 20;
        s.elements.push(newEl);
        setSelectedId(newEl.id);
        render();
      }
      break;

    // --- SLIDE OPS ---
    case 'dupPage':
      document.getElementById('dupSlideBtn').click(); // Reuse existing button logic
      break;
    
    case 'addPage':
      document.getElementById('addSlideBtn').click(); // Reuse existing button logic
      break;

    case 'deletePage':
      if (state.slides.length > 1) {
        // Remove the active slide
        state.slides.splice(state.activeSlide, 1);
        
        // Adjust active index if we deleted the last one
        if (state.activeSlide >= state.slides.length) {
          state.activeSlide = state.slides.length - 1;
        }
        
        setSelectedId(null);
        render();
      } else {
        alert("Impossible de supprimer la dernière page.");
      }
      break;

    case 'downloadPage':
      // Generate HTML for the current slide
      const html = generateSlideHTML(state.activeSlide);
      
      // Create download link
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `slide-${state.activeSlide + 1}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      break;

    // --- ELEMENT OPS ---
    case 'delete':
      if (targetElementId) {
        s.elements = s.elements.filter(e => e.id !== targetElementId);
        setSelectedId(null);
        render();
      }
      break;

    // --- LAYERS ---
    case 'front':
      moveLayer(s, targetElementId, 'front');
      break;
    case 'back':
      moveLayer(s, targetElementId, 'back');
      break;
    case 'forward':
      moveLayer(s, targetElementId, 'forward');
      break;
    case 'backward':
      moveLayer(s, targetElementId, 'backward');
      break;

    // --- LINKING ---
    case 'link':
      addLinkToElement(s, targetElementId);
      break;
  }
}

/* =====================================================
    LAYER LOGIC
===================================================== */
function moveLayer(slide, id, direction) {
  const index = slide.elements.findIndex(e => e.id === id);
  if (index === -1) return;

  const el = slide.elements[index];

  // Remove element from current position
  slide.elements.splice(index, 1);

  if (direction === 'front') {
    slide.elements.push(el);
  } else if (direction === 'back') {
    slide.elements.unshift(el);
  } else if (direction === 'forward') {
    // Insert at index + 1
    const newIndex = Math.min(index + 1, slide.elements.length);
    slide.elements.splice(newIndex, 0, el);
  } else if (direction === 'backward') {
    // Insert at index - 1
    const newIndex = Math.max(index - 1, 0);
    slide.elements.splice(newIndex, 0, el);
  }
  
  render();
}

/* =====================================================
    LINK LOGIC
===================================================== */
function addLinkToElement(slide, id) {
  const el = slide.elements.find(e => e.id === id);
  if (!el) return;

  const input = prompt(
    "Ajouter un lien :\n- Entre 'http://...' pour un site web\n- Entre un numéro (ex: 2) pour aller à une slide", 
    el.link || ""
  );

  if (input !== null) {
    el.link = input.trim();
    // Visual feedback?
    render();
  }
}