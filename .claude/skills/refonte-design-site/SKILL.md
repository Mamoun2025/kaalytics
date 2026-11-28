---
name: refonte-design-site
description: Refonte visuelle de kaalytics.com (thème, accueil, visuels d'en-tête) sur une branche, avec contrôle avant chaque lien. À utiliser pour toute demande de design, de maquette ou de changement de thème sur le site.
---

# Refonte du design de kaalytics.com

Méthode rodée le 28/11/2026 (branche `refonte/maquette-accueil`). Rien sur main sans l'accord de Mamoun.

## Étapes

1. **Tour avant** : `lourd python3 -m scripts.design.tour --sortie DIR` (101 pages, 4 largeurs, captures et mesures).
2. **Maquette** : à part dans `docs/design/<nom>/`, chemins ABSOLUS (`/docs/design/<nom>/…`), sinon 404 sur Vercel.
3. **Thème** : `python3 -m scripts.design.theme` (recolore styles et SVG, branche `assets/css/theme/*` sur chaque page ;
   idempotent ; `--verifier` en contrôle). Daedalia exclue (garde son bleu), `hero-film.css` intact.
4. **Visuels d'en-tête** : `studio etalonner --marque kaalytics --sortie DIR <images>` puis
   `python3 -m scripts.design.visuels --sources DIR` (table page → visuel dans `visuels.py`).
5. **Tour après** et comparaison des mesures (erreurs, absents, débordements, bords gauches, couleurs).
6. **Contrôle avant tout lien**, sur l'adresse EN LIGNE : `python3 -m scripts.design.controle <URL> --sortie DIR`
   (404, erreurs, débordement, fluidité processeur x4). Un chemin du dépôt (`index.html`) est servi en local.
7. **Ergonomie** (téléphones 360/390/412, tablette 11 pouces 800x1280 et 1280x800, ordinateur 1440/1920) :
   `lourd python3 -m scripts.design.ergonomie --sortie DIR` ; corrections à la racine dans `assets/css/theme/ergonomie.css`.
8. Commit par lots, fichiers nommés (`git add -A` bloqué), tests verts, page de suivi republiée.

## Règles de performance (leçon de la v1 à 6 images/s)

Aucun filtre (`blur`, `drop-shadow`, `backdrop-filter`), aucun `mix-blend-mode`, aucune section bloquée à l'écran,
pas de défilement adouci. On anime `transform` et `opacity`, une fois, déclenché à l'entrée dans l'écran.

## Pièges connus

- L'ancien hero (`_hero-premium.css`) cache `.hero__title-highlight` (`opacity: 0`) et interdit tout fond en `!important` :
  remplacer son animation le laisse invisible. Le raccourci `background … !important` remet aussi `background-clip`.
- Sélecteurs génériques type `[class*="highlight"]` : ils touchent des blocs entiers (`accordion-item__highlight`, 134 fois).
- Ne pas animer une variable CSS sur la barre ni une position (`left`) à chaque défilement : tout recalculer coûte
  15 points d'images lentes. Ajouter de vrais éléments (`will-change: transform`) et ne changer que `transform`.
- Fonds pleine largeur qui glissent : fondu cuit dans l'image (canal alpha), jamais de `mask-image` sur un élément qui bouge.
- Visuels du Studio déjà générés AVANT d'en créer : `~/VI.Studio/projets/20261121-*`, `20261122-modules`.

## Suivi

Page artefact : https://claude.ai/artifact/MjYJZQnAjsEK3MUb4FQz3v (source `docs/design/page/`).
Aperçu : https://kaalytics-git-refonte-maquette-accueil-mamoun2025s-projects.vercel.app
