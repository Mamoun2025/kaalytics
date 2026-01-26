/**
 * Breadcrumbs Component
 * Auto-genere les breadcrumbs avec schema.org BreadcrumbList
 */

(function() {
    'use strict';

    // Configuration des pages
    const PAGE_CONFIG = {
        // Pages produits
        'fleetops.html': {
            parent: { name: 'Produits', url: '/products/' },
            current: 'FleetOps Pro'
        },
        'daedalia.html': {
            parent: { name: 'Produits', url: '/products/' },
            current: 'Daedalia'
        },
        'ascend.html': {
            parent: { name: 'Produits', url: '/products/' },
            current: 'Ascend'
        },
        // Pages industries (secteurs)
        'industrie.html': {
            parent: { name: 'Industries', url: '/industries/' },
            current: 'Industrie'
        },
        'btp.html': {
            parent: { name: 'Industries', url: '/industries/' },
            current: 'BTP & Construction'
        },
        'transport.html': {
            parent: { name: 'Industries', url: '/industries/' },
            current: 'Transport & Logistique'
        },
        'location.html': {
            parent: { name: 'Industries', url: '/industries/' },
            current: 'Location de vehicules'
        },
        'mines.html': {
            parent: { name: 'Industries', url: '/industries/' },
            current: 'Mines & Carrieres'
        },
        'collectivites.html': {
            parent: { name: 'Industries', url: '/industries/' },
            current: 'Collectivites'
        },
        // Blog
        'blog': {
            parent: { name: 'Ressources', url: '/ressources.html' },
            current: 'Blog'
        },
        // Case studies
        'terrafleet.html': {
            parent: { name: 'Etudes de cas', url: '/case-studies/' },
            current: 'TerraFleet'
        }
    };

    function init() {
        const container = document.querySelector('.breadcrumbs');
        if (!container) return;

        const pathname = window.location.pathname;
        const filename = pathname.split('/').pop() || 'index.html';

        // Trouver la config de la page
        let config = PAGE_CONFIG[filename];

        // Si pas trouve, essayer de detecter
        if (!config) {
            if (pathname.includes('/products/')) {
                config = {
                    parent: { name: 'Produits', url: '/products/' },
                    current: document.querySelector('h1')?.textContent || 'Produit'
                };
            } else if (pathname.includes('/industries/')) {
                config = {
                    parent: { name: 'Industries', url: '/industries/' },
                    current: document.querySelector('h1')?.textContent || 'Secteur'
                };
            } else if (pathname.includes('/blog/')) {
                config = {
                    parent: { name: 'Blog', url: '/blog/' },
                    current: document.querySelector('h1')?.textContent || 'Article'
                };
            }
        }

        if (!config) return;

        // Generer le HTML
        const breadcrumbsHTML = `
            <nav class="breadcrumbs__nav" aria-label="Fil d'Ariane">
                <ol class="breadcrumbs__list">
                    <li class="breadcrumbs__item">
                        <a href="/" class="breadcrumbs__link">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                <polyline points="9 22 9 12 15 12 15 22"/>
                            </svg>
                            <span>Accueil</span>
                        </a>
                    </li>
                    <li class="breadcrumbs__item">
                        <a href="${config.parent.url}" class="breadcrumbs__link">${config.parent.name}</a>
                    </li>
                    <li class="breadcrumbs__item breadcrumbs__item--current" aria-current="page">
                        ${config.current}
                    </li>
                </ol>
            </nav>
        `;

        container.innerHTML = breadcrumbsHTML;

        // Ajouter schema.org
        const schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        schemaScript.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Accueil",
                    "item": window.location.origin + "/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": config.parent.name,
                    "item": window.location.origin + config.parent.url
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": config.current
                }
            ]
        });
        document.head.appendChild(schemaScript);
    }

    // Lancer au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
