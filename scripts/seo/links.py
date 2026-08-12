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

    if path.endswith("/"):
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
