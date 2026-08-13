"""Garde-fous responsive.

Un style en ligne bat toute feuille de style. C'est ce qui rendait le site
inutilisable sur telephone a deux endroits, pour la meme raison :
- `style="display: inline-flex"` sur le bouton d'appel de la navbar poussait
  le burger hors de l'ecran ;
- `style="grid-template-columns: 1fr 1fr"` sur les grilles les empechait de
  se replier (mesure : 574px de contenu sur un ecran de 375 pour contact).

Ces tests empechent le motif de revenir. Le comportement, lui, se verifie
au navigateur.
"""
import re
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
IGNORES = {"TRASH", "PROPOSALS", "node_modules", "__pycache__", "proposals"}

GRILLE_EN_LIGNE = re.compile(r'style="[^"]*grid-template-columns', re.I)
CSS_GRILLES = RACINE / "assets" / "css" / "layout" / "_grilles-responsives.css"
CSS_CIBLES = RACINE / "assets" / "css" / "layout" / "_cibles-tactiles.css"
MAIN_CSS = RACINE / "assets" / "css" / "main.css"


def pages_html():
    for chemin in RACINE.rglob("*.html"):
        if IGNORES & set(chemin.parts):
            continue
        yield chemin


def test_aucune_grille_declaree_en_style_en_ligne():
    """Une grille en style en ligne ne peut pas se replier sur telephone :
    aucune media query ne peut la surcharger."""
    fautifs = []
    for page in pages_html():
        for numero, ligne in enumerate(page.read_text(encoding="utf-8").splitlines(), 1):
            if GRILLE_EN_LIGNE.search(ligne):
                fautifs.append(f"{page.relative_to(RACINE)}:{numero}")
    assert not fautifs, (
        "grille(s) declaree(s) en style en ligne — utiliser les classes de "
        "_grilles-responsives.css :\n  " + "\n  ".join(fautifs[:20])
    )


def test_les_classes_de_grille_existent():
    """Les pages s'appuient sur ces classes : si le fichier disparait ou
    qu'une classe est renommee, les grilles retombent en une colonne."""
    css = CSS_GRILLES.read_text(encoding="utf-8")
    for classe in ("grille", "grille--2", "grille--3", "grille--4",
                   "grille--fluide", "grille--pied", "defile-x"):
        assert re.search(rf"\.{re.escape(classe)}\b", css), f".{classe} absente"


def test_les_grilles_se_replient_sur_telephone():
    css = CSS_GRILLES.read_text(encoding="utf-8")
    bloc = re.search(r"@media \(max-width: 640px\) \{(.+?)\n\}\n", css, re.S)
    assert bloc, "aucun palier telephone dans le CSS des grilles"
    for classe in ("grille--2", "grille--3", "grille--4", "grille--pied"):
        assert classe in bloc.group(1), f"{classe} ne se replie pas sous 640px"


def test_les_pistes_de_grille_ont_une_taille_minimale_nulle():
    """`1fr` a une taille minimale `auto` : un mot long ou un tableau
    elargit la colonne au lieu d'etre contraint, et la page deborde."""
    css = CSS_GRILLES.read_text(encoding="utf-8")
    for declaration in re.findall(r"grid-template-columns:\s*([^;]+);", css):
        if "auto" in declaration or "min(" in declaration:
            continue  # pistes dimensionnees par leur contenu, voulues
        assert "minmax(0" in declaration or "minmax(min(" in declaration, (
            f"piste sans minimum nul : {declaration.strip()}"
        )


def test_le_pied_de_page_garde_ses_colonnes_sur_desktop():
    """Replier le pied de page en deux colonnes des le desktop amputerait
    la mise en page : c'est arrive une fois, on le garde verifie."""
    css = CSS_GRILLES.read_text(encoding="utf-8")
    regle = re.search(r"\.grille--pied \{([^}]+)\}", css)
    assert regle, ".grille--pied absente"
    assert "repeat(4" in regle.group(1), (
        "le pied de page ne declare plus ses quatre colonnes de liens"
    )


def test_les_feuilles_responsives_sont_chargees():
    main = MAIN_CSS.read_text(encoding="utf-8")
    for feuille in ("layout/_grilles-responsives.css", "layout/_cibles-tactiles.css",
                    "layout/_navbar-mobile.css"):
        assert feuille in main, f"{feuille} n'est pas importee dans main.css"


def test_les_cibles_tactiles_visent_44px():
    css = CSS_CIBLES.read_text(encoding="utf-8")
    assert "min-height: 44px" in css, "aucune cible tactile portee a 44px"
    assert "max-width: 1024px" in css, (
        "les cibles tactiles doivent etre elargies uniquement sur petit ecran"
    )
