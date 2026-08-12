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

# /work vient d'une rewrite Vercel vers kaalytics-work.vercel.app (application externe).
# Elle n'existe pas dans le catalogue mais elle est une page publique réelle et indexable.
EXTERNAL_PAGES = [
    PageMeta(
        html_path="work",
        url_path="/work",
        lang="fr",
        title="Réalisations",
        description="Portfolio de nos réalisations clients",
        og_image="",
        keyword="",
        alternates=(),
        robots="index, follow, max-image-preview:large, max-snippet:-1",
    )
]


def _priority(url_path: str) -> str:
    return PRIORITIES.get(url_path, DEFAULT_PRIORITY)


def build_sitemap(pages: list[PageMeta], lastmod: str) -> str:
    # Combine catalogue pages with external pages
    all_pages = pages + EXTERNAL_PAGES
    indexables = [p for p in all_pages if "noindex" not in p.robots]
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
