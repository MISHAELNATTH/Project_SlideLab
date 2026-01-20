// src/JS/arbre/io/saveSlideMeta.js

/**
 * Construit une meta par slide à écrire dans <script id="slide-meta">
 * Ici tu peux choisir EXACTEMENT le format attendu par tes slides.
 */
function nodeToSlideMeta(node) {
  return {
    id: node.id,
    label: node.label,
    x: node.x,
    y: node.y,
    buttons: node.buttons.map((b) => ({
      label: b.label ?? "",
      target: b.target ?? null,
    })),
  };
}

/**
 * Sauvegarde DEV: écrit dans les fichiers HTML des slides en remplaçant script#slide-meta
 * PROD: impossible (pas de serveur) => on peut fallback localStorage si tu veux.
 */
export async function saveAllSlidesMeta(store) {
  const nodes = store.getNodes();

  const updates = nodes
    .map((n) => {
      // IMPORTANT: il faut que n.file existe (chemin du fichier HTML à modifier)
      // Si ce n'est pas le cas, tu peux décider d'un mapping: ex `src/html/slide${n.id}.html`
      const file = n.file || `src/html/slide${n.id}.html`;
      return { file, meta: nodeToSlideMeta(n) };
    });

  if (import.meta.env.DEV) {
    const res = await fetch("/api/save-slide-meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return await res.json();
  }

  // PROD: pas d'écriture fichiers
  return { ok: false, reason: "PROD_NO_SERVER" };
}
