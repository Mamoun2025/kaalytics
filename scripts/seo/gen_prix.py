"""Affichage des prix - pilote par un drapeau, reversible.

Les montants ne sont pas supprimes des pages : ils vivent dans
data/prix.json, et chaque emplacement porte un marqueur dans le HTML.
Ce script y rend soit le montant, soit la mention neutre, selon le
drapeau `afficher_les_prix`.

Le balisage structure (Offer, AggregateOffer) suit le meme drapeau :
laisser un prix dans le JSON-LD alors que la page dit « Sur devis »
mettrait les deux en contradiction, ce que Google releve.

Usage:
    python3 -m scripts.seo.gen_prix              # applique le drapeau
    python3 -m scripts.seo.gen_prix --dry-run    # montre sans ecrire
    python3 -m scripts.seo.gen_prix --etat       # ou en est-on
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
CATALOGUE = RACINE / "data" / "prix.json"

# Un emplacement de prix dans une page :
#   <!--PRIX:cle-->ce qui est affiche<!--/PRIX-->
MARQUEUR = re.compile(r"<!--PRIX:([a-z0-9._-]+)-->([\s\S]*?)<!--/PRIX-->")


def charger() -> dict:
    if not CATALOGUE.exists():
        print(f"Catalogue introuvable : {CATALOGUE}", file=sys.stderr)
        sys.exit(1)
    return json.loads(CATALOGUE.read_text(encoding="utf-8"))


def rendu(entree: dict, afficher: bool) -> str:
    """Ce qui doit apparaitre a la place du marqueur."""
    if afficher:
        return entree["affiche"]
    return entree["masque"]


def appliquer_html(catalogue: dict, dry_run: bool) -> int:
    afficher = catalogue["afficher_les_prix"]
    montants = catalogue["montants"]
    modifies = 0
    inconnus = []

    fichiers = sorted({m["fichier"] for m in montants.values()})
    for nom in fichiers:
        chemin = RACINE / nom
        if not chemin.exists():
            print(f"  absent : {nom}", file=sys.stderr)
            continue
        source = chemin.read_text(encoding="utf-8")

        def remplacer(m):
            cle = m.group(1)
            entree = montants.get(cle)
            if entree is None:
                inconnus.append(cle)
                return m.group(0)
            return f"<!--PRIX:{cle}-->{rendu(entree, afficher)}<!--/PRIX-->"

        nouveau = MARQUEUR.sub(remplacer, source)
        if nouveau != source:
            modifies += 1
            if not dry_run:
                chemin.write_text(nouveau, encoding="utf-8")
            print(f"  {'(essai) ' if dry_run else ''}{nom}")

    if inconnus:
        print(f"\n  {len(set(inconnus))} marqueur(s) sans entree au catalogue : "
              f"{sorted(set(inconnus))[:5]}", file=sys.stderr)
    return modifies


def appliquer_schemas(catalogue: dict, dry_run: bool) -> int:
    """Retire ou remet les prix du balisage structure.

    Un Offer sans prix reste valide : Google accepte une offre dont le
    montant n'est pas public. Une page qui dit « Sur devis » avec un
    Offer chiffre, en revanche, se contredit.
    """
    afficher = catalogue["afficher_les_prix"]
    modifies = 0
    for nom, blocs in catalogue.get("schemas", {}).items():
        chemin = RACINE / nom
        if not chemin.exists():
            continue
        source = chemin.read_text(encoding="utf-8")
        nouveau = source
        for bloc in blocs:
            avec, sans = bloc["avec_prix"], bloc["sans_prix"]
            vise, remplace = (sans, avec) if afficher else (avec, sans)
            if vise in nouveau:
                nouveau = nouveau.replace(vise, remplace)
        if nouveau != source:
            modifies += 1
            if not dry_run:
                chemin.write_text(nouveau, encoding="utf-8")
            print(f"  {'(essai) ' if dry_run else ''}{nom} (balisage)")
    return modifies


def etat(catalogue: dict) -> None:
    afficher = catalogue["afficher_les_prix"]
    montants = catalogue["montants"]
    print(f"afficher_les_prix = {afficher}")
    print(f"{len(montants)} montant(s) au catalogue, "
          f"{len({m['fichier'] for m in montants.values()})} fichier(s)")
    par_fichier = {}
    for m in montants.values():
        par_fichier[m["fichier"]] = par_fichier.get(m["fichier"], 0) + 1
    for f, n in sorted(par_fichier.items()):
        print(f"   {n:3}  {f}")
    print(f"\n{sum(len(v) for v in catalogue.get('schemas', {}).values())} "
          f"bloc(s) de balisage structure")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true", help="ne rien ecrire")
    ap.add_argument("--etat", action="store_true", help="afficher l'etat du catalogue")
    args = ap.parse_args()

    catalogue = charger()
    if args.etat:
        etat(catalogue)
        return 0

    n = appliquer_html(catalogue, args.dry_run)
    n += appliquer_schemas(catalogue, args.dry_run)
    mode = "affiches" if catalogue["afficher_les_prix"] else "masques"
    print(f"\n{n} fichier(s) mis a jour — prix {mode}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
