# SlideLab

## Lien du projet
👉 https://florian-glay.github.io/Projet-Informatique-S6-GR4/

---

## Présentation
Ce projet a été développé dans le cadre du **Projet Informatique – S6 (GR4)**.  
Il s’agit d’une application web (HTML / CSS / JS) utilisant **Vite**, **React** et **Tailwind CSS**, avec un système d’édition et de gestion de contenu, déployée sur **GitHub Pages**.

---

## Résumé du produit

### Nom du concept
**Éditeur de présentations visuelles multiplans**

### Pitch
Application web de création visuelle de présentations où chaque élément graphique peut servir de point d’entrée vers une nouvelle diapositive, permettant de construire des récits **non linéaires et interactifs**, à la manière d’un canevas dynamique.

### Fonctionnalités clés
- **Canevas libre** : glisser-déposer d’éléments (formes, images, texte) sur un espace de travail infini.
- **Liens d’éléments** : chaque élément peut être lié à une diapositive distincte ou à un sous-état, supportant des parcours utilisateur non linéaires.
- **Édition visuelle** : modification des propriétés d’objet (taille, position, style) et contrôles de transformation (déplacement, redimensionnement, rotation).
- **Gestion de slides** : création, duplication et navigation entre slides ou états liés aux éléments du canevas.
- **Export & intégration** : export des présentations et intégration possible via **JSON / API** (format de projet réutilisable).
- **Historique & stockage** : persistance locale ou serveur et historique d’actions (annuler / refaire).

### Cas d’usage typiques
- Présentations interactives non linéaires (ateliers, formations, démonstrations produit)
- Prototypage d’UX et d’interactions visuelles
- Cartographie d’idées où chaque nœud ouvre une vue détaillée

### Valeur ajoutée / Avantage concurrentiel
- Combine la souplesse d’un éditeur **type canvas** (créativité visuelle) avec un **modèle de navigation par objets**.
- Permet de créer des parcours interactifs sans scripting complexe.
- Idéal pour les **concepteurs pédagogiques**, **product managers** et **formateurs** souhaitant raconter des histoires à embranchements.

### Technologie & architecture (aperçu)
- Application web front-end moderne en **JavaScript**, avec une structure modulaire (rendu, gestion d’état, interactions, stockage).
- Projets **sérialisables en JSON**, facilitant la réutilisation, la collaboration et l’intégration continue.

---

## Prérequis
Avant de pouvoir utiliser ou modifier le projet, assure-toi d’avoir installé :

- **Node.js** (version recommandée : 18 ou supérieure)
- **npm** (fourni avec Node.js)
- **Git**

---

## Installation du projet

### Cloner le dépôt
```bash
git clone https://github.com/Florian-Glay/Projet-Informatique-S6-GR4.git
cd Projet-Informatique-S6-GR4
cd projetGr4
```

### Installer les dépendances
Depuis projetGr4/
```bash
npm install
```

Toutes les bibliothèques nécessaires seront installées automatiquement.

### Bibliothèques principales utilisées
- `react`
- `react-dom`
- `vite`
- `@vitejs/plugin-react`
- `tailwindcss`
- `@tailwindcss/vite`
- `gh-pages` (pour le déploiement)

---

## Lancer le projet en local
Pour démarrer le serveur de développement :

```bash
npm run dev
```

Puis ouvre ton navigateur à l’adresse indiquée dans le terminal (généralement) :
```
http://localhost:5173
```

---

## Build du projet
Pour générer la version de production :

```bash
npm run build
```

Les fichiers générés seront placés dans le dossier `dist/`.

---

## Déploiement sur GitHub Pages

Le projet est déployé grâce au package **gh-pages**.

### Initialisation du dépôt (une seule fois)
```bash
git init
git add .
git commit -m "Initial commit"

git branch -M main
git remote add origin https://github.com/Florian-Glay/Projet-Informatique-S6-GR4.git
git push -u origin main
```

### Déployer une nouvelle version
À chaque nouvelle mise à jour du projet :

```bash
npm run deploy
```
### Création de la doc
Depuis la racine :

```bash
npm run docs
```

---

## Documentation
La documentation technique du projet est générée automatiquement à l’aide de **JSDoc**.  
Elle décrit les fonctions, modules et structures principales du code.

La documentation se trouve dans public/doc/

---

## Auteurs
Projet réalisé par le groupe **GR4** dans le cadre du Projet d'Informatique semestre 6.
