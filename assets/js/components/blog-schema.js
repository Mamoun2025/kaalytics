/**
 * Blog Article Schema Generator
 * Auto-genere le schema.org Article pour les pages blog
 */

(function() {
    'use strict';

    function init() {
        // Verifier si on est sur une page blog (pas index)
        const pathname = window.location.pathname;
        if (!pathname.includes('/blog/') || pathname.endsWith('/blog/') || pathname.endsWith('/blog/index.html')) {
            return;
        }

        // Extraire les metadonnees de la page
        const title = document.querySelector('meta[property="og:title"]')?.content
            || document.querySelector('title')?.textContent
            || document.querySelector('h1')?.textContent;

        const description = document.querySelector('meta[name="description"]')?.content
            || document.querySelector('meta[property="og:description"]')?.content
            || '';

        const image = document.querySelector('meta[property="og:image"]')?.content
            || 'https://kaalytics.com/assets/images/og-blog.jpg';

        const url = window.location.href;

        // Essayer de trouver la date de publication
        const dateElement = document.querySelector('.blog-article__date, .article__date, time[datetime]');
        const publishDate = dateElement?.getAttribute('datetime')
            || dateElement?.textContent
            || new Date().toISOString().split('T')[0];

        // Essayer de trouver l'auteur
        const authorElement = document.querySelector('.blog-article__author, .article__author');
        const authorName = authorElement?.textContent?.trim() || 'Equipe Kaalytics';

        // Generer le schema
        const schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": description,
            "image": image,
            "url": url,
            "datePublished": publishDate,
            "dateModified": publishDate,
            "author": {
                "@type": "Person",
                "name": authorName
            },
            "publisher": {
                "@type": "Organization",
                "name": "Kaalytics",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://kaalytics.com/assets/images/logo.svg"
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": url
            }
        };

        // Ajouter le schema a la page
        const schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        schemaScript.textContent = JSON.stringify(schema);
        document.head.appendChild(schemaScript);

        console.log('[Blog Schema] Article schema generated');
    }

    // Lancer au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
