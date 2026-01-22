/**
 * KAALYTICS - Testimonials Section Loader
 * =========================================
 * Charge dynamiquement la section temoignages avec carousel
 *
 * Usage:
 * <div id="testimonials-container"></div>
 * <script>
 *   window.TESTIMONIALS_CONFIG = {
 *     variant: 'full',
 *     testimonials: [...]
 *   };
 * </script>
 * <script src="{{path}}/components/sections/testimonials-loader.js"></script>
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURATION
    // ========================================

    const CONFIG = window.TESTIMONIALS_CONFIG || {};

    const DEFAULTS = {
        variant: 'full',          // 'full' | 'compact' | 'minimal'
        containerId: 'testimonials-container',
        badge: 'Temoignages',
        title: 'Ils nous font confiance',
        subtitle: 'Decouvrez comment nos clients transforment leur gestion de flotte avec Kaalytics.',
        stats: [
            { value: '50+', label: 'Entreprises' },
            { value: '4.9/5', label: 'Satisfaction' },
            { value: '1000+', label: 'Vehicules geres' }
        ],
        cta: {
            text: 'Devenir le prochain temoignage',
            href: '#contact'
        },
        autoplay: true,
        autoplayInterval: 5000,
        testimonials: [
            {
                name: 'Mohammed Benali',
                role: 'Directeur Operations',
                company: 'BEKS Logistics',
                avatar: null,
                initials: 'MB',
                rating: 5,
                content: 'FleetOps Pro a completement transforme notre gestion de flotte. Nous avons reduit nos couts de maintenance de 40% en 6 mois.',
                metrics: [
                    { value: '-40%', label: 'Couts' },
                    { value: '+35%', label: 'Productivite' }
                ]
            },
            {
                name: 'Sarah Kamali',
                role: 'CEO',
                company: 'TransMaroc',
                avatar: null,
                initials: 'SK',
                rating: 5,
                content: 'L\'IA predictive nous alerte avant les pannes. On n\'a plus de camions immobilises au mauvais moment.',
                metrics: [
                    { value: '-70%', label: 'Pannes' },
                    { value: '98%', label: 'Disponibilite' }
                ]
            },
            {
                name: 'Ahmed El Fassi',
                role: 'Fleet Manager',
                company: 'MineralCo',
                avatar: null,
                initials: 'AE',
                rating: 5,
                content: 'Le ROI a ete visible des le premier mois. L\'interface est intuitive et le support est excellent.',
                metrics: [
                    { value: '6 mois', label: 'ROI' },
                    { value: '-25%', label: 'Carburant' }
                ]
            },
            {
                name: 'Fatima Zahra',
                role: 'Directrice Logistique',
                company: 'Atlas Transport',
                avatar: null,
                initials: 'FZ',
                rating: 5,
                content: 'Enfin une solution qui comprend les realites du terrain marocain. Integration parfaite avec notre ERP.',
                metrics: [
                    { value: '3 jours', label: 'Integration' },
                    { value: '24/7', label: 'Support' }
                ]
            },
            {
                name: 'Karim Benjelloun',
                role: 'Responsable Flotte',
                company: 'Casablanca Freight',
                avatar: null,
                initials: 'KB',
                rating: 4,
                content: 'Suivi GPS precis, alertes en temps reel, rapports automatiques. Tout ce dont on avait besoin.',
                metrics: [
                    { value: '95%', label: 'Precision' },
                    { value: '-30%', label: 'Temps admin' }
                ]
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
        const scripts = document.querySelectorAll('script[src*="testimonials-loader"]');
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

    async function loadTestimonialsTemplate(rootPath) {
        const templateUrl = rootPath + 'components/sections/testimonials.html';

        try {
            const response = await fetch(templateUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } catch (error) {
            console.error('[Testimonials] Erreur chargement template:', error);
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

        // Stats
        if (config.stats && config.stats.length >= 3) {
            result = result.replace('{{STAT1_VALUE}}', config.stats[0].value);
            result = result.replace('{{STAT1_LABEL}}', config.stats[0].label);
            result = result.replace('{{STAT2_VALUE}}', config.stats[1].value);
            result = result.replace('{{STAT2_LABEL}}', config.stats[1].label);
            result = result.replace('{{STAT3_VALUE}}', config.stats[2].value);
            result = result.replace('{{STAT3_LABEL}}', config.stats[2].label);
        }

        result = result.replace('{{CTA_TEXT}}', config.cta.text);
        result = result.replace('{{CTA_HREF}}', config.cta.href);

        return result;
    }

    // ========================================
    // TESTIMONIALS GENERATION
    // ========================================

    function generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            const starClass = i <= rating ? 'testimonial-card__star' : 'testimonial-card__star testimonial-card__star--empty';
            stars += `<svg class="${starClass}" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
        }
        return stars;
    }

    function generateTestimonialCards(testimonials) {
        return testimonials.map(t => {
            const avatar = t.avatar
                ? `<img src="${t.avatar}" alt="${t.name}">`
                : t.initials;

            const metrics = (t.metrics || []).map(m =>
                `<div class="testimonial-card__metric">
                    <span class="testimonial-card__metric-value">${m.value}</span>
                    <span class="testimonial-card__metric-label">${m.label}</span>
                </div>`
            ).join('');

            return `
                <div class="testimonial-card" data-animate="fade-up">
                    <div class="testimonial-card__header">
                        <div class="testimonial-card__avatar">${avatar}</div>
                        <div class="testimonial-card__info">
                            <div class="testimonial-card__name">${t.name}</div>
                            <div class="testimonial-card__role">${t.role} @ <span class="testimonial-card__company">${t.company}</span></div>
                        </div>
                    </div>
                    <div class="testimonial-card__rating">
                        ${generateStars(t.rating)}
                    </div>
                    <div class="testimonial-card__content">${t.content}</div>
                    ${metrics ? `<div class="testimonial-card__metrics">${metrics}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    // ========================================
    // CAROUSEL FUNCTIONALITY
    // ========================================

    function initCarousel(container, config) {
        const track = container.querySelector('#testimonialsTrack');
        const prevBtn = container.querySelector('#testimonialsPrev');
        const nextBtn = container.querySelector('#testimonialsNext');
        const dotsContainer = container.querySelector('#testimonialsDots');

        if (!track) return;

        const cards = track.querySelectorAll('.testimonial-card');
        const totalCards = cards.length;
        let currentIndex = 0;
        let autoplayTimer = null;

        // Generate dots
        if (dotsContainer) {
            for (let i = 0; i < Math.ceil(totalCards / getVisibleCount()); i++) {
                const dot = document.createElement('button');
                dot.className = `section-testimonials__dot${i === 0 ? ' is-active' : ''}`;
                dot.setAttribute('aria-label', `Slide ${i + 1}`);
                dot.addEventListener('click', () => goToSlide(i));
                dotsContainer.appendChild(dot);
            }
        }

        function getVisibleCount() {
            if (window.innerWidth >= 1024) return 3;
            if (window.innerWidth >= 768) return 2;
            return 1;
        }

        function updateDots() {
            if (!dotsContainer) return;
            const dots = dotsContainer.querySelectorAll('.section-testimonials__dot');
            const visibleCount = getVisibleCount();
            const activeDot = Math.floor(currentIndex / visibleCount);

            dots.forEach((dot, i) => {
                dot.classList.toggle('is-active', i === activeDot);
            });
        }

        function goToSlide(index) {
            const cardWidth = cards[0].offsetWidth + 24; // + gap
            const visibleCount = getVisibleCount();
            const maxIndex = Math.max(0, totalCards - visibleCount);

            currentIndex = Math.min(index * visibleCount, maxIndex);
            track.scrollTo({
                left: currentIndex * cardWidth,
                behavior: 'smooth'
            });

            updateDots();
            resetAutoplay();
        }

        function navigate(direction) {
            const visibleCount = getVisibleCount();
            const maxIndex = Math.max(0, totalCards - visibleCount);

            if (direction === 'next') {
                currentIndex = currentIndex + visibleCount >= totalCards ? 0 : currentIndex + visibleCount;
            } else {
                currentIndex = currentIndex - visibleCount < 0 ? maxIndex : currentIndex - visibleCount;
            }

            const cardWidth = cards[0].offsetWidth + 24;
            track.scrollTo({
                left: currentIndex * cardWidth,
                behavior: 'smooth'
            });

            updateDots();
            resetAutoplay();
        }

        function startAutoplay() {
            if (!config.autoplay) return;
            autoplayTimer = setInterval(() => navigate('next'), config.autoplayInterval);
        }

        function stopAutoplay() {
            if (autoplayTimer) {
                clearInterval(autoplayTimer);
                autoplayTimer = null;
            }
        }

        function resetAutoplay() {
            stopAutoplay();
            startAutoplay();
        }

        // Event listeners
        if (prevBtn) prevBtn.addEventListener('click', () => navigate('prev'));
        if (nextBtn) nextBtn.addEventListener('click', () => navigate('next'));

        // Pause autoplay on hover
        track.addEventListener('mouseenter', stopAutoplay);
        track.addEventListener('mouseleave', startAutoplay);

        // Handle resize
        window.addEventListener('resize', () => {
            updateDots();
        });

        // Track scroll for dot update
        track.addEventListener('scroll', () => {
            const cardWidth = cards[0].offsetWidth + 24;
            currentIndex = Math.round(track.scrollLeft / cardWidth);
            updateDots();
        });

        // Start
        startAutoplay();
    }

    // ========================================
    // VARIANT APPLICATION
    // ========================================

    function applyVariant(container, variant) {
        const section = container.querySelector('.section-testimonials');
        if (!section) return;

        section.classList.remove('section-testimonials--full', 'section-testimonials--compact', 'section-testimonials--minimal');

        if (variant !== 'full') {
            section.classList.add(`section-testimonials--${variant}`);
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

        console.log('[Testimonials] Root path:', rootPath || '(root)');

        const template = await loadTestimonialsTemplate(rootPath);
        if (!template) {
            console.error('[Testimonials] Impossible de charger le template');
            return;
        }

        // Extract and inject styles
        const styles = extractStyles(template);
        if (styles && !document.querySelector('style[data-testimonials-styles]')) {
            const styleEl = document.createElement('style');
            styleEl.setAttribute('data-testimonials-styles', '');
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

        // Insert testimonial cards
        const track = targetContainer.querySelector('#testimonialsTrack');
        if (track) {
            track.innerHTML = generateTestimonialCards(settings.testimonials);
        }

        // Apply configuration
        applyVariant(targetContainer, variant);
        initCarousel(targetContainer, settings);
        initAnimations(targetContainer);

        // Dispatch event
        window.dispatchEvent(new CustomEvent('testimonialsLoaded', {
            detail: { section: targetContainer.querySelector('.section-testimonials'), variant }
        }));

        console.log('[Testimonials] Charge avec succes:', { variant, count: settings.testimonials.length });
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
