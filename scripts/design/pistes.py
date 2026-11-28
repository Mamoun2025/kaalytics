"""Captures des maquettes de thème (docs/design/pistes) aux quatre largeurs du tour.

Usage : python3 -m scripts.design.pistes --sortie DIR
Résultat : DIR/<piste>-<largeur>.jpg
"""
from __future__ import annotations

import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright

from scripts.design.serveur_local import demarrer
from scripts.design.tour import LARGEURS, RACINE

PISTES = ("sombre", "clair", "technique")


def main() -> None:
    analyse = argparse.ArgumentParser(description=__doc__)
    analyse.add_argument("--sortie", type=Path, required=True)
    options = analyse.parse_args()
    options.sortie.mkdir(parents=True, exist_ok=True)

    serveur, base = demarrer(RACINE)
    with sync_playwright() as p:
        navigateur = p.chromium.launch()
        for piste in PISTES:
            for largeur, (l, h) in LARGEURS.items():
                page = navigateur.new_page(viewport={"width": l, "height": h})
                page.goto(f"{base}/docs/design/pistes/maquette.html?piste={piste}", wait_until="networkidle")
                page.wait_for_timeout(400)
                page.screenshot(
                    path=str(options.sortie / f"{piste}-{largeur}.jpg"), type="jpeg", quality=78, full_page=True
                )
                page.close()
        navigateur.close()
    serveur.shutdown()
    print(f"{len(PISTES) * len(LARGEURS)} captures -> {options.sortie}")


if __name__ == "__main__":
    main()
