"""Visuel d'en-tête de chaque page : une image du Studio (étalonnée émeraude) fondue derrière le titre.

Usage : python3 -m scripts.design.visuels [--sources DIR]
- --sources : dossier des images étalonnées (`studio etalonner --marque kaalytics`) ; exportées en WebP 1600 px
  dans assets/images/visuels/. Sans --sources, seules les pages sont mises à jour.
- Le visuel est inséré en premier enfant du premier bloc d'en-tête de la page. Idempotent.
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

from scripts.design.tour import RACINE, pages_du_site

DOSSIER = "assets/images/visuels"
MARQUE = 'class="visuel-page"'
SANS_VISUEL = {"index.html", "404.html", "merci.html", "faq.html", "products/daedalia.html"}

PAR_PREFIXE = {"legal/": None}
PAR_PAGE = {
    "industries/btp.html": "btp-chantier-grue", "industries/mines.html": "mines-maintenance-pneu",
    "industries/transport.html": "transport-quai", "industries/distribution.html": "distribution-entrepot",
    "industries/industrie.html": "industrie-ligne", "industries/location.html": "location-parc-engins",
    "industries/index.html": "transport-autoroute-nuit",
    "modules/sales-intelligence.html": "module-sales-intelligence", "modules/marketing-automation.html": "module-marketing-auto",
    "modules/financial-operations.html": "module-financial-ops", "modules/supply-chain.html": "module-supply-chain",
    "modules/fleetops.html": "module-fleetops", "modules/erp-connect.html": "module-erp-connect",
    "modules/digital-platform.html": "module-digital-platform", "modules/ai-engine.html": "module-ai-engine",
    "modules/index.html": "scene-reseau-agents", "products/index.html": "scene-reseau-agents",
    "products/fleetops.html": "module-fleetops", "integrations.html": "module-erp-connect",
    "case-studies/index.html": "scene-usine-donnees", "case-studies/terrafleet.html": "scenario-btp-flotte",
    "case-studies/locamat.html": "location-parc-engins", "case-studies/transmaroc.html": "scenario-transport-logistique",
    "realisations.html": "scene-usine-donnees", "about.html": "services-reunion-direction",
    "methodologie.html": "scene-diagnostic", "alternatives.html": "scene-diagnostic", "pricing.html": "scene-equipe-commerciale",
    "contact.html": "scene-partage-reseaux", "support.html": "scene-partage-reseaux", "demo.html": "module-digital-platform",
    "portail-client/index.html": "module-digital-platform", "resources/index.html": "scene-reseau-agents",
    "ou-nous-intervenons.html": "zones-globe", "canada.html": "francophonie-globe",
    "guides/index.html": "scene-diagnostic", "guides/checklist-maintenance.html": "mines-maintenance-pneu",
    "guides/comparatif-fleet-management.html": "scene-flotte-nuit", "guides/guide-flotte-btp.html": "btp-chantier-grue",
    "blog/index.html": "scene-reseau-agents",
    "blog/automatiser-relances-clients.html": "module-marketing-auto", "blog/connecteurs-cegid-sage-sap.html": "module-erp-connect",
    "blog/cout-projet-ia-pme.html": "scene-diagnostic", "blog/deployer-ia-entreprise.html": "scene-reseau-agents",
    "blog/digitalisation-flotte-btp.html": "btp-chantier-grue", "blog/erp-maroc-comparatif.html": "module-erp-connect",
    "blog/erreurs-migration-erp.html": "scene-usine-donnees", "blog/facturation-electronique-erp.html": "module-financial-ops",
    "blog/gps-tracking-erreurs.html": "scene-flotte-nuit", "blog/maintenance-predictive-guide.html": "mines-maintenance-pneu",
    "blog/odoo-pme-bon-choix.html": "module-erp-connect", "blog/premier-erp-pme.html": "scene-equipe-commerciale",
    "blog/reduire-couts-flotte-ia.html": "transport-autoroute-nuit", "blog/roi-gestion-flotte.html": "module-fleetops",
    "blog/securite-donnees-ia-entreprise.html": "module-ai-engine", "blog/tableau-de-bord-erp.html": "module-sales-intelligence",
}
_EN_TETE = re.compile(r'<(section|header|div)\b[^>]*class="[^"]*(?:hero|header|page-top)[^"]*"[^>]*>', re.I)
_SECTION = re.compile(r"<section\b[^>]*>", re.I)
_ANCIEN = re.compile(r'\s*<div class="visuel-page"[^>]*>.*?</div>', re.S)


def visuel_de(page: str) -> str | None:
    chemin = page.removeprefix("en/")
    if chemin in SANS_VISUEL or any(chemin.startswith(p) for p in PAR_PREFIXE):
        return None
    return PAR_PAGE.get(chemin)


def bloc(cle: str) -> str:
    return (f'<div class="visuel-page" aria-hidden="true"><img src="/{DOSSIER}/{cle}.webp" alt="" '
            'width="1600" height="900" fetchpriority="high" decoding="async"></div>')


def inserer(html: str, cle: str | None) -> str:
    """Retire l'ancien visuel puis place le nouveau dans le premier en-tête (ou la première section)."""
    corps = html.find("<body")
    if corps < 0:
        return html
    tete, reste = html[:corps], _ANCIEN.sub("", html[corps:])
    if cle is None:
        return tete + reste
    ouverture = _EN_TETE.search(reste) or _SECTION.search(reste)
    if not ouverture:
        return tete + reste
    fin = ouverture.end()
    return tete + reste[:fin] + "\n        " + bloc(cle) + reste[fin:]


def exporter(sources: Path) -> int:
    from PIL import Image

    cible = RACINE / DOSSIER
    cible.mkdir(parents=True, exist_ok=True)
    nombre = 0
    for cle in sorted(set(PAR_PAGE.values())):
        source = sources / f"{cle}-kaalytics.jpg"
        with Image.open(source) as image:
            image = image.convert("RGB")
            image.thumbnail((1600, 1600))
            image.save(cible / f"{cle}.webp", quality=70, method=6)
        nombre += 1
    return nombre


def main() -> None:
    analyse = argparse.ArgumentParser(description=__doc__)
    analyse.add_argument("--sources", type=Path)
    options = analyse.parse_args()
    if options.sources:
        print(f"{exporter(options.sources)} visuels exportés")
    modifiees = 0
    for page in pages_du_site():
        fichier = RACINE / page
        avant = fichier.read_text(encoding="utf-8")
        apres = inserer(avant, visuel_de(page))
        if apres != avant:
            fichier.write_text(apres, encoding="utf-8")
            modifiees += 1
    print(f"{modifiees} pages mises à jour")


if __name__ == "__main__":
    main()
