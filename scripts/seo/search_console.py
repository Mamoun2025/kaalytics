"""Search Console - soumission du sitemap et releve de l'indexation.

Google n'utilise pas IndexNow : la decouverte passe par le sitemap declare
ici, et l'API d'inspection dit, page par page, ce que Google en a fait.

L'authentification se fait par un compte de service autorise dans la
Search Console. Sa cle vit hors du depot ; le chemin peut etre change par
la variable d'environnement KAALYTICS_SA_KEY.

Usage:
    python3 -m scripts.seo.search_console                 # etat d'indexation
    python3 -m scripts.seo.search_console --sitemap       # (re)soumet le sitemap
    python3 -m scripts.seo.search_console --url <url>     # inspecte une URL
    python3 -m scripts.seo.search_console --json out.json # releve complet
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build

ROOT = Path(__file__).resolve().parents[2]
SITEMAP_PATH = ROOT / "sitemap.xml"

SITE = "sc-domain:kaalytics.com"
SITEMAP_URL = "https://kaalytics.com/sitemap.xml"
CLE_PAR_DEFAUT = Path.home() / ".config" / "kaalytics" / "seo-sa.json"
PORTEE = ["https://www.googleapis.com/auth/webmasters"]

# L'API d'inspection est limitee a 2000 requetes par jour et 600 par minute.
# Le site en compte moins d'une centaine : aucun risque, mais on le rappelle
# ici pour le jour ou il en comptera mille.
PLAFOND_QUOTIDIEN = 2000


def chemin_cle() -> Path:
    return Path(os.environ.get("KAALYTICS_SA_KEY", CLE_PAR_DEFAUT))


def service():
    """Ouvre la connexion a l'API avec le compte de service."""
    cle = chemin_cle()
    if not cle.exists():
        print(f"Cle du compte de service introuvable : {cle}", file=sys.stderr)
        print("Definir KAALYTICS_SA_KEY si elle est ailleurs.", file=sys.stderr)
        sys.exit(1)
    creds = service_account.Credentials.from_service_account_file(
        str(cle), scopes=PORTEE)
    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)


def urls_du_sitemap() -> list[str]:
    if not SITEMAP_PATH.exists():
        print(f"Sitemap introuvable : {SITEMAP_PATH}", file=sys.stderr)
        return []
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    racine = ET.parse(SITEMAP_PATH).getroot()
    return [loc.text for loc in racine.findall(".//s:loc", ns) if loc.text]


def soumettre_sitemap(sc) -> None:
    sc.sitemaps().submit(siteUrl=SITE, feedpath=SITEMAP_URL).execute()
    print(f"Sitemap soumis : {SITEMAP_URL}")
    for s in sc.sitemaps().list(siteUrl=SITE).execute().get("sitemap", []):
        print(f"  telecharge le : {s.get('lastDownloaded', 'jamais')}")
        print(f"  erreurs={s.get('errors', 0)} avertissements={s.get('warnings', 0)}")
        for c in s.get("contents", []):
            print(f"  URLs declarees={c.get('submitted')} indexees={c.get('indexed', '-')}")


def inspecter(sc, url: str) -> dict:
    """Interroge Google sur une URL. Renvoie un resume, jamais une exception."""
    corps = {"inspectionUrl": url, "siteUrl": SITE, "languageCode": "fr"}
    try:
        r = sc.urlInspection().index().inspect(body=corps).execute()
    except Exception as e:  # quota, URL hors propriete, panne passagere
        return {"url": url, "etat": "ERREUR", "detail": str(e)[:120]}

    res = r.get("inspectionResult", {})
    idx = res.get("indexStatusResult", {})
    return {
        "url": url,
        "etat": idx.get("coverageState", "inconnu"),
        "verdict": res.get("verdict", "-"),
        "robots": idx.get("robotsTxtState", "-"),
        "indexation": idx.get("indexingState", "-"),
        "canonique_google": idx.get("googleCanonical", "-"),
        "canonique_declaree": idx.get("userCanonical", "-"),
        "dernier_passage": idx.get("lastCrawlTime", "jamais"),
    }


def releve(sc, urls: list[str]) -> list[dict]:
    if len(urls) > PLAFOND_QUOTIDIEN:
        print(f"{len(urls)} URLs pour un plafond de {PLAFOND_QUOTIDIEN}/jour : "
              f"seules les {PLAFOND_QUOTIDIEN} premieres seront interrogees.",
              file=sys.stderr)
        urls = urls[:PLAFOND_QUOTIDIEN]

    resultats = []
    for i, url in enumerate(urls, 1):
        r = inspecter(sc, url)
        resultats.append(r)
        print(f"  [{i:3}/{len(urls)}] {r['etat'][:38]:38} {url.replace('https://kaalytics.com', '')}")
    return resultats


def resumer(resultats: list[dict]) -> None:
    compte = Counter(r["etat"] for r in resultats)
    print(f"\n{'=' * 70}")
    for etat, n in compte.most_common():
        print(f"  {n:4}  {etat}")

    absentes = [r for r in resultats
                if "not" in r["etat"].lower() or r["etat"] == "inconnu"]
    if absentes:
        print(f"\n{len(absentes)} URL(s) que Google n'a pas indexees :")
        for r in absentes[:25]:
            print(f"   - {r['url'].replace('https://kaalytics.com', '')}  ({r['etat']})")
        if len(absentes) > 25:
            print(f"   … et {len(absentes) - 25} autres")

    canoniques = [r for r in resultats
                  if r.get("canonique_google", "-") not in ("-", r["url"])
                  and r.get("canonique_google")]
    if canoniques:
        print(f"\n{len(canoniques)} URL(s) dont Google retient une autre canonique :")
        for r in canoniques[:10]:
            print(f"   - {r['url'].replace('https://kaalytics.com', '')}")
            print(f"     -> {r['canonique_google']}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--sitemap", action="store_true", help="(re)soumettre le sitemap")
    ap.add_argument("--url", help="inspecter une seule URL")
    ap.add_argument("--json", help="ecrire le releve complet dans un fichier")
    args = ap.parse_args()

    sc = service()

    if args.sitemap:
        soumettre_sitemap(sc)
        return 0

    if args.url:
        print(json.dumps(inspecter(sc, args.url), indent=2, ensure_ascii=False))
        return 0

    urls = urls_du_sitemap()
    if not urls:
        return 1
    print(f"Etat d'indexation de {len(urls)} URLs\n")
    resultats = releve(sc, urls)
    resumer(resultats)

    if args.json:
        Path(args.json).write_text(
            json.dumps(resultats, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\nReleve complet : {args.json}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
