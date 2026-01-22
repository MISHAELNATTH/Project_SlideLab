import { thumbsEl, state, zoomChip, cryptoId, setSelectedId, render } from './editor.js';
import { getElementStyles, getElementClasses, getSlideBackgroundStyle, px } from './styleHelper.js';

/* =========================
   MODE PRÉSENTATION
========================== */

let presentationIndex = 0;

  const presentBtn = document.getElementById("presentBtn");
  if (presentBtn) {
    presentBtn.addEventListener('click', startPresentation);
  }



  function startPresentation() {
    // 1. Create Container Overlay
    const overlay = document.createElement("div");
    overlay.id = "presentation-overlay";
    Object.assign(overlay.style, {
      position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh",
      backgroundColor: "black", zIndex: "9999", display: "flex",
      alignItems: "center", justifyContent: "center"
    });

    // 2. Create Slide Container (Scaled)
    const slideContainer = document.createElement("div");
    slideContainer.id = "presentation-slide";
    // Base dimensions matching your editor logic (960x540)
    Object.assign(slideContainer.style, {
      position: "relative", width: "960px", height: "540px",
      backgroundColor: "white", overflow: "hidden", boxShadow: "0 0 50px rgba(0,0,0,0.5)"
    });

    overlay.appendChild(slideContainer);
    document.body.appendChild(overlay);

    // 3. Handle Fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(e => {
        console.warn("Fullscreen request denied:", e);
      });
    }

    // 4. Render Initial Slide
    presentationIndex = state.activeSlide; // Start from currently selected slide
    renderPresentationSlide(presentationIndex, slideContainer);
    fitPresentationToScreen(slideContainer);

    // 5. Events (Resize & Navigation)
    // We attach these AFTER rendering to ensure they exist
    window.addEventListener("resize", onWindowResize);
    document.addEventListener("keydown", handlePresentationKeys);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    // Cleanup on exit
    //document.addEventListener("fullscreenchange", () => {
    //  if (!document.fullscreenElement) closePresentation();
    //});
  }

  // Separate function for resize to easily remove it later
  function onWindowResize() {
    const container = document.getElementById("presentation-slide");
    if (container) fitPresentationToScreen(container);
  }

  // Separate function for fullscreen change
  function onFullscreenChange() {
    if (!document.fullscreenElement) {
      closePresentation();
    }
  }

  function closePresentation() {
    const overlay = document.getElementById("presentation-overlay");
    if (overlay) overlay.remove();
    document.removeEventListener("keydown", handlePresentationKeys);
    // Optional: Restore window size logic if needed
    window.removeEventListener("resize", onWindowResize);
    document.removeEventListener("fullscreenchange", onFullscreenChange);
  }

  function handlePresentationKeys(ev) {
    if (ev.key === "ArrowRight" || ev.key === " " || ev.key === "Enter") {
      nextSlide();
    } else if (ev.key === "ArrowLeft") {
      prevSlide();
    } else if (ev.key === "Escape") {
      if (document.fullscreenElement) document.exitFullscreen();
      closePresentation();
    }
  }

  function nextSlide() {
    if (presentationIndex < state.slides.length - 1) {
      presentationIndex++;
      const container = document.getElementById("presentation-slide");
      renderPresentationSlide(presentationIndex, container);
    }
  }

  function prevSlide() {
    if (presentationIndex > 0) {
      presentationIndex--;
      const container = document.getElementById("presentation-slide");
      renderPresentationSlide(presentationIndex, container);
    }
  }



function fitPresentationToScreen(container) {
  if (!container) return;
  // Calculate scale to fit window
  const margin = 20;
  const scaleX = (window.innerWidth - margin) / 960;
  const scaleY = (window.innerHeight - margin) / 540;
  const scale = Math.min(scaleX, scaleY);
  container.style.transform = `scale(${scale})`;
}

function renderPresentationSlide(index, container) {
  container.innerHTML = ""; // Clear previous
  const s = state.slides[index];
  if (!s) return;

  s.elements.forEach(e => {
    const node = document.createElement("div");
    // Reuse your 'el' class for basic styling, but exclude 'selected'
    node.className = "el " + e.type; 

    if (e.shapeType) {
      node.classList.add(e.shapeType);
    }

    // Positioning
    node.style.position = "absolute";
    node.style.left = px(e.x);
    node.style.top  = px(e.y);
    node.style.width  = px(e.w);
    node.style.height = px(e.h);

    //style to reflect in presentation mode
    if (e.color) node.style.color = e.color;
    if (e.fontSize) node.style.fontSize = px(e.fontSize);
    if (e.fontWeight) node.style.fontWeight = e.fontWeight;
    if (e.fontFamily) node.style.fontFamily = e.fontFamily;
    if (e.textAlign) node.style.textAlign = e.textAlign;
    if (e.fontStyle) node.style.fontStyle = e.fontStyle;

    if (e.type === "shape") {
      if (e.fillColor) node.style.background = e.fillColor;
      if (e.borderColor) {
        node.style.borderColor = e.borderColor;
        node.style.borderWidth = "2px"; // Ensure border is visible
        node.style.borderStyle = "solid";
      }
      if (e.opacity !== undefined) node.style.opacity = e.opacity;
    }

    // Specific Content Rendering
    if (e.type === "text" || e.type === "button") {
      node.innerHTML = e.html || "";
      // Style tweaks for presentation (not editable)
      node.style.display = "flex";
      node.style.alignItems = "center";
      if(e.type === "button") node.style.justifyContent = "center";
      
      // INTERACTIVITY: If it's a button, make it clickable
      if (e.type === "button") {
        node.style.cursor = "pointer";
        node.onclick = () => {
           // Placeholder for your future "Branching" logic
           // For now, let's just go to next slide
           nextSlide();
        };
      }
    } else if (e.type === "image") {
       if (e.imageData) {
         node.innerHTML = `<img src="${e.imageData}" style="width:100%;height:100%;object-fit:cover;">`;
       } else {
         node.innerHTML = `<div style="width:100%;height:100%;background:#eee;display:flex;align-items:center;justify-content:center;color:#aaa;">IMAGE</div>`;
       }
      }
    
      // NEW: HANDLE LINKS (Apply to ALL types)
    if (e.link) {
      node.style.cursor = "pointer";
      node.title = `Lien vers: ${e.link}`; // Tooltip
      
      // Add visual hint for link if you want, or keep invisible
      // node.style.border = "1px dashed blue"; 

  function renderPresentationSlide(index, container) {
    container.innerHTML = ""; // Clear previous
    const s = state.slides[index];
    if (!s) return;

    // [STRATEGY] Apply Background
    container.style.background = getSlideBackgroundStyle(s);

    s.elements.forEach(e => {
      const node = document.createElement("div");
    
      // [STRATEGY] Apply Classes and Styles via Helper
      node.className = getElementClasses(e);
      const styles = getElementStyles(e);
      Object.assign(node.style, styles);

      // --- TEXT & BUTTON ---
      if (e.type === "text" || e.type === "button") {
        node.innerHTML = e.html || "";
        node.style.display = "flex";
        node.style.alignItems = "center";
        if(e.type === "button") node.style.justifyContent = "center";
        
        if (e.type === "button") {
          node.style.cursor = "pointer";
          node.onclick = () => nextSlide();
        }
      } 
      // --- IMAGE ---
      else if (e.type === "image") {
        if (e.imageData) {
          node.innerHTML = `<img src="${e.imageData}" style="width:100%;height:100%;object-fit:contain;">`;
        } else {
          node.innerHTML = `<div style="width:100%;height:100%;background:#eee;"></div>`;
        }
      }
      // --- TABLE ---
      else if (e.type === "table") {
        const tableEl = document.createElement("table");
        tableEl.className = "data-table";
        if (e.borderColor) tableEl.style.setProperty('--table-border-color', e.borderColor);
        
        const rows = e.rows || 3;
        const cols = e.cols || 3;
        const data = e.data || Array(rows).fill(null).map(() => Array(cols).fill(""));

        for (let i = 0; i < rows; i++) {
          const tr = document.createElement("tr");
          for (let j = 0; j < cols; j++) {
            const cell = i === 0 ? document.createElement("th") : document.createElement("td");
            cell.textContent = data[i]?.[j] || "";
            if (i === 0 && e.headerColor) cell.style.background = e.headerColor;
            if (e.borderColor) cell.style.borderColor = e.borderColor;
            tr.appendChild(cell);
          }
          tableEl.appendChild(tr);
        }
        node.appendChild(tableEl);
      }
      
      // --- HANDLE LINKS (Apply to ALL types) ---
      if (e.link) {
        node.style.cursor = "pointer";
        node.title = `Lien vers: ${e.link}`;
        
        node.onclick = (evt) => {
          evt.stopPropagation();
          
          if (!isNaN(e.link)) {
            const slideIndex = parseInt(e.link) - 1;
            if (slideIndex >= 0 && slideIndex < state.slides.length) {
              renderPresentationSlide(slideIndex, container);
            }
          } else {
            window.open(e.link, '_blank');
          }
        };
      } else if (e.type === "button" && !node.onclick) {
        node.onclick = (evt) => {
          evt.stopPropagation();
          nextSlide();
        };
      }
      
      container.appendChild(node);
    });
  }}})}