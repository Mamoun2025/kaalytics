# KAALYTICS - Architecture Modulaire des Composants

## Vue d'ensemble

```
components/
├── navbar/              # Navigation modulaire
│   ├── navbar.html      # Template HTML
│   └── navbar-loader.js # Chargeur dynamique
├── footer/              # Footer modulaire
│   ├── footer.html
│   └── footer-loader.js
├── chatbot/             # Widget chatbot IA
│   ├── chatbot.html
│   └── chatbot-loader.js
├── sections/            # Sections de page modulaires
│   ├── hero.html        # Section hero
│   ├── hero-loader.js
│   ├── features.html    # Section features/modules
│   ├── features-loader.js
│   ├── pricing.html     # Section pricing
│   ├── pricing-loader.js
│   ├── testimonials.html # Section temoignages
│   └── testimonials-loader.js
├── effects/             # Effets UI (21 composants)
│   ├── aurora-background.html
│   ├── particles-hero.html
│   └── ...
├── roi-calculator.html  # Calculateur ROI standalone
├── chatbot-widget.html  # Chatbot standalone (legacy)
└── README.md            # Cette documentation
```

## Composants Modulaires

### Navbar

**Usage simple:**
```html
<div id="navbar-container"></div>
<script src="/components/navbar/navbar-loader.js"></script>
```

**Configuration avancée:**
```html
<script>
window.NAVBAR_CONFIG = {
    variant: 'full',        // 'full' | 'simple'
    style: 'transparent'    // 'transparent' | 'solid'
};
</script>
<script src="/components/navbar/navbar-loader.js"></script>
```

**Événements:**
```javascript
window.addEventListener('navbarLoaded', (e) => {
    console.log('Navbar chargée:', e.detail);
});
```

---

### Footer

**Usage simple:**
```html
<div id="footer-container"></div>
<script src="/components/footer/footer-loader.js"></script>
```

**Variantes:**
- `full` - Footer complet avec newsletter, colonnes, contact
- `simple` - Footer simplifié sans newsletter
- `minimal` - Copyright uniquement

**Configuration:**
```html
<script>
window.FOOTER_CONFIG = {
    variant: 'full'
};
</script>
<script src="/components/footer/footer-loader.js"></script>
```

---

### Chatbot

**Usage:**
```html
<script src="/components/chatbot/chatbot-loader.js"></script>
```

**Configuration:**
```javascript
window.CHATBOT_CONFIG = {
    position: 'bottom-right',  // 'bottom-right' | 'bottom-left'
    theme: 'dark',
    whatsappNumber: '+212661718141',
    autoOpen: false,
    autoOpenDelay: 5000
};
```

**Événements:**
```javascript
window.addEventListener('chatbotLoaded', (e) => {
    console.log('Chatbot prêt');
});
```

---

## Sections Modulaires

### Hero Section

**Usage:**
```html
<div id="hero-container"></div>
<script>
window.HERO_CONFIG = {
    variant: 'full',      // 'full' | 'simple' | 'minimal'
    title: {
        line1: 'Votre flotte vous coute',
        highlight: '30% de trop',
        line3: 'On corrige ca en 48h.'
    },
    metrics: [
        { value: '95%', label: 'Precision IA' },
        { value: '-70%', label: 'Temps admin' },
        { value: '-40%', label: 'Couts maintenance' },
        { value: '6 mois', label: 'ROI visible' }
    ]
};
</script>
<script src="/components/sections/hero-loader.js"></script>
```

---

### Features Section

**Usage:**
```html
<div id="features-container"></div>
<script>
window.FEATURES_CONFIG = {
    variant: 'full',      // 'full' | 'compact' | 'minimal'
    badge: 'Nos modules',
    title: 'Une suite complete',
    features: [
        { icon: 'truck', title: 'Suivi GPS', description: '...', benefits: ['...'] },
        // ...
    ]
};
</script>
<script src="/components/sections/features-loader.js"></script>
```

**Icones disponibles:** `truck`, `fuel`, `wrench`, `users`, `route`, `chart`, `shield`, `zap`, `brain`, `document`

---

### Pricing Section

**Usage:**
```html
<div id="pricing-container"></div>
<script>
window.PRICING_CONFIG = {
    variant: 'full',      // 'full' | 'compact' | 'minimal'
    currency: 'MAD',
    yearlyDiscount: 0.20,
    plans: [
        { name: 'Starter', monthlyPrice: 299, features: [...] },
        { name: 'Pro', monthlyPrice: 799, featured: true, features: [...] },
        { name: 'Enterprise', monthlyPrice: null, priceLabel: 'Sur mesure' }
    ]
};
</script>
<script src="/components/sections/pricing-loader.js"></script>
```

**Evenements:**
```javascript
window.addEventListener('pricingToggle', (e) => {
    console.log('Billing period:', e.detail.isYearly ? 'yearly' : 'monthly');
});
```

---

### Testimonials Section

**Usage:**
```html
<div id="testimonials-container"></div>
<script>
window.TESTIMONIALS_CONFIG = {
    variant: 'full',      // 'full' | 'compact' | 'minimal'
    autoplay: true,
    autoplayInterval: 5000,
    testimonials: [
        {
            name: 'Mohammed Benali',
            role: 'Directeur Operations',
            company: 'TerraFleet Logistics',
            initials: 'MB',
            rating: 5,
            content: 'FleetOps Pro a completement transforme...',
            metrics: [{ value: '-40%', label: 'Couts' }]
        }
    ]
};
</script>
<script src="/components/sections/testimonials-loader.js"></script>
```

---

## Effets UI

21 composants d'effets visuels standalone. Chaque fichier est autonome avec CSS et JS intégrés.

| Composant | Description |
|-----------|-------------|
| `aurora-background.html` | Fond aurora borealis animé |
| `glassmorphism-cards.html` | Cartes effet verre dépoli |
| `particles-hero.html` | Particules interactives |
| `gradient-mesh.html` | Gradient mesh animé |
| `text-scramble.html` | Texte effet scramble |
| `typewriter-effect.html` | Effet machine à écrire |
| `glow-buttons.html` | Collection boutons lumineux |
| `floating-elements.html` | Éléments flottants |
| `scroll-reveal.html` | Révélation au scroll |
| `neon-text.html` | Texte effet néon |
| `cursor-glow.html` | Curseur lumineux |
| `liquid-button.html` | Bouton effet liquide |
| `morphing-shapes.html` | Formes SVG animées |
| `3d-card-tilt.html` | Carte 3D au survol |
| `magnetic-cursor.html` | Effet magnétique |
| `wave-divider.html` | Séparateurs vagues |
| `spotlight-effect.html` | Effet projecteur |
| `animated-counter.html` | Compteur animé |
| `image-reveal.html` | Image effet rideau |
| `parallax-layers.html` | Couches parallaxe |
| `hover-underline.html` | Soulignement animé |

**Utilisation:**
```html
<!-- Intégrer dans une page -->
<iframe src="/components/effects/aurora-background.html" width="100%" height="400"></iframe>

<!-- Ou copier le code source dans votre page -->
```

---

## Système de Placeholders

Tous les composants utilisent `{{ROOT}}` comme placeholder pour les chemins relatifs.

Le loader détecte automatiquement la profondeur de la page et remplace `{{ROOT}}` par le bon chemin (`../`, `../../`, etc.).

**Exemple dans navbar.html:**
```html
<a href="{{ROOT}}products/fleetops.html">FleetOps</a>
<!-- Devient -->
<a href="../products/fleetops.html">FleetOps</a>
```

---

## Intégration i18n

Tous les composants supportent le système i18n via les attributs `data-i18n`:

```html
<span data-i18n="nav.products">Produits</span>
```

Le système de traduction (`/assets/js/i18n/i18n.js`) met à jour automatiquement ces éléments.

---

## Migration d'une page

Pour migrer une page vers l'architecture modulaire:

1. **Supprimer** le HTML inline de la navbar/footer
2. **Ajouter** le container:
   ```html
   <div id="navbar-container"></div>
   ```
3. **Ajouter** le loader en fin de page:
   ```html
   <script src="../components/navbar/navbar-loader.js"></script>
   ```

---

## Bonnes pratiques

1. **Un composant = un fichier** - Chaque composant est autonome
2. **Pas de dépendances externes** - CSS/JS inline ou bundlé
3. **Mobile-first** - Tous les composants sont responsive
4. **Accessibilité** - Labels ARIA, navigation clavier
5. **Événements** - Dispatch d'événements pour l'intégration

---

## Roadmap

- [x] Section Hero modulaire
- [x] Section Pricing modulaire
- [x] Section Testimonials modulaire
- [x] Section Features modulaire
- [ ] Systeme de themes (dark/light)
- [ ] Section Contact modulaire
- [ ] Section FAQ modulaire
