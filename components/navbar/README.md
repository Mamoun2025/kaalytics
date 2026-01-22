# Navbar Modulaire Kaalytics

## Architecture

```
components/navbar/
├── navbar.html         # Template HTML de la navbar
├── navbar-loader.js    # Script de chargement dynamique
└── README.md           # Documentation
```

## Utilisation Rapide

### 1. Dans une page a la racine (index.html)

```html
<body>
    <!-- Container pour la navbar -->
    <div id="navbar-container" data-navbar="full" data-navbar-style="transparent"></div>

    <!-- Votre contenu -->
    <main>...</main>

    <!-- Scripts en fin de page -->
    <script src="components/navbar/navbar-loader.js"></script>
</body>
```

### 2. Dans une page en sous-dossier (blog/index.html)

```html
<body>
    <div id="navbar-container" data-navbar="full" data-navbar-style="solid"></div>

    <main>...</main>

    <script src="../components/navbar/navbar-loader.js"></script>
</body>
```

### 3. Configuration via JavaScript (alternative)

```html
<body>
    <div id="navbar-container"></div>

    <script>
        window.NAVBAR_CONFIG = {
            variant: 'simple',
            style: 'solid',
            containerId: 'navbar-container'
        };
    </script>
    <script src="../components/navbar/navbar-loader.js"></script>
</body>
```

## Options

### Variantes (`data-navbar`)

| Valeur | Description |
|--------|-------------|
| `full` | Navigation complete avec dropdowns multi-niveaux |
| `simple` | Navigation simplifiee sans dropdowns |

### Styles (`data-navbar-style`)

| Valeur | Description |
|--------|-------------|
| `transparent` | Fond transparent, devient solide au scroll |
| `solid` | Fond solide des le depart |

## Evenements JavaScript

```javascript
// La navbar est chargee et prete
window.addEventListener('navbarLoaded', (e) => {
    console.log('Navbar chargee:', e.detail);
    // { navbar: HTMLElement, variant: 'full', style: 'transparent' }
});

// Changement de langue
window.addEventListener('languageChange', (e) => {
    console.log('Langue changee:', e.detail.lang);
});
```

## Classes CSS Importantes

| Classe | Description |
|--------|-------------|
| `.navbar--transparent` | Style transparent |
| `.navbar--solid` | Style fond solide |
| `.navbar--scrolled` | Ajoute au scroll > 50px |
| `.navbar--hidden` | Cache au scroll vers le bas |
| `.navbar__link--active` | Lien de la page actuelle |

## Migration d'une page existante

### Avant (inline)
```html
<nav class="navbar navbar--transparent">
    <!-- 200+ lignes de HTML duplique -->
</nav>
```

### Apres (modulaire)
```html
<div id="navbar-container" data-navbar="full" data-navbar-style="transparent"></div>
<script src="components/navbar/navbar-loader.js"></script>
```

## Compatibilite

- Fonctionne avec le systeme i18n existant (data-i18n)
- Compatible avec le theme dark/light
- Responsive (mobile menu inclus)
- Support des ancres (#pricing, #contact, etc.)
