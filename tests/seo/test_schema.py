"""Tests pour les structures de données structurées (BreadcrumbList, Article)."""
import json
from pathlib import Path

from scripts.seo.catalog import load_catalog, load_defaults
from scripts.seo.schema import build_breadcrumb_list, build_article_schema, get_author


ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "seo"


class TestBreadcrumbList:
    """Tests pour la génération de BreadcrumbList."""

    def test_homepage_has_no_breadcrumb(self):
        """L'accueil n'a pas de fil d'Ariane (une seule étape)."""
        schema = build_breadcrumb_list("index.html", "fr")
        assert schema is None, "L'accueil ne doit pas avoir de fil d'Ariane"

    def test_homepage_en_has_no_breadcrumb(self):
        """La page d'accueil anglaise n'a pas de fil d'Ariane."""
        schema = build_breadcrumb_list("en/index.html", "en")
        assert schema is None, "L'accueil EN ne doit pas avoir de fil d'Ariane"

    def test_module_page_breadcrumb(self):
        """Une page module a un fil d'Ariane : Accueil → Modules → FleetOps."""
        schema = build_breadcrumb_list("modules/fleetops.html", "fr")
        assert schema is not None
        assert schema["@type"] == "BreadcrumbList"
        assert len(schema["itemListElement"]) == 3

        # Vérifier l'ordre
        assert schema["itemListElement"][0]["position"] == 1
        assert schema["itemListElement"][0]["name"] == "Accueil"
        assert schema["itemListElement"][0]["item"] == "https://kaalytics.com/"

        assert schema["itemListElement"][1]["position"] == 2
        assert schema["itemListElement"][1]["name"] == "Modules"
        assert schema["itemListElement"][1]["item"] == "https://kaalytics.com/modules"

        assert schema["itemListElement"][2]["position"] == 3
        assert schema["itemListElement"][2]["name"] == "FleetOps"
        assert schema["itemListElement"][2]["item"] == "https://kaalytics.com/modules/fleetops"

    def test_module_page_breadcrumb_en(self):
        """Fil d'Ariane en anglais pour une page module."""
        schema = build_breadcrumb_list("en/modules/fleetops.html", "en")
        assert schema is not None
        assert schema["itemListElement"][1]["name"] == "Modules"
        assert schema["itemListElement"][2]["name"] == "FleetOps"

    def test_blog_index_breadcrumb(self):
        """blog/index.html a un fil d'Ariane : Accueil → Blog."""
        schema = build_breadcrumb_list("blog/index.html", "fr")
        assert schema is not None
        assert len(schema["itemListElement"]) == 2
        assert schema["itemListElement"][1]["name"] == "Blog"
        assert schema["itemListElement"][1]["item"] == "https://kaalytics.com/blog"

    def test_blog_article_breadcrumb(self):
        """Un article de blog a un fil d'Ariane : Accueil → Blog → titre article."""
        schema = build_breadcrumb_list("blog/digitalisation-flotte-btp.html", "fr")
        assert schema is not None
        assert len(schema["itemListElement"]) == 3
        assert schema["itemListElement"][1]["name"] == "Blog"
        assert "Digitalisation flotte BTP" in schema["itemListElement"][2]["name"]

    def test_guides_breadcrumb(self):
        """guides/index.html a un fil d'Ariane : Accueil → Guides."""
        schema = build_breadcrumb_list("guides/index.html", "fr")
        assert schema is not None
        assert len(schema["itemListElement"]) == 2
        assert schema["itemListElement"][1]["name"] == "Guides"

    def test_case_studies_breadcrumb(self):
        """case-studies/index.html a un fil d'Ariane : Accueil → Études de cas."""
        schema = build_breadcrumb_list("case-studies/index.html", "fr")
        assert schema is not None
        assert len(schema["itemListElement"]) == 2
        assert schema["itemListElement"][1]["name"] == "Études de cas"

    def test_breadcrumb_is_valid_json(self):
        """Le JSON-LD généré est valide."""
        schema = build_breadcrumb_list("modules/fleetops.html", "fr")
        json_str = json.dumps(schema)
        parsed = json.loads(json_str)
        assert parsed["@type"] == "BreadcrumbList"


class TestArticleSchema:
    """Tests pour la génération du schéma Article."""

    def test_no_article_on_module_page(self):
        """Une page module n'est pas un Article."""
        schema = build_article_schema("modules/fleetops.html", "fr", None, None)
        assert schema is None

    def test_no_article_on_homepage(self):
        """L'accueil n'est pas un Article."""
        schema = build_article_schema("index.html", "fr", None, None)
        assert schema is None

    def test_article_on_blog_page(self):
        """Un article de blog a un schéma Article."""
        title = "Digitalisation flotte BTP"
        description = "Guide pratique de digitalisation"
        schema = build_article_schema("blog/digitalisation-flotte-btp.html", "fr", title, description)

        assert schema is not None
        assert schema["@type"] == "Article"
        assert schema["headline"] == title
        assert schema["description"] == description
        assert schema["inLanguage"] == "fr"
        assert schema["mainEntityOfPage"]["@id"] == "https://kaalytics.com/blog/digitalisation-flotte-btp"

    def test_article_on_guide_page(self):
        """Un guide a un schéma Article."""
        title = "Checklist Maintenance Préventive"
        description = "Checklist complète de maintenance"
        schema = build_article_schema("guides/checklist-maintenance.html", "fr", title, description)

        assert schema is not None
        assert schema["@type"] == "Article"
        assert schema["headline"] == title

    def test_article_has_author_and_publisher(self):
        """Un Article inclut author et publisher."""
        schema = build_article_schema(
            "blog/roi-gestion-flotte.html", "fr",
            "ROI d'une solution | Blog Kaalytics", "Comment calculer le ROI"
        )
        assert "author" in schema
        assert schema["author"]["@type"] == "Organization"
        assert schema["author"]["name"] == "Kaalytics"
        assert "publisher" in schema
        assert schema["publisher"]["@type"] == "Organization"
        # Vérifier que le suffixe a été retiré du headline
        assert schema["headline"] == "ROI d'une solution"

    def test_article_headline_strips_kaalytics_suffix(self):
        """Le headline retire le suffixe '| Kaalytics' du titre du catalogue."""
        schema = build_article_schema(
            "blog/test.html", "fr",
            "Test Article | Blog Kaalytics", "Description"
        )
        assert schema["headline"] == "Test Article"

    def test_article_no_date_if_not_provided(self):
        """Pas de datePublished si aucune date n'est fournie."""
        schema = build_article_schema(
            "blog/test.html", "fr",
            "Test Article", "Description"
        )
        assert "datePublished" not in schema

    def test_article_is_valid_json(self):
        """Le JSON-LD Article généré est valide."""
        schema = build_article_schema(
            "blog/test.html", "fr",
            "Test Article", "Description"
        )
        json_str = json.dumps(schema)
        parsed = json.loads(json_str)
        assert parsed["@type"] == "Article"

    def test_no_article_on_blog_index(self):
        """La page d'index du blog n'est pas un Article."""
        schema = build_article_schema("blog/index.html", "fr", None, None)
        assert schema is None

    def test_no_article_on_guides_index(self):
        """La page d'index des guides n'est pas un Article."""
        schema = build_article_schema("guides/index.html", "fr", None, None)
        assert schema is None


class TestNonRegression:
    """Tests de non-régression pour l'inventaire des types structurés."""

    def test_listitem_present_in_breadcrumbs(self):
        """Chaque entrée de BreadcrumbList doit avoir @type ListItem."""
        schema = build_breadcrumb_list("modules/fleetops.html", "fr")
        assert schema is not None
        for item in schema["itemListElement"]:
            assert item.get("@type") == "ListItem", f"ListItem manquant dans {item}"

    def test_all_breadcrumbs_have_listitem(self):
        """Tous les BreadcrumbList produits doivent contenir ListItem pour chaque entrée."""
        catalog = load_catalog(DATA)
        for page in catalog:
            breadcrumb = build_breadcrumb_list(page.html_path, page.lang)
            if breadcrumb is None:
                continue
            for item in breadcrumb["itemListElement"]:
                assert "@type" in item and item["@type"] == "ListItem", \
                    f"ListItem manquant dans {page.html_path} entrée {item}"

    def test_extra_org_replaces_default(self):
        """Une Organization supplémentaire remplace celle par défaut, pas s'ajoute."""
        from scripts.seo.head import build_head_block
        import re

        meta = next(p for p in load_catalog(DATA) if p.html_path == "index.html")
        defaults = load_defaults(DATA)

        # Créer une Organization supplémentaire riche
        extra_org = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Kaalytics Riche",
            "hasOfferCatalog": {"@type": "OfferCatalog"}
        }

        block = build_head_block(meta, defaults, extra_schemas=[extra_org])

        # Compter les Organization dans le bloc
        scripts = re.findall(r'<script[^>]*ld\+json[^>]*>(.*?)</script>', block, re.S)
        org_count = 0
        for script in scripts:
            data = json.loads(script)
            if data.get("@type") == "Organization":
                org_count += 1

        assert org_count == 1, f"Expected 1 Organization, got {org_count}"

    def test_no_duplicate_types_at_root_level(self):
        """Aucun type ne doit apparaître plus d'une fois au niveau racine."""
        from scripts.seo.head import build_head_block, _deduplicate_schemas
        from scripts.seo.gen_head import _load_extra_schemas
        import re

        catalog = load_catalog(DATA)
        defaults = load_defaults(DATA)
        extra_schemas_by_page = _load_extra_schemas()

        for page in catalog:
            extra = extra_schemas_by_page.get(page.html_path, {}).get("extra_schemas")
            block = build_head_block(page, defaults, extra_schemas=extra)
            block = _deduplicate_schemas(block + "</head></html>")

            # Compter les types au niveau racine
            scripts = re.findall(r'<script[^>]*ld\+json[^>]*>(.*?)</script>', block, re.S)
            type_counts = {}
            for script in scripts:
                try:
                    data = json.loads(script)
                    t = data.get("@type")
                    if t:
                        type_counts[t] = type_counts.get(t, 0) + 1
                except:
                    pass

            # Vérifier qu'aucun type n'apparaît plus d'une fois
            duplicates = {t: count for t, count in type_counts.items() if count > 1}
            assert not duplicates, \
                f"{page.html_path}: types dupliqués au premier niveau: {duplicates}"


class TestSchemaIntegration:
    """Tests d'intégration avec le catalogue."""

    def test_every_production_page_has_valid_json_ld(self):
        """Chaque page de production ne doit avoir que du JSON-LD valide."""
        catalog = load_catalog(DATA)
        for page in catalog:
            breadcrumb = build_breadcrumb_list(page.html_path, page.lang)
            article = build_article_schema(page.html_path, page.lang, page.title, page.description)

            # Vérifier que les deux sont soit None, soit des dicts valides
            if breadcrumb is not None:
                json_str = json.dumps(breadcrumb)
                json.loads(json_str)  # Lève une exception si invalide

            if article is not None:
                json_str = json.dumps(article)
                json.loads(json_str)  # Lève une exception si invalide

    def test_breadcrumb_position_increments(self):
        """Les positions du fil d'Ariane doivent incrémenter de 1."""
        schema = build_breadcrumb_list("modules/fleetops.html", "fr")
        positions = [item["position"] for item in schema["itemListElement"]]
        assert positions == list(range(1, len(positions) + 1))

    def test_breadcrumb_items_are_absolute_urls(self):
        """Les URLs du fil d'Ariane doivent être absolues."""
        schema = build_breadcrumb_list("modules/fleetops.html", "fr")
        for item in schema["itemListElement"]:
            assert item["item"].startswith("https://kaalytics.com")

    def test_breadcrumb_items_correspond_to_real_files(self):
        """Chaque maillon du fil d'Ariane (sauf accueil) doit correspondre à un fichier réel."""
        # Teste plusieurs pages
        test_cases = [
            "modules/fleetops.html",
            "blog/roi-gestion-flotte.html",
            "industries/btp.html",
            "guides/checklist-maintenance.html",
        ]

        for html_path in test_cases:
            schema = build_breadcrumb_list(html_path, "fr", root=ROOT)
            assert schema is not None, f"{html_path}: attendait un breadcrumb, reçu None"

            for item in schema["itemListElement"]:
                url = item["item"]
                # Extrait le chemin relatif de l'URL
                path_part = url.replace("https://kaalytics.com", "")
                if path_part == "/":
                    continue  # L'accueil existe toujours

                # Cherche le fichier correspondant
                candidates = [
                    ROOT / (path_part.lstrip("/") + ".html"),
                    ROOT / (path_part.lstrip("/") + "/index.html"),
                ]
                file_exists = any(c.exists() for c in candidates)
                assert file_exists, (
                    f"{html_path}: breadcrumb maillon {path_part} ne correspond à aucun fichier. "
                    f"Cherchait : {[str(c.relative_to(ROOT)) for c in candidates]}"
                )

    def test_dernier_maillon_breadcrumb_utilise_titre_catalogue(self):
        """Le dernier maillon du fil d'Ariane doit être le titre du catalogue (sans suffixe ` | Kaalytics`).

        Cela garantit que les accents, sigles et contexte sont corrects.
        """
        catalog = load_catalog(DATA)
        by_path = {p.html_path: p for p in catalog}

        for html_path, page in by_path.items():
            schema = build_breadcrumb_list(html_path, page.lang, root=ROOT, page_title=page.title.split(" | ")[0])
            if schema is None:
                continue  # Pas de breadcrumb pour l'accueil

            dernier = schema["itemListElement"][-1]
            # Le dernier maillon doit être exactement le titre sans suffixe
            titre_attendu = page.title.split(" | ")[0]
            assert dernier["name"] == titre_attendu, (
                f"{html_path} ({page.lang}): dernier maillon du breadcrumb incorrect\n"
                f"  actuel: {dernier['name']}\n"
                f"  attendu: {titre_attendu}"
            )


class TestAuthors:
    """Tests pour les auteurs et leur intégration dans les schémas Article."""

    def test_auteurs_declarees_existent(self):
        """Les auteurs déclarés dans data/authors.json doivent être chargés
        correctement avec tous les champs requis."""
        auteurs_ids = ["yasmine-berrada", "karim-ouazzani", "sofia-lemhaouri", "nadia-cherkaoui"]
        for author_id in auteurs_ids:
            author = get_author(author_id, ROOT)
            assert author is not None, f"Auteur {author_id} non trouvé"
            assert author.get("name"), f"Auteur {author_id} sans nom"
            assert author.get("jobTitle"), f"Auteur {author_id} sans jobTitle"
            assert author.get("description"), f"Auteur {author_id} sans description"

    def test_article_schema_avec_auteur_person(self):
        """Quand un Article est généré avec un auteur, le schéma doit contenir
        un auteur de type Person avec jobTitle et worksFor."""
        schema = build_article_schema(
            "blog/example.html",
            "fr",
            title="Example Article",
            description="Example description",
            author_name="Yasmine Berrada",
            author_job_title="Responsable Intégration ERP"
        )

        assert schema is not None
        assert schema["@type"] == "Article"
        assert schema["author"]["@type"] == "Person"
        assert schema["author"]["name"] == "Yasmine Berrada"
        assert schema["author"]["jobTitle"] == "Responsable Intégration ERP"
        assert schema["author"]["worksFor"]["@type"] == "Organization"
        assert schema["author"]["worksFor"]["name"] == "Kaalytics"

    def test_article_schema_sans_auteur_fallback_organization(self):
        """Quand aucun auteur n'est fourni, le schéma Article doit revenir
        à l'organization par défaut."""
        schema = build_article_schema(
            "blog/example.html",
            "fr",
            title="Example Article",
            description="Example description"
        )

        assert schema is not None
        assert schema["@type"] == "Article"
        assert schema["author"]["@type"] == "Organization"
        assert schema["author"]["name"] == "Kaalytics"
