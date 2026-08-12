import json
import re
from pathlib import Path

from scripts.seo.catalog import PageMeta, load_defaults
from scripts.seo.head import BEGIN_MARKER, END_MARKER, build_head_block

DATA = Path(__file__).resolve().parents[2] / "data" / "seo"

FR = PageMeta(
    html_path="modules/fleetops.html",
    url_path="/modules/fleetops",
    lang="fr",
    title="FleetOps — logiciel de gestion de flotte au Maroc | Kaalytics",
    description="Suivi GPS, maintenance predictive et couts par chantier.",
    og_image="/assets/images/og-fleetops.jpg",
    keyword="logiciel gestion de flotte Maroc",
    alternates=(
        ("fr", "https://kaalytics.com/modules/fleetops"),
        ("en", "https://kaalytics.com/en/modules/fleetops"),
        ("x-default", "https://kaalytics.com/modules/fleetops"),
    ),
    robots="index, follow",
)

SANS_EN = PageMeta(
    html_path="legal/privacy.html",
    url_path="/legal/privacy",
    lang="fr",
    title="Politique de confidentialite | Kaalytics",
    description="Comment Kaalytics collecte et protege vos donnees.",
    og_image="/assets/images/og-image.jpg",
    keyword="",
    alternates=(),
    robots="noindex, follow",
)


def block(meta):
    return build_head_block(meta, load_defaults(DATA))


def test_encadre_par_les_marqueurs():
    out = block(FR)
    assert out.startswith(BEGIN_MARKER)
    assert out.rstrip().endswith(END_MARKER)


def test_canonique_absolue_sans_extension():
    assert (
        '<link rel="canonical" href="https://kaalytics.com/modules/fleetops">'
        in block(FR)
    )


def test_hreflang_complet_quand_jumelle_en():
    out = block(FR)
    for lang, url in FR.alternates:
        assert f'<link rel="alternate" hreflang="{lang}" href="{url}">' in out


def test_aucun_hreflang_sans_jumelle_en():
    assert "hreflang" not in block(SANS_EN)


def test_open_graph_et_twitter_complets():
    out = block(FR)
    for tag in ("og:title", "og:description", "og:url", "og:image", "og:type", "og:locale"):
        assert f'property="{tag}"' in out
    assert 'name="twitter:card" content="summary_large_image"' in out
    assert "https://kaalytics.com/assets/images/og-fleetops.jpg" in out


def test_og_locale_suit_la_langue():
    assert 'content="fr_FR"' in block(FR)
    en = PageMeta(**{**FR.__dict__, "lang": "en"})
    assert 'content="en_US"' in block(en)


def test_meta_robots_reprend_la_valeur_de_la_page():
    assert '<meta name="robots" content="noindex, follow">' in block(SANS_EN)


def test_jsonld_organization_present_et_valide():
    out = block(FR)
    blocks = re.findall(
        r'<script type="application/ld\+json">(.*?)</script>', out, re.S
    )
    assert blocks, "aucun bloc JSON-LD"
    # Chercher le bloc Organization (peut ne pas être le premier s'il y a BreadcrumbList/Article)
    org_data = None
    for block_str in blocks:
        data = json.loads(block_str)
        if data["@type"] == "Organization":
            org_data = data
            break
    assert org_data is not None, "aucun bloc Organization trouvé"
    assert org_data["@context"] == "https://schema.org"


def test_les_guillemets_du_titre_sont_echappes():
    piege = PageMeta(**{**FR.__dict__, "title": 'Un "vrai" titre & co'})
    out = block(piege)
    assert "&quot;vrai&quot;" in out
    assert "&amp; co" in out
    assert '"vrai"' not in out.split(END_MARKER)[0].replace("&quot;", "")


def test_le_titre_ne_contient_pas_de_balise_title_en_double():
    assert block(FR).count("<title>") == 1
