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
    """Fusionne tous les data/seo/*.json sauf defaults.json et extra-schemas.json."""
    merged: dict = {}
    for path in sorted(data_dir.glob("*.json")):
        if path.name in ("defaults.json", "extra-schemas.json"):
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
