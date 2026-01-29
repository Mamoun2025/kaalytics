/**
 * Kaalytics i18n System
 * Internationalization module with automatic language detection,
 * localStorage persistence, and DOM updates
 *
 * @version 1.0.0
 */

class I18n {
    constructor(options = {}) {
        this.defaultLang = options.defaultLang || 'fr';
        this.supportedLangs = options.supportedLangs || ['fr', 'en'];
        this.localesPath = options.localesPath || '/assets/locales';
        this.storageKey = 'kaalytics_lang';
        this.translations = {};
        this.currentLang = null;
        this.isLoaded = false;
        this.observers = [];
    }

    /**
     * Initialize the i18n system
     * Detects language preference and loads translations
     */
    async init() {
        // Determine language: localStorage > browser > default
        const savedLang = localStorage.getItem(this.storageKey);
        const browserLang = this.detectBrowserLanguage();

        this.currentLang = savedLang || browserLang || this.defaultLang;

        // Ensure language is supported
        if (!this.supportedLangs.includes(this.currentLang)) {
            this.currentLang = this.defaultLang;
        }

        // Load translations
        await this.loadTranslations(this.currentLang);

        // Update DOM
        this.updateDOM();

        // Update html lang attribute
        document.documentElement.lang = this.currentLang;

        // Update lang switcher UI
        this.updateLangSwitcher();

        this.isLoaded = true;
        this.notifyObservers('init', this.currentLang);

        // Setup lang switcher click handlers
        if (typeof setupLangSwitcher === 'function') {
            setupLangSwitcher();
        }

        console.log(`[i18n] Initialized with language: ${this.currentLang}`);
        document.dispatchEvent(new CustomEvent('i18nReady', { detail: { lang: this.currentLang } }));
        return this;
    }

    /**
     * Detect browser language preference
     * @returns {string|null} Language code or null
     */
    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        if (!browserLang) return null;

        // Extract primary language code (e.g., 'fr-FR' -> 'fr')
        const primaryLang = browserLang.split('-')[0].toLowerCase();

        // Check if supported
        if (this.supportedLangs.includes(primaryLang)) {
            return primaryLang;
        }

        return null;
    }

    /**
     * Load translations from JSON file
     * @param {string} lang - Language code
     */
    async loadTranslations(lang) {
        try {
            const cacheBuster = 'v=20260129b';
            const response = await fetch(`${this.localesPath}/${lang}.json?${cacheBuster}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${lang}.json: ${response.status}`);
            }
            this.translations[lang] = await response.json();
            console.log(`[i18n] Loaded translations for: ${lang}`);
        } catch (error) {
            console.error(`[i18n] Error loading translations for ${lang}:`, error);
            // Fallback to default language if not already
            if (lang !== this.defaultLang && !this.translations[this.defaultLang]) {
                await this.loadTranslations(this.defaultLang);
            }
        }
    }

    /**
     * Set active language
     * @param {string} lang - Language code
     */
    async setLanguage(lang) {
        if (!this.supportedLangs.includes(lang)) {
            console.warn(`[i18n] Unsupported language: ${lang}`);
            return;
        }

        if (lang === this.currentLang) return;

        // Load translations if not cached
        if (!this.translations[lang]) {
            await this.loadTranslations(lang);
        }

        this.currentLang = lang;
        localStorage.setItem(this.storageKey, lang);

        // Update DOM
        this.updateDOM();

        // Update html lang attribute
        document.documentElement.lang = lang;

        // Update lang switcher UI
        this.updateLangSwitcher();

        this.notifyObservers('change', lang);

        console.log(`[i18n] Language changed to: ${lang}`);
        document.dispatchEvent(new CustomEvent('i18nLanguageChanged', { detail: { lang } }));
    }

    /**
     * Translate a key
     * @param {string} key - Translation key (dot notation supported)
     * @param {object} params - Parameters for interpolation
     * @returns {string} Translated text or key if not found
     */
    translate(key, params = {}) {
        const translation = this.getNestedValue(
            this.translations[this.currentLang],
            key
        );

        if (translation === undefined) {
            console.warn(`[i18n] Missing translation for: ${key}`);
            return key;
        }

        // If translation is not a string (e.g. nested object), return key
        if (typeof translation !== 'string') {
            console.warn(`[i18n] Translation for "${key}" is not a string (got ${typeof translation})`);
            return key;
        }

        // Handle interpolation: {{variable}}
        return translation.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
            return params[paramKey] !== undefined ? params[paramKey] : match;
        });
    }

    /**
     * Shorthand for translate
     * @param {string} key
     * @param {object} params
     * @returns {string}
     */
    t(key, params = {}) {
        return this.translate(key, params);
    }

    /**
     * Get nested value from object using dot notation
     * @param {object} obj
     * @param {string} path
     * @returns {any}
     */
    getNestedValue(obj, path) {
        if (!obj) return undefined;
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Update all DOM elements with data-i18n attributes
     */
    updateDOM() {
        // Update text content
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translate(key);

            // Check for HTML content flag
            if (element.hasAttribute('data-i18n-html')) {
                element.innerHTML = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.translate(key);
        });

        // Update titles/tooltips
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.translate(key);
        });

        // Update aria-labels
        document.querySelectorAll('[data-i18n-aria]').forEach(element => {
            const key = element.getAttribute('data-i18n-aria');
            element.setAttribute('aria-label', this.translate(key));
        });

        // Update alt attributes
        document.querySelectorAll('[data-i18n-alt]').forEach(element => {
            const key = element.getAttribute('data-i18n-alt');
            element.alt = this.translate(key);
        });

        // Update value attributes (for buttons)
        document.querySelectorAll('[data-i18n-value]').forEach(element => {
            const key = element.getAttribute('data-i18n-value');
            element.value = this.translate(key);
        });
    }

    /**
     * Update language switcher UI
     */
    updateLangSwitcher() {
        const switchers = document.querySelectorAll('.lang-switcher');
        switchers.forEach(switcher => {
            const options = switcher.querySelectorAll('.lang-switcher__option');
            options.forEach(option => {
                const lang = option.getAttribute('data-lang');
                if (lang === this.currentLang) {
                    option.classList.add('lang-switcher__option--active');
                } else {
                    option.classList.remove('lang-switcher__option--active');
                }
            });
        });
    }

    /**
     * Add observer for language changes
     * @param {function} callback
     */
    onLanguageChange(callback) {
        this.observers.push(callback);
    }

    /**
     * Notify all observers
     * @param {string} event
     * @param {string} lang
     */
    notifyObservers(event, lang) {
        this.observers.forEach(callback => {
            try {
                callback(event, lang);
            } catch (error) {
                console.error('[i18n] Observer error:', error);
            }
        });
    }

    /**
     * Get current language
     * @returns {string}
     */
    getLanguage() {
        return this.currentLang;
    }

    /**
     * Get all supported languages
     * @returns {string[]}
     */
    getSupportedLanguages() {
        return [...this.supportedLangs];
    }

    /**
     * Check if translations are loaded
     * @returns {boolean}
     */
    isReady() {
        return this.isLoaded;
    }
}

// Create global instance
const i18n = new I18n({
    defaultLang: 'en',
    supportedLangs: ['fr', 'en'],
    localesPath: '/assets/locales'
});

// Setup lang switcher event listeners
function setupLangSwitcher() {
    const options = document.querySelectorAll('.lang-switcher__option');
    console.log('[i18n] Setting up', options.length, 'lang switcher options');

    options.forEach(option => {
        // Clone to remove any existing listeners
        const newOption = option.cloneNode(true);
        option.parentNode.replaceChild(newOption, option);
    });

    // Re-select and add listeners
    document.querySelectorAll('.lang-switcher__option').forEach(option => {
        option.style.cursor = 'pointer';
        // Add accessibility attributes
        option.setAttribute('role', 'button');
        option.setAttribute('tabindex', '0');

        // Handler function
        const handleLangSwitch = function(e) {
            e.preventDefault();
            e.stopPropagation();
            const lang = this.getAttribute('data-lang');
            console.log('[i18n] Switching to:', lang);
            if (lang && window.i18n) {
                window.i18n.setLanguage(lang);
            }
        };

        // Click event (desktop + mobile)
        option.addEventListener('click', handleLangSwitch);

        // Touch event for mobile (backup)
        option.addEventListener('touchend', function(e) {
            e.preventDefault();
            handleLangSwitch.call(this, e);
        }, { passive: false });

        // Keyboard support
        option.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLangSwitch.call(this, e);
            }
        });
    });
}

// Initialize function - called by pages after setting localesPath
window.initI18n = async function() {
    console.log('[i18n] initI18n called, localesPath:', i18n.localesPath);
    await i18n.init();
    setupLangSwitcher();
};

// Auto-init ONLY for root pages (localesPath starts with /)
// Subpages will call initI18n() manually after setting localesPath
function autoInit() {
    // Check if we're on a subpage by looking at the script's location
    const scripts = document.querySelectorAll('script[src*="i18n.js"]');
    const isSubpage = Array.from(scripts).some(s => s.src.includes('../'));

    if (!isSubpage && i18n.localesPath === '/assets/locales') {
        console.log('[i18n] Auto-init for root page');
        window.initI18n();
    } else {
        console.log('[i18n] Waiting for manual init (subpage detected)');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
} else {
    autoInit();
}

// Re-setup lang switcher when navbar is dynamically loaded
window.addEventListener('navbarLoaded', () => {
    console.log('[i18n] Navbar loaded, setting up lang switcher');
    setupLangSwitcher();
    // Update switcher UI to reflect current language
    if (window.i18n && window.i18n.isReady()) {
        window.i18n.updateLangSwitcher();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { I18n, i18n };
}

// Also expose globally
window.I18n = I18n;
window.i18n = i18n;
