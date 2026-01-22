/**
 * KAALYTICS - Pricing Section Loader
 * ====================================
 * Charge dynamiquement la section pricing avec toggle
 *
 * Usage:
 * <div id="pricing-container"></div>
 * <script>
 *   window.PRICING_CONFIG = {
 *     variant: 'full',
 *     plans: [...]
 *   };
 * </script>
 * <script src="{{path}}/components/sections/pricing-loader.js"></script>
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURATION
    // ========================================

    const CONFIG = window.PRICING_CONFIG || {};

    const DEFAULTS = {
        variant: 'full',          // 'full' | 'compact' | 'minimal'
        containerId: 'pricing-container',
        badge: 'Tarification',
        title: 'Des prix transparents, sans surprise',
        subtitle: 'Choisissez le plan adapte a votre flotte. Changez a tout moment.',
        yearlyDiscount: 0.20,     // 20% reduction annuelle
        currency: 'MAD',
        plans: [
            {
                name: 'Starter',
                description: 'Pour les petites flottes',
                monthlyPrice: 299,
                features: [
                    { text: 'Jusqu\'a 10 vehicules', included: true },
                    { text: 'Suivi GPS temps reel', included: true },
                    { text: 'Rapports basiques', included: true },
                    { text: 'Support email', included: true },
                    { text: 'Maintenance predictive', included: false },
                    { text: 'API access', included: false }
                ],
                cta: { text: 'Commencer', href: '#contact' },
                featured: false
            },
            {
                name: 'Professional',
                description: 'Pour les flottes en croissance',
                monthlyPrice: 799,
                badge: 'Le plus populaire',
                features: [
                    { text: 'Jusqu\'a 50 vehicules', included: true },
                    { text: 'Tous les modules IA', included: true },
                    { text: 'Rapports avances', included: true },
                    { text: 'Support prioritaire', included: true },
                    { text: 'Maintenance predictive', included: true },
                    { text: 'API access', included: true }
                ],
                cta: { text: 'Essai gratuit', href: '#contact', primary: true },
                featured: true
            },
            {
                name: 'Enterprise',
                description: 'Pour les grandes flottes',
                monthlyPrice: null,
                priceLabel: 'Sur mesure',
                features: [
                    { text: 'Vehicules illimites', included: true },
                    { text: 'Tous les modules IA', included: true },
                    { text: 'Rapports personnalises', included: true },
                    { text: 'Account manager dedie', included: true },
                    { text: 'Formation sur site', included: true },
                    { text: 'SLA garanti', included: true }
                ],
                cta: { text: 'Nous contacter', href: '#contact' },
                featured: false
            }
        ],
        enterprise: {
            title: 'Besoin d\'une solution sur mesure ?',
            description: 'Flottes de plus de 100 vehicules, integration ERP, deploiement on-premise...',
            cta: 'Parlons-en',
            href: '#contact'
        },
        trust: [
            'Essai 14 jours gratuit',
            'Paiement securise',
            'Support 24/7'
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
        const scripts = document.querySelectorAll('script[src*="pricing-loader"]');
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

    async function loadPricingTemplate(rootPath) {
        const templateUrl = rootPath + 'components/sections/pricing.html';

        try {
            const response = await fetch(templateUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } catch (error) {
            console.error('[Pricing] Erreur chargement template:', error);
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
        result = result.replace('{{ENTERPRISE_TITLE}}', config.enterprise.title);
        result = result.replace('{{ENTERPRISE_DESC}}', config.enterprise.description);
        result = result.replace('{{ENTERPRISE_CTA}}', config.enterprise.cta);
        result = result.replace('{{ENTERPRISE_HREF}}', config.enterprise.href);
        result = result.replace('{{TRUST_1}}', config.trust[0] || '');
        result = result.replace('{{TRUST_2}}', config.trust[1] || '');
        result = result.replace('{{TRUST_3}}', config.trust[2] || '');

        return result;
    }

    // ========================================
    // PRICING CARDS GENERATION
    // ========================================

    function formatPrice(price, currency) {
        if (price === null) return null;
        return new Intl.NumberFormat('fr-MA', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    function generatePricingCards(plans, config, isYearly = false) {
        return plans.map(plan => {
            let price = plan.monthlyPrice;
            let displayPrice = plan.priceLabel;

            if (price !== null) {
                if (isYearly) {
                    price = Math.round(price * (1 - config.yearlyDiscount));
                }
                displayPrice = formatPrice(price, config.currency);
            }

            const features = plan.features.map(f => {
                const iconClass = f.included ? '' : 'pricing-card__feature--disabled';
                const icon = f.included
                    ? '<svg class="pricing-card__feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>'
                    : '<svg class="pricing-card__feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
                return `<li class="pricing-card__feature ${iconClass}">${icon}<span>${f.text}</span></li>`;
            }).join('');

            const cardClass = plan.featured ? 'pricing-card pricing-card--featured' : 'pricing-card';
            const badge = plan.badge ? `<span class="pricing-card__badge">${plan.badge}</span>` : '';
            const ctaClass = plan.cta.primary ? 'pricing-card__cta pricing-card__cta--primary' : 'pricing-card__cta pricing-card__cta--secondary';

            const priceHTML = price !== null
                ? `<span class="pricing-card__currency">${config.currency}</span>
                   <span class="pricing-card__amount" data-monthly="${plan.monthlyPrice}" data-yearly="${Math.round(plan.monthlyPrice * (1 - config.yearlyDiscount))}">${displayPrice}</span>
                   <span class="pricing-card__period">/${isYearly ? 'an' : 'mois'}</span>`
                : `<span class="pricing-card__amount pricing-card__amount--custom">${displayPrice}</span>`;

            return `
                <div class="${cardClass}" data-animate="fade-up">
                    ${badge}
                    <div class="pricing-card__header">
                        <h3 class="pricing-card__name">${plan.name}</h3>
                        <p class="pricing-card__description">${plan.description}</p>
                        <div class="pricing-card__price">
                            ${priceHTML}
                        </div>
                    </div>
                    <ul class="pricing-card__features">
                        ${features}
                    </ul>
                    <a href="${plan.cta.href}" class="${ctaClass}">
                        ${plan.cta.text}
                    </a>
                </div>
            `;
        }).join('');
    }

    // ========================================
    // TOGGLE FUNCTIONALITY
    // ========================================

    function initToggle(container, config) {
        const toggle = container.querySelector('#pricingToggle');
        const labels = container.querySelectorAll('.section-pricing__toggle-label');
        const grid = container.querySelector('#pricingGrid');

        if (!toggle || !grid) return;

        let isYearly = false;

        toggle.addEventListener('click', () => {
            isYearly = !isYearly;
            toggle.classList.toggle('is-yearly', isYearly);

            // Update labels
            labels[0].dataset.active = !isYearly;
            labels[1].dataset.active = isYearly;

            // Update prices
            const amounts = grid.querySelectorAll('.pricing-card__amount[data-monthly]');
            const periods = grid.querySelectorAll('.pricing-card__period');

            amounts.forEach(amount => {
                const value = isYearly ? amount.dataset.yearly : amount.dataset.monthly;
                amount.textContent = formatPrice(parseInt(value), config.currency);
            });

            periods.forEach(period => {
                period.textContent = isYearly ? '/an' : '/mois';
            });

            // Dispatch event
            window.dispatchEvent(new CustomEvent('pricingToggle', {
                detail: { isYearly }
            }));
        });
    }

    // ========================================
    // VARIANT APPLICATION
    // ========================================

    function applyVariant(container, variant) {
        const section = container.querySelector('.section-pricing');
        if (!section) return;

        section.classList.remove('section-pricing--full', 'section-pricing--compact', 'section-pricing--minimal');

        if (variant !== 'full') {
            section.classList.add(`section-pricing--${variant}`);
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

        console.log('[Pricing] Root path:', rootPath || '(root)');

        const template = await loadPricingTemplate(rootPath);
        if (!template) {
            console.error('[Pricing] Impossible de charger le template');
            return;
        }

        // Extract and inject styles
        const styles = extractStyles(template);
        if (styles && !document.querySelector('style[data-pricing-styles]')) {
            const styleEl = document.createElement('style');
            styleEl.setAttribute('data-pricing-styles', '');
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

        // Insert pricing cards
        const grid = targetContainer.querySelector('#pricingGrid');
        if (grid) {
            grid.innerHTML = generatePricingCards(settings.plans, settings, false);
        }

        // Apply configuration
        applyVariant(targetContainer, variant);
        initToggle(targetContainer, settings);
        initAnimations(targetContainer);

        // Dispatch event
        window.dispatchEvent(new CustomEvent('pricingLoaded', {
            detail: { section: targetContainer.querySelector('.section-pricing'), variant }
        }));

        console.log('[Pricing] Charge avec succes:', { variant, plans: settings.plans.length });
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
