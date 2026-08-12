import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_vercel_json_est_valide():
    """vercel.json doit être du JSON valide."""
    vercel_file = ROOT / "vercel.json"
    content = vercel_file.read_text(encoding="utf-8")
    data = json.loads(content)  # Lève une exception si invalide
    assert isinstance(data, dict)


def test_chaque_redirection_a_source_et_destination():
    """Chaque redirection doit avoir une source et une destination non vides."""
    vercel_file = ROOT / "vercel.json"
    data = json.loads(vercel_file.read_text(encoding="utf-8"))

    redirects = data.get("redirects", [])
    for i, redirect in enumerate(redirects):
        assert "source" in redirect, f"Redirection {i} sans 'source'"
        assert "destination" in redirect, f"Redirection {i} sans 'destination'"
        assert redirect["source"], f"Redirection {i} : source vide"
        assert redirect["destination"], f"Redirection {i} : destination vide"
        assert redirect.get("permanent", False), f"Redirection {i} ({redirect['source']}) doit être permanente (permanent: true)"
