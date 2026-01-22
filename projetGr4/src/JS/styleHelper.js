export function px(n) {
  return Math.round(n) + "px";
}

/**
 * Returns the CSS class string for an element.
 */
export function getElementClasses(el) {
  const classes = ["el", el.type];
  if (el.type === 'shape' && el.shapeType) {
    classes.push(el.shapeType);
  }
  return classes.join(' ');
}

/**
 * Returns an object containing all CSS properties for an element.
 * Used by Editor and Presenter to apply styles via JS.
 */
export function getElementStyles(el) {
  const styles = {
    left: px(el.x),
    top: px(el.y),
    width: px(el.w),
    height: px(el.h),
    position: 'absolute', 
  };

  // --- TEXT & BUTTON STYLES ---
  if (el.type === 'text' || el.type === 'button') {
    if (el.color) styles.color = el.color;
    if (el.fontSize) styles.fontSize = px(el.fontSize);
    if (el.fontWeight) styles.fontWeight = el.fontWeight;
    if (el.fontFamily) styles.fontFamily = el.fontFamily;
    if (el.textAlign) styles.textAlign = el.textAlign;
    if (el.fontStyle) styles.fontStyle = el.fontStyle;
  }

  // --- SHAPE STYLES ---
  // Note: Shape fill, border, and opacity are now applied to shape-content-wrapper in editor.js
  // This keeps the outer node fully clickable (no clip-path blocking clicks)
  
  // --- TABLE STYLES (Container only) ---
  if (el.type === 'table') {
     // Tables might have specific container styles if needed
     styles.overflow = 'visible'; 
  }

  return styles;
}

/**
 * Generates the CSS string for HTML Export.
 */
/**
 * Generates inline styles for shape wrapper element
 * Matches presentation mode rendering exactly
 */
export function getShapeWrapperStyles(el) {
  let styles = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    boxSizing: 'border-box'
  };
  
  // Apply fill color (without opacity baked in - apply opacity separately like presentation mode)
  if (el.fillColor) {
    styles.background = el.fillColor;
  }
  
  // Apply opacity as separate property (matches presentation mode)
  if (el.opacity !== undefined) {
    styles.opacity = el.opacity;
  }
  
  // Apply border
  if (el.borderColor) {
    styles.borderColor = el.borderColor;
    styles.borderWidth = '2px';
    styles.borderStyle = 'solid';
  }
  
  return styles;
}

/**
 * Converts style object to inline CSS string
 */
export function stylesToString(styles) {
  return Object.entries(styles)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
      return `${cssKey}:${value}`;
    })
    .join(';');
}

export function generateExportStyle(el) {
    const styles = getElementStyles(el);
    return Object.entries(styles)
        .map(([key, value]) => {
            const cssKey = key.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
            return `${cssKey}:${value}`;
        })
        .join(';');
}

/**
 * Returns the background style for a slide
 */
export function getSlideBackgroundStyle(slide) {
    if (slide.backgroundGradient) {
        return slide.backgroundGradient;
    }
    return slide.backgroundColor || "#ffffff";
}