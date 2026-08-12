from scripts.seo.head import BEGIN_MARKER, END_MARKER
from scripts.seo.htmlio import strip_legacy_tags, upsert_block

BLOCK = f"{BEGIN_MARKER}\n    <title>Nouveau</title>\n{END_MARKER}\n"

SANS_MARQUEURS = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Ancien</title>
    <link rel="canonical" href="https://kaalytics.com/ancien.html">
</head>
<body>
    <h1>Corps intact</h1>
    <title>piege dans le corps</title>
</body>
</html>
"""


def test_insere_avant_head_fermant_quand_marqueurs_absents():
    out = upsert_block(SANS_MARQUEURS, BLOCK)
    assert BEGIN_MARKER in out
    assert out.index(BEGIN_MARKER) < out.index("</head>")


def test_le_corps_nest_jamais_modifie():
    out = upsert_block(SANS_MARQUEURS, BLOCK)
    body = out.split("<body>")[1]
    assert "<h1>Corps intact</h1>" in body
    assert "<title>piege dans le corps</title>" in body


def test_idempotence():
    une = upsert_block(SANS_MARQUEURS, BLOCK)
    deux = upsert_block(une, BLOCK)
    assert une == deux


def test_remplace_le_bloc_existant_sans_le_dupliquer():
    une = upsert_block(SANS_MARQUEURS, BLOCK)
    autre = BLOCK.replace("Nouveau", "Encore plus nouveau")
    deux = upsert_block(une, autre)
    assert deux.count(BEGIN_MARKER) == 1
    assert "Encore plus nouveau" in deux
    assert "<title>Nouveau</title>" not in deux


def test_strip_legacy_retire_les_balises_du_head_seulement():
    out = strip_legacy_tags(SANS_MARQUEURS)
    head = out.split("</head>")[0]
    assert "<title>Ancien</title>" not in head
    assert 'rel="canonical"' not in head
    assert '<meta charset="UTF-8">' in head, "charset doit survivre"
    assert "<title>piege dans le corps</title>" in out.split("<body>")[1]


def test_strip_legacy_ne_touche_pas_a_linterieur_des_marqueurs():
    avec_bloc = upsert_block(SANS_MARQUEURS, BLOCK)
    out = strip_legacy_tags(avec_bloc)
    assert "<title>Nouveau</title>" in out


def test_leve_si_pas_de_head_fermant():
    import pytest

    with pytest.raises(ValueError, match="</head>"):
        upsert_block("<html><body>rien</body></html>", BLOCK)
