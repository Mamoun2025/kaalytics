"""Recoloration vers la palette Kaalytics : toute teinte hors palette ramenée dans la famille émeraude.

Règle (palette validée le 23/11/2026) : émeraude et gris verts ; ambre et rouge pour les alertes seulement.
- Couleurs saturées bleues, cyan, violettes, roses, orange : teinte émeraude (160°), même luminosité.
- Gris bleutés (ardoise, #64748b, #94a3b8, #0f172a…) : gris verts (155°), même luminosité.
- Verts, ambres, rouges, neutres purs : inchangés.
"""
from __future__ import annotations

import colorsys
import re

TEINTE_EMERAUDE = 160 / 360
TEINTE_GRIS_VERT = 155 / 360
SATURATION_EMERAUDE = 0.84
SATURATION_GRIS_VERT = 0.14

_HEX = re.compile(r"#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b")
_RGB = re.compile(r"rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*[\d.]+\s*)?\)")


def _hors_palette(teinte: float, saturation: float) -> str | None:
    """« vive » ou « ardoise » si la couleur sort de la palette, sinon None."""
    degres = teinte * 360
    if saturation >= 0.35:
        froide = 175 <= degres < 345   # cyan, bleu, violet, rose
        orange = 15 <= degres < 34      # orange (l'ambre des alertes commence vers 35°)
        return "vive" if froide or orange else None
    if 0.06 <= saturation < 0.35 and 190 <= degres < 250:
        return "ardoise"
    return None


def convertir(r: int, g: int, b: int) -> tuple[int, int, int] | None:
    """Rend la couleur ramenée dans la palette, ou None si elle y est déjà."""
    teinte, clarte, saturation = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    genre = _hors_palette(teinte, saturation)
    if genre is None:
        return None
    if genre == "vive":
        nouvelle = colorsys.hls_to_rgb(TEINTE_EMERAUDE, clarte, max(saturation, SATURATION_EMERAUDE) if clarte < 0.85 else saturation)
    else:
        nouvelle = colorsys.hls_to_rgb(TEINTE_GRIS_VERT, clarte, min(saturation, SATURATION_GRIS_VERT))
    return tuple(round(v * 255) for v in nouvelle)


def _hex(match: re.Match) -> str:
    code = match.group(0)[1:]
    if len(code) == 3:
        code = "".join(c * 2 for c in code)
    nouvelle = convertir(int(code[0:2], 16), int(code[2:4], 16), int(code[4:6], 16))
    return match.group(0) if nouvelle is None else "#{:02x}{:02x}{:02x}".format(*nouvelle)


def _rgb(match: re.Match) -> str:
    r, g, b = (int(match.group(i)) for i in (1, 2, 3))
    nouvelle = convertir(r, g, b)
    if nouvelle is None:
        return match.group(0)
    alpha = match.group(4)
    if alpha:
        return "rgba({}, {}, {}{})".format(*nouvelle, alpha.rstrip())
    return "rgb({}, {}, {})".format(*nouvelle)


_BORD_GAUCHE = re.compile(r"border-left\s*:\s*([2-9]|\d{2,})px\s+(solid|dashed|double)\s+(?!transparent)[^;\"}]+")


def recolorer(css: str) -> str:
    """Couleurs hors palette remplacées ; bordures gauches colorées épaisses retirées."""
    css = _HEX.sub(_hex, css)
    css = _RGB.sub(_rgb, css)
    return _BORD_GAUCHE.sub("border-left: 0", css)
