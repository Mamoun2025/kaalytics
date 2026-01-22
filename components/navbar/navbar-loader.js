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
        // Methode 1: Chercher le script navbar-loader.js
        const scripts = document.querySelectorAll('script[src*="navbar-loader"]');
        if (scripts.length > 0) {
            const src = scripts[0].getAttribute('src');
            // Ex: "../components/navbar/navbar-loader.js" -> "../"
            // Ex: "components/navbar/navbar-loader.js" -> ""
            const match = src.match(/^(\.\.\/)*(?:\.\/)?/);
            if (match) {
                const depth = (src.match(/\.\.\//g) || []).length;
                return '../'.repeat(depth);
            }
        }

        // Methode 2: Analyser l'URL de la page
        const path = window.location.pathname;
        const segments = path.split('/').filter(s => s && !s.includes('.'));

        // Ignorer le segment racine du projet si present
        const projectRoot = ['kaalytics'];
        const relevantSegments = segments.filter(s => !projectRoot.includes(s));

        if (relevantSegments.length === 0) {
            return '';
        }

        return '../'.repeat(relevantSegments.length);
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
        const templateUrl = rootPath + 'components/navbar/navbar.html';

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
                const isOpen = mobileMenu.classList.toggle('is-open');
                mobileToggle.setAttribute('aria-expanded', isOpen);
                document.body.classList.toggle('menu-open', isOpen);
            });

            // Fermer au clic sur un lien
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.remove('is-open');
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
                menu.classList.add('is-open');
            });

            dropdown.addEventListener('mouseleave', () => {
                menu.classList.remove('is-open');
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
     */
    function initLangSwitcher(container) {
        const switcher = container.querySelector('.lang-switcher');
        if (!switcher) return;

        const options = switcher.querySelectorAll('.lang-switcher__option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                const lang = option.dataset.lang;

                // Update active state
                options.forEach(o => o.classList.remove('lang-switcher__option--active'));
                option.classList.add('lang-switcher__option--active');

                // Dispatch event for i18n system
                window.dispatchEvent(new CustomEvent('languageChange', { detail: { lang } }));

                // Call i18n if available
                if (window.i18n && typeof window.i18n.setLanguage === 'function') {
                    window.i18n.setLanguage(lang);
                }
            });
        });
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
