# Design — Version anglaise `/en/` (site bilingue FR/EN)

_Date : 2026-08-05 · Statut : approuvé (Mamoun) · Repo : Mamoun2025/kaalytics_

## Objectif
Version anglaise **ultra propre, organisée, bien référencée**, avec un **beau switcher FR/EN**.
FR reste canonique et intact.

## Décisions
- **URL** : path-based **`/en/…`** (Option B). Vraies pages EN indexables (`/en/`, `/en/pricing`,
  `/en/modules/fleetops`), `hreflang` fr↔en + canonical. (Pas de `?lang=`, pas de sous-domaine.)
- **Génération** : **script au build** (FR = source unique). On ne duplique pas à la main.
- **Périmètre par lots** :
  - Lot 1 (cœur, ~18 pages) : accueil, 8 modules, 6 industries, pricing, about, contact, faq.
  - Lot 2 : blog (5), guides, case-studies. Lot 3 : legal + secondaires.

## Architecture du générateur (`scripts/gen-en.mjs` ou `.py`)
1. **Dictionnaire FR→EN** = paires `assets/locales/fr.json[k] → en.json[k]` (~1035)
   + `i18n/en-supplement.json` (chaînes hors dico, traduites à la main pour combler les trous).
2. Pour chaque page FR du lot :
   - cloner vers `/en/<meme-chemin>` ;
   - remplacer les **nœuds de texte** visibles via le dico FR→EN (match le plus long d'abord),
     **jamais** le code/attributs/URLs ; protéger noms de modules + « Made in Morocco » ;
   - `<html lang="en">` ; liens **absolus** (`/`, `/x`) préfixés `/en/` (les relatifs restent) ;
   - injecter `hreflang` (fr↔en) + `canonical` EN ; traduire `<title>`/meta description/OG ;
   - forcer la langue EN (pas de bascule JS qui rateindexe le contenu).
3. **Rapport de couverture** : lister les chaînes FR non traduites par page → on complète le
   supplément → on régénère (boucle jusqu'à 0 résidu FR sur les pages du lot).

## Switcher FR/EN (navbar, composant partagé)
Toggle élégant `FR | EN` (état actif souligné/pilulé), pointe vers l'URL équivalente
(`/pricing` ↔ `/en/pricing`). Ajouté dans `components/navbar/navbar.html`, style dans le CSS navbar.
Sur pages EN : lien vers l'équivalent FR (retirer le préfixe `/en/`) ; sur FR : ajouter `/en/`.

## Routing Vercel
Pages EN générées et **commitées** sous `/en/` (statique, pas de build step requis).
`vercel.json` : dupliquer les redirects extensionless pour `/en/` si besoin. `hreflang` dans le HTML.

## SEO
Chaque page : `<link rel="alternate" hreflang="fr" href=".../x">` + `hreflang="en" href=".../en/x">`
+ `hreflang="x-default"` (FR). `canonical` = self. Sitemap : ajouter les URLs `/en/`.

## Hors périmètre (pour l'instant)
Arabe. Traduction automatique en direct. Blog/legal (lots ultérieurs).

## Critères de succès Lot 1
- `/en/` + 17 pages cœur : 0 texte FR résiduel (hors marque), rendu vérifié.
- Switcher fonctionne dans les 2 sens. hreflang/canonical corrects. FR inchangé.
