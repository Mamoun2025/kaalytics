"""Tests pour IndexNow - clé de domaine et extraction du sitemap."""
from __future__ import annotations

from pathlib import Path

import pytest

from scripts.seo.indexnow import KEY, extract_urls_from_sitemap, status_text

ROOT = Path(__file__).resolve().parents[2]


def test_cle_indexnow_existe():
    """Verifie que le fichier de cle IndexNow existe et contient la bonne cle."""
    key_file = ROOT / f"{KEY}.txt"
    assert key_file.exists(), f"Fichier de cle {key_file} introuvable"
    content = key_file.read_text(encoding="utf-8").strip()
    assert content == KEY, f"Contenu du fichier != cle (got {content})"


def test_cle_cohérente():
    """Verifie que la cle est une valeur hexadecimale valide."""
    assert len(KEY) == 32, f"Cle doit faire 32 chars (got {len(KEY)})"
    assert all(c in "0123456789abcdef" for c in KEY), "Cle doit etre en hex"


def test_extraction_urls_depuis_sitemap():
    """Extrait les URLs du sitemap et verifie qu'elles sont valides."""
    urls = extract_urls_from_sitemap()
    assert urls, "Aucune URL extraite du sitemap"
    for url in urls:
        assert url.startswith("https://kaalytics.com"), f"URL invalide: {url}"
        assert not url.endswith(".html"), f"URL en .html: {url}"
        if url != "https://kaalytics.com/":
            assert not url.endswith("/"), f"URL avec slash final: {url}"


def test_status_text_codes_http():
    """Teste la traduction des codes HTTP."""
    assert "OK" in status_text(200)
    assert "Accepted" in status_text(202)
    assert "Bad request" in status_text(400)
    assert "invalide" in status_text(403)
    assert "invalides" in status_text(422)
    assert "Rate limit" in status_text(429)
    assert "Status 999" in status_text(999)
