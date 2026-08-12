from pathlib import Path

from scripts.seo.catalog import load_catalog, load_defaults
from scripts.seo.gen_head import apply_to_page, main

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "seo"

PAGE = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Ancien titre</title>
    <meta name="description" content="Ancienne description">
</head>
<body><main>corps</main></body>
</html>
"""


def meta_fleetops():
    return next(
        p for p in load_catalog(DATA) if p.html_path == "modules/fleetops.html"
    )


def test_applique_le_nouveau_titre_et_retire_lancien():
    out = apply_to_page(PAGE, meta_fleetops(), load_defaults(DATA))
    assert "FleetOps" in out
    assert "Ancien titre" not in out
    assert "Ancienne description" not in out
    assert out.count("<title>") == 1


def test_idempotent_sur_une_page_reelle():
    defaults = load_defaults(DATA)
    une = apply_to_page(PAGE, meta_fleetops(), defaults)
    deux = apply_to_page(une, meta_fleetops(), defaults)
    assert une == deux


def test_le_corps_est_preserve():
    out = apply_to_page(PAGE, meta_fleetops(), load_defaults(DATA))
    assert "<main>corps</main>" in out


def test_dry_run_necrit_rien(tmp_path, monkeypatch, capsys):
    cible = ROOT / "modules" / "fleetops.html"
    avant = cible.read_text(encoding="utf-8")
    code = main(["--dry-run", "--only", "modules/fleetops.html"])
    assert code == 0
    assert cible.read_text(encoding="utf-8") == avant
    assert "DRY-RUN" in capsys.readouterr().out


def test_only_ne_traite_que_les_pages_demandees(capsys):
    main(["--dry-run", "--only", "modules/fleetops.html"])
    sortie = capsys.readouterr().out
    assert "modules/fleetops.html" in sortie
    assert "modules/ai-engine.html" not in sortie
