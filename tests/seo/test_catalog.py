import json
from pathlib import Path

import pytest

from scripts.seo.catalog import (
    BASE_URL,
    absolute_url,
    load_catalog,
    load_defaults,
    url_path_for,
)

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "seo"


@pytest.mark.parametrize(
    "html_path,expected",
    [
        ("index.html", "/"),
        ("en/index.html", "/en"),
        ("guides/index.html", "/guides"),
        ("blog/index.html", "/blog"),
        ("modules/fleetops.html", "/modules/fleetops"),
        ("en/modules/fleetops.html", "/en/modules/fleetops"),
        ("legal/privacy.html", "/legal/privacy"),
    ],
)
def test_url_path_sans_extension_ni_slash_final(html_path, expected):
    assert url_path_for(html_path) == expected


def test_absolute_url_prefixe_le_domaine():
    assert absolute_url("modules/fleetops.html") == (
        "https://kaalytics.com/modules/fleetops"
    )
    assert absolute_url("index.html") == "https://kaalytics.com/"


def test_defaults_contient_le_minimum():
    defaults = load_defaults(DATA)
    assert defaults["base_url"] == BASE_URL
    assert defaults["og_image"].startswith("/assets/images/")
    assert defaults["organization"]["@type"] == "Organization"


def test_catalogue_produit_les_pages_fr_et_en():
    pages = {p.html_path: p for p in load_catalog(DATA)}
    assert "modules/fleetops.html" in pages
    assert "en/modules/fleetops.html" in pages
    assert pages["modules/fleetops.html"].lang == "fr"
    assert pages["en/modules/fleetops.html"].lang == "en"


def test_hreflang_reciproque_par_construction():
    pages = {p.html_path: p for p in load_catalog(DATA)}
    fr = dict(pages["modules/fleetops.html"].alternates)
    en = dict(pages["en/modules/fleetops.html"].alternates)
    assert fr == en, "les deux versions doivent declarer les memes alternates"
    assert fr["fr"] == "https://kaalytics.com/modules/fleetops"
    assert fr["en"] == "https://kaalytics.com/en/modules/fleetops"
    assert fr["x-default"] == fr["fr"], "x-default doit pointer sur le FR"


def test_le_nom_du_module_est_intact_dans_le_titre():
    pages = {p.html_path: p for p in load_catalog(DATA)}
    assert pages["modules/fleetops.html"].title.startswith("FleetOps")
    assert pages["en/modules/fleetops.html"].title.startswith("FleetOps")


def test_aucune_description_dupliquee_entre_pages():
    descriptions = [p.description for p in load_catalog(DATA)]
    assert len(descriptions) == len(set(descriptions))


def test_descriptions_sous_160_caracteres():
    for page in load_catalog(DATA):
        assert len(page.description) <= 160, f"{page.html_path} trop longue"


def test_les_fichiers_de_donnees_sont_du_json_valide():
    for path in DATA.glob("*.json"):
        json.loads(path.read_text(encoding="utf-8"))


def test_les_textes_francais_sont_accentues():
    """Les titres et descriptions FR alimentent les resultats Google : du
    francais desaccentue y ferait tache. Detecte les mots frequents ecrits
    sans leur accent."""
    import re

    sans_accent = re.compile(
        r"\b(predictive|couts|rentabilite|reel|donnees|integre|automatise|"
        r"ciblees|previsions?|referencement|genere|deployes|detection|"
        r"numerique|systeme|societe|deja|operationnel|metier[es]?|"
        r"prevision|reliee?s?|connectee?s?|alimentee?s?)\b",
        re.I,
    )
    fautifs = []
    for page in load_catalog(DATA):
        if page.lang != "fr":
            continue
        for champ in (page.title, page.description):
            trouves = sans_accent.findall(champ)
            if trouves:
                fautifs.append((page.html_path, trouves))
    assert not fautifs, f"francais desaccentue : {fautifs}"


def test_load_catalog_ne_renvoie_que_des_pages_existantes():
    """Le catalogue ne doit contenir que des entrées correspondant à des fichiers
    HTML réels. C'est un garde-fou contre les confusion (ex: auteurs chargés
    comme des pages du site)."""
    manquantes = []
    for page in load_catalog(DATA):
        if not Path(page.html_path).exists():
            manquantes.append(page.html_path)
    assert not manquantes, f"entrées du catalogue sans fichier : {manquantes}"
