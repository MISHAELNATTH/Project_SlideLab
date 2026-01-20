function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function createCameraUtils({ dom, store }) {
  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 2.5;

  function getCanvasRect() {
    return dom.canvasEl.getBoundingClientRect();
  }

  // coords écran -> coords "canvas" locales
  function clientToCanvas(clientX, clientY) {
    const r = getCanvasRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  // coords canvas -> coords monde
  function canvasToWorld(cx, cy) {
    const cam = store.getCamera();
    return {
      x: cam.x + cx / cam.zoom,
      y: cam.y + cy / cam.zoom,
    };
  }

  function screenToWorld(clientX, clientY) {
    const p = clientToCanvas(clientX, clientY);
    return canvasToWorld(p.x, p.y);
  }

  function worldToCanvas(wx, wy) {
    const cam = store.getCamera();
    return {
      x: (wx - cam.x) * cam.zoom,
      y: (wy - cam.y) * cam.zoom,
    };
  }

  function setZoom(newZoom) {
    const cam = store.getCamera();
    cam.zoom = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
    store.setCamera(cam);
  }

  function zoomAt(clientX, clientY, factor) {
    const camBefore = store.getCamera();
    const before = screenToWorld(clientX, clientY);

    const newZoom = clamp(camBefore.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    const camAfter = { ...camBefore, zoom: newZoom };
    store.setCamera(camAfter);

    const after = screenToWorld(clientX, clientY);

    // Ajuste la caméra pour que le point sous la souris reste sous la souris
    const cam = store.getCamera();
    cam.x += before.x - after.x;
    cam.y += before.y - after.y;
    store.setCamera(cam);
  }

  return {
    screenToWorld,
    worldToCanvas,
    clientToCanvas,
    setZoom,
    zoomAt,
    clampZoom: (z) => clamp(z, MIN_ZOOM, MAX_ZOOM),
  };
}

/**
 * Pan:
 * - clic maintenu sur fond du canvas => déplace caméra
 * Zoom:
 * - wheel / trackpad => zoom centré sur la souris
 */
export function setupPanZoom({ dom, store, onRenderAll }) {
  const utils = createCameraUtils({ dom, store });

  // PAN state local (on stocke aussi dans store pour debug)
  function startPan(e) {
    store.setPanning(true);
    store.setPanStart(e.clientX, e.clientY);
    const cam = store.getCamera();
    store.setCameraStart(cam.x, cam.y);
  }

  function movePan(e) {
    if (!store.isPanning()) return;

    const panStart = store.getPanStart();
    const camStart = store.getCameraStart();
    const cam = store.getCamera();

    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;

    // déplacement monde (divise par zoom)
    cam.x = camStart.x - dx / cam.zoom;
    cam.y = camStart.y - dy / cam.zoom;

    store.setCamera(cam);
    onRenderAll();
  }

  function endPan() {
    store.setPanning(false);
  }

  // Zoom wheel
  function onWheel(e) {
    // IMPORTANT pour trackpad + wheel
    e.preventDefault();

    const delta = e.deltaY;
    // deltaY > 0 => zoom out ; < 0 => zoom in
    const factor = delta > 0 ? 0.9 : 1.1;

    utils.zoomAt(e.clientX, e.clientY, factor);
    onRenderAll();
  }

  // listeners globaux (pour pan)
  window.addEventListener("mousemove", movePan);
  window.addEventListener("mouseup", endPan);

  // wheel sur canvas
  dom.canvasEl.addEventListener("wheel", onWheel, { passive: false });

  return {
    startPan,
    endPan,
    utils,
  };
}
