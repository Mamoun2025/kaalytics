/**
 * KAALYTICS - Navbar Loader
 * ==========================
 * Charge dynamiquement la navbar modulaire
 *
 * Usage dans HTML:
 * <div id="navbar-container"
 *      data-navbar="full|simple"
 *      data-navbar-style="transparent|solid">
 * </div>
 * <script src="{{path}}/components/navbar/navbar-loader.js"></script>
 *
 * Ou plus simplement:
 * <script>
 *   window.NAVBAR_CONFIG = { variant: 'full', style: 'transparent' };
 * </script>
 * <script src="{{path}}/components/navbar/navbar-loader.js"></script>
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURATION
    // ========================================

    const CONFIG = window.NAVBAR_CONFIG || {};
    const DEFAULTS = {
        variant: 'full',      // 'full' | 'simple'
        style: 'transparent', // 'transparent' | 'solid'
        containerId: 'navbar-container'
    };

    // ========================================
    // PATH DETECTION
    // ========================================

    /**
     * Detecte le chemin relatif vers la racine du site
     * en analysant le chemin du script actuel
     */
    function detectRootPath() {
        // Chemin racine ABSOLU, piloté par l'URL (path-based i18n) :
        // pages EN sous /en/ -> liens {{ROOT}} vers /en/ ; sinon racine /.
        const p = window.location.pathname;
        return (p === '/en' || p.startsWith('/en/')) ? '/en/' : '/';
    }

    /**
     * Remplace tous les {{ROOT}} par le chemin detecte
     */
    function replaceRootPlaceholders(html, rootPath) {
        return html.replace(/\{\{ROOT\}\}/g, rootPath);
    }

    // ========================================
    // NAVBAR LOADING
    // ========================================

    /**
     * Charge le template navbar depuis le fichier HTML
     */
    async function loadNavbarTemplate(rootPath) {
        // Template absolu ; variante .en sur les pages /en/
        const _p = window.location.pathname;
        const _en = (_p === '/en' || _p.startsWith('/en/'));
        const templateUrl = _en ? '/components/navbar/navbar.en.html' : '/components/navbar/navbar.html';

        try {
            const response = await fetch(templateUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error('[Navbar] Erreur chargement template:', error);
            return null;
        }
    }

    /**
     * Extrait uniquement le contenu de la balise <nav>
     */
    function extractNavContent(html) {
        const match = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
        if (match) {
            return '<nav' + html.match(/<nav([^>]*)>/i)[1] + '>' + match[1] + '</nav>';
        }
        return html;
    }

    /**
     * Applique la variante (full/simple) en cachant les elements non necessaires
     */
    function applyVariant(container, variant) {
        if (variant === 'simple') {
            // Cacher les dropdowns, afficher seulement les liens simples
            container.querySelectorAll('[data-navbar-full]').forEach(el => {
                el.style.display = 'none';
            });
        }
    }

    /**
     * Applique le style (transparent/solid)
     */
    function applyStyle(navbar, style) {
        navbar.classList.remove('navbar--transparent', 'navbar--solid');
        navbar.classList.add(`navbar--${style}`);
    }

    /**
     * Marque le lien actif selon l'URL actuelle
     */
    function markActiveLink(container) {
        const currentPath = window.location.pathname;
        const links = container.querySelectorAll('.navbar__link, .navbar__dropdown-item');

        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href.replace(/^\.\.\//, '').replace(/\/$/, ''))) {
                link.classList.add('navbar__link--active');
            }
        });
    }

    /**
     * Initialise les interactions (mobile menu, dropdowns, scroll)
     */
    function initInteractions(container) {
        const navbar = container.querySelector('.navbar');
        const mobileToggle = container.querySelector('.navbar__mobile-toggle');
        const mobileMenu = container.querySelector('.navbar__mobile-menu');
        const dropdowns = container.querySelectorAll('.navbar__dropdown');

        // Mobile menu toggle
        if (mobileToggle && mobileMenu) {
            mobileToggle.addEventListener('click', () => {
                const isOpen = mobileMenu.classList.toggle('active');
                mobileToggle.setAttribute('aria-expanded', isOpen);
                document.body.classList.toggle('menu-open', isOpen);
            });

            // Fermer au clic sur un lien
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.remove('active');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    document.body.classList.remove('menu-open');
                });
            });
        }

        // Dropdown hover (desktop)
        dropdowns.forEach(dropdown => {
            const menu = dropdown.querySelector('.navbar__dropdown-menu');
            if (!menu) return;

            dropdown.addEventListener('mouseenter', () => {
                menu.classList.add('active');
            });

            dropdown.addEventListener('mouseleave', () => {
                menu.classList.remove('active');
            });
        });

        // Scroll behavior (navbar solid on scroll)
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.scrollY;

            if (currentScroll > 50) {
                navbar.classList.add('navbar--scrolled');
            } else {
                navbar.classList.remove('navbar--scrolled');
            }

            // Hide/show on scroll direction
            if (currentScroll > lastScroll && currentScroll > 200) {
                navbar.classList.add('navbar--hidden');
            } else {
                navbar.classList.remove('navbar--hidden');
            }

            lastScroll = currentScroll;
        }, { passive: true });
    }

    /**
     * Initialise le language switcher
     * Note: Les event listeners sont gérés par i18n.js setupLangSwitcher()
     * Cette fonction prépare juste les éléments pour l'accessibilité
     */
    function initLangSwitcher(container) {
        // Switcher pilule FR/EN piloté par l'URL (path-based). Pointe vers l'URL équivalente.
        const lang = container.querySelector('.navbar__lang');
        if (!lang) return;
        const p = window.location.pathname;
        const isEN = (p === '/en' || p.startsWith('/en/'));
        const frPath = isEN ? (p.replace(/^\/en/, '') || '/') : p;
        const enPath = isEN ? p : ('/en' + (p === '/' ? '/' : p));
        const fr = lang.querySelector('[data-lang="fr"]');
        const en = lang.querySelector('[data-lang="en"]');
        if (fr) { fr.setAttribute('href', frPath); fr.classList.toggle('navbar__lang-btn--active', !isEN); }
        if (en) { en.setAttribute('href', enPath); en.classList.toggle('navbar__lang-btn--active', isEN); }
    }

    // ========================================
    // MAIN INITIALIZATION
    // ========================================

    async function init() {
        // Detecter la configuration
        const container = document.getElementById(CONFIG.containerId || DEFAULTS.containerId);
        const variant = CONFIG.variant || container?.dataset?.navbar || DEFAULTS.variant;
        const style = CONFIG.style || container?.dataset?.navbarStyle || DEFAULTS.style;

        // Detecter le chemin racine
        const rootPath = detectRootPath();
        console.log('[Navbar] Root path detected:', rootPath || '(root)');

        // Charger le template
        const template = await loadNavbarTemplate(rootPath);
        if (!template) {
            console.error('[Navbar] Impossible de charger le template');
            return;
        }

        // Preparer le HTML
        let navHTML = extractNavContent(template);
        navHTML = replaceRootPlaceholders(navHTML, rootPath);

        // Inserer dans le DOM
        let targetContainer = container;
        if (!targetContainer) {
            // Creer un container au debut du body
            targetContainer = document.createElement('div');
            targetContainer.id = DEFAULTS.containerId;
            document.body.insertBefore(targetContainer, document.body.firstChild);
        }

        targetContainer.innerHTML = navHTML;

        // Appliquer les configurations
        const navbar = targetContainer.querySelector('.navbar');
        if (navbar) {
            applyStyle(navbar, style);
            applyVariant(targetContainer, variant);
            markActiveLink(targetContainer);
            initInteractions(targetContainer);
            initLangSwitcher(targetContainer);
        }

        // Dispatch event pour signaler que la navbar est prete
        window.dispatchEvent(new CustomEvent('navbarLoaded', { detail: { navbar, variant, style } }));

        console.log('[Navbar] Chargee avec succes:', { variant, style });
    }

    // ========================================
    // EXECUTION
    // ========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
