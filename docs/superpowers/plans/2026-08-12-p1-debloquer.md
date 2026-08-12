# P1 « Débloquer » — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lever tout ce qui empêche mécaniquement Google et les IA de lire, indexer et citer kaalytics.com, et poser le générateur qui empêchera les métadonnées de dériver à nouveau.

**Architecture :** Le site reste du HTML statique servi par Vercel. On ajoute un catalogue de métadonnées (`data/seo/*.json`) et un petit paquet Python (`scripts/seo/`) qui injecte le `<head>` entre marqueurs, canonise les liens internes, génère le sitemap et vérifie l'ensemble. Aucun runtime nouveau : les scripts tournent à la main avant commit, pas au build Vercel.

**Tech Stack :** Python 3.12 (bibliothèque standard uniquement), pytest 9.0.2 (déjà installé), HTML statique, Vercel, GitHub Actions pour IndexNow.

## Global Constraints

Ces contraintes s'appliquent à **toutes** les tâches. Valeurs reprises telles quelles de la spec `2026-08-12-seo-visibilite-design.md`.

- Les noms de modules (`FleetOps`, `Sales Intelligence`, `Marketing Automation`, `Financial Operations`, `Supply Chain Command`, `ERP Connect`, `Digital Platform`, `AI Engine`) ne sont **jamais modifiés ni traduits**. Ils peuvent être suivis d'un descripteur dans le `<title>`.
- **Pas de bloc tarifaire** sur les pages.
- URL canonique **sans extension et sans slash final** : `index.html` → `/`, `dir/index.html` → `/dir`, `page.html` → `/page`.
- `x-default` pointe toujours sur le **FR**.
- **Jamais de redirection dure par IP.** Aucune tâche de P1 n'introduit de routage par pays.
- Le générateur ne touche **que le `<head>`, entre deux marqueurs**. Le corps des pages n'est jamais modifié par `gen_head`.
- Le générateur est **idempotent** et dispose d'un **mode simulation** (`--dry-run`) qui n'écrit rien.
- **Aucune dépendance Python nouvelle.** Bibliothèque standard uniquement. Pas de `package.json`.
- Le site reste statique. `vercel.json` conserve `cleanUrls: true` et `trailingSlash: false`.
- Périmètre des pages traitées : les 68 pages réelles. Sont exclus `TRASH/`, `components/effects/`, `PROPOSALS/`, `proposals/`, `sections/`, `playground/`, `industries/TRASH/`.

## File Structure

| Fichier | Responsabilité |
|---|---|
| `robots.txt` | Modifié — débloque les IA et les sous-ressources de rendu |
| `llms.txt` | Créé — sommaire du site en texte brut pour les IA |
| `data/seo/defaults.json` | Créé — base URL, OG par défaut, JSON-LD Organization |
| `data/seo/modules.json` | Créé — métadonnées des 8 modules |
| `data/seo/core.json` | Créé — pages racine |
| `data/seo/industries.json` | Créé — 6 métiers |
| `data/seo/content.json` | Créé — blog, guides, études de cas |
| `data/seo/legal.json` | Créé — 4 pages légales |
| `scripts/seo/__init__.py` | Créé — marqueur de paquet |
| `scripts/seo/catalog.py` | Créé — charge et fusionne le catalogue, dérive les URL |
| `scripts/seo/head.py` | Créé — construit le bloc `<head>` (fonction pure) |
| `scripts/seo/htmlio.py` | Créé — insertion idempotente entre marqueurs |
| `scripts/seo/links.py` | Créé — canonisation des liens internes |
| `scripts/seo/gen_head.py` | Créé — CLI d'injection |
| `scripts/seo/gen_sitemap.py` | Créé — CLI de génération du sitemap |
| `scripts/seo/check_seo.py` | Créé — CLI de vérification, lecture seule, bloquant |
| `tests/seo/test_*.py` | Créés — un fichier de test par module |
| `.github/workflows/indexnow.yml` | Créé — notification Bing/Yandex au push |

Découpage par responsabilité, pas par couche. Chaque module reste sous 250 lignes conformément à `~/.claude/rules/modular-architecture.md`.

---

### Task 1: Débloquer robots.txt et publier llms.txt

C'est le point le plus grave de l'audit : `Disallow: /assets/js/` et `Disallow: /components/` empêchent Googlebot de charger la navigation du site, et sept crawlers IA sont interdits alors que la citabilité IA est un objectif.

**Files:**
- Modify: `robots.txt`
- Create: `llms.txt`
- Test: `tests/seo/test_robots.py`

**Interfaces:**
- Consumes: rien
- Produces: rien (fichiers statiques)

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/seo/test_robots.py` :

```python
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AI_BOTS = [
    "GPTBot", "ChatGPT-User", "CCBot", "anthropic-ai",
    "Claude-Web", "Google-Extended", "PerplexityBot",
]


def parse_groups(text):
    """Retourne {user_agent_minuscule: [regles]} depuis un robots.txt."""
    groups, current = {}, []
    for raw in text.splitlines():
        line = raw.split("#")[0].strip()
        if not line:
            continue
        key, _, value = line.partition(":")
        key, value = key.strip().lower(), value.strip()
        if key == "user-agent":
            current = groups.setdefault(value.lower(), [])
        elif key in ("allow", "disallow") and current is not None:
            current.append((key, value))
    return groups


def test_aucun_crawler_ia_bloque():
    groups = parse_groups((ROOT / "robots.txt").read_text(encoding="utf-8"))
    for bot in AI_BOTS:
        rules = groups.get(bot.lower(), [])
        assert ("disallow", "/") not in rules, f"{bot} est encore bloque"


def test_sous_ressources_de_rendu_autorisees():
    text = (ROOT / "robots.txt").read_text(encoding="utf-8")
    assert "Disallow: /assets/js/" not in text
    assert "Disallow: /components/" not in text


def test_trash_reste_bloque():
    rules = parse_groups((ROOT / "robots.txt").read_text(encoding="utf-8"))["*"]
    assert ("disallow", "/TRASH/") in rules


def test_sitemap_declare_et_directive_host_retiree():
    text = (ROOT / "robots.txt").read_text(encoding="utf-8")
    assert "Sitemap: https://kaalytics.com/sitemap.xml" in text
    assert "Host:" not in text


def test_aucun_user_agent_declare_deux_fois():
    text = (ROOT / "robots.txt").read_text(encoding="utf-8")
    agents = [
        l.split(":", 1)[1].strip().lower()
        for l in text.splitlines()
        if l.strip().lower().startswith("user-agent:")
    ]
    assert len(agents) == len(set(agents)), "AhrefsBot ou SemrushBot declare deux fois"


def test_llms_txt_present_et_liste_les_sections():
    text = (ROOT / "llms.txt").read_text(encoding="utf-8")
    for section in ("/modules/", "/industries/", "/blog/", "/guides/"):
        assert section in text
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_robots.py -v
```

Attendu : `test_aucun_crawler_ia_bloque`, `test_sous_ressources_de_rendu_autorisees`, `test_sitemap_declare_et_directive_host_retiree`, `test_aucun_user_agent_declare_deux_fois` échouent ; `test_llms_txt_present_et_liste_les_sections` échoue sur `FileNotFoundError`.

- [ ] **Step 3: Réécrire robots.txt**

Remplacer intégralement le contenu de `robots.txt` par :

```
# ==============================================
# Kaalytics - robots.txt
# https://kaalytics.com/robots.txt
# Last updated: 2026-08-12
# ==============================================

User-agent: *
Allow: /
Disallow: /TRASH/
Disallow: /data/
Disallow: /PROPOSALS/
Disallow: /proposals/
Disallow: /*?*preview=
Disallow: /*?*debug=

Sitemap: https://kaalytics.com/sitemap.xml

# ==============================================
# Moteurs de recherche
# ==============================================

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: YandexBot
Allow: /

# ==============================================
# Assistants IA - AUTORISES (citabilite recherchee)
# ==============================================

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: Applebot-Extended
Allow: /

# ==============================================
# Reseaux sociaux (previsualisations)
# ==============================================

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: WhatsApp
Allow: /

User-agent: Slackbot
Allow: /

# ==============================================
# Robots indesirables
# ==============================================

User-agent: Bytespider
Disallow: /

User-agent: BLEXBot
Disallow: /

User-agent: DataForSeoBot
Disallow: /

User-agent: MegaIndex.ru
Disallow: /
```

Note : `Disallow: /assets/js/`, `Disallow: /components/`, `Disallow: /*.json$`, la directive `Host:`, les `Crawl-delay:` et les doubles déclarations d'`AhrefsBot`/`SemrushBot` disparaissent. `/*.json$` est retiré parce qu'il bloquait aussi `manifest.json`.

- [ ] **Step 4: Créer llms.txt**

Créer `llms.txt` à la racine :

```
# Kaalytics

> Kaalytics est une societe marocaine qui connecte des modules d'analyse et
> d'automatisation aux ERP deja en place dans l'entreprise - Cegid, Sage, SAP,
> Dynamics, Odoo - sans modifier le systeme existant. Pour une entreprise sans
> ERP, Kaalytics deploie Odoo. Base a Casablanca, Maroc.

## Modules

- [FleetOps](https://kaalytics.com/modules/fleetops) : suivi de flotte, maintenance predictive, couts par chantier
- [Sales Intelligence](https://kaalytics.com/modules/sales-intelligence) : pilotage commercial et scoring des prospects
- [Marketing Automation](https://kaalytics.com/modules/marketing-automation) : campagnes ciblees et pipeline marketing
- [Financial Operations](https://kaalytics.com/modules/financial-operations) : tableau de bord financier et relances clients
- [Supply Chain Command](https://kaalytics.com/modules/supply-chain) : planning achats et prevision de ventes
- [ERP Connect](https://kaalytics.com/modules/erp-connect) : connecteurs vers les ERP existants
- [Digital Platform](https://kaalytics.com/modules/digital-platform) : site web et catalogue connectes a l'ERP
- [AI Engine](https://kaalytics.com/modules/ai-engine) : agents autonomes et automatisations IA

## Secteurs

- [Industries](https://kaalytics.com/industries/industrie)
- [Transport et logistique](https://kaalytics.com/industries/transport)
- [Distribution et negoce](https://kaalytics.com/industries/distribution)
- [BTP](https://kaalytics.com/industries/btp)
- [Location d'equipements](https://kaalytics.com/industries/location)
- [Mines et carrieres](https://kaalytics.com/industries/mines)

## Ressources

- [Blog](https://kaalytics.com/blog)
- [Guides](https://kaalytics.com/guides)
- [Etudes de cas](https://kaalytics.com/case-studies)
- [Questions frequentes](https://kaalytics.com/faq)
- [Tarifs](https://kaalytics.com/pricing)

## Contact

- [Contact](https://kaalytics.com/contact)
- Version anglaise : https://kaalytics.com/en
```

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils passent**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_robots.py -v
```

Attendu : 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
cd ~/II.Kaalytics/Website/kaalytics
git add robots.txt llms.txt tests/seo/test_robots.py
git commit -m "fix(seo): debloque les crawlers IA et les sous-ressources de rendu + llms.txt"
```

---

### Task 2: Supprimer les avis fictifs balisés

`AggregateRating 4.9/47 avis` et `4.8/32 avis` sont déclarés en JSON-LD sur quatre pages alors que ces avis n'existent pas. C'est une violation des règles Google sur le balisage d'avis, passible d'une action manuelle.

**Files:**
- Modify: `index.html:235`, `index.html:328`, `en/index.html:230`, `en/index.html:323`, `products/fleetops.html:91`, `products/daedalia.html:158`
- Test: `tests/seo/test_no_fake_reviews.py`

**Interfaces:**
- Consumes: rien
- Produces: rien

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/seo/test_no_fake_reviews.py` :

```python
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXCLUDED = ("TRASH", "PROPOSALS", "proposals", "node_modules")
FORBIDDEN_TYPES = {"AggregateRating", "Review", "Rating"}


def production_pages():
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT).as_posix()
        if any(part in rel for part in EXCLUDED):
            continue
        yield rel, path


def jsonld_types(html):
    """Tous les @type presents dans les blocs JSON-LD d'une page."""
    types = set()
    for block in re.findall(
        r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
        html,
        re.S,
    ):
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        stack = [data]
        while stack:
            node = stack.pop()
            if isinstance(node, dict):
                if "@type" in node and isinstance(node["@type"], str):
                    types.add(node["@type"])
                stack.extend(node.values())
            elif isinstance(node, list):
                stack.extend(node)
    return types


def test_aucun_avis_fictif_balise():
    coupables = {}
    for rel, path in production_pages():
        found = jsonld_types(path.read_text(encoding="utf-8")) & FORBIDDEN_TYPES
        if found:
            coupables[rel] = sorted(found)
    assert not coupables, f"Avis fictifs balises : {coupables}"


def test_tous_les_blocs_jsonld_restent_valides():
    """Retirer les avis ne doit pas casser le JSON des blocs restants."""
    for rel, path in production_pages():
        html = path.read_text(encoding="utf-8")
        for block in re.findall(
            r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
            html,
            re.S,
        ):
            json.loads(block)  # leve si le JSON est casse
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_no_fake_reviews.py -v
```

Attendu : `test_aucun_avis_fictif_balise` FAIL en listant `index.html`, `en/index.html`, `products/fleetops.html`, `products/daedalia.html`.

- [ ] **Step 3: Retirer les blocs à la main**

Dans chacun des quatre fichiers, supprimer la propriété `"aggregateRating"` et sa valeur, ainsi que toute propriété `"review"` et les objets `Review`/`Rating` associés. Attention à la virgule de la propriété précédente : la retirer si `aggregateRating` était la dernière propriété de l'objet.

Exemple, dans `index.html` autour de la ligne 233 :

```json
        "brand": { "@type": "Brand", "name": "Kaalytics" },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "47"
        }
    }
```

devient :

```json
        "brand": { "@type": "Brand", "name": "Kaalytics" }
    }
```

Ne rien supprimer d'autre : les blocs `Organization`, `SoftwareApplication`, `FAQPage`, `HowTo`, `BreadcrumbList` restent en place.

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_no_fake_reviews.py -v
```

Attendu : 2 tests PASS. Si `test_tous_les_blocs_jsonld_restent_valides` échoue, c'est une virgule en trop ou manquante — corriger avant de continuer.

- [ ] **Step 5: Commit**

```bash
cd ~/II.Kaalytics/Website/kaalytics
git add index.html en/index.html products/fleetops.html products/daedalia.html tests/seo/test_no_fake_reviews.py
git commit -m "fix(seo): retire les avis fictifs balises (AggregateRating/Review)"
```

---

### Task 3: Catalogue SEO — chargeur et dérivation des URL

C'est ici qu'on corrige structurellement le bug des canoniques : aujourd'hui `guides/index.html` déclare `https://kaalytics.com/guides/` et `en/index.html` déclare `https://kaalytics.com/en/`, deux URLs qui répondent 308. `url_path_for()` rend ce bug impossible.

**Files:**
- Create: `data/seo/defaults.json`
- Create: `data/seo/modules.json`
- Create: `scripts/seo/__init__.py`
- Create: `scripts/seo/catalog.py`
- Test: `tests/seo/test_catalog.py`

**Interfaces:**
- Consumes: rien
- Produces:
  - `url_path_for(html_path: str) -> str`
  - `absolute_url(html_path: str) -> str`
  - `@dataclass(frozen=True) PageMeta` avec les champs `html_path: str`, `url_path: str`, `lang: str`, `title: str`, `description: str`, `og_image: str`, `keyword: str`, `alternates: tuple[tuple[str, str], ...]`, `robots: str`
  - `load_defaults(data_dir: Path) -> dict`
  - `load_catalog(data_dir: Path) -> list[PageMeta]` — retourne les pages FR **et** EN, à plat

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/seo/test_catalog.py` :

```python
import json
from pathlib import Path

import pytest

from scripts.seo.catalog import (
    BASE_URL,
    absolute_url,
    load_catalog,
    load_defaults,
    url_path_for,
)

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "seo"


@pytest.mark.parametrize(
    "html_path,expected",
    [
        ("index.html", "/"),
        ("en/index.html", "/en"),
        ("guides/index.html", "/guides"),
        ("blog/index.html", "/blog"),
        ("modules/fleetops.html", "/modules/fleetops"),
        ("en/modules/fleetops.html", "/en/modules/fleetops"),
        ("legal/privacy.html", "/legal/privacy"),
    ],
)
def test_url_path_sans_extension_ni_slash_final(html_path, expected):
    assert url_path_for(html_path) == expected


def test_absolute_url_prefixe_le_domaine():
    assert absolute_url("modules/fleetops.html") == (
        "https://kaalytics.com/modules/fleetops"
    )
    assert absolute_url("index.html") == "https://kaalytics.com/"


def test_defaults_contient_le_minimum():
    defaults = load_defaults(DATA)
    assert defaults["base_url"] == BASE_URL
    assert defaults["og_image"].startswith("/assets/images/")
    assert defaults["organization"]["@type"] == "Organization"


def test_catalogue_produit_les_pages_fr_et_en():
    pages = {p.html_path: p for p in load_catalog(DATA)}
    assert "modules/fleetops.html" in pages
    assert "en/modules/fleetops.html" in pages
    assert pages["modules/fleetops.html"].lang == "fr"
    assert pages["en/modules/fleetops.html"].lang == "en"


def test_hreflang_reciproque_par_construction():
    pages = {p.html_path: p for p in load_catalog(DATA)}
    fr = dict(pages["modules/fleetops.html"].alternates)
    en = dict(pages["en/modules/fleetops.html"].alternates)
    assert fr == en, "les deux versions doivent declarer les memes alternates"
    assert fr["fr"] == "https://kaalytics.com/modules/fleetops"
    assert fr["en"] == "https://kaalytics.com/en/modules/fleetops"
    assert fr["x-default"] == fr["fr"], "x-default doit pointer sur le FR"


def test_le_nom_du_module_est_intact_dans_le_titre():
    pages = {p.html_path: p for p in load_catalog(DATA)}
    assert pages["modules/fleetops.html"].title.startswith("FleetOps")
    assert pages["en/modules/fleetops.html"].title.startswith("FleetOps")


def test_aucune_description_dupliquee_entre_pages():
    descriptions = [p.description for p in load_catalog(DATA)]
    assert len(descriptions) == len(set(descriptions))


def test_descriptions_sous_160_caracteres():
    for page in load_catalog(DATA):
        assert len(page.description) <= 160, f"{page.html_path} trop longue"


def test_les_fichiers_de_donnees_sont_du_json_valide():
    for path in DATA.glob("*.json"):
        json.loads(path.read_text(encoding="utf-8"))
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_catalog.py -v
```

Attendu : `ModuleNotFoundError: No module named 'scripts.seo'`.

- [ ] **Step 3: Créer le paquet et le chargeur**

Créer `scripts/__init__.py` (vide) et `scripts/seo/__init__.py` (vide), puis `scripts/seo/catalog.py` :

```python
"""Catalogue des metadonnees SEO : chargement, fusion et derivation des URL.

Source de verite = data/seo/*.json. Chaque entree est clef par le chemin HTML
de la page FR ; le bloc "en" optionnel porte le chemin de sa jumelle anglaise.
Le hreflang est deduit de la presence de ce bloc, donc reciproque par
construction.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

BASE_URL = "https://kaalytics.com"
DEFAULT_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1"


def url_path_for(html_path: str) -> str:
    """Chemin canonique : sans extension, sans slash final.

    'index.html'            -> '/'
    'guides/index.html'     -> '/guides'
    'modules/fleetops.html' -> '/modules/fleetops'
    """
    path = html_path.strip("/")
    if path == "index.html":
        return "/"
    if path.endswith("/index.html"):
        return "/" + path[: -len("/index.html")]
    if path.endswith(".html"):
        return "/" + path[: -len(".html")]
    return "/" + path


def absolute_url(html_path: str) -> str:
    return BASE_URL + url_path_for(html_path)


@dataclass(frozen=True)
class PageMeta:
    html_path: str
    url_path: str
    lang: str
    title: str
    description: str
    og_image: str
    keyword: str
    alternates: tuple[tuple[str, str], ...]
    robots: str


def load_defaults(data_dir: Path) -> dict:
    return json.loads((data_dir / "defaults.json").read_text(encoding="utf-8"))


def _entries(data_dir: Path) -> dict:
    """Fusionne tous les data/seo/*.json sauf defaults.json."""
    merged: dict = {}
    for path in sorted(data_dir.glob("*.json")):
        if path.name == "defaults.json":
            continue
        section = json.loads(path.read_text(encoding="utf-8"))
        duplicates = merged.keys() & section.keys()
        if duplicates:
            raise ValueError(f"pages declarees deux fois : {sorted(duplicates)}")
        merged.update(section)
    return merged


def _alternates(fr_path: str, en_path: str | None) -> tuple[tuple[str, str], ...]:
    """Vide s'il n'y a pas de jumelle EN. x-default pointe toujours sur le FR."""
    if not en_path:
        return ()
    fr_url = absolute_url(fr_path)
    return (
        ("fr", fr_url),
        ("en", absolute_url(en_path)),
        ("x-default", fr_url),
    )


def load_catalog(data_dir: Path) -> list[PageMeta]:
    defaults = load_defaults(data_dir)
    pages: list[PageMeta] = []
    for fr_path, entry in _entries(data_dir).items():
        en = entry.get("en")
        en_path = en.get("path") if en else None
        alternates = _alternates(fr_path, en_path)
        common = {
            "og_image": entry.get("og_image", defaults["og_image"]),
            "keyword": entry.get("keyword", ""),
            "alternates": alternates,
            "robots": entry.get("robots", DEFAULT_ROBOTS),
        }
        pages.append(
            PageMeta(
                html_path=fr_path,
                url_path=url_path_for(fr_path),
                lang="fr",
                title=entry["fr"]["title"],
                description=entry["fr"]["description"],
                **common,
            )
        )
        if en:
            pages.append(
                PageMeta(
                    html_path=en_path,
                    url_path=url_path_for(en_path),
                    lang="en",
                    title=en["title"],
                    description=en["description"],
                    **common,
                )
            )
    return pages
```

- [ ] **Step 4: Créer data/seo/defaults.json**

```json
{
  "base_url": "https://kaalytics.com",
  "site_name": "Kaalytics",
  "og_image": "/assets/images/og-image.jpg",
  "twitter_card": "summary_large_image",
  "organization": {
    "@type": "Organization",
    "name": "Kaalytics",
    "url": "https://kaalytics.com",
    "logo": "https://kaalytics.com/assets/images/logo/kaalytics-logo.png",
    "areaServed": "MA",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Casablanca",
      "addressCountry": "MA"
    }
  }
}
```

- [ ] **Step 5: Créer data/seo/modules.json**

Les huit modules, FR et EN. Les descriptions FR reprennent l'existant, corrigé et dédoublonné ; les descriptions EN sont de vraies traductions anglaises — aujourd'hui les pages EN portent des descriptions françaises. Le champ `keyword` sert de cible à la réécriture de P2 ; P1 ne s'en sert que pour la traçabilité.

```json
{
  "modules/fleetops.html": {
    "keyword": "logiciel gestion de flotte Maroc",
    "og_image": "/assets/images/og-fleetops.jpg",
    "fr": {
      "title": "FleetOps — logiciel de gestion de flotte au Maroc | Kaalytics",
      "description": "Suivi GPS, maintenance predictive et couts par chantier. La rentabilite de chaque machine visible depuis votre ERP."
    },
    "en": {
      "path": "en/modules/fleetops.html",
      "title": "FleetOps — fleet management software in Morocco | Kaalytics",
      "description": "GPS tracking, predictive maintenance and per-site costs. See the profitability of every machine from your ERP."
    }
  },
  "modules/sales-intelligence.html": {
    "keyword": "tableau de bord commercial ERP",
    "fr": {
      "title": "Sales Intelligence — pilotage commercial connecte a votre ERP | Kaalytics",
      "description": "Indicateurs commerciaux en temps reel, scoring des prospects et devis en 30 secondes, directement relies a votre ERP."
    },
    "en": {
      "path": "en/modules/sales-intelligence.html",
      "title": "Sales Intelligence — sales management connected to your ERP | Kaalytics",
      "description": "Real-time sales indicators, prospect scoring and quotes in 30 seconds, wired straight into your ERP."
    }
  },
  "modules/marketing-automation.html": {
    "keyword": "marketing automation Maroc",
    "fr": {
      "title": "Marketing Automation — campagnes ciblees pour PME | Kaalytics",
      "description": "Campagnes avec scoring automatique, enrichissement des contacts et pipeline marketing relie au commercial. ROI mesure par campagne."
    },
    "en": {
      "path": "en/modules/marketing-automation.html",
      "title": "Marketing Automation — targeted campaigns for SMEs | Kaalytics",
      "description": "Campaigns with automatic scoring, contact enrichment and a marketing pipeline wired to sales. ROI measured per campaign."
    }
  },
  "modules/financial-operations.html": {
    "keyword": "tableau de bord financier PME",
    "fr": {
      "title": "Financial Operations — tableau de bord financier et relances | Kaalytics",
      "description": "Suivi de facturation automatise, relances intelligentes et detection d'anomalies. Cash flow previsionnel en un seul ecran."
    },
    "en": {
      "path": "en/modules/financial-operations.html",
      "title": "Financial Operations — financial dashboard and collections | Kaalytics",
      "description": "Automated invoicing follow-up, smart payment reminders and anomaly detection. Forecast cash flow on a single screen."
    }
  },
  "modules/supply-chain.html": {
    "keyword": "gestion des approvisionnements",
    "fr": {
      "title": "Supply Chain Command — planning achats et prevision de ventes | Kaalytics",
      "description": "Planning des achats, previsions de ventes et suivi logistique. Chaque maillon de la chaine visible en temps reel."
    },
    "en": {
      "path": "en/modules/supply-chain.html",
      "title": "Supply Chain Command — purchasing and sales forecasting | Kaalytics",
      "description": "Purchase planning, sales forecasting and logistics tracking. Every link in the chain visible in real time."
    }
  },
  "modules/erp-connect.html": {
    "keyword": "integration ERP Maroc",
    "fr": {
      "title": "ERP Connect — brancher vos modules sur votre ERP | Kaalytics",
      "description": "Connecteurs bidirectionnels vers Cegid, Sage, SAP, Dynamics et Odoo. Vos donnees exploitables sans toucher au systeme en place."
    },
    "en": {
      "path": "en/modules/erp-connect.html",
      "title": "ERP Connect — plug our modules into your ERP | Kaalytics",
      "description": "Two-way connectors for Cegid, Sage, SAP, Dynamics and Odoo. Your data made usable without touching the system in place."
    }
  },
  "modules/digital-platform.html": {
    "keyword": "site web connecte ERP",
    "fr": {
      "title": "Digital Platform — site web et catalogue connectes a l'ERP | Kaalytics",
      "description": "Site vitrine, referencement et catalogue e-commerce alimentes directement par votre ERP. Une presence en ligne qui genere des contacts."
    },
    "en": {
      "path": "en/modules/digital-platform.html",
      "title": "Digital Platform — website and catalogue connected to your ERP | Kaalytics",
      "description": "Website, search visibility and e-commerce catalogue fed directly by your ERP. An online presence that generates leads."
    }
  },
  "modules/ai-engine.html": {
    "keyword": "automatisation IA entreprise Maroc",
    "fr": {
      "title": "AI Engine — automatisations IA pour vos operations | Kaalytics",
      "description": "Agents autonomes, lecture intelligente de documents et analyses automatisees, branches sur vos donnees metier."
    },
    "en": {
      "path": "en/modules/ai-engine.html",
      "title": "AI Engine — AI automation for your operations | Kaalytics",
      "description": "Autonomous agents, intelligent document parsing and automated analysis, wired into your business data."
    }
  }
}
```

- [ ] **Step 6: Lancer les tests pour vérifier qu'ils passent**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_catalog.py -v
```

Attendu : 15 tests PASS (7 paramétrages de `url_path_for` + 8 autres).

- [ ] **Step 7: Commit**

```bash
cd ~/II.Kaalytics/Website/kaalytics
git add scripts/__init__.py scripts/seo/ data/seo/ tests/seo/test_catalog.py
git commit -m "feat(seo): catalogue des metadonnees + derivation des URL canoniques"
```

---

### Task 4: Construction du bloc `<head>`

Fonction pure : elle prend un `PageMeta` et rend une chaîne. Aucun accès disque, donc entièrement testable.

**Files:**
- Create: `scripts/seo/head.py`
- Test: `tests/seo/test_head.py`

**Interfaces:**
- Consumes: `PageMeta`, `load_defaults` (Task 3)
- Produces:
  - `BEGIN_MARKER: str` = `"<!-- SEO:BEGIN (genere par scripts/seo/gen_head.py - ne pas editer) -->"`
  - `END_MARKER: str` = `"<!-- SEO:END -->"`
  - `build_head_block(meta: PageMeta, defaults: dict) -> str`

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/seo/test_head.py` :

```python
import json
import re
from pathlib import Path

from scripts.seo.catalog import PageMeta, load_defaults
from scripts.seo.head import BEGIN_MARKER, END_MARKER, build_head_block

DATA = Path(__file__).resolve().parents[2] / "data" / "seo"

FR = PageMeta(
    html_path="modules/fleetops.html",
    url_path="/modules/fleetops",
    lang="fr",
    title="FleetOps — logiciel de gestion de flotte au Maroc | Kaalytics",
    description="Suivi GPS, maintenance predictive et couts par chantier.",
    og_image="/assets/images/og-fleetops.jpg",
    keyword="logiciel gestion de flotte Maroc",
    alternates=(
        ("fr", "https://kaalytics.com/modules/fleetops"),
        ("en", "https://kaalytics.com/en/modules/fleetops"),
        ("x-default", "https://kaalytics.com/modules/fleetops"),
    ),
    robots="index, follow",
)

SANS_EN = PageMeta(
    html_path="legal/privacy.html",
    url_path="/legal/privacy",
    lang="fr",
    title="Politique de confidentialite | Kaalytics",
    description="Comment Kaalytics collecte et protege vos donnees.",
    og_image="/assets/images/og-image.jpg",
    keyword="",
    alternates=(),
    robots="noindex, follow",
)


def block(meta):
    return build_head_block(meta, load_defaults(DATA))


def test_encadre_par_les_marqueurs():
    out = block(FR)
    assert out.startswith(BEGIN_MARKER)
    assert out.rstrip().endswith(END_MARKER)


def test_canonique_absolue_sans_extension():
    assert (
        '<link rel="canonical" href="https://kaalytics.com/modules/fleetops">'
        in block(FR)
    )


def test_hreflang_complet_quand_jumelle_en():
    out = block(FR)
    for lang, url in FR.alternates:
        assert f'<link rel="alternate" hreflang="{lang}" href="{url}">' in out


def test_aucun_hreflang_sans_jumelle_en():
    assert "hreflang" not in block(SANS_EN)


def test_open_graph_et_twitter_complets():
    out = block(FR)
    for tag in ("og:title", "og:description", "og:url", "og:image", "og:type", "og:locale"):
        assert f'property="{tag}"' in out
    assert 'name="twitter:card" content="summary_large_image"' in out
    assert "https://kaalytics.com/assets/images/og-fleetops.jpg" in out


def test_og_locale_suit_la_langue():
    assert 'content="fr_FR"' in block(FR)
    en = PageMeta(**{**FR.__dict__, "lang": "en"})
    assert 'content="en_US"' in block(en)


def test_meta_robots_reprend_la_valeur_de_la_page():
    assert '<meta name="robots" content="noindex, follow">' in block(SANS_EN)


def test_jsonld_organization_present_et_valide():
    out = block(FR)
    blocks = re.findall(
        r'<script type="application/ld\+json">(.*?)</script>', out, re.S
    )
    assert blocks, "aucun bloc JSON-LD"
    data = json.loads(blocks[0])
    assert data["@type"] == "Organization"
    assert data["@context"] == "https://schema.org"


def test_les_guillemets_du_titre_sont_echappes():
    piege = PageMeta(**{**FR.__dict__, "title": 'Un "vrai" titre & co'})
    out = block(piege)
    assert "&quot;vrai&quot;" in out
    assert "&amp; co" in out
    assert '"vrai"' not in out.split(END_MARKER)[0].replace("&quot;", "")


def test_le_titre_ne_contient_pas_de_balise_title_en_double():
    assert block(FR).count("<title>") == 1
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_head.py -v
```

Attendu : `ModuleNotFoundError: No module named 'scripts.seo.head'`.

- [ ] **Step 3: Écrire scripts/seo/head.py**

```python
"""Construction du bloc <head> genere. Fonction pure, aucun acces disque."""
from __future__ import annotations

import json
from html import escape

from scripts.seo.catalog import BASE_URL, PageMeta

BEGIN_MARKER = "<!-- SEO:BEGIN (genere par scripts/seo/gen_head.py - ne pas editer) -->"
END_MARKER = "<!-- SEO:END -->"

OG_LOCALE = {"fr": "fr_FR", "en": "en_US"}


def _abs(path: str) -> str:
    return path if path.startswith("http") else BASE_URL + path


def build_head_block(meta: PageMeta, defaults: dict) -> str:
    title = escape(meta.title, quote=True)
    description = escape(meta.description, quote=True)
    canonical = BASE_URL + meta.url_path
    og_image = _abs(meta.og_image)

    lines = [
        BEGIN_MARKER,
        f"    <title>{title}</title>",
        f'    <meta name="description" content="{description}">',
        f'    <meta name="robots" content="{escape(meta.robots, quote=True)}">',
        f'    <link rel="canonical" href="{canonical}">',
    ]

    for lang, url in meta.alternates:
        lines.append(f'    <link rel="alternate" hreflang="{lang}" href="{url}">')

    lines += [
        '    <meta property="og:type" content="website">',
        f'    <meta property="og:site_name" content="{escape(defaults["site_name"], quote=True)}">',
        f'    <meta property="og:locale" content="{OG_LOCALE[meta.lang]}">',
        f'    <meta property="og:title" content="{title}">',
        f'    <meta property="og:description" content="{description}">',
        f'    <meta property="og:url" content="{canonical}">',
        f'    <meta property="og:image" content="{og_image}">',
        f'    <meta name="twitter:card" content="{defaults["twitter_card"]}">',
        f'    <meta name="twitter:title" content="{title}">',
        f'    <meta name="twitter:description" content="{description}">',
        f'    <meta name="twitter:image" content="{og_image}">',
    ]

    organization = {"@context": "https://schema.org", **defaults["organization"]}
    lines += [
        '    <script type="application/ld+json">',
        json.dumps(organization, ensure_ascii=False, indent=4),
        "    </script>",
        END_MARKER,
    ]
    return "\n".join(lines) + "\n"
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_head.py -v
```

Attendu : 10 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/II.Kaalytics/Website/kaalytics
git add scripts/seo/head.py tests/seo/test_head.py
git commit -m "feat(seo): construction du bloc head (canonical, hreflang, OG, JSON-LD)"
```

---

### Task 5: Écriture idempotente entre marqueurs

Le garde-fou central : le générateur ne doit jamais toucher au corps de la page, et le relancer deux fois doit donner le même fichier.

**Files:**
- Create: `scripts/seo/htmlio.py`
- Test: `tests/seo/test_htmlio.py`

**Interfaces:**
- Consumes: `BEGIN_MARKER`, `END_MARKER` (Task 4)
- Produces:
  - `upsert_block(html: str, block: str) -> str`
  - `strip_legacy_tags(html: str) -> str` — retire du `<head>` les balises que le bloc généré remplace, uniquement **hors** des marqueurs

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/seo/test_htmlio.py` :

```python
from scripts.seo.head import BEGIN_MARKER, END_MARKER
from scripts.seo.htmlio import strip_legacy_tags, upsert_block

BLOCK = f"{BEGIN_MARKER}\n    <title>Nouveau</title>\n{END_MARKER}\n"

SANS_MARQUEURS = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Ancien</title>
    <link rel="canonical" href="https://kaalytics.com/ancien.html">
</head>
<body>
    <h1>Corps intact</h1>
    <title>piege dans le corps</title>
</body>
</html>
"""


def test_insere_avant_head_fermant_quand_marqueurs_absents():
    out = upsert_block(SANS_MARQUEURS, BLOCK)
    assert BEGIN_MARKER in out
    assert out.index(BEGIN_MARKER) < out.index("</head>")


def test_le_corps_nest_jamais_modifie():
    out = upsert_block(SANS_MARQUEURS, BLOCK)
    body = out.split("<body>")[1]
    assert "<h1>Corps intact</h1>" in body
    assert "<title>piege dans le corps</title>" in body


def test_idempotence():
    une = upsert_block(SANS_MARQUEURS, BLOCK)
    deux = upsert_block(une, BLOCK)
    assert une == deux


def test_remplace_le_bloc_existant_sans_le_dupliquer():
    une = upsert_block(SANS_MARQUEURS, BLOCK)
    autre = BLOCK.replace("Nouveau", "Encore plus nouveau")
    deux = upsert_block(une, autre)
    assert deux.count(BEGIN_MARKER) == 1
    assert "Encore plus nouveau" in deux
    assert "<title>Nouveau</title>" not in deux


def test_strip_legacy_retire_les_balises_du_head_seulement():
    out = strip_legacy_tags(SANS_MARQUEURS)
    head = out.split("</head>")[0]
    assert "<title>Ancien</title>" not in head
    assert 'rel="canonical"' not in head
    assert '<meta charset="UTF-8">' in head, "charset doit survivre"
    assert "<title>piege dans le corps</title>" in out.split("<body>")[1]


def test_strip_legacy_ne_touche_pas_a_linterieur_des_marqueurs():
    avec_bloc = upsert_block(SANS_MARQUEURS, BLOCK)
    out = strip_legacy_tags(avec_bloc)
    assert "<title>Nouveau</title>" in out


def test_leve_si_pas_de_head_fermant():
    import pytest

    with pytest.raises(ValueError, match="</head>"):
        upsert_block("<html><body>rien</body></html>", BLOCK)
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_htmlio.py -v
```

Attendu : `ModuleNotFoundError: No module named 'scripts.seo.htmlio'`.

- [ ] **Step 3: Écrire scripts/seo/htmlio.py**

```python
"""Insertion idempotente du bloc SEO dans le <head>. Le corps n'est jamais touche."""
from __future__ import annotations

import re

from scripts.seo.head import BEGIN_MARKER, END_MARKER

_BLOCK_RE = re.compile(
    re.escape(BEGIN_MARKER) + r".*?" + re.escape(END_MARKER) + r"\n?", re.S
)

# Balises que le bloc genere reprend a son compte, et qui doivent donc
# disparaitre du <head> ecrit a la main. charset et viewport ne sont pas
# dans la liste : ils restent geres par la page.
_LEGACY_PATTERNS = [
    r'[ \t]*<title[^>]*>.*?</title>\s*\n?',
    r'[ \t]*<meta[^>]+name=["\'](?:description|robots|title)["\'][^>]*>\s*\n?',
    r'[ \t]*<meta[^>]+property=["\']og:[^"\']+["\'][^>]*>\s*\n?',
    r'[ \t]*<meta[^>]+name=["\']twitter:[^"\']+["\'][^>]*>\s*\n?',
    r'[ \t]*<link[^>]+rel=["\']canonical["\'][^>]*>\s*\n?',
    r'[ \t]*<link[^>]+rel=["\']alternate["\'][^>]*hreflang[^>]*>\s*\n?',
]


def _split_head(html: str) -> tuple[str, str]:
    index = html.find("</head>")
    if index == -1:
        raise ValueError("page sans </head> : impossible d'inserer le bloc SEO")
    return html[:index], html[index:]


def strip_legacy_tags(html: str) -> str:
    """Retire du <head> les balises remplacees par le bloc genere.

    Ce qui se trouve entre les marqueurs est mis de cote puis restaure : on ne
    nettoie que le contenu ecrit a la main.
    """
    head, rest = _split_head(html)

    preserved: list[str] = []

    def _stash(match: re.Match) -> str:
        preserved.append(match.group(0))
        return f"\x00{len(preserved) - 1}\x00"

    head = _BLOCK_RE.sub(_stash, head)
    for pattern in _LEGACY_PATTERNS:
        head = re.sub(pattern, "", head, flags=re.S | re.I)
    for index, original in enumerate(preserved):
        head = head.replace(f"\x00{index}\x00", original)

    return head + rest


def upsert_block(html: str, block: str) -> str:
    """Remplace le bloc existant, ou l'insere juste avant </head>."""
    head, rest = _split_head(html)
    if BEGIN_MARKER in head:
        return _BLOCK_RE.sub(lambda _: block, head, count=1) + rest
    return head + block + rest
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_htmlio.py -v
```

Attendu : 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/II.Kaalytics/Website/kaalytics
git add scripts/seo/htmlio.py tests/seo/test_htmlio.py
git commit -m "feat(seo): insertion idempotente du bloc head entre marqueurs"
```

---

### Task 6: CLI gen_head et premier passage sur 3 pages

Le garde-fou de la spec : on n'applique pas sur 68 pages avant d'avoir lu le diff de trois.

**Files:**
- Create: `scripts/seo/gen_head.py`
- Modify: `modules/fleetops.html`, `modules/sales-intelligence.html`, `modules/erp-connect.html`
- Test: `tests/seo/test_gen_head.py`

**Interfaces:**
- Consumes: `load_catalog`, `load_defaults` (Task 3), `build_head_block` (Task 4), `strip_legacy_tags`, `upsert_block` (Task 5)
- Produces:
  - `apply_to_page(html: str, meta: PageMeta, defaults: dict) -> str`
  - `main(argv: list[str] | None = None) -> int` — CLI avec `--dry-run` et `--only <chemin> [...]`

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/seo/test_gen_head.py` :

```python
from pathlib import Path

from scripts.seo.catalog import load_catalog, load_defaults
from scripts.seo.gen_head import apply_to_page, main

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "seo"

PAGE = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Ancien titre</title>
    <meta name="description" content="Ancienne description">
</head>
<body><main>corps</main></body>
</html>
"""


def meta_fleetops():
    return next(
        p for p in load_catalog(DATA) if p.html_path == "modules/fleetops.html"
    )


def test_applique_le_nouveau_titre_et_retire_lancien():
    out = apply_to_page(PAGE, meta_fleetops(), load_defaults(DATA))
    assert "FleetOps" in out
    assert "Ancien titre" not in out
    assert "Ancienne description" not in out
    assert out.count("<title>") == 1


def test_idempotent_sur_une_page_reelle():
    defaults = load_defaults(DATA)
    une = apply_to_page(PAGE, meta_fleetops(), defaults)
    deux = apply_to_page(une, meta_fleetops(), defaults)
    assert une == deux


def test_le_corps_est_preserve():
    out = apply_to_page(PAGE, meta_fleetops(), load_defaults(DATA))
    assert "<main>corps</main>" in out


def test_dry_run_necrit_rien(tmp_path, monkeypatch, capsys):
    cible = ROOT / "modules" / "fleetops.html"
    avant = cible.read_text(encoding="utf-8")
    code = main(["--dry-run", "--only", "modules/fleetops.html"])
    assert code == 0
    assert cible.read_text(encoding="utf-8") == avant
    assert "DRY-RUN" in capsys.readouterr().out


def test_only_ne_traite_que_les_pages_demandees(capsys):
    main(["--dry-run", "--only", "modules/fleetops.html"])
    sortie = capsys.readouterr().out
    assert "modules/fleetops.html" in sortie
    assert "modules/ai-engine.html" not in sortie
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_gen_head.py -v
```

Attendu : `ModuleNotFoundError: No module named 'scripts.seo.gen_head'`.

- [ ] **Step 3: Écrire scripts/seo/gen_head.py**

```python
"""Injecte le bloc SEO dans les pages declarees au catalogue.

Usage :
    python3 -m scripts.seo.gen_head --dry-run
    python3 -m scripts.seo.gen_head --only modules/fleetops.html
    python3 -m scripts.seo.gen_head
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from scripts.seo.catalog import PageMeta, load_catalog, load_defaults
from scripts.seo.head import build_head_block
from scripts.seo.htmlio import strip_legacy_tags, upsert_block

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "seo"


def apply_to_page(html: str, meta: PageMeta, defaults: dict) -> str:
    cleaned = strip_legacy_tags(html)
    return upsert_block(cleaned, build_head_block(meta, defaults))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Injecte le bloc SEO dans le <head>.")
    parser.add_argument("--dry-run", action="store_true", help="n'ecrit rien")
    parser.add_argument("--only", nargs="+", default=None, help="chemins a traiter")
    args = parser.parse_args(argv)

    defaults = load_defaults(DATA)
    pages = load_catalog(DATA)
    if args.only:
        wanted = set(args.only)
        pages = [p for p in pages if p.html_path in wanted]
        inconnues = wanted - {p.html_path for p in pages}
        if inconnues:
            print(f"ERREUR: absentes du catalogue : {sorted(inconnues)}", file=sys.stderr)
            return 1

    prefix = "DRY-RUN " if args.dry_run else ""
    modifiees = 0
    for meta in pages:
        path = ROOT / meta.html_path
        if not path.exists():
            print(f"ERREUR: fichier introuvable : {meta.html_path}", file=sys.stderr)
            return 1
        avant = path.read_text(encoding="utf-8")
        apres = apply_to_page(avant, meta, defaults)
        if avant == apres:
            print(f"{prefix}inchange  {meta.html_path}")
            continue
        modifiees += 1
        print(f"{prefix}modifie   {meta.html_path}")
        if not args.dry_run:
            path.write_text(apres, encoding="utf-8")

    print(f"\n{prefix}{modifiees} page(s) modifiee(s) sur {len(pages)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_gen_head.py -v
```

Attendu : 5 tests PASS.

- [ ] **Step 5: Simulation sur les trois pages témoins**

```bash
cd ~/II.Kaalytics/Website/kaalytics
python3 -m scripts.seo.gen_head --dry-run \
  --only modules/fleetops.html modules/sales-intelligence.html modules/erp-connect.html
```

Attendu : trois lignes `DRY-RUN modifie`, et aucun fichier touché (`git status` propre).

- [ ] **Step 6: Application réelle et relecture du diff**

```bash
cd ~/II.Kaalytics/Website/kaalytics
python3 -m scripts.seo.gen_head \
  --only modules/fleetops.html modules/sales-intelligence.html modules/erp-connect.html
git diff --stat
git diff modules/fleetops.html
```

Contrôler à l'œil, sur `modules/fleetops.html` : le bloc est bien dans le `<head>`, le corps est identique, il n'y a qu'un seul `<title>`, la canonique est `https://kaalytics.com/modules/fleetops` sans `.html`, et le hreflang déclare les trois entrées.

**Si le diff touche le corps de la page, arrêter et revenir en arrière** (`git checkout -- .`) : c'est un bug de `strip_legacy_tags`.

- [ ] **Step 7: Vérifier l'idempotence sur fichiers réels**

```bash
cd ~/II.Kaalytics/Website/kaalytics
python3 -m scripts.seo.gen_head \
  --only modules/fleetops.html modules/sales-intelligence.html modules/erp-connect.html
git diff --stat
```

Attendu : `3 page(s) inchangee(s)` et un `git diff` vide.

- [ ] **Step 8: Commit**

```bash
cd ~/II.Kaalytics/Website/kaalytics
git add scripts/seo/gen_head.py tests/seo/test_gen_head.py modules/fleetops.html modules/sales-intelligence.html modules/erp-connect.html
git commit -m "feat(seo): CLI gen_head + premier passage sur 3 pages modules"
```

---

### Task 7: Appliquer aux 8 modules, FR et EN

**Files:**
- Modify: les 5 pages `modules/*.html` restantes et les 8 pages `en/modules/*.html`

**Interfaces:**
- Consumes: `main()` de `scripts.seo.gen_head` (Task 6)
- Produces: rien de nouveau

- [ ] **Step 1: Simulation sur l'ensemble du catalogue**

```bash
cd ~/II.Kaalytics/Website/kaalytics
python3 -m scripts.seo.gen_head --dry-run
```

Attendu : 16 pages listées (8 FR + 8 EN), dont 3 `inchange` (celles de la tâche 6).

- [ ] **Step 2: Application**

```bash
cd ~/II.Kaalytics/Website/kaalytics
python3 -m scripts.seo.gen_head
git diff --stat
```

Attendu : 13 fichiers modifiés.

- [ ] **Step 3: Vérifier qu'aucune page EN ne garde une description française**

```bash
cd ~/II.Kaalytics/Website/kaalytics
grep -l 'name="description"' en/modules/*.html | while read f; do
  printf "%-42s " "$f"
  grep -o 'name="description" content="[^"]*"' "$f" | head -1
done
```

Attendu : huit descriptions en anglais. C'était le défaut principal des pages EN.

- [ ] **Step 4: Lancer toute la suite de tests**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo -v
```

Attendu : tous les tests PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/II.Kaalytics/Website/kaalytics
git add modules/ en/modules/
git commit -m "feat(seo): metadonnees generees sur les 8 modules FR et EN"
```

---

### Task 8: Compléter le catalogue et l'appliquer aux 68 pages

**Files:**
- Create: `data/seo/core.json`, `data/seo/industries.json`, `data/seo/content.json`, `data/seo/legal.json`
- Modify: les pages restantes du périmètre
- Test: `tests/seo/test_couverture.py`

**Interfaces:**
- Consumes: `load_catalog` (Task 3), `main()` de `gen_head` (Task 6)
- Produces:
  - `production_pages() -> list[str]` dans `tests/seo/test_couverture.py`, réutilisé par le checker de la Task 11

- [ ] **Step 1: Écrire le test de couverture qui échoue**

Créer `tests/seo/test_couverture.py` :

```python
from pathlib import Path

from scripts.seo.catalog import load_catalog

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "seo"
EXCLUDED_DIRS = {
    "TRASH", "PROPOSALS", "proposals", "components",
    "sections", "playground", "node_modules", "docs", "tests",
}
# Pages hors perimetre d'indexation : elles ne sont pas au catalogue.
EXCLUDED_FILES = {"404.html", "merci.html"}


def production_pages() -> list[str]:
    pages = []
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT).as_posix()
        if set(rel.split("/")) & EXCLUDED_DIRS:
            continue
        if rel in EXCLUDED_FILES:
            continue
        pages.append(rel)
    return pages


def test_toutes_les_pages_de_prod_sont_au_catalogue():
    au_catalogue = {p.html_path for p in load_catalog(DATA)}
    manquantes = sorted(set(production_pages()) - au_catalogue)
    assert not manquantes, f"pages absentes du catalogue : {manquantes}"


def test_le_catalogue_ne_reference_aucun_fichier_absent():
    fantomes = [p.html_path for p in load_catalog(DATA) if not (ROOT / p.html_path).exists()]
    assert not fantomes, f"entrees sans fichier : {fantomes}"


def test_aucun_titre_duplique():
    titres = [p.title for p in load_catalog(DATA)]
    doublons = {t for t in titres if titres.count(t) > 1}
    assert not doublons, f"titres dupliques : {sorted(doublons)}"
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_couverture.py -v
```

Attendu : `test_toutes_les_pages_de_prod_sont_au_catalogue` FAIL en listant une cinquantaine de pages.

- [ ] **Step 3: Créer les quatre fichiers de catalogue restants**

Reprendre pour chaque page la structure de `modules.json`. Règles à respecter :

- Le `title` et la `description` de départ sont ceux de la page **si elle en a un correct** ; sinon on en écrit un. Les 17 pages de la génération 2 (`industries/*`, `pricing`, `about`, `portail-client`) n'en ont aucun d'exploitable.
- Les pages `legal/*` prennent `"robots": "noindex, follow"` — c'est déjà leur réglage actuel, on le conserve.
- Une page sans jumelle EN n'a **pas** de bloc `en`.
- Aucune description ne dépasse 160 caractères, aucune n'est identique à une autre : les tests de la Task 3 le vérifient.
- Les descriptions EN sont en anglais.

Répartition :

| Fichier | Pages |
|---|---|
| `core.json` | `index.html`, `about.html`, `contact.html`, `demo.html`, `faq.html`, `integrations.html`, `pricing.html`, `support.html`, `resources/index.html`, `portail-client/index.html`, `products/daedalia.html`, `products/fleetops.html` — avec blocs `en` pour `index`, `about`, `contact`, `faq`, `pricing` |
| `industries.json` | les 6 `industries/*.html`, chacune avec sa jumelle `en/industries/*.html` |
| `content.json` | `blog/index.html` + 5 articles, `guides/index.html` + 3 guides, `case-studies/index.html` + 3 études — sans bloc `en` |
| `legal.json` | les 4 `legal/*.html` — sans bloc `en`, `robots` en `noindex, follow` |

**Les 3 études de cas fictives passent en `noindex, nofollow`.** La spec (D2) demande leur
remplacement par les vrais clients anonymisés, mais rédiger ces cas suppose les chiffres
réels d'Excelsa, Multiprobat et Transwin — c'est du contenu, donc P2. En attendant, les
laisser indexées reviendrait à corriger les faux avis tout en laissant en ligne des clients
inventés. On les retire donc de l'index dès P1 :

```json
{
  "case-studies/locamat.html": {
    "keyword": "",
    "robots": "noindex, nofollow",
    "_note": "2026-08-12 - client fictif, a remplacer par un cas reel anonymise en P2",
    "fr": {
      "title": "Etude de cas LocaMat | Kaalytics",
      "description": "Gestion optimisee d'un parc de location d'engins avec FleetOps."
    }
  }
}
```

Même traitement pour `case-studies/terrafleet.html` et `case-studies/transmaroc.html`.
`case-studies/index.html` reste indexable.

Extrait de `core.json` pour fixer la forme d'une entrée **avec** jumelle EN :

```json
{
  "pricing.html": {
    "keyword": "tarifs modules ERP Maroc",
    "fr": {
      "title": "Tarifs — un module, un prix, zero surprise | Kaalytics",
      "description": "Tarification par module, sans engagement sur des fonctions inutilisees. Chaque module reste independant."
    },
    "en": {
      "path": "en/pricing.html",
      "title": "Pricing — one module, one price, no surprises | Kaalytics",
      "description": "Per-module pricing, with no commitment on features you do not use. Every module stays independent."
    }
  }
}
```

Pour les pages qui ont déjà un titre et une description corrects (blog, guides,
`case-studies/index`, `faq`, `contact`, `support`, `integrations`, `resources`), les
reprendre tels quels depuis le HTML existant — c'est une migration, pas une réécriture.
La réécriture ciblée sur les mots-clés est le travail de P2.

Extrait de `legal.json` pour fixer la forme d'une entrée **sans** jumelle EN :

```json
{
  "legal/privacy.html": {
    "keyword": "",
    "robots": "noindex, follow",
    "fr": {
      "title": "Politique de confidentialite | Kaalytics",
      "description": "Comment Kaalytics collecte, utilise et protege vos donnees personnelles."
    }
  },
  "legal/terms.html": {
    "keyword": "",
    "robots": "noindex, follow",
    "fr": {
      "title": "Conditions generales d'utilisation | Kaalytics",
      "description": "Conditions generales d'utilisation des services et de la plateforme Kaalytics."
    }
  },
  "legal/mentions.html": {
    "keyword": "",
    "robots": "noindex, follow",
    "fr": {
      "title": "Mentions legales | Kaalytics",
      "description": "Editeur, hebergeur et informations legales du site kaalytics.com."
    }
  },
  "legal/cookies.html": {
    "keyword": "",
    "robots": "noindex, follow",
    "fr": {
      "title": "Politique de cookies | Kaalytics",
      "description": "Cookies et technologies similaires utilises sur le site kaalytics.com."
    }
  }
}
```

- [ ] **Step 4: Lancer les tests de catalogue et de couverture**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_catalog.py tests/seo/test_couverture.py -v
```

Attendu : tous PASS. En cas d'échec sur les doublons ou la longueur, corriger le JSON.

- [ ] **Step 5: Simulation puis application sur l'ensemble**

```bash
cd ~/II.Kaalytics/Website/kaalytics
python3 -m scripts.seo.gen_head --dry-run | tail -5
python3 -m scripts.seo.gen_head
git diff --stat | tail -3
```

- [ ] **Step 6: Vérifier l'idempotence globale**

```bash
cd ~/II.Kaalytics/Website/kaalytics
python3 -m scripts.seo.gen_head | tail -2
git diff --stat | tail -1
```

Attendu : `0 page(s) modifiee(s)` au second passage.

- [ ] **Step 7: Commit**

```bash
cd ~/II.Kaalytics/Website/kaalytics
git add data/seo/ tests/seo/test_couverture.py .
git commit -m "feat(seo): catalogue complet et metadonnees generees sur les 68 pages"
```

---

### Task 9: Canoniser les liens internes

995 liens internes en `.html` répartis dans 59 fichiers, plus 31 `href="../guides/"` et une poignée d'autres liens à slash final : chacun déclenche un 308 en production. Les fragments (`#modules-ia`), les requêtes (`?lang=`) et le préfixe `{{ROOT}}` de la navbar doivent être préservés.

**Files:**
- Create: `scripts/seo/links.py`
- Modify: les 59 fichiers HTML concernés, plus `components/navbar/navbar.html`, `components/navbar/navbar.en.html`, `components/footer/footer.html`, `components/footer/footer.en.html`
- Test: `tests/seo/test_links.py`

**Interfaces:**
- Consumes: rien
- Produces:
  - `canonicalize_href(href: str) -> str`
  - `canonicalize_links(html: str) -> str`
  - `main(argv: list[str] | None = None) -> int` — CLI avec `--dry-run`

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/seo/test_links.py` :

```python
import pytest

from scripts.seo.links import canonicalize_href, canonicalize_links


@pytest.mark.parametrize(
    "avant,apres",
    [
        # extension retiree
        ("../pricing.html", "../pricing"),
        ("supply-chain.html", "supply-chain"),
        ("/modules/fleetops.html", "/modules/fleetops"),
        ("../legal/privacy.html", "../legal/privacy"),
        # slash final retire
        ("../guides/", "../guides"),
        ("/blog/", "/blog"),
        ("guides/", "guides"),
        ("{{ROOT}}blog/", "{{ROOT}}blog"),
        # index.html
        ("index.html", "/"),
        ("../index.html", "../"),
        ("../index.html#modules-ia", "../#modules-ia"),
        # fragments et requetes preserves
        ("../about.html#equipe", "../about#equipe"),
        ("/faq.html?lang=fr", "/faq?lang=fr"),
        # inchanges
        ("../", "../"),
        ("./", "./"),
        ("/", "/"),
        ("#modules-ia", "#modules-ia"),
        ("{{ROOT}}", "{{ROOT}}"),
        ("https://kaalytics.com/products/daedalia.html", "https://kaalytics.com/products/daedalia.html"),
        ("mailto:contact@kaalytics.com", "mailto:contact@kaalytics.com"),
        ("tel:+212522000000", "tel:+212522000000"),
        ("/assets/css/main.css", "/assets/css/main.css"),
        ("/assets/js/core/app.js", "/assets/js/core/app.js"),
        ("/manifest.json", "/manifest.json"),
        ("/favicon.svg", "/favicon.svg"),
    ],
)
def test_canonicalisation_dun_href(avant, apres):
    assert canonicalize_href(avant) == apres


def test_reecrit_les_href_dans_le_html():
    html = '<a href="../pricing.html">Tarifs</a><a href="../guides/">Guides</a>'
    out = canonicalize_links(html)
    assert 'href="../pricing"' in out
    assert 'href="../guides"' in out


def test_ne_touche_pas_aux_src_ni_aux_link_stylesheet():
    html = (
        '<link rel="stylesheet" href="/assets/css/main.css">'
        '<script src="/assets/js/core/app.js"></script>'
    )
    assert canonicalize_links(html) == html


def test_idempotent():
    html = '<a href="../pricing.html">x</a>'
    une = canonicalize_links(html)
    assert canonicalize_links(une) == une
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_links.py -v
```

Attendu : `ModuleNotFoundError: No module named 'scripts.seo.links'`.

- [ ] **Step 3: Écrire scripts/seo/links.py**

```python
"""Canonisation des liens internes : ni .html, ni slash final.

vercel.json applique cleanUrls + trailingSlash:false ; tout lien en .html ou
finissant par / declenche un 308. On les reecrit a la source.

Usage :
    python3 -m scripts.seo.links --dry-run
    python3 -m scripts.seo.links
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

_SKIP_PREFIXES = ("http://", "https://", "//", "mailto:", "tel:", "data:", "javascript:")
_RESOURCE_RE = re.compile(
    r"\.(css|js|mjs|png|jpe?g|svg|ico|webp|gif|woff2?|ttf|mp4|webm|json|xml|txt|pdf)$",
    re.I,
)
_HREF_RE = re.compile(r'href="([^"]*)"')

EXCLUDED_DIRS = {"TRASH", "PROPOSALS", "proposals", "node_modules", "docs", "tests"}


def canonicalize_href(href: str) -> str:
    if not href or href.startswith(_SKIP_PREFIXES) or href.startswith("#"):
        return href

    # separe le chemin du fragment/de la requete, qui sont preserves tels quels
    match = re.match(r"([^#?]*)([#?].*)?$", href)
    path, tail = match.group(1), match.group(2) or ""

    if not path or _RESOURCE_RE.search(path):
        return href

    if path.endswith("index.html"):
        path = path[: -len("index.html")]
        if not path:
            path = "/"
    elif path.endswith(".html"):
        path = path[: -len(".html")]
    elif path.endswith("/"):
        last = path.rstrip("/").split("/")[-1]
        if last and last not in ("..", "."):
            path = path.rstrip("/")

    return path + tail


def canonicalize_links(html: str) -> str:
    return _HREF_RE.sub(lambda m: f'href="{canonicalize_href(m.group(1))}"', html)


def _target_files() -> list[Path]:
    files = []
    for path in sorted(ROOT.rglob("*.html")):
        if set(path.relative_to(ROOT).parts) & EXCLUDED_DIRS:
            continue
        files.append(path)
    return files


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Canonise les liens internes.")
    parser.add_argument("--dry-run", action="store_true", help="n'ecrit rien")
    args = parser.parse_args(argv)

    prefix = "DRY-RUN " if args.dry_run else ""
    modifiees = 0
    for path in _target_files():
        avant = path.read_text(encoding="utf-8")
        apres = canonicalize_links(avant)
        if avant == apres:
            continue
        modifiees += 1
        print(f"{prefix}modifie   {path.relative_to(ROOT)}")
        if not args.dry_run:
            path.write_text(apres, encoding="utf-8")

    print(f"\n{prefix}{modifiees} fichier(s) modifie(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_links.py -v
```

Attendu : 28 tests PASS (24 paramétrages + 4 autres).

- [ ] **Step 5: Simulation puis application**

```bash
cd ~/II.Kaalytics/Website/kaalytics
python3 -m scripts.seo.links --dry-run | tail -3
python3 -m scripts.seo.links
git diff --stat | tail -3
```

Attendu : une soixantaine de fichiers modifiés, `components/` inclus (navbar et footer).

- [ ] **Step 6: Vérifier qu'il ne reste aucun lien de page en .html**

```bash
cd ~/II.Kaalytics/Website/kaalytics
grep -rhoE 'href="[^"]*\.html[#?"]' --include="*.html" . \
  | grep -vE 'TRASH|PROPOSALS|proposals' | sort -u
```

Attendu : seules subsistent d'éventuelles URL absolues externes. Aucun lien relatif ou en `/`.

- [ ] **Step 7: Commit**

```bash
cd ~/II.Kaalytics/Website/kaalytics
git add scripts/seo/links.py tests/seo/test_links.py .
git commit -m "fix(seo): canonise les liens internes (fin des 308 sur chaque lien)"
```

- [ ] **Step 8: Vérification en production après déploiement**

Attendre le déploiement Vercel automatique, puis :

```bash
for u in /modules/fleetops /guides /pricing /en/modules/fleetops /blog; do
  printf "%-28s " "$u"
  curl -sS -o /dev/null -w "%{http_code} redir=%{num_redirects}\n" "https://kaalytics.com$u"
done
```

Attendu : `200 redir=0` partout. Un `redir=1` signale un lien mal réécrit.

---

### Task 10: Générer le sitemap

Le sitemap actuel date du 22/01/2026 : 33 URLs, une 404 (`industries/collectivites.html`), 7 images déclarées sur 10 inexistantes, un `hreflang="ar"` fantôme, et la majorité des pages absentes. Il est régénéré depuis le catalogue, donc il ne peut plus mentir.

**Files:**
- Create: `scripts/seo/gen_sitemap.py`
- Modify: `sitemap.xml`
- Test: `tests/seo/test_sitemap.py`

**Interfaces:**
- Consumes: `load_catalog`, `absolute_url` (Task 3)
- Produces:
  - `build_sitemap(pages: list[PageMeta], lastmod: str) -> str`
  - `main(argv: list[str] | None = None) -> int` — CLI avec `--lastmod YYYY-MM-DD`

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/seo/test_sitemap.py` :

```python
import re
import xml.etree.ElementTree as ET
from pathlib import Path

from scripts.seo.catalog import load_catalog
from scripts.seo.gen_sitemap import build_sitemap

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "seo"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def sitemap():
    return build_sitemap(load_catalog(DATA), "2026-08-12")


def test_xml_valide():
    ET.fromstring(sitemap())


def test_une_entree_par_page_indexable():
    pages = [p for p in load_catalog(DATA) if "noindex" not in p.robots]
    root = ET.fromstring(sitemap())
    assert len(root.findall("sm:url", NS)) == len(pages)


def test_les_pages_noindex_sont_exclues():
    xml = sitemap()
    assert "/legal/privacy" not in xml
    assert "/legal/terms" not in xml


def test_aucune_url_en_html_ni_slash_final():
    for loc in re.findall(r"<loc>([^<]+)</loc>", sitemap()):
        assert not loc.endswith(".html"), loc
        assert loc == "https://kaalytics.com/" or not loc.endswith("/"), loc


def test_collectivites_absente():
    assert "collectivites" not in sitemap()


def test_aucune_balise_image():
    assert "image:" not in sitemap()


def test_hreflang_reciproque_et_pas_darabe():
    xml = sitemap()
    assert 'hreflang="ar"' not in xml
    assert '?lang=' not in xml
    assert 'hreflang="x-default"' in xml


def test_le_fichier_livre_est_a_jour():
    """sitemap.xml sur disque doit correspondre au catalogue."""
    genere = build_sitemap(load_catalog(DATA), "PLACEHOLDER")
    livre = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    normalise = re.sub(r"<lastmod>[^<]*</lastmod>", "<lastmod>PLACEHOLDER</lastmod>", livre)
    assert normalise == genere
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_sitemap.py -v
```

Attendu : `ModuleNotFoundError: No module named 'scripts.seo.gen_sitemap'`.

- [ ] **Step 3: Écrire scripts/seo/gen_sitemap.py**

```python
"""Genere sitemap.xml depuis le catalogue. Aucune URL inventee.

Usage :
    python3 -m scripts.seo.gen_sitemap --lastmod 2026-08-12
"""
from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path

from scripts.seo.catalog import BASE_URL, PageMeta, load_catalog

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "seo"

PRIORITIES = {"/": "1.0"}
DEFAULT_PRIORITY = "0.8"


def _priority(url_path: str) -> str:
    return PRIORITIES.get(url_path, DEFAULT_PRIORITY)


def build_sitemap(pages: list[PageMeta], lastmod: str) -> str:
    indexables = [p for p in pages if "noindex" not in p.robots]
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ]
    for page in sorted(indexables, key=lambda p: p.url_path):
        lines.append("  <url>")
        lines.append(f"    <loc>{BASE_URL}{page.url_path}</loc>")
        lines.append(f"    <lastmod>{lastmod}</lastmod>")
        lines.append(f"    <priority>{_priority(page.url_path)}</priority>")
        for lang, url in page.alternates:
            lines.append(
                f'    <xhtml:link rel="alternate" hreflang="{lang}" href="{url}"/>'
            )
        lines.append("  </url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Genere sitemap.xml.")
    parser.add_argument("--lastmod", default=date.today().isoformat())
    args = parser.parse_args(argv)

    xml = build_sitemap(load_catalog(DATA), args.lastmod)
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
    print(f"sitemap.xml genere ({xml.count('<url>')} URL, lastmod {args.lastmod})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Générer le sitemap**

```bash
cd ~/II.Kaalytics/Website/kaalytics
python3 -m scripts.seo.gen_sitemap --lastmod 2026-08-12
head -20 sitemap.xml
```

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils passent**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_sitemap.py -v
```

Attendu : 8 tests PASS.

- [ ] **Step 6: Commit**

```bash
cd ~/II.Kaalytics/Website/kaalytics
git add scripts/seo/gen_sitemap.py tests/seo/test_sitemap.py sitemap.xml
git commit -m "fix(seo): sitemap regenere depuis le catalogue (fin des 404 et images fantomes)"
```

---

### Task 11: Le vérificateur bloquant

**Files:**
- Create: `scripts/seo/check_seo.py`
- Test: `tests/seo/test_check_seo.py`

**Interfaces:**
- Consumes: `load_catalog` (Task 3), `canonicalize_href` (Task 9), `production_pages` (Task 8)
- Produces:
  - `Violation` — `NamedTuple` avec `page: str`, `rule: str`, `detail: str`
  - `run_checks(root: Path) -> list[Violation]`
  - `main(argv: list[str] | None = None) -> int` — renvoie `1` s'il y a au moins une violation

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/seo/test_check_seo.py` :

```python
from pathlib import Path

from scripts.seo.check_seo import main, run_checks

ROOT = Path(__file__).resolve().parents[2]


def test_le_site_actuel_ne_viole_aucune_regle():
    violations = run_checks(ROOT)
    assert not violations, "\n".join(
        f"{v.page}: {v.rule} — {v.detail}" for v in violations
    )


def test_code_de_sortie_zero_quand_tout_va_bien():
    assert main([]) == 0


def test_detecte_une_canonique_manquante(tmp_path):
    (tmp_path / "data" / "seo").mkdir(parents=True)
    (tmp_path / "data" / "seo" / "defaults.json").write_text(
        (ROOT / "data" / "seo" / "defaults.json").read_text(encoding="utf-8"),
        encoding="utf-8",
    )
    (tmp_path / "data" / "seo" / "core.json").write_text(
        '{"orpheline.html": {"keyword": "", '
        '"fr": {"title": "T", "description": "D"}}}',
        encoding="utf-8",
    )
    (tmp_path / "orpheline.html").write_text(
        "<html><head></head><body>x</body></html>", encoding="utf-8"
    )
    violations = run_checks(tmp_path)
    assert any(v.rule == "canonical-manquante" for v in violations)


def test_detecte_un_lien_en_html(tmp_path):
    (tmp_path / "data" / "seo").mkdir(parents=True)
    (tmp_path / "data" / "seo" / "defaults.json").write_text(
        (ROOT / "data" / "seo" / "defaults.json").read_text(encoding="utf-8"),
        encoding="utf-8",
    )
    (tmp_path / "data" / "seo" / "core.json").write_text("{}", encoding="utf-8")
    (tmp_path / "sale.html").write_text(
        '<html><head></head><body><a href="/pricing.html">x</a></body></html>',
        encoding="utf-8",
    )
    violations = run_checks(tmp_path)
    assert any(v.rule == "lien-non-canonique" for v in violations)
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_check_seo.py -v
```

Attendu : `ModuleNotFoundError: No module named 'scripts.seo.check_seo'`.

- [ ] **Step 3: Écrire scripts/seo/check_seo.py**

```python
"""Verificateur SEO. Lecture seule. Code de sortie 1 s'il y a une violation.

Usage :
    python3 -m scripts.seo.check_seo
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import NamedTuple

from scripts.seo.catalog import BASE_URL, load_catalog
from scripts.seo.links import canonicalize_href

EXCLUDED_DIRS = {"TRASH", "PROPOSALS", "proposals", "node_modules", "docs", "tests"}
MAX_DESCRIPTION = 160

# Pages /en/ dont le corps n'est pas encore entierement traduit. Chaque entree
# doit porter une date et disparaitre en P2. Ne PAS assouplir la regle
# francais-sur-page-en : inscrire la page ici, visiblement, ou la traduire.
TRADUCTION_EN_ATTENTE: dict[str, str] = {
    # "en/exemple.html": "2026-08-12 - radar des modules non traduit",
}

# Mots frequents en francais, absents ou rares en anglais : servent a detecter
# une chaine francaise restee sur une page /en/.
FRENCH_MARKERS = re.compile(
    r"\b(vos|votre|nos|notre|des|une|pour|avec|sans|plus|tous|toutes|"
    r"chaque|leur|dans|entre|selon|ainsi|donc|aussi)\b",
    re.I,
)


class Violation(NamedTuple):
    page: str
    rule: str
    detail: str


def _pages(root: Path) -> list[Path]:
    return [
        p
        for p in sorted(root.rglob("*.html"))
        if not set(p.relative_to(root).parts) & EXCLUDED_DIRS
    ]


def _visible_text(html: str) -> str:
    body = html.split("<body", 1)[-1]
    body = re.sub(r"<(script|style|svg)[\s\S]*?</\1>", " ", body, flags=re.I)
    return re.sub(r"<[^>]+>", " ", body)


def run_checks(root: Path) -> list[Violation]:
    violations: list[Violation] = []
    catalog = load_catalog(root / "data" / "seo")
    by_path = {p.html_path: p for p in catalog}

    descriptions: dict[str, str] = {}
    for page in catalog:
        if len(page.description) > MAX_DESCRIPTION:
            violations.append(
                Violation(page.html_path, "description-trop-longue", str(len(page.description)))
            )
        if page.description in descriptions:
            violations.append(
                Violation(page.html_path, "description-dupliquee", descriptions[page.description])
            )
        descriptions[page.description] = page.html_path

        for lang, url in page.alternates:
            if lang == "x-default":
                continue
            jumelle = url.replace(BASE_URL, "")
            cible = next((p for p in catalog if p.url_path == jumelle), None)
            if cible is None:
                violations.append(Violation(page.html_path, "hreflang-orphelin", url))
            elif dict(cible.alternates) != dict(page.alternates):
                violations.append(Violation(page.html_path, "hreflang-non-reciproque", url))

    for path in _pages(root):
        rel = path.relative_to(root).as_posix()
        html = path.read_text(encoding="utf-8")

        if rel in by_path and 'rel="canonical"' not in html:
            violations.append(Violation(rel, "canonical-manquante", ""))

        for href in re.findall(r'href="([^"]*)"', html):
            if href != canonicalize_href(href):
                violations.append(Violation(rel, "lien-non-canonique", href))

        if rel.startswith("en/") and rel not in TRADUCTION_EN_ATTENTE:
            texte = _visible_text(html)
            trouves = sorted(set(m.lower() for m in FRENCH_MARKERS.findall(texte)))
            if trouves:
                violations.append(
                    Violation(rel, "francais-sur-page-en", ", ".join(trouves[:5]))
                )

    sitemap = root / "sitemap.xml"
    if sitemap.exists():
        indexables = {BASE_URL + p.url_path for p in catalog if "noindex" not in p.robots}
        declarees = set(re.findall(r"<loc>([^<]+)</loc>", sitemap.read_text(encoding="utf-8")))
        for url in sorted(declarees - indexables):
            violations.append(Violation("sitemap.xml", "url-hors-catalogue", url))
        for url in sorted(indexables - declarees):
            violations.append(Violation("sitemap.xml", "url-manquante", url))

    return violations


def main(argv: list[str] | None = None) -> int:
    root = Path(__file__).resolve().parents[2]
    violations = run_checks(root)
    for v in violations:
        print(f"{v.page}: {v.rule} — {v.detail}")
    print(f"\n{len(violations)} violation(s)")
    return 1 if violations else 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Lancer le vérificateur sur le site réel**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m scripts.seo.check_seo
```

Corriger chaque violation remontée avant de continuer. La règle `francais-sur-page-en` remontera probablement du contenu de corps non traduit : c'est un vrai défaut, à corriger en régénérant les pages EN concernées avec `python3 scripts/gen-en.py <page>`.

**Si une page EN ne peut pas être entièrement traduite dans cette tâche**, l'inscrire explicitement dans une liste `TRADUCTION_EN_ATTENTE` en tête de `check_seo.py` avec un commentaire daté, plutôt que d'affaiblir la règle.

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils passent**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo -v
```

Attendu : toute la suite PASS, `test_le_site_actuel_ne_viole_aucune_regle` compris.

- [ ] **Step 6: Commit**

```bash
cd ~/II.Kaalytics/Website/kaalytics
git add scripts/seo/check_seo.py tests/seo/test_check_seo.py .
git commit -m "feat(seo): verificateur bloquant (canoniques, liens, hreflang, sitemap, langue)"
```

---

### Task 12: Mesure — GA4, Search Console, IndexNow

**Bloquant : cette tâche a besoin de deux valeurs que seul Mamoun peut fournir.** Demander avant de commencer :
1. L'identifiant de mesure GA4 (format `G-XXXXXXXXXX`) — créer la propriété sur analytics.google.com si elle n'existe pas.
2. Le mode de vérification Search Console retenu (fichier HTML à déposer, ou balise meta).

Ne rien inventer. Si les valeurs ne sont pas disponibles, s'arrêter et le signaler.

**Files:**
- Modify: toutes les pages contenant `G-XXXXXXXXXX`
- Create: `.github/workflows/indexnow.yml`
- Create: `<cle-indexnow>.txt` à la racine
- Create: `scripts/seo/indexnow.py`
- Test: `tests/seo/test_mesure.py`

**Interfaces:**
- Consumes: `sitemap.xml` (Task 10)
- Produces:
  - `submit(urls: list[str], host: str, key: str) -> int` — code HTTP renvoyé par l'API IndexNow

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/seo/test_mesure.py` :

```python
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXCLUDED = ("TRASH", "PROPOSALS", "proposals")


def prod_html():
    for path in ROOT.rglob("*.html"):
        rel = path.relative_to(ROOT).as_posix()
        if not any(x in rel for x in EXCLUDED):
            yield rel, path


def test_plus_aucun_placeholder_ga4():
    fautifs = [
        rel for rel, path in prod_html()
        if "G-XXXXXXXXXX" in path.read_text(encoding="utf-8")
    ]
    assert not fautifs, f"placeholder GA4 encore present : {fautifs}"


def test_identifiant_ga4_de_forme_valide():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    ids = set(re.findall(r"G-[A-Z0-9]{8,12}", html))
    assert len(ids) == 1, f"identifiants GA4 incoherents : {ids}"


def test_cle_indexnow_presente_a_la_racine():
    cles = list(ROOT.glob("*.txt"))
    noms = {p.stem for p in cles}
    workflow = (ROOT / ".github" / "workflows" / "indexnow.yml").read_text(encoding="utf-8")
    assert any(nom in workflow for nom in noms), "cle IndexNow absente ou non referencee"


def test_le_fichier_cle_contient_exactement_la_cle():
    for path in ROOT.glob("*.txt"):
        if path.name in ("humans.txt", "llms.txt", "robots.txt"):
            continue
        assert path.read_text(encoding="utf-8").strip() == path.stem
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_mesure.py -v
```

Attendu : `test_plus_aucun_placeholder_ga4` FAIL, `test_cle_indexnow_presente_a_la_racine` FAIL.

- [ ] **Step 3: Remplacer le placeholder GA4**

```bash
cd ~/II.Kaalytics/Website/kaalytics
grep -rl "G-XXXXXXXXXX" --include="*.html" . | grep -vE 'TRASH|PROPOSALS|proposals' \
  | xargs sed -i "s/G-XXXXXXXXXX/<IDENTIFIANT_FOURNI_PAR_MAMOUN>/g"
grep -rn "G-XXXXXXXXXX" --include="*.html" . | grep -vE 'TRASH|PROPOSALS' | wc -l
```

Attendu : `0`.

- [ ] **Step 4: Générer la clé IndexNow et son fichier**

```bash
cd ~/II.Kaalytics/Website/kaalytics
KEY=$(python3 -c "import uuid; print(uuid.uuid4().hex)")
printf '%s' "$KEY" > "$KEY.txt"
echo "Cle IndexNow : $KEY"
```

Noter la clé : elle est reprise à l'étape suivante.

- [ ] **Step 5: Écrire scripts/seo/indexnow.py**

Reprend le principe de `~/IV.Beks/Website/scripts/seo/indexnow.js`, en Python et bibliothèque standard.

```python
"""Notifie Bing, Yandex et leurs partenaires des URL du sitemap via IndexNow.

Usage :
    python3 -m scripts.seo.indexnow            # toutes les URL du sitemap
    python3 -m scripts.seo.indexnow <url> ...  # URL precises
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HOST = "kaalytics.com"
KEY = "<CLE_GENEREE_A_LETAPE_4>"
ENDPOINT = "https://api.indexnow.org/IndexNow"


def sitemap_urls() -> list[str]:
    xml = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    return re.findall(r"<loc>([^<]+)</loc>", xml)


def submit(urls: list[str], host: str = HOST, key: str = KEY) -> int:
    payload = json.dumps(
        {
            "host": host,
            "key": key,
            "keyLocation": f"https://{host}/{key}.txt",
            "urlList": urls,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        ENDPOINT,
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.status


def main(argv: list[str] | None = None) -> int:
    urls = (argv or sys.argv[1:]) or sitemap_urls()
    if not urls:
        print("aucune URL a soumettre", file=sys.stderr)
        return 1
    status = submit(urls)
    print(f"IndexNow : {len(urls)} URL soumises, reponse HTTP {status}")
    return 0 if status in (200, 202) else 1


if __name__ == "__main__":
    raise SystemExit(main())
```

Remplacer `<CLE_GENEREE_A_LETAPE_4>` par la clé réelle.

- [ ] **Step 6: Créer le workflow GitHub**

Créer `.github/workflows/indexnow.yml` :

```yaml
name: IndexNow

on:
  push:
    branches: [main]
    paths:
      - 'sitemap.xml'
  workflow_dispatch:

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Attendre le deploiement Vercel
        run: sleep 90
      - name: Soumettre les URL a IndexNow
        run: python3 -m scripts.seo.indexnow
```

- [ ] **Step 7: Lancer les tests pour vérifier qu'ils passent**

```bash
cd ~/II.Kaalytics/Website/kaalytics && python3 -m pytest tests/seo/test_mesure.py -v
```

Attendu : 4 tests PASS.

- [ ] **Step 8: Commit**

```bash
cd ~/II.Kaalytics/Website/kaalytics
git add -A
git commit -m "feat(seo): GA4 reel, cle IndexNow et workflow de notification"
```

- [ ] **Step 9: Actions manuelles après déploiement**

À faire par Mamoun, dans cet ordre — ces étapes ne sont pas automatisables :

1. Vérifier la propriété `kaalytics.com` sur [Search Console](https://search.google.com/search-console).
2. Soumettre `https://kaalytics.com/sitemap.xml`.
3. Dans **Inspection d'URL**, tester `https://kaalytics.com/modules/fleetops`, cliquer sur **Tester l'URL en direct** puis **Capture d'écran** : **vérifier que la navigation apparaît**. C'est le test qui valide la réparation du point le plus grave de l'audit — jusqu'ici `robots.txt` empêchait Googlebot de charger la navbar.
4. Relever et noter les chiffres de départ : pages indexées, requêtes distinctes. Il n'y a aucun historique, ces valeurs servent de référence.
5. Ajouter à la liste de suivi les concurrents marocains à surveiller sur les mêmes requêtes.

---

## Condition de sortie de P1

P1 est terminé quand ces cinq points sont vrais :

```bash
cd ~/II.Kaalytics/Website/kaalytics
python3 -m pytest tests/seo -v          # toute la suite passe
python3 -m scripts.seo.check_seo        # 0 violation, code de sortie 0
python3 -m scripts.seo.gen_head         # 0 page modifiee (idempotent)
```

Plus, en production :

```bash
for u in / /modules/fleetops /guides /en /pricing /llms.txt; do
  printf "%-24s " "$u"
  curl -sS -o /dev/null -w "%{http_code} redir=%{num_redirects}\n" "https://kaalytics.com$u"
done
```

Attendu : `200 redir=0` partout.

Et enfin, dans Search Console : le rendu en direct de `https://kaalytics.com/modules/fleetops` montre la navigation.

**P2 ne démarre pas avant que ces cinq conditions soient remplies.**
