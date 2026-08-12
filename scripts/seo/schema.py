"""Génération des structures de données structurées : BreadcrumbList et Article.

Ce module est une fonction pure - aucun accès disque, aucun effet de bord.
Chaque fonction retourne un dict JSON-LD (ou None si non applicable).
"""
from __future__ import annotations

import re
from typing import Optional

# Table de correspondance segment URL ↔ libellé du fil d'Ariane
# Utilisée pour le lien entre "blog/" et "Blog", etc.
BREADCRUMB_LABELS = {
    "fr": {
        "modules": "Modules",
        "industries": "Secteurs",
        "blog": "Blog",
        "guides": "Guides",
        "case-studies": "Études de cas",
        "legal": "Mentions légales",
        "products": "Produits",
    },
    "en": {
        "modules": "Modules",
        "industries": "Industries",
        "blog": "Blog",
        "guides": "Guides",
        "case-studies": "Case Studies",
        "legal": "Legal",
        "products": "Products",
    },
}


def _html_path_to_segments(html_path: str) -> list[str]:
    """Extrait les segments du chemin HTML.

    'modules/fleetops.html'     -> ['modules', 'fleetops']
    'blog/index.html'           -> ['blog']
    'index.html'                -> []
    'en/modules/ai-engine.html' -> ['modules', 'ai-engine']
    """
    path = html_path.strip("/")

    # Cas spécial : accueil
    if path == "index.html":
        return []

    # Cas spécial : accueil en anglais
    if path == "en/index.html":
        return []

    # Retire 'en/' au début si présent
    if path.startswith("en/"):
        path = path[3:]

    # Retire '/index.html' à la fin si présent
    if path.endswith("/index.html"):
        path = path[: -len("/index.html")]

    # Retire '.html' à la fin si présent
    if path.endswith(".html"):
        path = path[: -len(".html")]

    return path.split("/")


def _url_path_from_segments(segments: list[str]) -> str:
    """Construit le chemin canonique URL à partir des segments.

    ['modules', 'fleetops'] -> '/modules/fleetops'
    []                       -> '/'
    ['blog']                 -> '/blog'
    """
    if not segments:
        return "/"
    return "/" + "/".join(segments)


def _page_title_from_html_path(html_path: str) -> str:
    """Extrait le titre de la page (dernier segment du chemin).

    'modules/fleetops.html'    -> 'fleetops'
    'blog/digitalisation-flotte-btp.html' -> 'digitalisation-flotte-btp'
    'guides/index.html'        -> 'guide' (index n'est pas un titre valide)
    """
    segments = _html_path_to_segments(html_path)
    if not segments:
        return ""
    last = segments[-1]
    if last == "index":
        return ""
    return last


def _humanize_segment(segment: str) -> str:
    """Convertit un segment d'URL en texte lisible.

    'fleetops'          -> 'FleetOps'
    'sales-intelligence' -> 'Sales Intelligence'
    'digitalisation-flotte-btp' -> 'Digitalisation flotte BTP'
    """
    # Cas spéciaux : modules et termes techniques
    module_names = {
        "fleetops": "FleetOps",
        "sales-intelligence": "Sales Intelligence",
        "marketing-automation": "Marketing Automation",
        "financial-operations": "Financial Operations",
        "supply-chain-command": "Supply Chain Command",
        "erp-connect": "ERP Connect",
        "digital-platform": "Digital Platform",
        "ai-engine": "AI Engine",
        "digitalisation-flotte-btp": "Digitalisation flotte BTP",
    }
    if segment in module_names:
        return module_names[segment]

    # Cas général : capitaliser la première lettre seulement (sinon flotte -> Flotte)
    words = segment.split("-")
    result = []
    for i, word in enumerate(words):
        if i == 0:
            result.append(word.capitalize())
        else:
            result.append(word)
    return " ".join(result)


def build_breadcrumb_list(html_path: str, lang: str) -> Optional[dict]:
    """Génère un schéma BreadcrumbList pour une page.

    Retourne None si la page est l'accueil (pas de fil d'Ariane sur une seule étape).
    """
    segments = _html_path_to_segments(html_path)

    # Pas de fil d'Ariane sur l'accueil
    if not segments:
        return None

    items: list[dict] = []

    # Étape 1 : Accueil
    items.append(
        {
            "position": 1,
            "name": "Accueil" if lang == "fr" else "Home",
            "item": "https://kaalytics.com/",
        }
    )

    # Étapes intermédiaires et finale
    for i, segment in enumerate(segments):
        position = i + 2
        path_parts = segments[: i + 1]

        # Libellé : lookup dans la table si c'est un segment connu, sinon humaniser
        if segment in BREADCRUMB_LABELS[lang]:
            name = BREADCRUMB_LABELS[lang][segment]
        else:
            name = _humanize_segment(segment)

        # URL absolue
        url = "https://kaalytics.com" + _url_path_from_segments(path_parts)

        items.append(
            {
                "position": position,
                "name": name,
                "item": url,
            }
        )

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items,
    }


def build_article_schema(
    html_path: str, lang: str, title: Optional[str], description: Optional[str]
) -> Optional[dict]:
    """Génère un schéma Article pour une page de blog ou guide.

    Retourne None si la page n'est pas un article (module, accueil, etc.).

    Paramètres :
        html_path : chemin relatif du fichier HTML
        lang : 'fr' ou 'en'
        title : titre de la page
        description : description de la page
    """
    # Retire 'en/' du début du chemin si présent pour la vérification
    check_path = html_path.replace("en/", "")

    # Seules les pages de blog/ et guides/ (hors index) sont des articles
    is_blog = check_path.startswith("blog/") and not check_path.endswith("/index.html")
    is_guide = check_path.startswith("guides/") and not check_path.endswith("/index.html")

    if not (is_blog or is_guide):
        return None

    if not title or not description:
        return None

    # URL canonique
    if html_path.startswith("en/"):
        path = html_path[3:]
    else:
        path = html_path

    if path.endswith(".html"):
        path = path[: -len(".html")]
    if path.endswith("/index"):
        path = path[: -len("/index")]

    canonical_url = "https://kaalytics.com/" + path

    # Schéma Organization pour author et publisher
    organization = {
        "@type": "Organization",
        "name": "Kaalytics",
        "url": "https://kaalytics.com",
        "logo": "https://kaalytics.com/assets/images/logo/kaalytics-logo.png",
    }

    # Nettoyer le headline : retirer le suffixe "| Kaalytics" et autres suffixes
    headline = title
    # Patterns de suffixes à retirer
    suffixes = [" | Kaalytics", " | Blog Kaalytics", " - Kaalytics"]
    for suffix in suffixes:
        if headline.endswith(suffix):
            headline = headline[: -len(suffix)]

    article: dict = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": headline,
        "description": description,
        "inLanguage": lang,
        "author": organization,
        "publisher": organization,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonical_url,
        },
    }

    return article
