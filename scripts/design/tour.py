"""Tour du site : capture pleine page et mesures de chaque page, à quatre largeurs.

Usage :
    lourd python3 -m scripts.design.tour --sortie DIR [--base URL] [--pages a.html b.html]

Sans --base, le dépôt est servi en local. Avec --base (aperçu Vercel), les mêmes pages
sont lues à distance, ce qui donne les captures « après » d'une branche.
Résultat : DIR/<largeur>/<page>.jpg et DIR/tour.json.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import subprocess
from pathlib import Path

from playwright.async_api import Browser, async_playwright

from scripts.design.serveur_local import demarrer

RACINE = Path(__file__).resolve().parents[2]
MESURES_JS = (Path(__file__).parent / "mesures.js").read_text(encoding="utf-8")
LARGEURS = {"1440": (1440, 900), "1024": (1024, 1366), "768": (768, 1024), "390": (390, 844)}
HORS_SITE = ("components/", "playground/", "PROPOSALS/", "proposals/", "sections/", "TRASH/", "docs/")
EN_PARALLELE = 3
HAUTEUR_MAX = 14000
CONSENTEMENT = "%7B%22necessary%22%3Atrue%2C%22analytics%22%3Afalse%2C%22marketing%22%3Afalse%7D"


def pages_du_site() -> list[str]:
    sortie = subprocess.run(
        ["git", "ls-files", "*.html"], cwd=RACINE, capture_output=True, text=True, check=True
    ).stdout.split()
    return sorted(p for p in sortie if not p.startswith(HORS_SITE))


def nom_fichier(page: str) -> str:
    return page.removesuffix(".html").replace("/", "__")


async def _derouler(page) -> None:
    """Fait défiler la page pour déclencher les apparitions au défilement, puis remonte."""
    await page.evaluate(
        """async () => {
            const pas = window.innerHeight * 0.8;
            for (let y = 0; y < document.documentElement.scrollHeight; y += pas) {
                window.scrollTo(0, y);
                await new Promise((r) => setTimeout(r, 90));
            }
            window.scrollTo(0, 0);
        }"""
    )
    await page.wait_for_timeout(500)


async def visiter(navigateur: Browser, base: str, chemin: str, largeur: str, sortie: Path) -> dict:
    l, h = LARGEURS[largeur]
    contexte = await navigateur.new_context(
        viewport={"width": l, "height": h},
        device_scale_factor=1,
        is_mobile=l < 800,
        has_touch=l < 800,
        locale="fr-FR",
    )
    # Consentement refusé d'avance : le bandeau cookies ne recouvre pas les captures.
    await contexte.add_cookies([{"name": "kaalytics_cookie_consent", "value": CONSENTEMENT, "url": base}])
    page = await contexte.new_page()
    erreurs: list[str] = []
    absents: list[str] = []
    page.on("pageerror", lambda e: erreurs.append(f"{e.message} | {(e.stack or '')[:300]}"))
    page.on("console", lambda m: m.type == "error" and erreurs.append(f"console: {m.text[:300]}"))
    page.on("response", lambda r: r.status >= 400 and base in r.url and absents.append(f"{r.status} {r.url}"))
    resultat: dict = {"page": chemin, "largeur": largeur}
    try:
        adresse = f"{base}/{chemin.removesuffix('.html') if base.startswith('https') else chemin}"
        await page.goto(adresse, wait_until="load", timeout=45000)
        await page.wait_for_timeout(1200)
        await _derouler(page)
        resultat.update(await page.evaluate(MESURES_JS))
        cible = sortie / largeur / f"{nom_fichier(chemin)}.jpg"
        cible.parent.mkdir(parents=True, exist_ok=True)
        hauteur = min(resultat["hauteur"], HAUTEUR_MAX)
        await page.screenshot(
            path=str(cible), type="jpeg", quality=62, full_page=True,
            clip={"x": 0, "y": 0, "width": l, "height": hauteur},
        )
        resultat["capture"] = str(cible.relative_to(sortie))
    except Exception as exc:  # une page en panne ne doit pas arrêter le tour
        resultat["echec"] = f"{type(exc).__name__}: {exc}"[:400]
    resultat["erreurs"] = sorted(set(erreurs))
    resultat["absents"] = sorted(set(absents))
    await contexte.close()
    return resultat


async def tour(base: str, pages: list[str], sortie: Path) -> list[dict]:
    verrou = asyncio.Semaphore(EN_PARALLELE)
    async with async_playwright() as p:
        navigateur = await p.chromium.launch()

        async def une(chemin: str, largeur: str) -> dict:
            async with verrou:
                return await visiter(navigateur, base, chemin, largeur, sortie)

        resultats = await asyncio.gather(*(une(c, lg) for c in pages for lg in LARGEURS))
        await navigateur.close()
    return list(resultats)


def main() -> None:
    analyse = argparse.ArgumentParser(description=__doc__)
    analyse.add_argument("--sortie", type=Path, required=True)
    analyse.add_argument("--base", default="")
    analyse.add_argument("--pages", nargs="*")
    options = analyse.parse_args()

    base = options.base.rstrip("/")
    serveur = None
    if not base:
        serveur, base = demarrer(RACINE)
    pages = options.pages or pages_du_site()
    options.sortie.mkdir(parents=True, exist_ok=True)
    resultats = asyncio.run(tour(base, pages, options.sortie))
    (options.sortie / "tour.json").write_text(
        json.dumps(resultats, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    if serveur:
        serveur.shutdown()
    echecs = [r for r in resultats if "echec" in r]
    print(f"{len(pages)} pages, {len(resultats)} visites, {len(echecs)} échecs -> {options.sortie}")


if __name__ == "__main__":
    main()
