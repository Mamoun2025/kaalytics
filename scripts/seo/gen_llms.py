"""Genere llms.txt depuis le catalogue. Aucune URL inventee.

Usage :
    python3 -m scripts.seo.gen_llms
"""
from __future__ import annotations

from pathlib import Path

from scripts.seo.catalog import BASE_URL, PageMeta, load_catalog, url_path_for

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "seo"

# Presentation standardisee, correctement accentuee (marque commerciale importante)
DESCRIPTION = (
    "Kaalytics est une société marocaine qui connecte des modules "
    "d'analyse et d'automatisation aux ERP déjà en place dans l'entreprise — "
    "Cegid, Sage, SAP, Dynamics, Odoo — sans modifier le système existant. "
    "Pour une entreprise sans ERP, Kaalytics déploie Odoo. "
    "Basée à Casablanca, Maroc."
)


def _is_indexable(page: PageMeta) -> bool:
    return "noindex" not in page.robots


def _group_by_family(pages: list[PageMeta]) -> dict[str, list[PageMeta]]:
    """Groupe les pages par famille basee sur le chemin HTML."""
    groups: dict[str, list[PageMeta]] = {
        "modules": [],
        "industries": [],
        "blog": [],
        "guides": [],
        "resources": [],
        "company": [],
        "en": [],
    }

    for page in pages:
        if not _is_indexable(page):
            continue

        if page.lang == "en":
            groups["en"].append(page)
        elif page.html_path.startswith("modules/"):
            groups["modules"].append(page)
        elif page.html_path.startswith("industries/"):
            groups["industries"].append(page)
        elif page.html_path.startswith("blog/"):
            groups["blog"].append(page)
        elif page.html_path.startswith("guides/"):
            groups["guides"].append(page)
        elif page.html_path in ("pricing.html", "faq.html", "contact.html"):
            groups["resources"].append(page)
        else:
            groups["company"].append(page)

    return groups


def _sort_within_family(pages: list[PageMeta]) -> list[PageMeta]:
    """Trie les pages : pages racine d'abord, puis alphabetiquement."""
    index_pages = [p for p in pages if p.html_path.endswith("/index.html")]
    other_pages = [p for p in pages if not p.html_path.endswith("/index.html")]
    return sorted(index_pages, key=lambda p: p.url_path) + sorted(
        other_pages, key=lambda p: p.url_path
    )


def build_llms(pages: list[PageMeta]) -> str:
    groups = _group_by_family(pages)
    lines = ["# Kaalytics", "", f"> {DESCRIPTION}", ""]

    # Modules
    if groups["modules"]:
        lines.append("## Modules")
        lines.append("")
        for page in _sort_within_family(groups["modules"]):
            if page.lang == "fr":
                url = BASE_URL + page.url_path
                lines.append(f"- [{page.title.replace(' — ', ' — ')}]({url}) : {page.description}")
        lines.append("")

    # Industries
    if groups["industries"]:
        lines.append("## Secteurs")
        lines.append("")
        for page in _sort_within_family(groups["industries"]):
            if page.lang == "fr":
                url = BASE_URL + page.url_path
                lines.append(f"- [{page.title.replace(' | ', ' | ')}]({url}) : {page.description}")
        lines.append("")

    # Blog
    if groups["blog"]:
        lines.append("## Articles")
        lines.append("")
        for page in _sort_within_family(groups["blog"]):
            if page.lang == "fr":
                url = BASE_URL + page.url_path
                lines.append(f"- [{page.title.replace(' | ', ' | ')}]({url}) : {page.description}")
        lines.append("")

    # Guides
    if groups["guides"]:
        lines.append("## Guides")
        lines.append("")
        for page in _sort_within_family(groups["guides"]):
            if page.lang == "fr":
                url = BASE_URL + page.url_path
                lines.append(f"- [{page.title.replace(' | ', ' | ')}]({url}) : {page.description}")
        lines.append("")

    # Ressources et contact
    if groups["resources"]:
        lines.append("## Ressources")
        lines.append("")
        for page in _sort_within_family(groups["resources"]):
            if page.lang == "fr":
                url = BASE_URL + page.url_path
                lines.append(f"- [{page.title.replace(' | ', ' | ')}]({url}) : {page.description}")
        lines.append("")

    # Entreprise (About, Contact, etc.)
    company_pages = [p for p in _sort_within_family(groups["company"]) if p.lang == "fr"]
    if company_pages:
        lines.append("## Entreprise")
        lines.append("")
        for page in company_pages:
            url = BASE_URL + page.url_path
            lines.append(f"- [{page.title.replace(' | ', ' | ')}]({url}) : {page.description}")
        lines.append("")

    # Version anglaise
    if groups["en"]:
        lines.append("## Version anglaise")
        lines.append("")
        lines.append(f"- [English version]({BASE_URL}/en) : Full English version of Kaalytics")
        lines.append("")

    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    xml = build_llms(load_catalog(DATA))
    (ROOT / "llms.txt").write_text(xml, encoding="utf-8")
    lines = xml.count("\n")
    urls = xml.count("](https://kaalytics.com")
    print(f"llms.txt genere ({urls} URLs, {lines} lignes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
