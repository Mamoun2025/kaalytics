"""Contrôle d'une page EN LIGNE avant d'en donner le lien : fichiers absents, erreurs, débordement, captures.

Usage : python3 -m scripts.design.controle URL --sortie DIR
Code de sortie 1 si une ressource manque ou si une erreur de script apparaît.
Leçon du 28/11/2026 : une maquette vérifiée seulement en local a été livrée sans styles (chemins relatifs en 404).
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ECRANS = {"ordinateur": (1440, 900, False), "tablette": (600, 900, True), "telephone": (390, 780, True)}


def controler(adresse: str, sortie: Path) -> list[str]:
    problemes: list[str] = []
    sortie.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        navigateur = p.chromium.launch()
        for nom, (largeur, hauteur, tactile) in ECRANS.items():
            contexte = navigateur.new_context(
                viewport={"width": largeur, "height": hauteur}, is_mobile=tactile, has_touch=tactile
            )
            page = contexte.new_page()
            page.on("pageerror", lambda e, n=nom: problemes.append(f"{n} : erreur de script : {e.message}"))
            page.on("response", lambda r, n=nom: r.status >= 400 and problemes.append(f"{n} : {r.status} {r.url}"))
            page.on("requestfailed", lambda r, n=nom: problemes.append(f"{n} : échec {r.url}"))
            page.goto(adresse, wait_until="load", timeout=45000)
            page.wait_for_timeout(3000)
            for etape in range(6):
                page.screenshot(path=str(sortie / f"{nom}-{etape}.jpg"), type="jpeg", quality=72)
                page.mouse.wheel(0, hauteur * 1.4)
                page.wait_for_timeout(1300)
            debordement = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
            if debordement > 2:
                problemes.append(f"{nom} : débordement horizontal de {debordement} px")
            contexte.close()
        navigateur.close()
    return sorted(set(problemes))


def main() -> None:
    analyse = argparse.ArgumentParser(description=__doc__)
    analyse.add_argument("adresse")
    analyse.add_argument("--sortie", type=Path, required=True)
    options = analyse.parse_args()
    problemes = controler(options.adresse, options.sortie)
    for probleme in problemes:
        print(probleme)
    print(f"{len(problemes)} problème(s) sur {options.adresse}")
    sys.exit(1 if problemes else 0)


if __name__ == "__main__":
    main()
