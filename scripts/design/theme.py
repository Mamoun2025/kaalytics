"""Applique le thème 2026 à tout le site : recoloration des styles et branchement de la feuille commune.

Usage : python3 -m scripts.design.theme [--verifier]
- Feuilles CSS du dépôt : recolorées entièrement (scripts/design/couleurs.py).
- Pages HTML : seuls les blocs <style>, les attributs style="…" et les couleurs SVG sont recolorés ;
  le texte n'est jamais touché. La feuille du thème et ses polices sont branchées juste avant </head>.
- Idempotent. --verifier n'écrit rien et sort en 1 si un fichier reste à traiter.
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

from scripts.design.couleurs import recolorer
from scripts.design.tour import RACINE, pages_du_site

MARQUE = "<!-- theme-2026 -->"
_ANCIEN_BRANCHEMENT = re.compile(r"    <!-- theme-2026 -->\n(?:    <(?:link|script)[^>]*>(?:</script>)?\n)+")
BRANCHEMENT = (
    f"    {MARQUE}\n"
    '    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@600;700'
    '&family=Unbounded:wght@400;500;600&display=swap">\n'
    '    <link rel="stylesheet" href="/assets/css/theme/theme.css?v=5">\n'
    '    <link rel="stylesheet" href="/assets/css/theme/composants.css?v=2">\n'
    '    <link rel="stylesheet" href="/assets/css/theme/visuels.css?v=7">\n'
    '    <link rel="stylesheet" href="/assets/css/theme/boutons.css?v=7">\n'
    '    <link rel="stylesheet" href="/assets/css/theme/navigation.css?v=8">\n'
    '    <link rel="stylesheet" href="/assets/css/theme/menus.css?v=2">\n'
    '    <link rel="stylesheet" href="/assets/css/theme/marque.css?v=2">\n'
    '    <link rel="stylesheet" href="/assets/css/theme/ergonomie.css?v=6">\n'
    '    <script defer src="/assets/js/theme/navigation.js?v=2"></script>\n'
)
INTACTS = {"assets/css/sections/hero-film.css"}  # hero v4 : aucune régression tolérée
PAGES_EXCLUES = {"products/daedalia.html"}  # Daedalia garde son bleu (palette validée le 23/11/2026)
_STYLE_BLOC = re.compile(r"(<style[^>]*>)(.*?)(</style>)", re.S)
_STYLE_ATTR = re.compile(r'(\sstyle=")([^"]*)(")')
_SVG_ATTR = re.compile(r'(\s(?:fill|stroke|stop-color)=")([^"]*)(")')


def feuilles_css() -> list[str]:
    sortie = subprocess.run(
        ["git", "ls-files", "assets/css", "components", "sections"], cwd=RACINE, capture_output=True, text=True, check=True
    ).stdout.split()
    return sorted(f for f in sortie if f.endswith(".css") and f not in INTACTS and not f.startswith("assets/css/theme/"))


def gabarits_html() -> list[str]:
    sortie = subprocess.run(
        ["git", "ls-files", "components"], cwd=RACINE, capture_output=True, text=True, check=True
    ).stdout.split()
    return sorted(f for f in sortie if f.endswith(".html") and "/effects/" not in f)


def _recolorer_groupe(motif: re.Pattern, html: str) -> str:
    return motif.sub(lambda m: m.group(1) + recolorer(m.group(2)) + m.group(3), html)


def traiter_html(html: str, brancher: bool) -> str:
    for motif in (_STYLE_BLOC, _STYLE_ATTR, _SVG_ATTR):
        html = _recolorer_groupe(motif, html)
    if brancher and "</head>" in html:
        html = _ANCIEN_BRANCHEMENT.sub("", html)
        html = html.replace("</head>", BRANCHEMENT + "</head>", 1)
    return html


def appliquer(ecrire: bool) -> list[str]:
    """Rend la liste des fichiers modifiés (ou à modifier si ecrire est faux)."""
    modifies = []
    travaux = [(f, "css") for f in feuilles_css()]
    travaux += [(f, "page") for f in pages_du_site() if f not in PAGES_EXCLUES]
    travaux += [(f, "gabarit") for f in gabarits_html()]
    for chemin, genre in travaux:
        fichier = RACINE / chemin
        avant = fichier.read_text(encoding="utf-8")
        apres = recolorer(avant) if genre == "css" else traiter_html(avant, brancher=genre == "page")
        if apres != avant:
            modifies.append(chemin)
            if ecrire:
                fichier.write_text(apres, encoding="utf-8")
    return modifies


def main() -> None:
    analyse = argparse.ArgumentParser(description=__doc__)
    analyse.add_argument("--verifier", action="store_true")
    options = analyse.parse_args()
    modifies = appliquer(ecrire=not options.verifier)
    print(f"{len(modifies)} fichier(s) {'à traiter' if options.verifier else 'modifiés'}")
    if options.verifier and modifies:
        print("\n".join(modifies[:20]))
        sys.exit(1)


if __name__ == "__main__":
    main()
