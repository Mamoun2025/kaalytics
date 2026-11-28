"""Serveur local du site, avec les adresses sans « .html » comme sur Vercel (cleanUrls)."""
from __future__ import annotations

import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class _AdressesPropres(SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        chemin = Path(super().translate_path(path))
        if not chemin.exists() and chemin.suffix != ".html":
            candidat = chemin.with_name(chemin.name + ".html")
            if candidat.exists():
                return str(candidat)
        return str(chemin)

    def log_message(self, *args) -> None:  # silence : le rapport se lit dans tour.json
        return


def demarrer(racine: Path, port: int = 0) -> tuple[ThreadingHTTPServer, str]:
    """Lance le serveur dans un fil et rend (serveur, adresse de base)."""
    gestionnaire = partial(_AdressesPropres, directory=str(racine))
    serveur = ThreadingHTTPServer(("127.0.0.1", port), gestionnaire)
    threading.Thread(target=serveur.serve_forever, daemon=True).start()
    return serveur, f"http://127.0.0.1:{serveur.server_address[1]}"
