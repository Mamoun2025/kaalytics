import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXCLUDED = ("TRASH", "PROPOSALS", "proposals", "node_modules")
FORBIDDEN_TYPES = {"AggregateRating", "Review", "Rating"}


def production_pages():
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT).as_posix()
        if any(part in rel for part in EXCLUDED):
            continue
        yield rel, path


def jsonld_types(html):
    """Tous les @type presents dans les blocs JSON-LD d'une page."""
    types = set()
    for block in re.findall(
        r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
        html,
        re.S,
    ):
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        stack = [data]
        while stack:
            node = stack.pop()
            if isinstance(node, dict):
                if "@type" in node and isinstance(node["@type"], str):
                    types.add(node["@type"])
                stack.extend(node.values())
            elif isinstance(node, list):
                stack.extend(node)
    return types


def test_aucun_avis_fictif_balise():
    coupables = {}
    for rel, path in production_pages():
        found = jsonld_types(path.read_text(encoding="utf-8")) & FORBIDDEN_TYPES
        if found:
            coupables[rel] = sorted(found)
    assert not coupables, f"Avis fictifs balises : {coupables}"


def test_tous_les_blocs_jsonld_restent_valides():
    """Retirer les avis ne doit pas casser le JSON des blocs restants."""
    for rel, path in production_pages():
        html = path.read_text(encoding="utf-8")
        for block in re.findall(
            r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
            html,
            re.S,
        ):
            json.loads(block)  # leve si le JSON est casse
