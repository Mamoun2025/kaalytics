# Section Modules IA - Hub Interactif

Version: 2.0 (Production Ready)

Section interactive presentant les 8 modules IA de Kaalytics avec lecture video aleatoire et panneau d'information lateral.

## Structure des fichiers

```
sections/modules-ia/
├── modules-ia.css        # Styles de la section
├── modules-ia.js         # Logique et interactions
├── section-modules-ia.html  # Markup HTML (partial)
├── demo.html             # Page de demo standalone
└── README.md             # Cette documentation
```

## Integration rapide

### 1. Dans le `<head>`
```html
<link rel="stylesheet" href="sections/modules-ia/modules-ia.css">
```

### 2. Dans le `<body>` (a la position souhaitee)
```html
<!-- Copier le contenu de section-modules-ia.html ici -->
```

### 3. Avant `</body>`
```html
<script src="sections/modules-ia/modules-ia.js"></script>
```

## Dependances

- `assets/css/main.css` - Variables CSS globales
- `assets/videos/` - Videos des modules (28 videos)

## Configuration

### Modifier les liens de navigation

Dans `modules-ia.js`, chaque module a une propriete `link`:

```javascript
daedalia: {
    // ...
    link: '#daedalia'  // Modifier vers la page cible
},
industrial: {
    // ...
    link: '#fleetops'  // Lien vers FleetOps
}
```

### Evenements personnalises

Le script emet un evenement quand le module change:

```javascript
document.addEventListener('modulesIA:moduleChanged', (e) => {
    console.log('Module selectionne:', e.detail.module);
    console.log('Config:', e.detail.config);
});
```

### API JavaScript

```javascript
// Changer de module programmatiquement
ModulesIA.switchModule('industrial', true);

// Obtenir la config
const config = ModulesIA.getConfig();

// Module actuel
const current = ModulesIA.getCurrentModule();
```

## Raccourcis clavier

| Touche | Action |
|--------|--------|
| 1-8 | Selectionner un module |
| ← | Video precedente |
| → | Video suivante |
| Echap | Fermer le panneau |

## Videos par module

| Module | Nombre | Dossier |
|--------|--------|---------|
| Daedalia | 4 | daedalia/ |
| Industrial | 6 | industrial/ |
| Connectivity | 5 | connectivity/ |
| Odoo | 4 | odoo/ |
| Supply Chain | 3 | supply-chain/ |
| Sales | 3 | sales/ |
| Cyber | 2 | cyber/ |
| Marketing | 1 | marketing/ |
| **Total** | **28** | |

## Personnalisation CSS

### Variables disponibles
```css
.section-modules-ia {
    --section-bg: ...;       /* Gradient de fond */
    --section-bg-light: ...; /* Glow central */
}
```

### Classes principales
- `.section-modules-ia` - Container principal
- `.modules-ia__hub` - Zone du hub central
- `.modules-ia__center` - Lecteur video
- `.module-node` - Noeuds de modules
- `.module-info-panel` - Panneau lateral

## Responsive

- Desktop: Hub en plein avec aspect-ratio 1:1
- Tablette: Reduction proportionnelle
- Mobile: Hub avec hauteur fixe, modules plus petits
