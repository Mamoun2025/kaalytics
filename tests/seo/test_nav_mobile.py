"""Garde-fous de la navigation mobile.

Le burger existait et etait cable, mais restait injoignable au doigt : un
style en ligne `display: inline-flex` sur le CTA le rendait impossible a
masquer sous 1024px, et le bouton se retrouvait pousse hors de l'ecran
(mesure : x=414 sur un ecran de 375). Ces tests gardent les conditions qui
ont permis la correction ; le comportement lui-meme se verifie au
navigateur.
"""
import re
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
COMPOSANTS = [
    RACINE / "components" / "navbar" / "navbar.html",
    RACINE / "components" / "navbar" / "navbar.en.html",
]
CSS_MOBILE = RACINE / "assets" / "css" / "layout" / "_navbar-mobile.css"
MAIN_CSS = RACINE / "assets" / "css" / "main.css"


def _lire(chemin):
    return chemin.read_text(encoding="utf-8")


def test_le_cta_ne_porte_aucun_style_en_ligne():
    """Un style en ligne bat toute media query : le CTA redeviendrait
    impossible a masquer et repousserait le burger hors de l'ecran."""
    for composant in COMPOSANTS:
        html = _lire(composant)
        balise = re.search(r"<a[^>]*navbar__cta-desktop[^>]*>", html)
        assert balise, f"CTA introuvable dans {composant.name}"
        assert "style=" not in balise.group(0), (
            f"{composant.name} : le CTA porte un style en ligne, "
            f"il ne pourra pas etre masque en mobile"
        )


def test_le_css_mobile_est_charge_apres_les_boutons():
    """`.btn { display: inline-flex }` et `.navbar__cta-desktop
    { display: none }` ont la meme specificite : seul l'ordre les departage."""
    css = _lire(MAIN_CSS)
    rang_boutons = css.index("components/_buttons.css")
    rang_nav_mobile = css.index("layout/_navbar-mobile.css")
    assert rang_nav_mobile > rang_boutons, (
        "layout/_navbar-mobile.css doit etre importe apres components/_buttons.css"
    )


def test_le_cta_est_masque_sous_1024px():
    css = _lire(CSS_MOBILE)
    bloc = re.search(r"@media \(max-width: 1024px\) \{(.+?)\n\}", css, re.S)
    assert bloc, "aucun bloc @media 1024px dans le CSS de la nav mobile"
    assert re.search(r"\.navbar__cta-desktop\s*\{\s*display:\s*none", bloc.group(1)), (
        "le CTA n'est pas masque sous 1024px"
    )


def test_la_cible_tactile_du_burger_atteint_44px():
    """En dessous de 44px la cible devient difficile a viser au doigt."""
    css = _lire(CSS_MOBILE)
    bloc = re.search(
        r"\.navbar \.navbar__mobile-toggle \{(.+?)\}", css, re.S
    )
    assert bloc, "le burger n'est pas dimensionne dans le CSS de la nav mobile"
    for propriete in ("width", "height"):
        valeur = re.search(rf"{propriete}:\s*(\d+)px", bloc.group(1))
        assert valeur and int(valeur.group(1)) >= 44, (
            f"{propriete} du burger < 44px"
        )


def test_le_bouton_declare_le_panneau_qu_il_pilote():
    for composant in COMPOSANTS:
        html = _lire(composant)
        bouton = re.search(r"<button[^>]*navbar__mobile-toggle[^>]*>", html)
        assert bouton, f"burger introuvable dans {composant.name}"
        attributs = bouton.group(0)
        assert 'aria-controls="navbar-mobile-menu"' in attributs, composant.name
        assert 'aria-expanded="false"' in attributs, composant.name
        assert 'id="navbar-mobile-menu"' in html, (
            f"{composant.name} : aria-controls pointe vers un identifiant absent"
        )


def test_le_panneau_est_ferme_avant_meme_que_le_js_tourne():
    """Sans cela, les liens du panneau sont dans l'ordre de tabulation
    des le chargement, et le clavier part dans le vide."""
    for composant in COMPOSANTS:
        panneau = re.search(
            r"<div[^>]*navbar__mobile-menu[^>]*>", _lire(composant)
        )
        assert panneau, f"panneau introuvable dans {composant.name}"
        assert "inert" in panneau.group(0), composant.name
        assert 'aria-hidden="true"' in panneau.group(0), composant.name


def test_le_libelle_du_burger_change_selon_l_etat():
    for composant in COMPOSANTS:
        attributs = re.search(
            r"<button[^>]*navbar__mobile-toggle[^>]*>", _lire(composant)
        ).group(0)
        assert "data-label-ouvrir=" in attributs, composant.name
        assert "data-label-fermer=" in attributs, composant.name


def test_le_panneau_se_ferme_au_clavier_et_au_clic_exterieur():
    """Sur telephone c'est le seul acces a la navigation : il doit exister
    plusieurs facons d'en sortir."""
    loader = _lire(RACINE / "components" / "navbar" / "navbar-loader.js")
    assert "'Escape'" in loader, "Echap ne ferme pas le panneau"
    assert "mobileMenu.contains(e.target)" in loader, "le clic exterieur ne ferme pas"
    assert "window.innerWidth > 1024" in loader, (
        "le panneau reste ouvert au retour vers le desktop"
    )
    assert "mobileToggle.focus()" in loader, "le focus n'est pas rendu au bouton"
