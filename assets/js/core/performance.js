/**
 * Kaalytics Performance Optimizations
 * Lazy loading, preloading, animations GPU
 */

class KaalyticsPerformance {
    constructor() {
        this.init();
    }

    init() {
        this.initLazyVideos();
        this.initImageOptimization();
        this.initReducedMotion();
        this.initPrefetch();
        this.optimizeAnimations();
    }

    // Lazy loading des videos
    initLazyVideos() {
        const videos = document.querySelectorAll('video[data-src]');
        if (!videos.length) return;

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const video = entry.target;
                    const source = video.querySelector('source');

                    if (source && source.dataset.src) {
                        source.src = source.dataset.src;
                        video.load();
                        video.play().catch(() => {});
                    } else if (video.dataset.src) {
                        video.src = video.dataset.src;
                        video.load();
                        video.play().catch(() => {});
                    }

                    video.removeAttribute('data-src');
                    videoObserver.unobserve(video);
                }
            });
        }, {
            rootMargin: '200px',
            threshold: 0
        });

        videos.forEach(video => videoObserver.observe(video));
    }

    // Optimisation des images
    initImageOptimization() {
        // Native lazy loading
        document.querySelectorAll('img').forEach(img => {
            if (!img.loading) {
                img.loading = 'lazy';
            }
        });

        // Blur-up effect pour images
        const blurImages = document.querySelectorAll('img[data-blur]');
        blurImages.forEach(img => {
            img.style.filter = 'blur(5px)';
            img.style.transition = 'filter 0.3s ease';

            img.addEventListener('load', () => {
                img.style.filter = 'none';
            });
        });
    }

    // Respect prefers-reduced-motion
    initReducedMotion() {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        const handleReducedMotion = (e) => {
            if (e.matches) {
                document.documentElement.classList.add('reduced-motion');

                // Desactiver les animations CSS
                const style = document.createElement('style');
                style.id = 'reduced-motion-styles';
                style.textContent = `
                    .reduced-motion *,
                    .reduced-motion *::before,
                    .reduced-motion *::after {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                `;
                document.head.appendChild(style);
            } else {
                document.documentElement.classList.remove('reduced-motion');
                document.getElementById('reduced-motion-styles')?.remove();
            }
        };

        handleReducedMotion(mediaQuery);
        mediaQuery.addEventListener('change', handleReducedMotion);
    }

    // Prefetch des pages
    initPrefetch() {
        // Prefetch on hover
        const links = document.querySelectorAll('a[href^="/"], a[href^="./"]');

        links.forEach(link => {
            let prefetched = false;

            link.addEventListener('mouseenter', () => {
                if (prefetched) return;

                const href = link.getAttribute('href');
                if (!href || href === '#') return;

                const prefetchLink = document.createElement('link');
                prefetchLink.rel = 'prefetch';
                prefetchLink.href = href;
                document.head.appendChild(prefetchLink);

                prefetched = true;
            });
        });
    }

    // Optimiser les animations pour GPU
    optimizeAnimations() {
        // Forcer le GPU pour les elements animes
        const animatedElements = document.querySelectorAll(
            '.hero__orb, .particle, .hero__scroll-wheel, .btn, .module-ia-card, .fleetops-module'
        );

        animatedElements.forEach(el => {
            el.style.willChange = 'transform, opacity';
        });

        // Nettoyer willChange apres l'animation initiale
        setTimeout(() => {
            animatedElements.forEach(el => {
                el.style.willChange = 'auto';
            });
        }, 2000);
    }
}

// Font loading optimization
class FontOptimizer {
    constructor() {
        this.init();
    }

    init() {
        // Font display swap
        if ('fonts' in document) {
            document.fonts.ready.then(() => {
                document.documentElement.classList.add('fonts-loaded');
            });
        }

        // Preload critical fonts
        this.preloadFonts([
            'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2'
        ]);
    }

    preloadFonts(fontUrls) {
        fontUrls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'font';
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';
            link.href = url;
            document.head.appendChild(link);
        });
    }
}

// Critical CSS inliner (for build process)
class CriticalCSS {
    static getAboveTheFoldSelectors() {
        return [
            '.navbar',
            '.hero',
            '.hero__content',
            '.hero__title',
            '.hero__subtitle',
            '.hero__metrics',
            '.hero__cta-group',
            '.btn',
            '.btn-primary'
        ];
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new KaalyticsPerformance();
    new FontOptimizer();
});

// Export for other modules
window.KaalyticsPerformance = KaalyticsPerformance;
