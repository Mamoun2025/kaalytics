import pytest

from scripts.seo.links import canonicalize_href, canonicalize_links


@pytest.mark.parametrize(
    "avant,apres",
    [
        # extension retiree
        ("../pricing.html", "../pricing"),
        ("supply-chain.html", "supply-chain"),
        ("/modules/fleetops.html", "/modules/fleetops"),
        ("../legal/privacy.html", "../legal/privacy"),
        # slash final retire
        ("../guides/", "../guides"),
        ("/blog/", "/blog"),
        ("guides/", "guides"),
        ("{{ROOT}}blog/", "{{ROOT}}blog"),
        # index.html
        ("index.html", "/"),
        ("../index.html", "../"),
        ("../index.html#modules-ia", "../#modules-ia"),
        # index.html avec slash (cas critique pour idempotence)
        ("blog/index.html", "blog"),
        ("guides/index.html", "guides"),
        ("/blog/index.html", "/blog"),
        ("../guides/index.html", "../guides"),
        # fragments et requetes preserves
        ("../about.html#equipe", "../about#equipe"),
        ("/faq.html?lang=fr", "/faq?lang=fr"),
        # inchanges
        ("../", "../"),
        ("./", "./"),
        ("/", "/"),
        ("#modules-ia", "#modules-ia"),
        ("{{ROOT}}", "{{ROOT}}"),
        ("https://kaalytics.com/products/daedalia.html", "https://kaalytics.com/products/daedalia.html"),
        ("mailto:contact@kaalytics.com", "mailto:contact@kaalytics.com"),
        ("tel:+212522000000", "tel:+212522000000"),
        ("/assets/css/main.css", "/assets/css/main.css"),
        ("/assets/js/core/app.js", "/assets/js/core/app.js"),
        ("/manifest.json", "/manifest.json"),
        ("/favicon.svg", "/favicon.svg"),
    ],
)
def test_canonicalisation_dun_href(avant, apres):
    assert canonicalize_href(avant) == apres


def test_reecrit_les_href_dans_le_html():
    html = '<a href="../pricing.html">Tarifs</a><a href="../guides/">Guides</a>'
    out = canonicalize_links(html)
    assert 'href="../pricing"' in out
    assert 'href="../guides"' in out


def test_ne_touche_pas_aux_src_ni_aux_link_stylesheet():
    html = (
        '<link rel="stylesheet" href="/assets/css/main.css">'
        '<script src="/assets/js/core/app.js"></script>'
    )
    assert canonicalize_links(html) == html


def test_idempotent():
    html = '<a href="../pricing.html">x</a>'
    une = canonicalize_links(html)
    assert canonicalize_links(une) == une


def test_canonicalize_href_est_idempotente():
    """Appliquer deux fois doit donner le meme resultat : sans ca, un href
    peut rester dans un etat intermediaire qui redirige encore."""
    cas = [
        "../pricing.html", "blog/index.html", "guides/index.html",
        "index.html", "../index.html", "/blog/", "{{ROOT}}blog/",
        "../", "./", "/", "#ancre", "/faq.html?lang=fr",
        "../about.html#equipe", "/assets/css/main.css",
        "https://exemple.com/page.html", "mailto:a@b.c",
    ]
    for href in cas:
        une = canonicalize_href(href)
        assert canonicalize_href(une) == une, f"non idempotent sur {href!r}"
