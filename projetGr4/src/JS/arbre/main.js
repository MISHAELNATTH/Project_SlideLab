/**
 * main.js (arbre)
 * Initialisation du sous-module 'arbre' : lecture du slides_state,
 * installation des interactions, boutons et contrôle caméra, puis
 * construction du graph initial.
 */
import { assertDom, dom } from "./dom.js";
import { appState } from "./state.js";
import { loadSlidesStateFromLocalStorage, requestSave } from "./storage.js";
import { buildGraphFromSlidesState } from "./buildGraph.js";
import { addSlide } from "./actions.js";
import { exportJsonDownload } from "./io.js";
import { installInteractions } from "./interactions.js";
import { installCameraControls, applyCameraTransform } from "./camera.js";

export function initArbre() {
  assertDom();

  // SOURCE UNIQUE
  appState.slides_state = loadSlidesStateFromLocalStorage();

  installInteractions();

  if (dom.btnAdd) dom.btnAdd.addEventListener("click", addSlide);

  if (dom.btnSave) {
    dom.btnSave.addEventListener("click", () => {
      requestSave();         // force save
      exportJsonDownload();  // optionnel
    });
  }

  if (dom.btnLoad) {
    dom.btnLoad.addEventListener("click", () => {
      const target = "src/html/editor.html";
      window.location.href = `${import.meta.env.BASE_URL}${target}`;
    });
  }

  buildGraphFromSlidesState();
  installCameraControls();
  applyCameraTransform();
}

initArbre();
