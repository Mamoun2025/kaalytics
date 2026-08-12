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
# Note: terminer par [ \t]*\r?\n? (pas \s*\n?) pour preserver l'indentation de la ligne suivante.
_LEGACY_PATTERNS = [
    r'[ \t]*<title[^>]*>.*?</title>[ \t]*\r?\n?',
    r'[ \t]*<meta[^>]+name=["\'](?:description|robots|title)["\'][^>]*>[ \t]*\r?\n?',
    r'[ \t]*<meta[^>]+property=["\']og:[^"\']+["\'][^>]*>[ \t]*\r?\n?',
    r'[ \t]*<meta[^>]+name=["\']twitter:[^"\']+["\'][^>]*>[ \t]*\r?\n?',
    r'[ \t]*<link[^>]+rel=["\']canonical["\'][^>]*>[ \t]*\r?\n?',
    r'[ \t]*<link[^>]+rel=["\']alternate["\'][^>]*hreflang[^>]*>[ \t]*\r?\n?',
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
