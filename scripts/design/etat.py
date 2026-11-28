"""État du site page par page, à partir d'un tour (tour.json + captures).

Usage : python3 -m scripts.design.etat --tour DIR --page docs/design/page
Écrit dans le dossier de la page de suivi :
    etat.json                      une entrée par page (constats réunis sur les 4 largeurs)
    medias/vignettes/<page>.jpg    haut de page ordinateur + téléphone
    medias/avant/<largeur>/<page>.jpg  captures entières des gabarits de référence
"""
from __future__ import annotations

import argparse
import json
import shutil
from collections import defaultdict
from pathlib import Path

from PIL import Image

from scripts.design.tour import LARGEURS, nom_fichier

GABARITS = (
    ("blog/", "Blog"), ("guides/", "Guides"), ("modules/", "Modules"), ("industries/", "Industries"),
    ("case-studies/", "Études de cas"), ("legal/", "Légal"), ("products/", "Produits"),
)
REFERENCES = (
    "index.html", "en/index.html", "modules/fleetops.html", "industries/btp.html",
    "blog/roi-gestion-flotte.html", "pricing.html", "contact.html", "about.html",
)
HAUTEUR_VIGNETTE = 300


def gabarit(page: str) -> str:
    chemin = page.removeprefix("en/")
    if chemin == "index.html":
        return "Accueil"
    for prefixe, nom in GABARITS:
        if chemin.startswith(prefixe):
            return nom
    return "Pages"


def vignette(tour: Path, page: str, cible: Path) -> bool:
    """Haut de page à 1440 et à 390, côte à côte."""
    morceaux = []
    for largeur in ("1440", "390"):
        source = tour / largeur / f"{nom_fichier(page)}.jpg"
        if not source.exists():
            return False
        l, h = LARGEURS[largeur]
        with Image.open(source) as image:
            haut = image.crop((0, 0, l, min(h, image.height)))
        morceaux.append(haut.resize((round(l * HAUTEUR_VIGNETTE / h), round(haut.height * HAUTEUR_VIGNETTE / h))))
    planche = Image.new("RGB", (sum(m.width for m in morceaux) + 8, HAUTEUR_VIGNETTE), "#dfe6e2")
    x = 0
    for morceau in morceaux:
        planche.paste(morceau, (x, 0))
        x += morceau.width + 8
    cible.parent.mkdir(parents=True, exist_ok=True)
    planche.save(cible, quality=68, optimize=True)
    return True


def reunir(visites: list[dict]) -> dict:
    """Constats d'une page, réunis sur ses quatre largeurs."""
    par_largeur = {v["largeur"]: v for v in visites}
    bureau = par_largeur.get("1440", visites[0])
    erreurs = sorted({e.split(" | ")[0] for v in visites for e in v.get("erreurs", [])})
    hors_palette = {f: n for f, n in bureau.get("couleurs", {}).items() if f != "vert"}
    polices = [p for p in bureau.get("polices", {}) if p not in ("Inter", "")]
    return {
        "h1": bureau.get("h1", ""),
        "erreurs": erreurs,
        "absents": sorted({a.split("/", 3)[-1] for v in visites for a in v.get("absents", [])}),
        "debordements": [lg for lg in LARGEURS if par_largeur.get(lg, {}).get("debordement", 0) > 2],
        "horsPalette": hors_palette,
        "polices": polices,
        "bordsGauches": max(v.get("bordsGauches", 0) for v in visites),
        "emojis": any(v.get("emojis") for v in visites),
        "titres": bureau.get("nbTitres", 0),
        "titresLongs": bureau.get("nbTitresLongs", 0),
        "exemplesTitres": [t["texte"] for t in bureau.get("titresLongs", [])][:4],
        "echecs": [v["largeur"] for v in visites if "echec" in v],
    }


def main() -> None:
    analyse = argparse.ArgumentParser(description=__doc__)
    analyse.add_argument("--tour", type=Path, required=True)
    analyse.add_argument("--page", type=Path, required=True)
    options = analyse.parse_args()

    visites = json.loads((options.tour / "tour.json").read_text(encoding="utf-8"))
    par_page: dict[str, list[dict]] = defaultdict(list)
    for visite in visites:
        par_page[visite["page"]].append(visite)

    medias = options.page / "medias"
    etat = []
    for page in sorted(par_page):
        entree = {
            "page": page,
            "langue": "EN" if page.startswith("en/") else "FR",
            "gabarit": gabarit(page),
            "fichier": nom_fichier(page),
            **reunir(par_page[page]),
        }
        entree["vignette"] = vignette(options.tour, page, medias / "vignettes" / f"{nom_fichier(page)}.jpg")
        etat.append(entree)

    for page in REFERENCES:
        for largeur in LARGEURS:
            source = options.tour / largeur / f"{nom_fichier(page)}.jpg"
            if source.exists():
                cible = medias / "avant" / largeur / source.name
                cible.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, cible)

    # Constats rédigés à la main (constats.json), joints aux mesures pour la page de suivi.
    redaction = options.page / "constats.json"
    constats = json.loads(redaction.read_text(encoding="utf-8")) if redaction.exists() else []
    (options.page / "etat.json").write_text(
        json.dumps({"pages": etat, "constats": constats}, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    print(f"{len(etat)} pages -> {options.page / 'etat.json'}")


if __name__ == "__main__":
    main()
