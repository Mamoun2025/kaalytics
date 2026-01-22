/**
 * Kaalytics Main Application
 * Core initialization and utilities
 */

const Kaalytics = {
    // Configuration
    config: {
        debug: false,
        animationsEnabled: true,
        lang: 'fr'
    },

    // Initialize application
    init() {
        this.detectPreferences();
        this.initNavbar();
        this.initAnimations();
        this.initLazyLoading();
        this.initI18n();

        if (this.config.debug) {
            console.log('Kaalytics initialized', this.config);
        }
    },

    // Detect user preferences
    detectPreferences() {
        // Reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.config.animationsEnabled = false;
            document.documentElement.classList.add('reduced-motion');
        }

        // Language from localStorage or browser
        const savedLang = localStorage.getItem('kaalytics-lang');
        if (savedLang) {
            this.config.lang = savedLang;
        } else {
            const browserLang = navigator.language.split('-')[0];
            this.config.lang = ['fr', 'en'].includes(browserLang) ? browserLang : 'fr';
        }
        document.documentElement.lang = this.config.lang;
    },

    // Initialize navbar scroll behavior
    initNavbar() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        let lastScroll = 0;
        const scrollThreshold = 50;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            if (currentScroll > scrollThreshold) {
                navbar.classList.add('navbar--solid');
                navbar.classList.remove('navbar--transparent');
            } else {
                navbar.classList.add('navbar--transparent');
                navbar.classList.remove('navbar--solid');
            }

            lastScroll = currentScroll;
        }, { passive: true });
    },

    // Initialize animations with GSAP
    initAnimations() {
        if (!this.config.animationsEnabled || typeof gsap === 'undefined') return;

        // Register ScrollTrigger
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }

        // Animate elements with data-animate attribute
        document.querySelectorAll('[data-animate]').forEach(el => {
            const animation = el.dataset.animate;
            const delay = parseFloat(el.dataset.delay) || 0;

            gsap.from(el, {
                opacity: 0,
                y: animation === 'fade-up' ? 30 : 0,
                x: animation === 'fade-left' ? -30 : animation === 'fade-right' ? 30 : 0,
                duration: 0.8,
                delay: delay,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            });
        });
    },

    // Lazy loading for videos and images
    initLazyLoading() {
        const lazyElements = document.querySelectorAll('[data-lazy]');

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const el = entry.target;

                        if (el.tagName === 'VIDEO') {
                            el.src = el.dataset.src;
                            el.load();
                        } else if (el.tagName === 'IMG') {
                            el.src = el.dataset.src;
                        }

                        el.removeAttribute('data-lazy');
                        observer.unobserve(el);
                    }
                });
            }, { rootMargin: '100px' });

            lazyElements.forEach(el => observer.observe(el));
        }
    },

    // i18n initialization
    initI18n() {
        // Load translations based on current language
        this.loadTranslations(this.config.lang);
    },

    // Load translation file
    async loadTranslations(lang) {
        try {
            const response = await fetch(`/i18n/${lang}.json`);
            if (response.ok) {
                this.translations = await response.json();
                this.applyTranslations();
            }
        } catch (error) {
            console.warn('Could not load translations:', error);
        }
    },

    // Apply translations to DOM
    applyTranslations() {
        if (!this.translations) return;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const translation = this.getTranslation(key);
            if (translation) {
                el.textContent = translation;
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            const translation = this.getTranslation(key);
            if (translation) {
                el.placeholder = translation;
            }
        });
    },

    // Get nested translation by key
    getTranslation(key) {
        return key.split('.').reduce((obj, k) => obj?.[k], this.translations);
    },

    // Switch language
    switchLanguage(lang) {
        this.config.lang = lang;
        localStorage.setItem('kaalytics-lang', lang);
        document.documentElement.lang = lang;
        this.loadTranslations(lang);

        // Update active state in language switcher
        document.querySelectorAll('.lang-switcher__option').forEach(el => {
            el.classList.toggle('lang-switcher__option--active', el.dataset.lang === lang);
        });
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => Kaalytics.init());

// Export for use in other modules
window.Kaalytics = Kaalytics;
