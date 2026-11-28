"""Outils du chantier design : serveur local à adresses propres, classement et réunion des constats."""
from __future__ import annotations

import urllib.error
import urllib.request

import pytest

from scripts.design.etat import gabarit, reunir
from scripts.design.serveur_local import demarrer
from scripts.design.tour import nom_fichier, pages_du_site


@pytest.fixture()
def site(tmp_path):
    (tmp_path / "about.html").write_text("<h1>A propos</h1>", encoding="utf-8")
    (tmp_path / "navbar.en.html").write_text("<nav>EN</nav>", encoding="utf-8")
    serveur, base = demarrer(tmp_path)
    yield base
    serveur.shutdown()


def lire(adresse: str) -> str:
    with urllib.request.urlopen(adresse, timeout=5) as reponse:
        return reponse.read().decode("utf-8")


def test_adresse_sans_extension_sert_le_fichier_html(site):
    assert "A propos" in lire(f"{site}/about")


def test_adresse_avec_point_sert_aussi_le_fichier_html(site):
    # navbar-loader.js demande « navbar.en » : Vercel le sert, le serveur local aussi.
    assert "EN" in lire(f"{site}/navbar.en")


def test_page_absente_repond_404(site):
    with pytest.raises(urllib.error.HTTPError) as erreur:
        lire(f"{site}/inconnue")
    assert erreur.value.code == 404


@pytest.mark.parametrize(
    ("page", "attendu"),
    [
        ("index.html", "Accueil"),
        ("en/index.html", "Accueil"),
        ("modules/fleetops.html", "Modules"),
        ("en/blog/index.html", "Blog"),
        ("legal/privacy.html", "Légal"),
        ("pricing.html", "Pages"),
    ],
)
def test_gabarit_par_chemin(page, attendu):
    assert gabarit(page) == attendu


def test_nom_fichier_aplatit_le_chemin():
    assert nom_fichier("en/modules/fleetops.html") == "en__modules__fleetops"


def test_pages_du_site_ecarte_les_dossiers_hors_site():
    pages = pages_du_site()
    assert "index.html" in pages and "en/index.html" in pages
    assert not [p for p in pages if p.startswith(("components/", "docs/", "playground/", "TRASH/"))]


def test_reunir_rassemble_les_quatre_largeurs():
    visites = [
        {"largeur": "1440", "h1": "Titre", "couleurs": {"vert": 40, "bleu": 5}, "polices": {"Inter": 9, "Arial": 1},
         "debordement": 0, "bordsGauches": 1, "nbTitres": 6, "nbTitresLongs": 2,
         "titresLongs": [{"niveau": "H2", "texte": "Les modules"}], "erreurs": ["Unexpected token '{' | pile"], "absents": []},
        {"largeur": "390", "debordement": 24, "bordsGauches": 0, "emojis": True,
         "erreurs": ["Unexpected token '{' | autre pile"], "absents": ["404 http://127.0.0.1:1/img/a.png"]},
    ]
    constats = reunir(visites)
    assert constats["erreurs"] == ["Unexpected token '{'"]
    assert constats["debordements"] == ["390"]
    assert constats["horsPalette"] == {"bleu": 5}
    assert constats["polices"] == ["Arial"]
    assert constats["bordsGauches"] == 1 and constats["emojis"] is True
    assert constats["titresLongs"] == 2 and constats["exemplesTitres"] == ["Les modules"]
    assert constats["absents"] == ["img/a.png"]
