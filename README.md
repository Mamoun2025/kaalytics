# Kaalytics Website

Site vitrine pour **kaalytics.com** - Services IA pour entreprises africaines.

## Structure du Projet

```
kaalytics/
├── index.html                  # Homepage principale
├── assets/
│   ├── css/
│   │   ├── base/               # Variables, reset, typography
│   │   ├── components/         # Buttons, cards
│   │   ├── layout/             # Navbar, footer, grid
│   │   ├── sections/           # Hero, fleetops, services...
│   │   └── main.css            # Point d'entree CSS
│   ├── js/
│   │   ├── core/               # App init, utils
│   │   ├── components/         # Navbar, modal
│   │   └── sections/           # Hero, fleetops
│   ├── images/                 # Logos, icons
│   └── videos/                 # Symlinks vers videos existantes
├── pages/
│   ├── services/               # Pages services
│   ├── industries/             # Pages industries
│   └── contact.html
├── components/                 # HTML partials
├── data/                       # JSON data
│   ├── services.json
│   └── fleetops-modules.json
├── i18n/                       # Traductions
│   ├── fr.json
│   └── en.json
└── playground/                 # Symlink vers Dimensions Playground
```

## Palette de Couleurs

**Kaalytics utilise une palette Emerald/Teal:**

| Variable | Hex | Usage |
|----------|-----|-------|
| `--emerald` | #10b981 | Couleur principale |
| `--teal` | #0d9488 | Couleur secondaire |
| `--bg-void` | #040a08 | Background principal |
| `--bg-primary` | #0a1412 | Background sections |
| `--text-primary` | #ecfdf5 | Texte principal |

## Demarrer

```bash
# Depuis le dossier kaalytics/
python3 -m http.server 8080

# Puis ouvrir http://localhost:8080
```

## Dependencies

- **GSAP 3.12+** - Animations (CDN)
- **Inter & IBM Plex Mono** - Fonts (Google Fonts)

## Videos

Les videos sont des symlinks vers `/official-site/shared/assets/videos/`.
Pas de duplication des 7.5 GB de contenu video.

## i18n

Le site supporte FR et EN. Les traductions sont dans `/i18n/`.
Le systeme detecte automatiquement la langue du navigateur.

## Produit Phare

**FleetOps Pro** est le produit mis en avant sur la homepage avec:
- 8 modules interactifs
- Videos qui changent au hover
- Section dediee prominente

## Branding

- **Kaalytics** = Entreprise / Marque principale
- **Daedalia** = Produit LLM/IA (dual branding)
- **FleetOps Pro** = Produit Fleet Management
