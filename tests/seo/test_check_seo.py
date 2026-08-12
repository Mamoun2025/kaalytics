from pathlib import Path

from scripts.seo.check_seo import main, run_checks

ROOT = Path(__file__).resolve().parents[2]


def test_le_site_actuel_ne_viole_aucune_regle():
    violations = run_checks(ROOT)
    assert not violations, "\n".join(
        f"{v.page}: {v.rule} — {v.detail}" for v in violations
    )


def test_code_de_sortie_zero_quand_tout_va_bien():
    assert main([]) == 0


def test_detecte_une_canonique_manquante(tmp_path):
    (tmp_path / "data" / "seo").mkdir(parents=True)
    (tmp_path / "data" / "seo" / "defaults.json").write_text(
        (ROOT / "data" / "seo" / "defaults.json").read_text(encoding="utf-8"),
        encoding="utf-8",
    )
    (tmp_path / "data" / "seo" / "core.json").write_text(
        '{"orpheline.html": {"keyword": "", '
        '"fr": {"title": "T", "description": "D"}}}',
        encoding="utf-8",
    )
    (tmp_path / "orpheline.html").write_text(
        "<html><head></head><body>x</body></html>", encoding="utf-8"
    )
    violations = run_checks(tmp_path)
    assert any(v.rule == "canonical-manquante" for v in violations)


def test_detecte_un_lien_en_html(tmp_path):
    (tmp_path / "data" / "seo").mkdir(parents=True)
    (tmp_path / "data" / "seo" / "defaults.json").write_text(
        (ROOT / "data" / "seo" / "defaults.json").read_text(encoding="utf-8"),
        encoding="utf-8",
    )
    (tmp_path / "data" / "seo" / "core.json").write_text("{}", encoding="utf-8")
    (tmp_path / "sale.html").write_text(
        '<html><head></head><body><a href="/pricing.html">x</a></body></html>',
        encoding="utf-8",
    )
    violations = run_checks(tmp_path)
    assert any(v.rule == "lien-non-canonique" for v in violations)
