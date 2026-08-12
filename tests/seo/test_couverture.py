from pathlib import Path

from scripts.seo.catalog import load_catalog

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "seo"
EXCLUDED_DIRS = {
    "TRASH", "PROPOSALS", "proposals", "components",
    "sections", "playground", "node_modules", "docs", "tests",
}
# Pages hors perimetre d'indexation : elles ne sont pas au catalogue.
EXCLUDED_FILES = {"404.html", "merci.html"}


def production_pages() -> list[str]:
    pages = []
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT).as_posix()
        if set(rel.split("/")) & EXCLUDED_DIRS:
            continue
        if rel in EXCLUDED_FILES:
            continue
        pages.append(rel)
    return pages


def test_toutes_les_pages_de_prod_sont_au_catalogue():
    au_catalogue = {p.html_path for p in load_catalog(DATA)}
    manquantes = sorted(set(production_pages()) - au_catalogue)
    assert not manquantes, f"pages absentes du catalogue : {manquantes}"


def test_le_catalogue_ne_reference_aucun_fichier_absent():
    fantomes = [p.html_path for p in load_catalog(DATA) if not (ROOT / p.html_path).exists()]
    assert not fantomes, f"entrees sans fichier : {fantomes}"


def test_aucun_titre_duplique():
    titres = [p.title for p in load_catalog(DATA)]
    doublons = {t for t in titres if titres.count(t) > 1}
    assert not doublons, f"titres dupliques : {sorted(doublons)}"
