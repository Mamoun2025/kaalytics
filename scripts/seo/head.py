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
