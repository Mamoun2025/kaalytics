"""Regles de verification SEO. A appeler depuis check_seo.py."""
from __future__ import annotations

import re
from pathlib import Path

from scripts.seo.catalog import BASE_URL

# Français sans accents détectables (omis dans les titres/descriptions)
FR_DESACCENTUE = re.compile(
    r"\b(predictive|couts|rentabilite|reel|donnees|integre|automatise|ciblees|"
    r"previsions?|referencement|genere|deployes|detection|numerique|systeme|"
    r"societe|deja|prevision|reliees?|connectees?|alimentees?|operations|"
    r"clientele|maitrise|securite|fiabilite|qualite|activite)\b"
)

# Marqueurs de français sur pages anglaises
FRENCH_MARKERS = re.compile(
    r"\b(vos|votre|nos|notre|des|une|pour|avec|sans|plus|tous|toutes|"
    r"chaque|leur|dans|entre|selon|ainsi|donc|aussi|les|est|sont|nous|vous|"
    r"qui|que|plusieurs|cette|ces|afin|lors|depuis|jusqu)\b", re.I)

ETIQUETTES_FR = re.compile(
    r"(?<![\w-])(IA|Lire|Voir|Accueil|Retour|Suivant|Precedent|Précédent|"
    r"Decouvrir|Découvrir|Nos|Le|La|Du|Au|Aux|Ou|Tarifs|Ressources|"
    r"Contactez|Demander|Telecharger|Télécharger)(?![\w-])")

HORS_INDEX = {"404.html", "merci.html"}


def _visible_text(html: str) -> str:
    """Extrait le texte visible d'une page HTML."""
    body = html.split("<body", 1)[-1]
    body = re.sub(r"<(script|style|svg)[\s\S]*?</\1>", " ", body, flags=re.I)
    return re.sub(r"<[^>]+>", " ", body)


class RuleError:
    """Erreur de règle avec page, rule et détail."""
    def __init__(self, page: str, rule: str, detail: str = ""):
        self.page = page
        self.rule = rule
        self.detail = detail


def check_tag_uniqueness(rel: str, html: str) -> list[RuleError]:
    """Verifie l'unicité de title, canonical, bloc-SEO."""
    errors = []
    tete = html.split("</head>")[0]
    indexable = rel not in HORS_INDEX

    if not indexable:
        return errors

    for balise, motif in (
        ("title", r"<title[^>]*>"),
        ("canonical", r'rel=["\']canonical["\']'),
        ("bloc-SEO", r"<!-- SEO:BEGIN"),
    ):
        n = len(re.findall(motif, tete, re.I))
        if n != 1:
            errors.append(RuleError(rel, f"{balise}-en-{n}-exemplaires", ""))
    return errors


def check_lang_attribute(rel: str, html: str) -> list[RuleError]:
    """Verifie lang="en" sur /en/ et lang="fr" sur /fr/."""
    errors = []
    indexable = rel not in HORS_INDEX
    lang = (re.findall(r'<html[^>]*lang=["\']([^"\']+)', html, re.I) or [""])[0]

    if rel.startswith("en/"):
        if lang != "en":
            errors.append(RuleError(rel, "page-EN-sans-lang-en", f"lang={lang!r}"))
    else:
        if indexable and lang != "fr":
            errors.append(RuleError(rel, "page-FR-sans-lang-fr", f"lang={lang!r}"))
    return errors


def check_hreflang_defaults(rel: str, html: str, root: Path) -> list[RuleError]:
    """Verifie hreflang sans x-default et x-default != FR."""
    errors = []
    tete = html.split("</head>")[0]
    hl = dict(
        (l, u)
        for l, u in re.findall(
            r'hreflang=["\']([^"\']+)["\'][^>]*href=["\']([^"\']+)', tete, re.I
        )
    )

    if not hl:
        return errors

    if "x-default" not in hl:
        errors.append(RuleError(rel, "hreflang-sans-x-default", ""))
    elif hl.get("x-default") != hl.get("fr"):
        errors.append(RuleError(rel, "x-default-ne-pointe-pas-sur-le-FR", ""))

    return errors


def check_hreflang_targets_exist(rel: str, html: str, root: Path) -> list[RuleError]:
    """Verifie que les cibles hreflang existent."""
    errors = []
    tete = html.split("</head>")[0]
    hl = dict(
        (l, u)
        for l, u in re.findall(
            r'hreflang=["\']([^"\']+)["\'][^>]*href=["\']([^"\']+)', tete, re.I
        )
    )

    for lang, u in hl.items():
        cible = u.replace(BASE_URL, "").lstrip("/")
        candidats = [cible + ".html", cible + "/index.html", cible]
        if cible == "":
            candidats = ["index.html"]
        if not any((root / c).exists() for c in candidats):
            errors.append(RuleError(rel, "hreflang-vers-page-inexistante", u))

    return errors


def check_page_in_catalog(rel: str, by_path: dict) -> list[RuleError]:
    """Verifie qu'une page HTML est au catalogue."""
    errors = []
    indexable = rel not in HORS_INDEX

    if indexable and rel not in by_path:
        errors.append(RuleError(rel, "page-hors-catalogue", ""))
    return errors


def check_catalog_entries_exist(
    catalog_entries: dict, root: Path
) -> list[RuleError]:
    """Verifie que les entrees du catalogue pointent vers des fichiers existants."""
    errors = []
    for page, e in catalog_entries.items():
        if not (root / page).exists():
            errors.append(RuleError("data/seo", "entree-catalogue-sans-fichier", page))
        for langue in ("fr", "en"):
            bloc = e.get(langue)
            if not bloc:
                continue
            chemin = bloc.get("path", page)
            if langue == "en" and not (root / chemin).exists():
                errors.append(
                    RuleError("data/seo", "entree-catalogue-sans-fichier", chemin)
                )
    return errors


def check_french_unaccented(
    page_path: str, title: str, description: str
) -> list[RuleError]:
    """Verifie les mots francais sans accents dans titre/description."""
    errors = []
    for mot in set(FR_DESACCENTUE.findall(title + " " + description)):
        errors.append(RuleError(page_path, "francais-desaccentue", mot))
    return errors


def check_sitemap_url_format(url: str) -> list[RuleError]:
    """Verifie que l'URL du sitemap ne contient pas .html."""
    errors = []
    if url.endswith(".html"):
        errors.append(RuleError("sitemap.xml", "sitemap-url-en-.html", url))
    return errors


def check_french_on_english_page(rel: str, html: str) -> list[RuleError]:
    """Verifie l'absence de francais sur les pages /en/."""
    errors = []
    if not rel.startswith("en/"):
        return errors

    texte = _visible_text(html)
    etiq = sorted(set(ETIQUETTES_FR.findall(texte)))
    if etiq:
        errors.append(RuleError(rel, "etiquette-francaise-sur-page-EN", ", ".join(etiq[:5])))

    trouves = sorted(set(m.lower() for m in FRENCH_MARKERS.findall(texte)))
    if trouves:
        errors.append(RuleError(rel, "francais-sur-page-en", ", ".join(trouves[:5])))

    return errors
