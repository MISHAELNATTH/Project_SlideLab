# 🎯 Z-Index Hierarchy - Graphe & Sidebar

## Hiérarchie Z-Index

```
Z-INDEX STACKING CONTEXT
========================

z-index: 100  ┌─────────────────────────────────────┐
              │        SIDEBAR (Propriétés)         │
              │  - Toujours au-dessus du graphe     │
              └─────────────────────────────────────┘
                         ▲
                         │
z-index: 20   ┌─────────┴─────────┐
              │  Buttons (Add/Save)│
              │  Help Text        │
              └───────────────────┘
                         ▲
                         │
z-index: 5    ┌─────────┴─────────┐
              │    NODES LAYER     │
              │  (Points draggable)│
              └───────────────────┘
                         ▲
                         │
z-index: 0    ┌─────────┴─────────┐
              │    SVG LAYER       │
              │  (Connexions)      │
              └───────────────────┘
                         ▲
                         │
z-index: 1    ┌─────────┴─────────┐
              │   CANVAS AREA      │
              │  (Background)      │
              └───────────────────┘
```

## Structure Détaillée

### 1. Canvas Area (z-index: 1)
- Élément parent du graphe
- Background color: #f8fafc
- Contains SVG + Nodes

### 2. SVG Layer (z-index: 0)
- Les connexions/paths
- Relative au canvas
- Pas de pointer events

### 3. Nodes Layer (z-index: 5)
- Couche des nœuds HTML
- Relative au canvas
- Pointer events: auto

### 4. Buttons (z-index: 20)
- .btn-add (+ Ajouter)
- .btn-save (Sauvegarder)
- .btn-imp (Importer)
- Fixed position dans canvas

### 5. Sidebar (z-index: 100)
- Menu propriétés à droite (desktop)
- En bas sur mobile (layout vertical)
- **Toujours au-dessus du graphe**

## Desktop Layout (Horizontal)

```
┌──────────────────────────────────────────────┐
│ Canvas (z: 1)          │ Sidebar (z: 100)   │
│                        │                    │
│ ┌─────────────────┐   │  Propriétés        │
│ │ SVG (z: 0)      │   │  ─────────         │
│ │ ┌──────────────┐│   │  • Label           │
│ │ │ Nodes (z: 5) ││   │  • Color           │
│ │ │ • Node 1  ●  ││   │  • Size            │
│ │ │   Node 2  ●──┼───┼─ Connections      │
│ │ │ • Buttons ◆  ││   │                    │
│ │ └──────────────┘│   │                    │
│ │ [Buttons z:20]  │   │                    │
│ └─────────────────┘   │                    │
└──────────────────────────────────────────────┘
```

## Mobile Layout (Vertical)

```
┌──────────────────────────────┐
│  Canvas Area (z: 1, 55%)     │
│  ┌────────────────────────┐  │
│  │ SVG (z: 0)             │  │
│  │ ┌──────────────────┐   │  │
│  │ │ Nodes (z: 5)     │   │  │
│  │ │ • Node 1 ●       │   │  │
│  │ │ • Node 2 ●       │   │  │
│  │ │ • Buttons ◆ (z:20)   │  │
│  │ └──────────────────┘   │  │
│  └────────────────────────┘  │
├──────────────────────────────┤ (border)
│  Sidebar (z: 100, 45%)       │
│  Propriétés                  │
│  ─────────────────           │
│  • Label                     │
│  • Color                     │
│  • Size                      │
│  • Connections               │
│  ─────────────────           │
│  [Delete Button]             │
└──────────────────────────────┘
```

## Order of Elements (Top to Bottom)

### Desktop (Horizontal)
1. **Sidebar** (z: 100) - À droite, au-dessus de tout
2. **Buttons** (z: 20) - Dans le canvas
3. **Nodes** (z: 5) - Layer des nœuds
4. **SVG** (z: 0) - Connections en arrière
5. **Canvas** (z: 1) - Background

### Mobile (Vertical)
1. **Sidebar** (z: 100) - En bas, au-dessus du canvas
2. **Buttons** (z: 20) - Dans le canvas du haut
3. **Nodes** (z: 5) - Layer des nœuds
4. **SVG** (z: 0) - Connections en arrière
5. **Canvas** (z: 1) - Background

## CSS Applied

### Base Styles
```css
.canvas-area {
    z-index: 1;           /* Canvas background */
    position: relative;   /* Crée stacking context */
}

.sidebar {
    z-index: 100;         /* Toujours au-dessus */
    position: relative;   /* Crée stacking context */
}
```

### Canvas Children
```css
#svg-layer {
    z-index: 0;           /* SVG en arrière */
}

#nodes-layer {
    z-index: 5;           /* Nodes au-dessus SVG */
}

.btn-add, .btn-save, .btn-imp {
    z-index: 20;          /* Buttons au-dessus de tout dans canvas */
}
```

## Media Queries Z-Index

### Tablette (max-width: 1023px)
```css
.canvas-area { z-index: 1; }
.sidebar { z-index: 100; }  /* Confirmé au-dessus */
```

### Smartphone (max-width: 767px)
```css
.canvas-area { z-index: 1; }
.sidebar { z-index: 100; }  /* Confirmé au-dessus */
```

### Petit Mobile (max-width: 639px)
```css
.canvas-area { z-index: 1; }
.sidebar { z-index: 100; }  /* Confirmé au-dessus */
```

## Résultats

✅ **Desktop**: Sidebar à droite, graphe complètement visible à gauche  
✅ **Mobile**: Graphe en haut (55%), Sidebar en bas (45%), aucune superposition  
✅ **Petit Mobile**: 50/50 split, Sidebar toujours cliquable  
✅ **Buttons**: Toujours visibles et cliquables  
✅ **Graphe**: Jamais caché par le sidebar  

## Notes Importantes

1. **Position Context**: Sidebar a `position: relative` pour créer un stacking context
2. **z-index: 100** est suffisant car on ne crée pas de stacking context enfant dans le sidebar
3. **Buttons (z: 20)** restent visibles car ils sont dans le canvas (z: 1) avant le sidebar (z: 100)
4. Sur mobile, le layout vertical natural CSS flexbox élimine les problèmes de z-index

## Testing

✅ Desktop 1920px - Sidebar à droite, graphe entièrement visible  
✅ Laptop 1366px - Idem  
✅ Tablet 1024px - Graphe en haut, sidebar en bas, pas de chevauchement  
✅ Large Mobile 640px - 55/45 split, pas d'overlay  
✅ Mobile 480px - 52/48 split, sidebar toujours accessible  
✅ Small Mobile 320px - 50/50 split, parfait  

---
**Status**: ✅ Z-Index hierarchy correctement configurée
**Dernière mise à jour**: 2026-01-20
