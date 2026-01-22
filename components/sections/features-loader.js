/**
 * KAALYTICS - Features Section Loader
 * =====================================
 * Charge dynamiquement la section features
 *
 * Usage:
 * <div id="features-container"></div>
 * <script>
 *   window.FEATURES_CONFIG = {
 *     variant: 'full',
 *     badge: 'Nos modules',
 *     title: 'Une suite complete...',
 *     features: [...]
 *   };
 * </script>
 * <script src="{{path}}/components/sections/features-loader.js"></script>
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURATION
    // ========================================

    const CONFIG = window.FEATURES_CONFIG || {};

    // Default icons (SVG)
    const ICONS = {
        truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
        fuel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 22V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14"/><path d="M5 12h8"/><path d="M17 6l2 2v4a2 2 0 0 0 2 2v0a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1"/><path d="M7 22v-4"/><path d="M11 22v-4"/></svg>',
        wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
        users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>',
        chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>',
        shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
        brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.54"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.54"/></svg>',
        document: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>'
    };

    const DEFAULTS = {
        variant: 'full',          // 'full' | 'compact' | 'minimal'
        containerId: 'features-container',
        badge: 'Nos modules',
        title: 'Une suite complete pour votre flotte',
        subtitle: 'Chaque module est concu pour resoudre un probleme specifique et s\'integre parfaitement avec les autres.',
        cta: {
            text: 'Voir tous les modules',
            href: '#products'
        },
        features: [
            {
                icon: 'truck',
                title: 'Suivi GPS',
                description: 'Localisation temps reel de tous vos vehicules avec historique complet.',
                benefits: ['Position exacte', 'Historique 90j', 'Geofencing'],
                link: '#tracking',
                linkText: 'En savoir plus',
                accent: 'green'
            },
            {
                icon: 'fuel',
                title: 'Gestion Carburant',
                description: 'Detectez les anomalies et optimisez la consommation de votre flotte.',
                benefits: ['Detection fuites', 'Alertes temps reel', '-25% carburant'],
                link: '#fuel',
                linkText: 'En savoir plus',
                accent: 'blue'
            },
            {
                icon: 'wrench',
                title: 'Maintenance Predictive',
                description: 'L\'IA predit les pannes avant qu\'elles n\'arrivent.',
                benefits: ['Prediction pannes', 'Planification auto', '-40% couts'],
                link: '#maintenance',
                linkText: 'En savoir plus',
                accent: 'cyan'
            },
            {
                icon: 'users',
                title: 'Gestion Chauffeurs',
                description: 'Suivez les performances et la securite de vos conducteurs.',
                benefits: ['Score conduite', 'Formations ciblees', 'Eco-conduite'],
                link: '#drivers',
                linkText: 'En savoir plus',
                accent: 'purple'
            },
            {
                icon: 'route',
                title: 'Optimisation Routes',
                description: 'Reduisez les kilometres et le temps de trajet.',
                benefits: ['Routes optimales', 'Trafic temps reel', '-30% km'],
                link: '#routes',
                linkText: 'En savoir plus',
                accent: 'green'
            },
            {
                icon: 'chart',
                title: 'Analytics IA',
                description: 'Tableaux de bord intelligents avec insights automatiques.',
                benefits: ['Rapports auto', 'KPIs cles', 'Predictions'],
                link: '#analytics',
                linkText: 'En savoir plus',
                accent: 'blue'
            },
            {
                icon: 'shield',
                title: 'Conformite',
                description: 'Restez conforme aux reglementations sans effort.',
                benefits: ['Documents auto', 'Alertes echeances', 'Audit ready'],
                link: '#compliance',
                linkText: 'En savoir plus',
                accent: 'orange'
            },
            {
                icon: 'brain',
                title: 'IA Decisions',
                description: 'Recommandations intelligentes basees sur vos donnees.',
                benefits: ['Suggestions IA', 'Auto-optimisation', 'Apprentissage'],
                link: '#ai',
                linkText: 'En savoir plus',
                accent: 'purple'
            }
        ]
    };

    function mergeConfig(defaults, custom) {
        const result = { ...defaults };
        for (const key in custom) {
            if (custom[key] !== null && typeof custom[key] === 'object' && !Array.isArray(custom[key])) {
                result[key] = mergeConfig(defaults[key] || {}, custom[key]);
            } else if (custom[key] !== undefined) {
                result[key] = custom[key];
            }
        }
        return result;
    }

    const settings = mergeConfig(DEFAULTS, CONFIG);

    // ========================================
    // PATH DETECTION
    // ========================================

    function detectRootPath() {
        const scripts = document.querySelectorAll('script[src*="features-loader"]');
        if (scripts.length > 0) {
            const src = scripts[0].getAttribute('src');
            const depth = (src.match(/\.\.\//g) || []).length;
            return '../'.repeat(depth);
        }

        const path = window.location.pathname;
        const segments = path.split('/').filter(s => s && !s.includes('.'));
        const projectRoot = ['kaalytics'];
        const relevantSegments = segments.filter(s => !projectRoot.includes(s));

        return relevantSegments.length === 0 ? '' : '../'.repeat(relevantSegments.length);
    }

    // ========================================
    // TEMPLATE LOADING
    // ========================================

    async function loadFeaturesTemplate(rootPath) {
        const templateUrl = rootPath + 'components/sections/features.html';

        try {
            const response = await fetch(templateUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } catch (error) {
            console.error('[Features] Erreur chargement template:', error);
            return null;
        }
    }

    function extractSectionContent(html) {
        const match = html.match(/<section[^>]*>([\s\S]*?)<\/section>/i);
        if (match) {
            return '<section' + html.match(/<section([^>]*)>/i)[1] + '>' + match[1] + '</section>';
        }
        return html;
    }

    function extractStyles(html) {
        const match = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        return match ? match[0] : '';
    }

    // ========================================
    // PLACEHOLDER REPLACEMENT
    // ========================================

    function replacePlaceholders(html, config, rootPath) {
        let result = html;

        result = result.replace(/\{\{ROOT\}\}/g, rootPath);
        result = result.replace('{{BADGE}}', config.badge);
        result = result.replace('{{TITLE}}', config.title);
        result = result.replace('{{SUBTITLE}}', config.subtitle);
        result = result.replace('{{CTA_TEXT}}', config.cta.text);
        result = result.replace('{{CTA_HREF}}', config.cta.href);

        return result;
    }

    // ========================================
    // FEATURE CARDS GENERATION
    // ========================================

    function generateFeatureCards(features) {
        return features.map(feature => {
            const icon = ICONS[feature.icon] || ICONS.zap;
            const benefits = (feature.benefits || []).map(b => `<li>${b}</li>`).join('');

            return `
                <div class="feature-card" data-accent="${feature.accent || 'green'}" data-animate="fade-up">
                    <div class="feature-card__icon-wrapper">
                        <div class="feature-card__icon">${icon}</div>
                        <div class="feature-card__glow"></div>
                    </div>
                    <h3 class="feature-card__title">${feature.title}</h3>
                    <p class="feature-card__description">${feature.description}</p>
                    <ul class="feature-card__benefits">${benefits}</ul>
                    <a href="${feature.link || '#'}" class="feature-card__link">
                        <span>${feature.linkText || 'En savoir plus'}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </a>
                </div>
            `;
        }).join('');
    }

    // ========================================
    // VARIANT APPLICATION
    // ========================================

    function applyVariant(container, variant) {
        const section = container.querySelector('.section-features');
        if (!section) return;

        section.classList.remove('section-features--full', 'section-features--compact', 'section-features--minimal');

        if (variant !== 'full') {
            section.classList.add(`section-features--${variant}`);
        }
    }

    // ========================================
    // ANIMATIONS
    // ========================================

    function initAnimations(container) {
        const animatedEls = container.querySelectorAll('[data-animate="fade-up"]');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        animatedEls.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // ========================================
    // MAIN INITIALIZATION
    // ========================================

    async function init() {
        const container = document.getElementById(settings.containerId);
        const variant = settings.variant;
        const rootPath = detectRootPath();

        console.log('[Features] Root path:', rootPath || '(root)');

        const template = await loadFeaturesTemplate(rootPath);
        if (!template) {
            console.error('[Features] Impossible de charger le template');
            return;
        }

        // Extract and inject styles
        const styles = extractStyles(template);
        if (styles && !document.querySelector('style[data-features-styles]')) {
            const styleEl = document.createElement('style');
            styleEl.setAttribute('data-features-styles', '');
            styleEl.textContent = styles.replace(/<\/?style[^>]*>/g, '');
            document.head.appendChild(styleEl);
        }

        // Process section content
        let sectionHTML = extractSectionContent(template);
        sectionHTML = replacePlaceholders(sectionHTML, settings, rootPath);

        // Insert into DOM
        let targetContainer = container;
        if (!targetContainer) {
            targetContainer = document.createElement('div');
            targetContainer.id = settings.containerId;
            document.body.appendChild(targetContainer);
        }

        targetContainer.innerHTML = sectionHTML;

        // Insert feature cards
        const grid = targetContainer.querySelector('#featuresGrid');
        if (grid) {
            grid.innerHTML = generateFeatureCards(settings.features);
        }

        // Apply configuration
        applyVariant(targetContainer, variant);
        initAnimations(targetContainer);

        // Dispatch event
        window.dispatchEvent(new CustomEvent('featuresLoaded', {
            detail: { section: targetContainer.querySelector('.section-features'), variant }
        }));

        console.log('[Features] Charge avec succes:', { variant, count: settings.features.length });
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
