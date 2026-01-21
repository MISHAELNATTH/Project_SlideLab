// Optimisations pour le rendu du graphe responsive
// Ce fichier contient des utilitaires pour améliorer la performance du graphe sur mobile

export const graphOptimizations = {
  // Détecter si on est sur un appareil mobile
  isMobileDevice() {
    return window.innerWidth <= 767;
  },

  // Détecter si on est sur un petit écran
  isSmallDevice() {
    return window.innerWidth <= 480;
  },

  // Adapter les paramètres de rendu selon la taille de l'écran
  getOptimizedZoomLimits() {
    if (this.isSmallDevice()) {
      return { min: 0.3, max: 3 }; // Zoom plus flexible sur petit écran
    } else if (this.isMobileDevice()) {
      return { min: 0.25, max: 2.8 };
    }
    return { min: 0.2, max: 2.5 };
  },

  // Adapter le stride de rendu (combien de frames on skip)
  getRenderStride() {
    if (this.isSmallDevice()) {
      return 2; // Rendre 1 frame sur 2 sur petit écran
    } else if (this.isMobileDevice()) {
      return 1; // Rendre toutes les frames
    }
    return 0; // Rendre toutes les frames (desktop)
  },

  // Adapter la largeur des connexions selon l'écran
  getConnectionStrokeWidth(isActive = false) {
    if (this.isSmallDevice()) {
      return isActive ? 2.5 : 1.5;
    } else if (this.isMobileDevice()) {
      return isActive ? 3.5 : 2.5;
    }
    return isActive ? 3 : 2;
  },

  // Adapter la taille des ports selon l'écran
  getPortSize() {
    if (this.isSmallDevice()) {
      return { width: 8, height: 8 };
    } else if (this.isMobileDevice()) {
      return { width: 10, height: 10 };
    }
    return { width: 12, height: 12 };
  },

  // Adapter la taille des nœuds selon l'écran
  getNodeWidth() {
    if (this.isSmallDevice()) {
      return 90;
    } else if (this.isMobileDevice()) {
      return 120;
    }
    return 192;
  },

  // Adapter la font size des titres de nœuds
  getNodeTitleFontSize() {
    if (this.isSmallDevice()) {
      return 9;
    } else if (this.isMobileDevice()) {
      return 11;
    }
    return 14;
  },

  // Optimiser les transitions SVG
  shouldUseSmoothTransitions() {
    // Sur mobile, pas trop de transitions pour la performance
    return !this.isMobileDevice();
  },

  // Vérifier si on doit utiliser requestAnimationFrame throttled
  shouldThrottleRender() {
    return this.isMobileDevice();
  },

  // Adapter le debounce pour les interactions
  getInteractionDebounce() {
    if (this.isSmallDevice()) {
      return 150;
    } else if (this.isMobileDevice()) {
      return 100;
    }
    return 50;
  }
};

// Observer les changements de taille de fenêtre
export function initResponsiveObserver(callback) {
  let resizeTimeout;

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      callback(graphOptimizations);
    }, 250);
  });

  // Appel initial
  callback(graphOptimizations);
}

// Utilitaire pour adapter dynamiquement le SVG
export function adaptSVGForMobile(svgElement) {
  if (graphOptimizations.isMobileDevice()) {
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgElement.style.willChange = 'transform';
    svgElement.style.transform = 'translate3d(0, 0, 0)'; // Force GPU acceleration
  }
}

// Utilitaire pour adapter les événements tactiles
export function adaptTouchEvents(element) {
  if (graphOptimizations.isMobileDevice()) {
    // Désactiver double-tap zoom
    let lastTouchEnd = 0;
    element.addEventListener('touchend', function(event) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // Activer passive listener pour scroll performance
    element.addEventListener('touchmove', () => {}, { passive: true });
  }
}

// Exporter toutes les optimisations
export default graphOptimizations;
