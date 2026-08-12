"""Construction du bloc <head> genere. Fonction pure, aucun acces disque."""
from __future__ import annotations

import json
import re
from html import escape

from scripts.seo.catalog import BASE_URL, PageMeta
from scripts.seo.schema import build_breadcrumb_list, build_article_schema

BEGIN_MARKER = "<!-- SEO:BEGIN (genere par scripts/seo/gen_head.py - ne pas editer) -->"
END_MARKER = "<!-- SEO:END -->"

OG_LOCALE = {"fr": "fr_FR", "en": "en_US"}


def _abs(path: str) -> str:
    return path if path.startswith("http") else BASE_URL + path


def _deduplicate_schemas(html: str) -> str:
    """Retire les scripts JSON-LD redondants en dehors du bloc SEO généré.

    Retire les blocs Organization et BreadcrumbList qui sont doublonnés
    (on les génère désormais dans le bloc SEO).
    """
    # Diviser le HTML en trois parties : avant bloc SEO, le bloc SEO, après bloc SEO
    head, rest = html.split("</head>", 1)
    seo_start = BEGIN_MARKER
    seo_end = END_MARKER

    if seo_start not in head or seo_end not in head:
        # Pas de bloc SEO, laisser intact
        return html

    # Trouver les positions
    before_seo = head[: head.find(seo_start)]
    seo_block = head[head.find(seo_start) : head.find(seo_end) + len(seo_end)]
    after_seo = head[head.find(seo_end) + len(seo_end) :]

    # Retirer les schémas redondants en dehors du bloc SEO
    def remove_duplicate_schemas(text: str) -> str:
        """Retire les scripts JSON-LD Organization et BreadcrumbList."""
        pattern = r'[ \t]*<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>[ \t]*\r?\n?'

        def check_and_remove(match):
            content = match.group(1)
            try:
                data = json.loads(content)
                schema_type = data.get("@type") if isinstance(data, dict) else None
                # Retirer si c'est une Organization ou BreadcrumbList (qu'on génère maintenant)
                if schema_type in ("Organization", "BreadcrumbList"):
                    return ""
            except (json.JSONDecodeError, ValueError):
                # Laisser les scripts invalides en place
                pass
            return match.group(0)

        return re.sub(pattern, check_and_remove, text, flags=re.S | re.I)

    before_seo_clean = remove_duplicate_schemas(before_seo)
    after_seo_clean = remove_duplicate_schemas(after_seo)

    return before_seo_clean + seo_block + after_seo_clean + "</head>" + rest


def build_head_block(meta: PageMeta, defaults: dict, extra_schemas: list[dict] | None = None) -> str:
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

    # Générer les schémas structurés
    schemas = []

    # 1. BreadcrumbList (si applicable)
    breadcrumb = build_breadcrumb_list(meta.html_path, meta.lang)
    if breadcrumb:
        schemas.append(breadcrumb)

    # 2. Article (si applicable)
    article = build_article_schema(meta.html_path, meta.lang, meta.title, meta.description)
    if article:
        schemas.append(article)

    # 3. Organization (toujours présente)
    organization = {"@context": "https://schema.org", **defaults["organization"]}
    schemas.append(organization)

    # 4. Schémas supplémentaires (si fournis)
    if extra_schemas:
        schemas.extend(extra_schemas)

    # Générer les scripts JSON-LD
    for schema in schemas:
        lines += [
            '    <script type="application/ld+json">',
            json.dumps(schema, ensure_ascii=False, indent=4),
            "    </script>",
        ]

    lines.append(END_MARKER)
    return "\n".join(lines) + "\n"
