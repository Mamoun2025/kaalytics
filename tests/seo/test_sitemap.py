import re
import xml.etree.ElementTree as ET
from pathlib import Path

from scripts.seo.catalog import load_catalog
from scripts.seo.gen_sitemap import build_sitemap

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "seo"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def sitemap():
    return build_sitemap(load_catalog(DATA), "2026-08-12")


def test_xml_valide():
    ET.fromstring(sitemap())


def test_une_entree_par_page_indexable():
    pages = [p for p in load_catalog(DATA) if "noindex" not in p.robots]
    # +1 pour la page /work (externe, vient de vercel.json)
    root = ET.fromstring(sitemap())
    assert len(root.findall("sm:url", NS)) == len(pages) + 1


def test_les_pages_noindex_sont_exclues():
    xml = sitemap()
    assert "/legal/privacy" not in xml
    assert "/legal/terms" not in xml


def test_aucune_url_en_html_ni_slash_final():
    for loc in re.findall(r"<loc>([^<]+)</loc>", sitemap()):
        assert not loc.endswith(".html"), loc
        assert loc == "https://kaalytics.com/" or not loc.endswith("/"), loc


def test_collectivites_absente():
    assert "collectivites" not in sitemap()


def test_aucune_balise_image():
    assert "image:" not in sitemap()


def test_hreflang_exclut_arabe_et_lang_params():
    """Vérifie qu'aucun hreflang ne pointe vers l'arabe ni vers des ?lang= params."""
    xml = sitemap()
    assert 'hreflang="ar"' not in xml, "hreflang vers l'arabe détecté"
    assert '?lang=' not in xml, "Paramètres ?lang= détectés"
    assert 'hreflang="x-default"' in xml, "hreflang x-default manquant"


def test_hreflang_reciproque():
    """Vérifie que tous les hreflang sont réciproques.

    Si la page A a un hreflang vers la page B, alors la page B doit avoir
    exactement les mêmes alternates que A (test de réciprocité stricte).
    """
    pages = load_catalog(DATA)
    for page in pages:
        for lang, url in page.alternates:
            if lang == "x-default":
                continue
            # Retrouve la page cible
            target_path = url.replace("https://kaalytics.com", "")
            target_page = next((p for p in pages if p.url_path == target_path), None)
            assert target_page is not None, (
                f"{page.html_path}: hreflang vers {url} (orphelin)"
            )
            # Vérifie la réciprocité
            assert dict(target_page.alternates) == dict(page.alternates), (
                f"{page.html_path}: hreflang non-réciproque vers {url} "
                f"(page cible a {dict(target_page.alternates)})"
            )


def test_work_url_incluse():
    """La page /work vient d'une rewrite Vercel, pas du catalogue."""
    xml = sitemap()
    assert "https://kaalytics.com/work" in xml


def test_le_fichier_livre_est_a_jour():
    """sitemap.xml sur disque doit correspondre au catalogue."""
    genere = build_sitemap(load_catalog(DATA), "PLACEHOLDER")
    livre = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    normalise = re.sub(r"<lastmod>[^<]*</lastmod>", "<lastmod>PLACEHOLDER</lastmod>", livre)
    assert normalise == genere
