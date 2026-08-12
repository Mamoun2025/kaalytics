"""Tests pour gen_llms - generation depuis le catalogue."""
from __future__ import annotations

import re
from pathlib import Path

import pytest

from scripts.seo.catalog import load_catalog
from scripts.seo.gen_llms import build_llms

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "seo"


def test_gen_llms_genere_un_fichier():
    """Verifie que gen_llms genere le fichier llms.txt."""
    llms_file = ROOT / "llms.txt"
    assert llms_file.exists(), f"llms.txt n'existe pas"
    content = llms_file.read_text(encoding="utf-8")
    assert len(content) > 100, "llms.txt est vide ou trop court"


def test_llms_txt_sans_extension_html():
    """Verifie qu'aucune URL dans llms.txt ne se termine par .html."""
    llms_file = ROOT / "llms.txt"
    content = llms_file.read_text(encoding="utf-8")
    # Extrait toutes les URLs
    urls = re.findall(r"https://kaalytics\.com[^)\s]*", content)
    for url in urls:
        assert not url.endswith(".html"), f"URL avec .html: {url}"


def test_llms_txt_sans_slash_final():
    """Verifie qu'aucune URL (sauf racine) n'a de slash final."""
    llms_file = ROOT / "llms.txt"
    content = llms_file.read_text(encoding="utf-8")
    urls = re.findall(r"https://kaalytics\.com[^)\s]*", content)
    for url in urls:
        if url != "https://kaalytics.com/":
            assert not url.endswith("/"), f"URL avec slash final: {url}"


def test_llms_txt_contient_sections_principales():
    """Verifie que llms.txt contient les sections principales."""
    llms_file = ROOT / "llms.txt"
    content = llms_file.read_text(encoding="utf-8")
    sections = ["## Modules", "## Secteurs", "## Articles", "## Guides"]
    for section in sections:
        assert section in content, f"Section '{section}' manquante"


def test_llms_txt_accentuation_correcte():
    """Verifie que le français est correctement accentué."""
    llms_file = ROOT / "llms.txt"
    content = llms_file.read_text(encoding="utf-8")
    # Verifie la description principale
    assert "d'analyse et d'automatisation" in content
    assert "à l'ERP" in content
    assert "déjà en place" in content
    assert "Basée à Casablanca" in content


def test_llms_txt_exclut_noindex():
    """Verifie que les pages en noindex sont exclues."""
    llms_file = ROOT / "llms.txt"
    content = llms_file.read_text(encoding="utf-8")
    # Les pages legal/* ont noindex
    assert "/legal/privacy" not in content
    assert "/legal/terms" not in content
    # Les case-studies fictives aussi
    assert "/case-studies/locamat" not in content
    assert "/case-studies/terrafleet" not in content
    assert "/case-studies/transmaroc" not in content


def test_llms_cache_pas_si_change():
    """Verifie que si le catalogue change, llms.txt se regenere correctement."""
    pages = load_catalog(DATA)
    llms = build_llms(pages)
    llms_file = ROOT / "llms.txt"
    current = llms_file.read_text(encoding="utf-8")
    # Doit etre identique (test que la generation est deterministe)
    assert llms == current, "llms.txt ne correspond plus a la generation depuis le catalogue"


def test_llms_compte_urls():
    """Verifie qu'on a un nombre raisonnable d'URLs."""
    llms_file = ROOT / "llms.txt"
    content = llms_file.read_text(encoding="utf-8")
    urls = re.findall(r"https://kaalytics\.com[^)\s]*", content)
    assert len(urls) >= 35, f"Trop peu d'URLs ({len(urls)})"
    assert len(urls) <= 200, f"Trop d'URLs ({len(urls)})"
