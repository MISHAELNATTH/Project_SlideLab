import { thumbsEl, state, zoomChip, cryptoId, setSelectedId, render} from './editor.js';
// =====================================================
//  IMPORT/EXPORT - FICHIERS HTML
// =====================================================
function parseSlideHTML(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const elements = [];

  const slideElements = doc.querySelectorAll('.slide-element');
  
  slideElements.forEach(el => {
    const style = el.getAttribute('style') || '';
    
    // Extract position and size from inline styles
    const leftMatch = style.match(/left:\s*(\d+)px/);
    const topMatch = style.match(/top:\s*(\d+)px/);
    const widthMatch = style.match(/width:\s*(\d+)px/);
    const heightMatch = style.match(/height:\s*(\d+)px/);
    
    const x = leftMatch ? parseInt(leftMatch[1]) : 0;
    const y = topMatch ? parseInt(topMatch[1]) : 0;
    const w = widthMatch ? parseInt(widthMatch[1]) : 240;
    const h = heightMatch ? parseInt(heightMatch[1]) : 54;
    
    // Determine element type from class
    let type = 'text';
    let html = '';
    
    if (el.classList.contains('text-element')) {
      type = 'text';
      const p = el.querySelector('p');
      html = p ? p.innerHTML : 'Texte';
    } else if (el.classList.contains('button-element')) {
      type = 'button';
      html = el.innerHTML.trim();
    } else if (el.classList.contains('image-element')) {
      type = 'image';
      html = '';
    } else if (el.classList.contains('shape-element')) {
      type = 'shape';
      html = '';
    }
    
    elements.push({
      id: cryptoId(),
      type,
      x,
      y,
      w,
      h,
      html
    });
  });
  
  return elements;
}

// load slides from files
function loadSlidesFromFiles(files) {
  const fileArray = Array.from(files).filter(f => f.name.endsWith('.html'));
  
  if (fileArray.length === 0) {
    alert('No HTML files selected');
    return;
  }
  
  // Sort files by name to load in order
  fileArray.sort((a, b) => a.name.localeCompare(b.name));
  
  let loadedCount = 0;
  
  fileArray.forEach((file, index) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const htmlContent = e.target.result;
        const elements = parseSlideHTML(htmlContent);
        
        // Replace or add slide
        if (index === 0) {
          // First file: replace current slide
          state.slides[state.activeSlide] = {
            id: cryptoId(),
            elements
          };
        } else {
          // Subsequent files: add as new slides
          state.slides.push({
            id: cryptoId(),
            elements
          });
        }
        
        loadedCount++;
        
        // Once all files are loaded, render
        if (loadedCount === fileArray.length) {
          state.activeSlide = 0;
          setSelectedId(null);
          render();
          thumbsEl.scrollLeft = 0;
          alert(`✓ Loaded ${fileArray.length} slide(s)`);
        }
      } catch (error) {
        console.error('Error parsing file:', file.name, error);
      }
    };
    
    reader.readAsText(file);
  });
}

// open folder button
const fileInput = document.getElementById('fileInput');
document.getElementById('openFolderBtn').addEventListener('click', ()=>{
  fileInput.click();
});

fileInput.addEventListener('change', (ev)=>{
  if (ev.target.files.length > 0) {
    loadSlidesFromFiles(ev.target.files);
    ev.target.value = ''; // reset input
  }
});