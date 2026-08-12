"""Verificateur SEO. Lecture seule. Code de sortie 1 s'il y a une violation."""
from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import NamedTuple

from scripts.seo.catalog import BASE_URL, load_catalog
from scripts.seo.links import canonicalize_href
from scripts.seo import rules

EXCLUDED_DIRS = {"TRASH", "PROPOSALS", "proposals", "node_modules", "docs", "tests", ".superpowers", ".git", ".vercel", "components", "sections", "playground"}
MAX_DESCRIPTION = 160
MAX_TITLE = 70
TRADUCTION_EN_ATTENTE: dict[str, str] = {}
FRENCH_MARKERS = re.compile(
    r"\b(vos|votre|nos|notre|des|une|pour|avec|sans|plus|tous|toutes|"
    r"chaque|leur|dans|entre|selon|ainsi|donc|aussi|les|est|sont|nous|vous|"
    r"qui|que|plusieurs|cette|ces|afin|lors|depuis|jusqu)\b", re.I)
ETIQUETTES_FR = re.compile(
    r"(?<![\w-])(IA|Lire|Voir|Accueil|Retour|Suivant|Precedent|Précédent|"
    r"Decouvrir|Découvrir|Nos|Le|La|Du|Au|Aux|Ou|Tarifs|Ressources|"
    r"Contactez|Demander|Telecharger|Télécharger)(?![\w-])")
RESSOURCE = re.compile(r"\.(css|js|mjs|png|jpe?g|svg|ico|webp|gif|woff2?|ttf|mp4|webm|json|xml|txt|pdf)$", re.I)
URLS_HORS_DEPOT = {BASE_URL + "/work"}


class Violation(NamedTuple):
    page: str
    rule: str
    detail: str


class Warning(NamedTuple):
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


def _resolve_link_target(rel_file: str, href: str, root: Path) -> bool:
    if href.startswith(("http", "//", "#", "mailto:", "tel:", "data:", "javascript:", "{{")):
        return True
    chemin = re.match(r"([^#?]*)", href).group(1)
    if not chemin or chemin in ("/", "./", "../") or RESSOURCE.search(chemin):
        return True
    base = os.path.dirname(rel_file)
    cible = os.path.normpath(os.path.join("" if chemin.startswith("/") else base, chemin.lstrip("/")))
    for candidate in (cible + ".html", os.path.join(cible, "index.html"), cible):
        if (root / candidate).exists():
            return True
    return False


def _run_checks_internal(root: Path) -> tuple[list[Violation], list[Warning]]:
    violations: list[Violation] = []
    warnings: list[Warning] = []
    catalog = load_catalog(root / "data" / "seo")
    by_path = {p.html_path: p for p in catalog}

    descriptions, titres = {}, {}
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

        # Titles (avertissements si > 70, pas des violations)
        if len(page.title) > MAX_TITLE:
            warnings.append(
                Warning(page.html_path, "titre-tronque-en-SERP", str(len(page.title)))
            )
        titres.setdefault(page.title, []).append(page.html_path)
        for lang, url in page.alternates:
            if lang == "x-default":
                continue
            jumelle = url.replace(BASE_URL, "")
            cible = next((p for p in catalog if p.url_path == jumelle), None)
            if cible is None:
                violations.append(Violation(page.html_path, "hreflang-orphelin", url))
            elif dict(cible.alternates) != dict(page.alternates):
                violations.append(Violation(page.html_path, "hreflang-non-reciproque", url))
    # Detecte les titres dupliques
    for titre, pages in titres.items():
        if len(pages) > 1:
            violations.append(Violation(pages[0], "titre-duplique", f"{pages} : {titre}"))
    # Catalogue : entrees fantomes et français désaccentué
    raw_catalog = {}
    for path in sorted((root / "data" / "seo").glob("*.json")):
        if path.name != "defaults.json":
            raw_catalog.update(json.loads(path.read_text(encoding="utf-8")))
    for err in rules.check_catalog_entries_exist(raw_catalog, root):
        violations.append(Violation(err.page, err.rule, err.detail))
    for page_path, entry in raw_catalog.items():
        for lng in ("fr", "en"):
            bloc = entry.get(lng)
            if not bloc or lng != "fr": continue
            for err in rules.check_french_unaccented(page_path, bloc["title"], bloc["description"]):
                violations.append(Violation(err.page, err.rule, err.detail))
    # --- Fichiers HTML
    for path in _pages(root):
        rel = path.relative_to(root).as_posix()
        html = path.read_text(encoding="utf-8")
        tete = html.split("</head>")[0]

        # Page en catalogue
        for err in rules.check_page_in_catalog(rel, by_path):
            violations.append(Violation(err.page, err.rule, err.detail))

        # Unicité balises title/canonical/bloc-SEO
        for err in rules.check_tag_uniqueness(rel, html):
            violations.append(Violation(err.page, err.rule, err.detail))

        # Attribut lang
        for err in rules.check_lang_attribute(rel, html):
            violations.append(Violation(err.page, err.rule, err.detail))

        # Canonique
        if rel in by_path and 'rel="canonical"' not in tete:
            violations.append(Violation(rel, "canonical-manquante", ""))

        # Canonique correspond au chemin reel
        canon_match = re.findall(r'rel="canonical"[^>]*href="([^"]+)', tete)
        if canon_match:
            canon_url = canon_match[0]
            if canon_url.endswith(".html"):
                violations.append(Violation(rel, "canonique-en-.html", canon_url))
            elif canon_url != BASE_URL + "/" and canon_url.endswith("/"):
                violations.append(Violation(rel, "canonique-a-slash-final", canon_url))
            else:
                attendu = "/" if rel == "index.html" else (
                    "/" + rel[:-len("/index.html")] if rel.endswith("/index.html")
                    else "/" + rel[:-len(".html")] if rel.endswith(".html")
                    else "/" + rel
                )
                if canon_url != BASE_URL + attendu:
                    violations.append(Violation(rel, "canonique-ne-correspond-pas-au-chemin", f"{canon_url}"))

        # hreflang
        for err in rules.check_hreflang_defaults(rel, html, root):
            violations.append(Violation(err.page, err.rule, err.detail))
        for err in rules.check_hreflang_targets_exist(rel, html, root):
            violations.append(Violation(err.page, err.rule, err.detail))

        # JSON-LD valide
        for bloc in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S):
            try:
                json.loads(bloc)
            except json.JSONDecodeError as exc:
                violations.append(Violation(rel, "json-ld-invalide", str(exc)))

        # Avis fictifs
        for t in re.findall(r'"@type"\s*:\s*"(AggregateRating|Review|Rating)"', html):
            violations.append(Violation(rel, "avis-fictif-balise", t))

        # Liens internes
        for href in re.findall(r'href="([^"]*)"', html):
            if href.startswith(("http", "//", "#", "mailto:", "tel:", "data:", "javascript:", "{{")):
                continue
            if href != canonicalize_href(href):
                violations.append(Violation(rel, "lien-non-canonique", href))
            if not _resolve_link_target(rel, href, root):
                violations.append(Violation(rel, "lien-sans-cible", href))

        # Separation des langues et contenu FR
        if rel.startswith("en/") and rel not in TRADUCTION_EN_ATTENTE:
            texte = _visible_text(html)
            etiq = sorted(set(ETIQUETTES_FR.findall(texte)))
            if etiq:
                violations.append(Violation(rel, "etiquette-francaise-sur-page-EN", ", ".join(etiq[:5])))
            trouves = sorted(set(m.lower() for m in FRENCH_MARKERS.findall(texte)))
            if trouves:
                violations.append(Violation(rel, "francais-sur-page-en", ", ".join(trouves[:5])))

    # --- Sitemap
    sitemap = root / "sitemap.xml"
    if sitemap.exists():
        indexables = {BASE_URL + p.url_path for p in catalog if "noindex" not in p.robots}
        declarees = set(re.findall(r"<loc>([^<]+)</loc>", sitemap.read_text(encoding="utf-8")))
        for url in sorted(declarees - URLS_HORS_DEPOT):
            if url.endswith(".html"):
                violations.append(Violation("sitemap.xml", "sitemap-url-en-.html", url))
            chemin = url.replace(BASE_URL, "").strip("/")
            candidats = [chemin + ".html", os.path.join(chemin, "index.html"), chemin] \
                if chemin else ["index.html"]
            if not any((root / c).exists() for c in candidats):
                violations.append(Violation("sitemap.xml", "sitemap-url-sans-page", url))

        for url in sorted(indexables - declarees):
            violations.append(Violation("sitemap.xml", "url-manquante", url))

    # --- robots.txt
    robots_path = root / "robots.txt"
    if robots_path.exists():
        robots = robots_path.read_text(encoding="utf-8")
        for bloque in ("/assets/js/", "/components/"):
            if f"Disallow: {bloque}" in robots:
                violations.append(Violation("robots.txt", "robots-bloque-le-rendu", bloque))

    return violations, warnings


def run_checks(root: Path) -> list[Violation]:
    """Interface publique - retourne seulement les violations."""
    violations, _ = _run_checks_internal(root)
    return violations


def main(argv: list[str] | None = None) -> int:
    root = Path(__file__).resolve().parents[2]
    violations, warnings = _run_checks_internal(root)

    # Affiche les violations
    for v in violations:
        print(f"{v.page}: {v.rule} — {v.detail}")

    # Affiche les avertissements separement
    if warnings:
        print("\n--- AVERTISSEMENTS (non-bloquants) ---")
        for w in warnings:
            print(f"{w.page}: {w.rule} — {w.detail}")

    total = len(violations)
    print(f"\n{total} violation(s)")
    return 1 if violations else 0


if __name__ == "__main__":
    raise SystemExit(main())
