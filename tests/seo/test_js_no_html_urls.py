"""
Test: Aucun fichier JavaScript de production ne référence d'URL interne en .html

Vérifie que les URLs chargées via fetch ou définies dans les loaders/modules
ne contiennent pas d'extensions .html, pour éviter les redirections 308
avec Vercel et cleanUrls: true.

Exceptions: Les comparaisons de chemin dans blog-schema.js et breadcrumbs.js
sont explicitement autorisées car elles testent des conditions, pas chargent des URLs.
"""

import re
from pathlib import Path
import pytest


# Chemins à scanner
PRODUCTION_JS_DIRS = [
    "assets/js",
    "components",
    "sections",
    "sw.js"
]

# Exceptions: chemins qui contiennent ces motifs sont ignorés
IGNORED_PATHS = [
    "TRASH",
    "PROPOSALS",
    "proposals",
    "node_modules",
    "__pycache__",
    ".git"
]

# Exceptions de fichiers avec motifs explicitement autorisés
EXPLICIT_EXCEPTIONS = {
    # blog-schema.js compare pathnames - OK car c'est une comparaison, pas une URL de chargement
    "assets/js/components/blog-schema.js": [
        r"pathname\.endsWith\('/blog/index\.html'\)"
    ],
    # breadcrumbs.js avait des clés de configuration - MIS À JOUR mais gardons pour audit
    # (les clés ont été changées de 'fleetops.html' → 'fleetops', etc.)
}


def get_production_js_files():
    """Récupère tous les fichiers .js de production (hors exclusions)."""
    root = Path(__file__).parent.parent.parent
    js_files = []

    for pattern_dir in PRODUCTION_JS_DIRS:
        path = root / pattern_dir
        if path.exists():
            if path.is_file():
                js_files.append(path)
            else:
                for js_file in path.rglob("*.js"):
                    # Ignorer les fichiers dans les répertoires exclus
                    if not any(ignored in js_file.parts for ignored in IGNORED_PATHS):
                        js_files.append(js_file)

    return sorted(js_files)


def contains_html_url_reference(content: str, filepath: str) -> list:
    """
    Trouve les références à des URLs en .html qui semblent être chargées.

    Retourne une liste de tuples (ligne, motif) des violations trouvées.
    """
    violations = []

    # Motifs de chargement d'URL:
    # - fetch(...'.html'...)
    # - const templateUrl = ... + '...html'
    # - link: '...html'
    # - url: '...html'
    # - href: '...html'  (mais pas dans les sélecteurs CSS)
    patterns = [
        # fetch avec .html
        (r"fetch\s*\(\s*['\"]([^'\"]*\.html)['\"]", "fetch avec .html"),
        # templateUrl = ... avec .html
        (r"const\s+templateUrl\s*=.*['\"]([^'\"]*\.html)['\"]", "templateUrl avec .html"),
        # link: '...html' (clés de configuration)
        (r"link\s*:\s*['\"]([^'\"]*\.html)['\"]", "link config avec .html"),
        # Assigner une URL à une variable avec .html
        (r"(?:const|let|var)\s+\w+\s*=\s*['\"](?:https?://|/)?[^'\"]*\.html['\"]", "variable avec .html"),
        # URL dans des objets de configuration (patterns comme url: '/foo.html')
        (r"(?:url|href|path|templateUrl)\s*:\s*['\"]([^'\"]*\.html)['\"]", "config URL avec .html"),
    ]

    for line_num, line in enumerate(content.split('\n'), 1):
        # Ignorer les commentaires
        if line.strip().startswith('//'):
            continue

        # Vérifier les exceptions explicites pour ce fichier
        if filepath in EXPLICIT_EXCEPTIONS:
            is_exception = False
            for exception_pattern in EXPLICIT_EXCEPTIONS[filepath]:
                if re.search(exception_pattern, line):
                    is_exception = True
                    break
            if is_exception:
                continue

        # Chercher les violations
        for pattern, pattern_type in patterns:
            if re.search(pattern, line):
                violations.append((line_num, line.strip(), pattern_type))
                break

    return violations


@pytest.fixture(scope="session")
def js_files():
    """Fixture: liste des fichiers JS à vérifier."""
    return get_production_js_files()


def test_no_internal_html_urls_in_js(js_files):
    """
    Vérifie qu'aucun fichier JS ne charge d'URLs en .html.

    Les URLs doivent être canonisées (sans .html) car Vercel avec cleanUrls: true
    sert les fichiers HTML sans extension.
    """
    violations_by_file = {}

    for js_file in js_files:
        try:
            content = js_file.read_text(encoding='utf-8')
        except Exception as e:
            pytest.skip(f"Impossible de lire {js_file}: {e}")
            continue

        violations = contains_html_url_reference(content, str(js_file))

        if violations:
            violations_by_file[js_file] = violations

    # Construire le message d'erreur
    if violations_by_file:
        error_lines = [
            "\n[ERREUR] URLs en .html trouvées en JavaScript - vont causer des redirections 308:\n"
        ]

        for filepath, violations in sorted(violations_by_file.items()):
            relative_path = filepath.relative_to(Path(__file__).parent.parent.parent)
            error_lines.append(f"\n  {relative_path}:")

            for line_num, line_content, pattern_type in violations:
                error_lines.append(
                    f"    Ligne {line_num} [{pattern_type}]: {line_content[:80]}"
                )

        error_lines.append("\n[SOLUTION] Supprimer l'extension .html des URLs (ex: '/path/file' au lieu de '/path/file.html')")

        pytest.fail("".join(error_lines))


def test_js_files_exist(js_files):
    """Vérifie qu'on trouve bien des fichiers JS à tester."""
    assert len(js_files) > 0, "Aucun fichier JS trouvé pour la vérification"


def test_critical_template_loaders_are_clean(js_files):
    """
    Vérifie spécifiquement que les loaders critiques (utilisés par 83 pages)
    ne contiennent pas d'URLs en .html.
    """
    critical_files = {
        "components/navbar/navbar-loader.js",
        "components/footer/footer-loader.js"
    }

    root = Path(__file__).parent.parent.parent

    for critical in critical_files:
        filepath = root / critical
        assert filepath.exists(), f"Fichier critique manquant: {critical}"

        content = filepath.read_text(encoding='utf-8')
        violations = contains_html_url_reference(content, str(filepath))

        assert not violations, (
            f"Le fichier critique {critical} contient des URLs en .html qui causent "
            f"des redirections (utilisé par 83 pages):\n"
            + "\n".join(f"  Ligne {ln}: {line}" for ln, line, _ in violations)
        )


def test_service_worker_precache_consistency():
    """
    Vérifie que le service worker est cohérent:
    - Aucune entrée de PRECACHE_ASSETS ne finit en .html
    - OFFLINE_URL est présent dans PRECACHE_ASSETS
    - OFFLINE_URL et PRECACHE_ASSETS sont synchronisés
    """
    root = Path(__file__).parent.parent.parent
    sw_file = root / "sw.js"
    assert sw_file.exists(), "Service worker manquant: sw.js"

    content = sw_file.read_text(encoding='utf-8')

    # Extraire OFFLINE_URL
    offline_match = re.search(r"const\s+OFFLINE_URL\s*=\s*['\"]([^'\"]+)['\"]", content)
    assert offline_match, "OFFLINE_URL non trouvé dans sw.js"
    offline_url = offline_match.group(1)

    # Vérifier qu'OFFLINE_URL ne finit pas en .html
    assert not offline_url.endswith('.html'), (
        f"OFFLINE_URL finit en .html ({offline_url}) - causera une redirection 308. "
        f"Utiliser la version canonique sans extension."
    )

    # Extraire PRECACHE_ASSETS
    precache_match = re.search(
        r"const\s+PRECACHE_ASSETS\s*=\s*\[(.*?)\]",
        content,
        re.DOTALL
    )
    assert precache_match, "PRECACHE_ASSETS non trouvé dans sw.js"
    precache_block = precache_match.group(1)

    # Parser les URLs de PRECACHE_ASSETS
    precache_urls = re.findall(r"['\"]([^'\"]+)['\"]", precache_block)
    assert len(precache_urls) > 0, "Aucune URL trouvée dans PRECACHE_ASSETS"

    # Vérifier qu'aucune URL ne finit en .html
    for url in precache_urls:
        assert not url.endswith('.html'), (
            f"PRECACHE_ASSETS contient une URL en .html: {url}. "
            f"Vercel redirige 308 sur .html, et cache.addAll() rejette les réponses redirigées. "
            f"Utiliser la version canonique sans extension."
        )

    # Vérifier qu'OFFLINE_URL est dans PRECACHE_ASSETS
    assert offline_url in precache_urls, (
        f"OFFLINE_URL ({offline_url}) n'est pas dans PRECACHE_ASSETS. "
        f"Sans quoi caches.match(OFFLINE_URL) échoue et le repli hors ligne ne marche pas. "
        f"Ajouter '{offline_url}' à PRECACHE_ASSETS."
    )
