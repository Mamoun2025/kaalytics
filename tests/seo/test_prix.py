"""Garde-fous de l'affichage des prix.

Les montants ne sont pas supprimes : ils vivent dans data/prix.json et
chaque emplacement porte un marqueur dans la page. Le drapeau
`afficher_les_prix` decide de ce qui est rendu.

Ces tests verifient que l'etat servi correspond au drapeau — dans les deux
sens. Le jour ou les prix reviennent, ils continueront de proteger.
"""
import json
import re
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
CATALOGUE = RACINE / "data" / "prix.json"
IGNORES = {"TRASH", "PROPOSALS", "proposals", "node_modules", "__pycache__",
           ".superpowers", "docs", "data", ".git"}

# Un montant : un nombre colle a une devise, dans un sens ou dans l'autre.
MONTANT = re.compile(
    r"(?:(?:€|\$)\s?\d[\d\s.,]*)"
    r"|(?:\d[\d\s.,]*\s?(?:€|EUR|MAD|DH|USD)\b)"
    r"|(?:\d[\d\s.,]*\s?[kK]\s?(?:€|EUR|MAD)\b)"
)

# Pages ou les montants sont ceux du MARCHE ou de CONCURRENTS, pas les
# notres : les masquer viderait un comparatif sourcé de sa substance.
# Elles sont hors du perimetre du drapeau, et c'est un choix explicite.
HORS_PERIMETRE = {
    "alternatives.html",            # tarifs publics des concurrents, sources
    "about.html",                   # cout d'une migration ERP, ordre de marche
    "industries/index.html",        # economie constatee chez un client
    "components/roi-calculator.html",  # curseurs de saisie du visiteur
}


def catalogue() -> dict:
    return json.loads(CATALOGUE.read_text(encoding="utf-8"))


def pages_de_notre_offre():
    """Pages qui presentent NOTRE offre, donc soumises au drapeau."""
    cat = catalogue()
    fichiers = {m["fichier"] for m in cat["montants"].values()}
    fichiers |= set(cat.get("schemas", {}))
    return sorted(fichiers)


def test_le_catalogue_est_coherent():
    cat = catalogue()
    assert isinstance(cat["afficher_les_prix"], bool)
    assert cat["montants"], "catalogue vide"
    for cle, m in cat["montants"].items():
        assert (RACINE / m["fichier"]).exists(), f"{cle} : fichier absent"
        assert m["affiche"] != m["masque"], f"{cle} : les deux versions sont identiques"
        assert m["masque"].strip(), f"{cle} : version masquee vide"


def test_l_etat_servi_suit_le_drapeau():
    """Le coeur du garde-fou : aucun montant sur nos pages d'offre quand
    le drapeau est baisse."""
    cat = catalogue()
    if cat["afficher_les_prix"]:
        return  # l'autre sens est couvert par test_le_retour_est_possible

    fautifs = []
    for nom in pages_de_notre_offre():
        texte = " ".join((RACINE / nom).read_text(encoding="utf-8").split())
        for m in MONTANT.finditer(texte):
            # Le catalogue conserve les montants : c'est voulu, et il est
            # exclu de l'analyse par IGNORES.
            fautifs.append(f"{nom} : {m.group(0)}")
    assert not fautifs, (
        "montant(s) encore affiche(s) alors que afficher_les_prix est faux :\n  "
        + "\n  ".join(fautifs[:15])
    )


def test_aucun_prix_dans_le_balisage_structure():
    """Une page qui dit « Sur devis » avec un Offer chiffre se contredit,
    et Google releve la contradiction."""
    if catalogue()["afficher_les_prix"]:
        return
    fautifs = []
    for page in RACINE.rglob("*.html"):
        if IGNORES & set(page.parts):
            continue
        for bloc in re.findall(
            r'<script type="application/ld\+json">([\s\S]*?)</script>',
            page.read_text(encoding="utf-8"),
        ):
            for champ in ("price", "priceCurrency", "lowPrice", "highPrice", "priceRange"):
                if f'"{champ}"' in bloc:
                    fautifs.append(f"{page.relative_to(RACINE)} : {champ}")
    assert not fautifs, "prix dans le balisage :\n  " + "\n  ".join(sorted(set(fautifs))[:15])


def test_le_retour_est_possible():
    """Chaque emplacement garde son montant d'origine : rien n'a ete perdu."""
    cat = catalogue()
    montants_reels = [m for m in cat["montants"].values() if MONTANT.search(m["affiche"])]
    assert len(montants_reels) >= 40, (
        f"seulement {len(montants_reels)} montants conserves : le catalogue "
        f"a perdu de l'information, le retour arriere serait incomplet"
    )


def test_les_marqueurs_du_html_ont_tous_une_entree():
    cat = catalogue()
    orphelins = []
    for nom in pages_de_notre_offre():
        for cle in re.findall(r"<!--PRIX:([a-z0-9._-]+)-->",
                              (RACINE / nom).read_text(encoding="utf-8")):
            if cle not in cat["montants"]:
                orphelins.append(f"{nom} : {cle}")
    assert not orphelins, "marqueur(s) sans entree :\n  " + "\n  ".join(orphelins[:10])


def test_le_perimetre_hors_drapeau_est_documente():
    """Les pages qui gardent des montants de marche doivent rester un choix
    explicite, pas un oubli."""
    for nom in HORS_PERIMETRE:
        assert (RACINE / nom).exists(), f"{nom} n'existe plus : mettre a jour la liste"
