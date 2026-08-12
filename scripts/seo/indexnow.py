"""IndexNow - Soumission automatique des URLs aux moteurs de recherche.

Supporte: Bing, Yandex, Seznam, Naver, Yep.
https://www.indexnow.org/

Usage:
    python3 -m scripts.seo.indexnow           # soumet toutes les URLs du sitemap
    python3 -m scripts.seo.indexnow <url>     # soumet une URL specifique
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SITEMAP_PATH = ROOT / "sitemap.xml"

HOST = "kaalytics.com"
KEY = "7cc36f86b3c36160223781823494b78e"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
ENDPOINT = "https://api.indexnow.org/IndexNow"


def extract_urls_from_sitemap() -> list[str]:
    """Extrait toutes les URLs <loc> du sitemap.xml."""
    if not SITEMAP_PATH.exists():
        print(f"Sitemap introuvable: {SITEMAP_PATH}", file=sys.stderr)
        return []

    tree = ET.parse(SITEMAP_PATH)
    root = tree.getroot()
    ns = {"sitemap": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [
        loc.text
        for loc in root.findall(".//sitemap:loc", ns)
        if loc.text
    ]


def submit_to_indexnow(urls: list[str]) -> dict:
    """Soumet les URLs a l'API IndexNow."""
    payload = json.dumps({
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls,
    }).encode("utf-8")

    req = urllib.request.Request(
        ENDPOINT,
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = response.read().decode("utf-8")
            return {"status": status, "body": body}
    except urllib.error.HTTPError as e:
        return {"status": e.code, "body": e.read().decode("utf-8")}


def status_text(status: int) -> str:
    """Traduit le code de status HTTP en message lisible."""
    messages = {
        200: "OK",
        202: "Accepted (validation en cours)",
        400: "Bad request",
        403: "Key invalide",
        422: "URLs invalides",
        429: "Rate limit",
    }
    return messages.get(status, f"Status {status}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Soumet les URLs du sitemap a IndexNow."
    )
    parser.add_argument(
        "url",
        nargs="?",
        help="URL specifique a soumettre (optionnel)",
    )
    args = parser.parse_args(argv)

    if args.url:
        urls = [args.url]
        print(f"IndexNow: soumission URL specifique -> {args.url}")
    else:
        urls = extract_urls_from_sitemap()
        print(f"IndexNow: {len(urls)} URLs extraites du sitemap")

    if not urls:
        print("Aucune URL a soumettre")
        return 0

    batch_size = 1000
    for i in range(0, len(urls), batch_size):
        batch = urls[i : i + batch_size]
        try:
            result = submit_to_indexnow(batch)
            msg = status_text(result["status"])
            batch_num = i // batch_size + 1
            print(f"Batch {batch_num}: {len(batch)} URLs -> {msg}")
        except Exception as e:
            batch_num = i // batch_size + 1
            print(f"Batch {batch_num} erreur: {e}", file=sys.stderr)
            return 1

    print("IndexNow: terminé")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
