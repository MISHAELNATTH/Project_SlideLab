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
  if (el.type === 'shape') {
    if (el.fillColor) styles.background = el.fillColor;
    if (el.borderColor) {
        styles.borderColor = el.borderColor;
        styles.borderWidth = '2px';
        styles.borderStyle = 'solid';
    }
    if (el.opacity !== undefined) styles.opacity = el.opacity;
  }
  
  // --- TABLE STYLES (Container only) ---
  if (el.type === 'table') {
     // Tables might have specific container styles if needed
     styles.overflow = 'auto'; // allow scroll if content overflows the box
  }

  return styles;
}

/**
 * Generates the CSS string for HTML Export.
 */
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