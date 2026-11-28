"""Contrôle d'ergonomie de toutes les pages sur téléphone, tablette 11 pouces (portrait, paysage) et ordinateur.

Usage : lourd python3 -m scripts.design.ergonomie --sortie DIR [--pages a.html b.html] [--ecrans tel390 tab-portrait]
Demande de Mamoun du 28/11/2026 : « un gros check d'ergonomie et de responsiveness, surtout téléphone ».
Mesures, page par page et écran par écran (scripts/design/ergonomie.js) :
- sous-barre : texte du haut de page caché sous la barre de navigation fixe ;
- debordement : la page défile à l'horizontale, ou un élément sort de l'écran à droite ;
- colonnes-etroites : blocs de texte de moins de 150 px de large (grilles trop serrées) ;
- texte-petit : texte de moins de 12 px ;
- cibles-petites : liens et boutons de moins de 40 px de haut sur écran tactile ;
- titre-decentre : titre principal centré dont le milieu s'écarte de plus de 12 px du milieu de l'écran.
Résultat : DIR/ergonomie.json, DIR/<écran>/<page>.jpg (premier écran) et un résumé à l'écran.
"""
from __future__ import annotations

import argparse
import asyncio
import json
from collections import Counter
from pathlib import Path

from playwright.async_api import async_playwright

from scripts.design.serveur_local import demarrer
from scripts.design.tour import CONSENTEMENT, RACINE, nom_fichier, pages_du_site

ECRANS = {
    "tel360": (360, 780, True), "tel390": (390, 844, True), "tel412": (412, 915, True),
    "tab-portrait": (800, 1280, True), "tab-paysage": (1280, 800, True),
    "ordi": (1440, 900, False), "ordi-large": (1920, 1080, False),
}
MESURES_JS = (Path(__file__).parent / "ergonomie.js").read_text(encoding="utf-8")
EN_PARALLELE = 3


async def visiter(navigateur, base: str, page_html: str, ecran: str, sortie: Path) -> dict:
    largeur, hauteur, tactile = ECRANS[ecran]
    contexte = await navigateur.new_context(
        viewport={"width": largeur, "height": hauteur}, is_mobile=tactile, has_touch=tactile
    )
    await contexte.add_cookies([{"name": "kaalytics_cookie_consent", "value": CONSENTEMENT, "url": base}])
    page = await contexte.new_page()
    resultat: dict = {"page": page_html, "ecran": ecran}
    try:
        await page.goto(f"{base}/{page_html}", wait_until="load", timeout=45000)
        await page.wait_for_timeout(1300)
        resultat.update(await page.evaluate(MESURES_JS, tactile))
        cible = sortie / ecran / f"{nom_fichier(page_html)}.jpg"
        cible.parent.mkdir(parents=True, exist_ok=True)
        await page.screenshot(path=str(cible), type="jpeg", quality=60)
    except Exception as exc:  # une page en panne ne doit pas arrêter le contrôle
        resultat["echec"] = f"{type(exc).__name__}: {exc}"[:300]
    await contexte.close()
    return resultat


async def controler(base: str, pages: list[str], ecrans: list[str], sortie: Path) -> list[dict]:
    verrou = asyncio.Semaphore(EN_PARALLELE)
    async with async_playwright() as p:
        navigateur = await p.chromium.launch()

        async def une(page_html: str, ecran: str) -> dict:
            async with verrou:
                return await visiter(navigateur, base, page_html, ecran, sortie)

        resultats = await asyncio.gather(*(une(pg, ec) for pg in pages for ec in ecrans))
        await navigateur.close()
    return list(resultats)


def resumer(resultats: list[dict]) -> None:
    par_genre: Counter = Counter()
    exemples: dict[str, list[str]] = {}
    for r in resultats:
        for probleme in r.get("problemes", []):
            par_genre[(probleme["genre"], r["ecran"])] += 1
            exemples.setdefault(probleme["genre"], [])
            if len(exemples[probleme["genre"]]) < 6:
                exemples[probleme["genre"]].append(f"{r['page']} [{r['ecran']}] {probleme['detail']}")
    for (genre, ecran), nombre in sorted(par_genre.items()):
        print(f"{genre:18} {ecran:13} {nombre:4} page(s)")
    for genre, liste in exemples.items():
        print(f"\n{genre} :")
        for ligne in liste:
            print("  ", ligne)


def main() -> None:
    analyse = argparse.ArgumentParser(description=__doc__)
    analyse.add_argument("--sortie", type=Path, required=True)
    analyse.add_argument("--pages", nargs="*")
    analyse.add_argument("--ecrans", nargs="*", default=list(ECRANS))
    options = analyse.parse_args()
    serveur, base = demarrer(RACINE)
    pages = options.pages or [p for p in pages_du_site() if p != "products/daedalia.html"]
    options.sortie.mkdir(parents=True, exist_ok=True)
    resultats = asyncio.run(controler(base, pages, options.ecrans, options.sortie))
    serveur.shutdown()
    (options.sortie / "ergonomie.json").write_text(json.dumps(resultats, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(pages)} pages x {len(options.ecrans)} écrans, {sum('echec' in r for r in resultats)} échecs")
    resumer(resultats)


if __name__ == "__main__":
    main()
