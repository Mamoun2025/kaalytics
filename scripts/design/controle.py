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
# Leçon du 28/11/2026 : maquette v1 à 6 images/s au défilement (flous, sections bloquées), non mesurée avant le lien.
SEUIL_IMAGES_LENTES = 5  # % d'images au-delà de 34 ms toléré pendant un défilement continu


def capturer_menu(page, cible: Path, problemes: list[str], nom: str) -> None:
    """Menu mobile ouvert, premier groupe déplié : capture à regarder (leçon du 28/11/2026, menu jamais relu)."""
    page.evaluate("window.scrollTo(0, 0)")
    bouton = page.locator(".navbar__mobile-toggle")
    if not bouton.count() or not bouton.first.is_visible():
        return
    bouton.first.click()
    page.wait_for_timeout(700)
    groupe = page.locator("summary.mobile-group__title")
    if groupe.count():
        groupe.first.click()
        page.wait_for_timeout(400)
    page.screenshot(path=str(cible), type="jpeg", quality=72)
    if page.evaluate("document.documentElement.scrollWidth - window.innerWidth") > 2:
        problemes.append(f"{nom} : menu mobile ouvert, débordement horizontal")
    bouton.first.click()
    page.wait_for_timeout(500)


def mesurer_fluidite(contexte, page) -> int:
    """Défile toute la page depuis le haut, processeur ralenti x4 ; rend le % d'images au-delà de 34 ms."""
    session = contexte.new_cdp_session(page)
    session.send("Emulation.setCPUThrottlingRate", {"rate": 4})
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(800)
    page.evaluate(
        """() => { window.__durees = []; let avant = performance.now();
            const suivre = (t) => { window.__durees.push(t - avant); avant = t; requestAnimationFrame(suivre); };
            requestAnimationFrame(suivre); }"""
    )
    for _ in range(50):
        page.mouse.wheel(0, 160)
        page.wait_for_timeout(60)
    durees = page.evaluate("window.__durees.slice(3)")
    session.send("Emulation.setCPUThrottlingRate", {"rate": 1})
    return round(100 * sum(1 for d in durees if d > 34) / max(len(durees), 1))


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
            # Chargement annulé par la page elle-même (vidéo changée, navigation) : pas une panne
            page.on("requestfailed", lambda r, n=nom: "ERR_ABORTED" not in (r.failure or "")
                    and problemes.append(f"{n} : échec {r.url} ({r.failure})"))
            page.goto(adresse, wait_until="load", timeout=45000)
            page.wait_for_timeout(3000)
            for etape in range(6):
                page.screenshot(path=str(sortie / f"{nom}-{etape}.jpg"), type="jpeg", quality=72)
                page.mouse.wheel(0, hauteur * 1.4)
                page.wait_for_timeout(1300)
            debordement = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
            if debordement > 2:
                problemes.append(f"{nom} : débordement horizontal de {debordement} px")
            if tactile:
                capturer_menu(page, sortie / f"{nom}-menu.jpg", problemes, nom)
            lentes = mesurer_fluidite(contexte, page)
            if lentes > SEUIL_IMAGES_LENTES:
                problemes.append(f"{nom} : défilement saccadé, {lentes} % d'images au-delà de 34 ms (processeur ralenti x4)")
            contexte.close()
        navigateur.close()
    # Mesure d'audience (identifiant factice G-XXXXXXXXXX déjà en ligne) : hors du périmètre du design.
    tiers = ("google-analytics.com", "googletagmanager.com")
    return sorted({p for p in problemes if not any(hote in p for hote in tiers)})


def main() -> None:
    analyse = argparse.ArgumentParser(description=__doc__)
    analyse.add_argument("adresse")
    analyse.add_argument("--sortie", type=Path, required=True)
    options = analyse.parse_args()
    adresse, serveur = options.adresse, None
    if not adresse.startswith("http"):
        # Chemin du dépôt (ex. index.html) : servi en local, sur un port libre.
        from scripts.design.serveur_local import demarrer
        from scripts.design.tour import RACINE

        serveur, base = demarrer(RACINE)
        adresse = f"{base}/{adresse.lstrip('/')}"
    problemes = controler(adresse, options.sortie)
    if serveur:
        serveur.shutdown()
    for probleme in problemes:
        print(probleme)
    print(f"{len(problemes)} problème(s) sur {options.adresse}")
    sys.exit(1 if problemes else 0)


if __name__ == "__main__":
    main()
