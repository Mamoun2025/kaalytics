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
