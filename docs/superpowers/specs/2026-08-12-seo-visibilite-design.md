# Design — Visibilité SEO et citabilité IA de kaalytics.com

_Date : 2026-08-12 · Statut : approuvé (Mamoun) · Repo : Mamoun2025/kaalytics_

## Objectif

Faire remonter kaalytics.com sur Google au Maroc, et rendre le site citable par les IA
quand on les interroge sur le secteur. Référence méthodologique : ce qui a fonctionné sur
beks.ma (voir mémoires `beks_seo_articles_pipeline`, `beks_liebherr_seo`).

## Contexte — état constaté au 12/08/2026

Audit complet du site (68 pages réelles, HTML statique, Vercel, pas de build).

**Ce qui bloque mécaniquement :**

- `robots.txt` interdit GPTBot, ChatGPT-User, CCBot, anthropic-ai, Claude-Web,
  Google-Extended, PerplexityBot — l'exact inverse de l'objectif de citabilité.
- `robots.txt` interdit aussi `/assets/js/` et `/components/` : la navbar est un fragment
  servi depuis `/components/`, chargé par un JS servi depuis `/assets/js/`.
  **Googlebot n'a pas le droit de charger la navigation du site.**
- Volume de contenu : médiane ~400 mots par page. Accueil 310 mots. Aucune page n'est
  assez fournie pour se battre sur une requête.
- Aucun ciblage de mots-clés : les titres sont des slogans de marque, sans ancrage
  géographique.
- Les 17 pages du positionnement actuel (8 modules, 6 industries, pricing, about,
  portail-client) n'ont **ni canonique, ni OG, ni JSON-LD**.

**Dégâts techniques :**

- `cleanUrls: true` + 100 % des liens internes écrits en `.html` → chaque lien interne
  déclenche un 308. Vérifié en production.
- Canoniques pointant vers des URLs qui redirigent (`products/daedalia.html`, `/en/`).
- hreflang non réciproque (côté FR absent, sauf l'accueil qui déclare des `?lang=`
  inexistants et un `ar` qui n'existe pas) → ignoré par Google.
- Sitemap daté du 22/01/2026 : 33 URLs, une 404 (`industries/collectivites.html`),
  7 images déclarées sur 10 inexistantes, la majorité des pages absentes.
- 19 descriptions et 9 titres dupliqués entre FR et EN ; descriptions françaises sur les
  pages anglaises, `en/index.html` compris.
- `products/daedalia` et `products/fleetops` — seules pages au balisage riche — orphelines.
- GA4 = `G-XXXXXXXXXX`, pixels = `YOUR_FACEBOOK_PIXEL_ID`, pas de Search Console.

**Risques de crédibilité :**

- JSON-LD d'accueil déclarant `AggregateRating 4.9/47 avis` et `4.8/32 avis` — avis
  inexistants. Violation des règles Google sur le balisage d'avis.
- 3 études de cas fictives (TerraFleet, TransMaroc, LocaMat).

**Cause racine** : le site est en HTML statique sans build, chaque `<head>` écrit à la
main. Rien n'impose les métadonnées, donc elles dérivent. La génération 1
(FleetOps/Daedalia) est équipée, la génération 2 (modules ERP) est nue.

## Approche retenue — « Réparer, muscler, puis alimenter »

Trois temps, chacun livrable et mesurable seul. Écartées : le moteur d'articles d'abord
(le trafic atterrirait sur des pages commerciales maigres) et les hubs thématiques
d'abord (chantier lourd, redondant avec `modules/` déjà maillée).

1. **Débloquer** — robots, canoniques, sitemap, hreflang, faux avis, mesure.
2. **Muscler l'existant** — les pages déjà indexées et maillées passent de ~500 à ~1800 mots.
3. **Alimenter** — moteur d'articles façon BEKS, une fois les pages de destination solides.

La citabilité IA n'est pas un quatrième temps : c'est une manière d'écrire, appliquée dès
le temps 2.

## Décisions

### D1 — Architecture de contenu : une page = une requête

Les noms de modules ne sont **jamais modifiés ni traduits**. Ils peuvent être suivis d'un
descripteur dans le `<title>` : `FleetOps — logiciel de gestion de flotte au Maroc | Kaalytics`.

| Page | Requête cible |
|---|---|
| `modules/fleetops` | logiciel gestion de flotte Maroc |
| `modules/sales-intelligence` | pilotage commercial · tableau de bord commercial ERP |
| `modules/financial-operations` | tableau de bord financier PME · relances clients automatiques |
| `modules/erp-connect` | connecter son ERP à un tableau de bord · intégration ERP Maroc |
| `modules/digital-platform` | site web e-commerce connecté à l'ERP |
| `modules/ai-engine` | automatisation IA entreprise Maroc |
| `modules/supply-chain` | gestion des approvisionnements · prévision de ventes |
| `modules/marketing-automation` | marketing automation Maroc |

**Couche ERP nouvelle** : un hub `/erp/` plus une page par ERP — transposition des
pages-marques de BEKS. Ensemble de départ : **Odoo, Cegid, Sage, SAP, Dynamics 365**.
Cegid y entre (absent du site aujourd'hui alors que c'est l'ERP d'Excelsa). L'ensemble
s'étend ensuite selon les ERP réellement rencontrés en clientèle ; le plan
d'implémentation arrête la liste définitive.
Positionnement honnête sur chaque page : on se connecte à l'ERP en place ; pour un client
sans ERP, on déploie Odoo.

**Métiers** : les 6 pages `industries/` refondues sur les secteurs **du portefeuille réel**
(Excelsa, Multiprobat, ATClimatisation, Transwin, KEvents, InternationalDealer) plutôt que
sur BTP/mines hérités de FleetOps. La liste exacte est arrêtée dans le plan
d'implémentation, à partir de ces clients.

**Legacy** : la substance de `products/daedalia` et `products/fleetops` est récupérée, pas
jetée. Les 5 articles de blog et 3 guides (tous orientés flotte) restent rattachés à
`modules/fleetops`.

### D2 — Crédibilité

- Les `AggregateRating` fictifs sont supprimés du JSON-LD. Non négociable.
- Les 3 études de cas fictives sont remplacées par les **vrais clients anonymisés**
  (« un distributeur Cegid PMI de 40 personnes à Casablanca »), avec chiffres réels.
  Pas d'autorisation client à obtenir, et plus convaincant que les chiffres ronds actuels.

### D3 — Socle technique : générateur Python avec garde-fous

Écartés : la réparation à la main (la dérive a déjà eu lieu une fois, elle recommencera)
et la migration framework (réécrit la plomberie, pas le contenu ; plusieurs semaines sans
mouvement SEO pour un site déjà rapide, TTFB 150-350 ms).

Le site reste statique. Pas de `package.json`. Même pattern que `scripts/gen-en.py`.

| Fichier | Responsabilité |
|---|---|
| `data/pages.json` | Une entrée par page : URL canonique, bloc `fr`, bloc `en`, mot-clé cible, type de balisage |
| `scripts/gen-head.py` | Injecte/rafraîchit le `<head>` entre marqueurs : canonique, OG, Twitter, hreflang, JSON-LD |
| `scripts/gen-sitemap.py` | Génère le sitemap depuis l'arborescence réelle |
| `scripts/check-seo.py` | Lecture seule, bloquant. Voir D7. |

**Garde-fous, non négociables :**

- Le générateur ne touche **que le `<head>`, entre deux marqueurs**. Le corps n'est jamais
  modifié. Rayon d'action borné par construction.
- **Idempotent** : deux exécutions donnent le même résultat.
- **Mode simulation** qui n'écrit rien et affiche le diff prévu.
- Premier passage **sur 3 pages**, relecture du diff git, puis déroulement sur les 68.

### D4 — robots.txt et citabilité IA

- Crawlers IA débloqués : GPTBot, ChatGPT-User, CCBot, anthropic-ai, Claude-Web,
  Google-Extended, PerplexityBot.
- `Disallow: /assets/js/` et `Disallow: /components/` **retirés** — ils empêchent le rendu.
- `TRASH/` reste bloqué. La directive `Host:` obsolète et la double déclaration
  contradictoire d'`AhrefsBot` sont nettoyées.
- Ajout d'un `llms.txt` à la racine : sommaire du site en texte brut.

### D5 — Gabarit de page

Une trame, déclinée pour modules, ERP et métiers. ~1800 mots.

| Bloc | Fonction |
|---|---|
| H1 | Nom du module intact + promesse métier |
| Chapô, 3 phrases | Définition autonome — le bloc que les IA extraient |
| Le problème, chiffré | Ancré Maroc, ordres de grandeur réels |
| Ce que fait le module | Un H2 par capacité, reformulant une variante de la requête |
| Comment ça se branche | ERP compatibles, délai, ce qui reste chez le client |
| Cas concret | Client réel anonymisé, chiffres réels |
| FAQ, 5-6 questions | Balisée `FAQPage` |
| Pour aller plus loin | Liens contextuels : ERP concernés, 2 modules voisins, 1 article |

**Pas de bloc tarifaire sur les pages** : renvoi vers `/pricing` ou vers un contact.

**Règles de citabilité, applicables partout :**

- Nommer les entités (Kaalytics, Maroc, Cegid, Odoo…) plutôt que « nos solutions ».
- Dater et chiffrer les affirmations.
- Aucune information importante uniquement dans une image ou une animation. Le radar SVG
  des 8 modules de l'accueil doit avoir son équivalent texte.
- Chaque paragraphe doit tenir debout hors contexte : une IA l'extrait et le sert seul.

**Maillage contextuel dans le corps du texte** — aujourd'hui les liens ne viennent que du
footer, identique sur les 68 pages. C'est le levier qui a fonctionné sur BEKS
(`/produits/timken` → `/blog/roulement-maroc-guide`).

### D6 — Bilingue FR/EN

- **Séparation stricte** : `/` = FR, `/en/` = EN. Jamais de mélange sur une page.
- Les métadonnées des deux langues vivent dans `data/pages.json`. Le hreflang est **déduit
  de la présence du bloc `en`**, donc réciproque par construction. Le `?lang=ar` fantôme
  disparaît.
- **Traduction systématique** : toute page FR **créée ou musclée** reçoit sa jumelle EN
  complète avant livraison — c'est une condition de livraison, pas un rattrapage. Les pages
  non touchées par le chantier gardent leur état actuel. Coût enregistré : ~1,7× le temps
  d'une page FR seule.
- Une page EN ne part en ligne que si **zéro chaîne française** y subsiste. `gen-en.py`
  produit déjà ce rapport ; il devient bloquant.
- `gen-en.py` garde la traduction du corps, mais **perd la responsabilité des
  métadonnées**, qui remonte dans `gen-head.py`.
- Le second système i18n (`assets/js/i18n/i18n.js`, attributs `data-i18n`, bascule
  `?lang=`) est **retiré**. Un seul mécanisme, celui par chemin.

**Anticipation du routage par pays** (fonction prévue plus tard). La redirection selon
l'IP est un piège classique : Googlebot crawle majoritairement depuis les États-Unis, donc
rediriger toute IP américaine vers `/en/` ferait qu'aucun robot ne verrait jamais la
version française — celle qu'on veut faire ranker au Maroc. Garde-fous posés dès
maintenant :

- Les deux versions gardent des URLs distinctes et directement accessibles. Jamais de
  contenu qui change selon le pays à URL identique.
- `x-default` pointe sur le **FR**.
- La détection pays n'est **jamais une redirection dure** : bandeau proposant la bascule et
  mémorisant le choix, ou 302 exemptant les robots. Le bandeau est plus sûr.

Vercel expose `x-vercel-ip-country` : l'infrastructure existe, le choix bandeau/redirection
se fera le moment venu. Le socle reste compatible avec les deux.

### D7 — Mesure et vérification

**Premier livrable du chantier**, avant la réécriture :

- Search Console vérifiée sur `kaalytics.com`, sitemap soumis.
- Vrai identifiant GA4 (remplace `G-XXXXXXXXXX`).
- IndexNow au déploiement, pour notifier Bing et Yandex — comme sur BEKS.

**Indicateurs suivis** (le trafic brut n'est pas le premier) :

- Nombre de pages réellement indexées — aujourd'hui inconnu, probablement < 68.
- Nombre de requêtes distinctes générant une impression.
- Positions moyennes sur les mots-clés cibles, page par page.
- **Positions de quelques concurrents marocains** sur les mêmes requêtes, pour situer la
  progression.

Les 2 à 4 premières semaines servent uniquement à établir une base de référence : il n'y a
aucun historique.

**`check-seo.py` bloque si :**

- une page n'a pas de canonique ;
- un lien interne finit en `.html` ;
- une description dépasse 160 caractères ou est dupliquée ;
- une page `/en/` contient du français, ou une page FR de l'anglais résiduel ;
- un hreflang n'est pas réciproque ;
- le sitemap référence une URL qui ne répond pas 200.

**Vérification non automatisable** : après le déblocage du `robots.txt`, contrôler dans
Search Console que Googlebot rend bien la page, navigation comprise. C'est le test qui dira
si le point le plus grave de l'audit est réparé.

## Découpage en plans d'implémentation

Le chantier est trop large pour un seul plan. Un plan par temps, chacun livrable et
vérifiable seul :

| Plan | Périmètre | Condition de sortie |
|---|---|---|
| **P1 — Débloquer** | D2, D3, D4, D7. robots, générateur + `data/pages.json`, canoniques, liens internes sans `.html`, sitemap, hreflang, retrait des faux avis, Search Console + GA4 + IndexNow | `check-seo.py` passe sur les 68 pages ; Googlebot rend la navigation |
| **P2 — Muscler** | D1, D5, D6. Réécriture des 8 modules, création de la couche ERP, refonte des métiers, études de cas anonymisées, jumelles EN | Chaque page livrée respecte le gabarit et passe le checker |
| **P3 — Alimenter** | Moteur d'articles façon BEKS + maillage contextuel | Cadence de publication tenue, positions suivies |

P2 ne démarre pas avant que P1 soit vert : muscler des pages que Googlebot ne peut pas
lire correctement serait du travail perdu. P2 peut lui-même être découpé par lots de pages.

## Périmètre exclu

- Migration vers un framework (Next.js, Astro).
- Optimisation des performances : le site est déjà rapide, ce n'est pas le frein.
- Nettoyage des 533 Mo de vidéos non référencées dans `assets/videos/` — sans effet SEO,
  à traiter séparément.
- Choix définitif bandeau vs redirection pour le routage par pays.

## Références

- Mémoires : `beks_seo_articles_pipeline`, `beks_liebherr_seo`, `beks_website_docs`.
- Spec antérieure : `2026-08-05-site-bilingue-en-design.md` — prévoyait la traduction des
  `<title>`/meta/OG, non livrée. `data/pages.json` corrige la cause.
