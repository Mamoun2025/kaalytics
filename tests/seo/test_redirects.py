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


def test_destinations_redirects_correspondent_a_fichiers_reels():
    """Chaque destination de redirection doit correspondre à un fichier réel du dépôt.

    Les sections sans index.html (modules, industries, legal, products) doivent
    rediriger vers une page réelle, pas vers un dossier inexistant.
    """
    vercel_file = ROOT / "vercel.json"
    data = json.loads(vercel_file.read_text(encoding="utf-8"))

    redirects = data.get("redirects", [])
    for redirect in redirects:
        dest = redirect["destination"]
        if dest == "/":
            continue  # L'accueil existe toujours

        # Reconstruit le chemin fichier correspondant à la destination
        if dest.endswith("/"):
            dest = dest[:-1]  # Retire slash final

        # Cherche le fichier correspondant
        candidates = [
            ROOT / (dest.lstrip("/") + ".html"),  # /foo → foo.html
            ROOT / (dest.lstrip("/") + "/index.html"),  # /foo → foo/index.html
        ]

        file_exists = any(c.exists() for c in candidates)
        assert file_exists, (
            f"Redirection vers '{dest}' : aucun fichier trouvé. "
            f"Cherchait : {[str(c.relative_to(ROOT)) for c in candidates]}"
        )
