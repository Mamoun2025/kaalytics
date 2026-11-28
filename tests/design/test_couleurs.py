"""Recoloration vers la palette émeraude."""
from __future__ import annotations

import colorsys

import pytest

from scripts.design.couleurs import convertir, recolorer


def teinte(code: str) -> float:
    r, g, b = (int(code[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return colorsys.rgb_to_hls(r, g, b)[0] * 360


@pytest.mark.parametrize("code", ["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#60a5fa", "#a78bfa"])
def test_les_couleurs_vives_hors_palette_passent_en_emeraude(code):
    nouveau = recolorer(f"color: {code};").split(": ")[1].rstrip(";")
    assert nouveau != code
    assert 150 <= teinte(nouveau) <= 170


@pytest.mark.parametrize("code", ["#64748b", "#94a3b8", "#0f172a"])
def test_les_gris_bleutes_passent_en_gris_verts(code):
    nouveau = recolorer(code)
    assert 145 <= teinte(nouveau) <= 165


@pytest.mark.parametrize("code", ["#10b981", "#34d399", "#ecfdf5", "#040a08", "#ef4444", "#fbbf24", "#f59e0b", "#ffffff", "#000000", "#25d366"])
def test_la_palette_et_les_alertes_restent_intactes(code):
    assert recolorer(code) == code


def test_rgba_garde_sa_transparence():
    assert recolorer("rgba(59, 130, 246, 0.15)").endswith(", 0.15)")
    assert recolorer("rgba(16, 185, 129, 0.15)") == "rgba(16, 185, 129, 0.15)"


def test_la_luminosite_est_conservee():
    r, g, b = convertir(0x3B, 0x82, 0xF6)
    avant = colorsys.rgb_to_hls(0x3B / 255, 0x82 / 255, 0xF6 / 255)[1]
    apres = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)[1]
    assert abs(avant - apres) < 0.02


def test_les_bordures_gauches_colorees_sont_retirees():
    assert recolorer(".a { border-left: 4px solid #10b981; }") == ".a { border-left: 0; }"
    assert recolorer(".b { border-left: 3px solid var(--emerald); }") == ".b { border-left: 0; }"


def test_les_bordures_gauches_fines_ou_transparentes_restent():
    assert recolorer("border-left: 1px solid #fff;") == "border-left: 1px solid #fff;"
    assert recolorer("border-left: 30px solid transparent;") == "border-left: 30px solid transparent;"


def test_idempotent():
    css = "a { color: #3b82f6; background: rgba(139, 92, 246, 0.2); border-left: 4px solid #8b5cf6; }"
    assert recolorer(recolorer(css)) == recolorer(css)
