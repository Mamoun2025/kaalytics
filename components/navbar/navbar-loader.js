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
        const templateUrl = _en ? '/components/navbar/navbar.en' : '/components/navbar/navbar';

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
        // Le fragment contient un second <nav> imbrique (la navigation du
        // panneau mobile). Une expression reguliere non gourmande s'arretait
        // a son </nav> et amputait la fin du fragment : le bouton d'appel du
        // panneau mobile n'a jamais ete rendu. On analyse donc le fragment.
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const nav = doc.querySelector('nav.navbar') || doc.querySelector('nav');
        return nav ? nav.outerHTML : html;
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

    // ========================================
    // MENU MOBILE
    // ========================================

    const SELECTEUR_FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    /**
     * Menu mobile : ouverture, fermeture et navigation au clavier.
     *
     * Sur telephone c'est le seul acces a la navigation : le panneau doit
     * pouvoir se fermer autrement qu'en retrouvant le bouton (Echap, clic
     * a cote, choix d'un lien, retour au desktop).
     */
    function initMobileMenu({ navbar, mobileToggle, mobileMenu }) {
        let ouvert = false;

        const libelle = (cle) => mobileToggle.dataset[cle] || 'Menu';

        function ouvrir({ focusPanneau = false } = {}) {
            if (ouvert) return;
            ouvert = true;
            mobileMenu.classList.add('active');
            // `inert` sort le panneau de la tabulation quand il est ferme ;
            // le retirer le rend focusable immediatement.
            mobileMenu.removeAttribute('inert');
            mobileMenu.setAttribute('aria-hidden', 'false');
            mobileToggle.setAttribute('aria-expanded', 'true');
            mobileToggle.setAttribute('aria-label', libelle('labelFermer'));
            document.body.classList.add('menu-open');
            // La barre porte le bouton de fermeture : elle ne doit pas
            // se derober si un defilement residuel survient.
            if (navbar) navbar.classList.add('navbar--menu-ouvert');

            if (focusPanneau) donnerLeFocusAuPanneau();
        }

        /**
         * Amene le focus sur la premiere destination du panneau.
         *
         * Possible des le retrait de `inert` : l'attribut prend effet
         * immediatement, sans attendre de recalcul de style.
         */
        function donnerLeFocusAuPanneau() {
            const premier = mobileMenu.querySelector(SELECTEUR_FOCUSABLE);
            if (premier) premier.focus();
        }

        function fermer({ rendreLeFocus = false } = {}) {
            if (!ouvert) return;
            ouvert = false;
            mobileMenu.classList.remove('active');
            mobileMenu.setAttribute('inert', '');
            mobileMenu.setAttribute('aria-hidden', 'true');
            mobileToggle.setAttribute('aria-expanded', 'false');
            mobileToggle.setAttribute('aria-label', libelle('labelOuvrir'));
            document.body.classList.remove('menu-open');
            if (navbar) navbar.classList.remove('navbar--menu-ouvert');

            // Au clavier, laisser le focus sur un element devenu invisible
            // renverrait l'utilisateur au debut de la page.
            if (rendreLeFocus) mobileToggle.focus();
        }

        mobileToggle.addEventListener('click', (e) => {
            if (ouvert) {
                fermer();
                return;
            }
            // Une activation au clavier (Entree ou Espace) arrive avec
            // detail = 0. Elle seule justifie de deplacer le focus : au
            // doigt ou a la souris, le focus doit rester ou il est.
            ouvrir({ focusPanneau: e.detail === 0 });
        });

        // Choisir une destination ferme le panneau.
        mobileMenu.querySelectorAll('a').forEach((lien) => {
            lien.addEventListener('click', () => fermer());
        });

        // Clic sur le fond du panneau (hors contenu) : fermeture.
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) fermer();
        });

        // Clic ailleurs dans la page, barre comprise.
        document.addEventListener('click', (e) => {
            if (!ouvert) return;
            if (mobileMenu.contains(e.target) || mobileToggle.contains(e.target)) return;
            fermer();
        });

        document.addEventListener('keydown', (e) => {
            if (!ouvert) return;
            if (e.key === 'Escape') {
                fermer({ rendreLeFocus: true });
                return;
            }
            if (e.key === 'Tab') piegerLeFocus(e, mobileMenu, mobileToggle);
        });

        // Retour au desktop avec le panneau ouvert : il resterait affiche
        // par-dessus une navigation redevenue visible.
        window.addEventListener('resize', () => {
            if (ouvert && window.innerWidth > 1024) fermer();
        });
    }

    /**
     * Maintient la tabulation dans le panneau tant qu'il est ouvert :
     * sans cela le focus part derriere l'overlay, dans une page masquee.
     */
    function piegerLeFocus(e, mobileMenu, mobileToggle) {
        const cibles = [
            mobileToggle,
            ...mobileMenu.querySelectorAll(SELECTEUR_FOCUSABLE),
        ].filter((el) => el.offsetParent !== null || el === mobileToggle);

        if (cibles.length === 0) return;

        const premier = cibles[0];
        const dernier = cibles[cibles.length - 1];
        const actif = document.activeElement;

        if (e.shiftKey && actif === premier) {
            e.preventDefault();
            dernier.focus();
        } else if (!e.shiftKey && actif === dernier) {
            e.preventDefault();
            premier.focus();
        }
    }

    /**
     * Initialise les interactions (mobile menu, dropdowns, scroll)
     */
    function initInteractions(container) {
        const navbar = container.querySelector('.navbar');
        const mobileToggle = container.querySelector('.navbar__mobile-toggle');
        const mobileMenu = container.querySelector('.navbar__mobile-menu');
        const dropdowns = container.querySelectorAll('.navbar__dropdown');

        // Mobile menu
        if (mobileToggle && mobileMenu) {
            initMobileMenu({ navbar, mobileToggle, mobileMenu });
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
