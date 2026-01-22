/**
 * KAALYTICS - Hero Section Loader
 * ================================
 * Charge dynamiquement la section hero modulaire
 *
 * Usage:
 * <div id="hero-container"></div>
 * <script>
 *   window.HERO_CONFIG = {
 *     variant: 'full',
 *     title: { line1: '...', highlight: '...', line3: '...' },
 *     subtitle: '...',
 *     metrics: [...],
 *     cta: { primary: {...}, secondary: {...} }
 *   };
 * </script>
 * <script src="{{path}}/components/sections/hero-loader.js"></script>
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURATION
    // ========================================

    const CONFIG = window.HERO_CONFIG || {};
    const DEFAULTS = {
        variant: 'full',      // 'full' | 'simple' | 'minimal'
        containerId: 'hero-container',
        title: {
            line1: 'Votre flotte vous coute',
            highlight: '30% de trop',
            line3: 'On corrige ca en 48h.'
        },
        rotatingTexts: ['30% de trop', 'trop cher', 'des soucis'],
        subtitle: 'FleetOps Pro : 8 modules IA qui transforment vos vehicules en actifs rentables. <strong>-40% couts. +35% productivite. Garanti.</strong>',
        trustNames: 'TerraFleet • TransMaroc • MineralCo',
        metrics: [
            { value: '95%', label: 'Precision IA' },
            { value: '-70%', label: 'Temps admin' },
            { value: '-40%', label: 'Couts maintenance' },
            { value: '6 mois', label: 'ROI visible' }
        ],
        cta: {
            primary: {
                text: 'Audit gratuit en 48h',
                href: '#contact',
                badge: '3 places restantes'
            },
            secondary: {
                text: 'Voir FleetOps Pro en action',
                href: '#products'
            }
        },
        socialProof: '4.9/5 - 50+ entreprises transformees',
        avatars: [
            { initials: 'MB', color: 'linear-gradient(135deg, #10b981, #0d9488)' },
            { initials: 'SK', color: 'linear-gradient(135deg, #0d9488, #14b8a6)' },
            { initials: 'AE', color: 'linear-gradient(135deg, #059669, #10b981)' },
            { initials: '+47', isCount: true }
        ],
        scrollTarget: '#products'
    };

    // Merge configurations
    function mergeConfig(defaults, custom) {
        const result = { ...defaults };
        for (const key in custom) {
            if (custom[key] !== null && typeof custom[key] === 'object' && !Array.isArray(custom[key])) {
                result[key] = mergeConfig(defaults[key] || {}, custom[key]);
            } else {
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
        const scripts = document.querySelectorAll('script[src*="hero-loader"]');
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

    async function loadHeroTemplate(rootPath) {
        const templateUrl = rootPath + 'components/sections/hero.html';

        try {
            const response = await fetch(templateUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } catch (error) {
            console.error('[Hero] Erreur chargement template:', error);
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

        // Root path
        result = result.replace(/\{\{ROOT\}\}/g, rootPath);

        // Title
        result = result.replace('{{TITLE_LINE1}}', config.title.line1);
        result = result.replace('{{TITLE_HIGHLIGHT}}', config.title.highlight);
        result = result.replace('{{TITLE_LINE3}}', config.title.line3);
        result = result.replace('{{ROTATING_TEXTS}}', config.rotatingTexts.join(','));

        // Trust & content
        result = result.replace('{{TRUST_NAMES}}', config.trustNames);
        result = result.replace('{{SUBTITLE}}', config.subtitle);
        result = result.replace('{{SOCIAL_PROOF}}', config.socialProof);

        // Metrics
        if (config.metrics && config.metrics.length >= 4) {
            result = result.replace('{{METRIC1_VALUE}}', config.metrics[0].value);
            result = result.replace('{{METRIC1_LABEL}}', config.metrics[0].label);
            result = result.replace('{{METRIC2_VALUE}}', config.metrics[1].value);
            result = result.replace('{{METRIC2_LABEL}}', config.metrics[1].label);
            result = result.replace('{{METRIC3_VALUE}}', config.metrics[2].value);
            result = result.replace('{{METRIC3_LABEL}}', config.metrics[2].label);
            result = result.replace('{{METRIC4_VALUE}}', config.metrics[3].value);
            result = result.replace('{{METRIC4_LABEL}}', config.metrics[3].label);
        }

        // CTAs
        result = result.replace('{{CTA_PRIMARY_TEXT}}', config.cta.primary.text);
        result = result.replace('{{CTA_PRIMARY_HREF}}', config.cta.primary.href);
        result = result.replace('{{CTA_BADGE}}', config.cta.primary.badge || '');
        result = result.replace('{{CTA_SECONDARY_TEXT}}', config.cta.secondary.text);
        result = result.replace('{{CTA_SECONDARY_HREF}}', config.cta.secondary.href);

        // Scroll target
        result = result.replace('{{SCROLL_TARGET}}', config.scrollTarget);

        return result;
    }

    // ========================================
    // VARIANT APPLICATION
    // ========================================

    function applyVariant(container, variant) {
        const section = container.querySelector('.section-hero');
        if (!section) return;

        section.classList.remove('section-hero--full', 'section-hero--simple', 'section-hero--minimal');

        if (variant !== 'full') {
            section.classList.add(`section-hero--${variant}`);
        }
    }

    // ========================================
    // INTERACTIONS
    // ========================================

    function initInteractions(container, config) {
        // Generate avatars
        const avatarsContainer = container.querySelector('#heroAvatars');
        if (avatarsContainer && config.avatars) {
            avatarsContainer.innerHTML = config.avatars.map(avatar => {
                const classes = avatar.isCount ? 'hero__avatar hero__avatar--count' : 'hero__avatar';
                const style = avatar.color ? `background: ${avatar.color};` : '';
                return `<div class="${classes}" style="${style}">${avatar.initials}</div>`;
            }).join('');
        }

        // Rotating text animation
        const rotatingEl = container.querySelector('#rotating-problem');
        if (rotatingEl && config.rotatingTexts && config.rotatingTexts.length > 1) {
            let currentIndex = 0;
            setInterval(() => {
                currentIndex = (currentIndex + 1) % config.rotatingTexts.length;
                rotatingEl.style.opacity = '0';
                setTimeout(() => {
                    rotatingEl.textContent = config.rotatingTexts[currentIndex];
                    rotatingEl.style.opacity = '1';
                }, 300);
            }, 3000);
        }

        // Counter animation
        const counters = container.querySelectorAll('[data-count]');
        const observerOptions = { threshold: 0.5 };

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        counters.forEach(counter => counterObserver.observe(counter));

        // Fade-up animations
        const animatedEls = container.querySelectorAll('[data-animate="fade-up"]');
        const fadeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.delay || 0;
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, parseInt(delay));
                    fadeObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        animatedEls.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            fadeObserver.observe(el);
        });
    }

    function animateCounter(element) {
        const text = element.textContent;
        const hasPercent = text.includes('%');
        const hasMinus = text.includes('-');
        const hasPlus = text.includes('+');
        const numMatch = text.match(/[\d.]+/);

        if (!numMatch) return;

        const target = parseFloat(numMatch[0]);
        const duration = 1500;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = target * easeProgress;

            let display = Number.isInteger(target) ? Math.floor(current) : current.toFixed(1);
            if (hasMinus) display = '-' + display;
            if (hasPlus) display = '+' + display;
            if (hasPercent) display += '%';

            element.textContent = display;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = text;
            }
        }

        requestAnimationFrame(update);
    }

    // ========================================
    // MAIN INITIALIZATION
    // ========================================

    async function init() {
        const container = document.getElementById(settings.containerId);
        const variant = settings.variant;
        const rootPath = detectRootPath();

        console.log('[Hero] Root path:', rootPath || '(root)');

        const template = await loadHeroTemplate(rootPath);
        if (!template) {
            console.error('[Hero] Impossible de charger le template');
            return;
        }

        // Extract and inject styles
        const styles = extractStyles(template);
        if (styles && !document.querySelector('style[data-hero-styles]')) {
            const styleEl = document.createElement('style');
            styleEl.setAttribute('data-hero-styles', '');
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
            const navbar = document.querySelector('.navbar, #navbar-container');
            if (navbar && navbar.nextSibling) {
                navbar.parentNode.insertBefore(targetContainer, navbar.nextSibling);
            } else {
                document.body.insertBefore(targetContainer, document.body.firstChild);
            }
        }

        targetContainer.innerHTML = sectionHTML;

        // Apply configuration
        applyVariant(targetContainer, variant);
        initInteractions(targetContainer, settings);

        // Dispatch event
        window.dispatchEvent(new CustomEvent('heroLoaded', {
            detail: { hero: targetContainer.querySelector('.section-hero'), variant }
        }));

        console.log('[Hero] Charge avec succes:', { variant });
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
