/**
 * Cookie Consent Manager - RGPD Compliant
 * Gere le consentement des cookies et le tracking analytics
 */

class CookieConsent {
    constructor() {
        this.COOKIE_NAME = 'kaalytics_cookie_consent';
        this.COOKIE_EXPIRY_DAYS = 365;
        this.consent = this.getConsent();

        this.init();
    }

    init() {
        // Si pas de consentement enregistre, afficher la banniere
        if (!this.consent) {
            this.showBanner();
        } else {
            // Appliquer les preferences enregistrees
            this.applyConsent(this.consent);
        }

        this.bindEvents();
    }

    getConsent() {
        const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith(this.COOKIE_NAME + '='));

        if (cookie) {
            try {
                return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    setConsent(consent) {
        const date = new Date();
        date.setTime(date.getTime() + (this.COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));

        document.cookie = `${this.COOKIE_NAME}=${encodeURIComponent(JSON.stringify(consent))}; expires=${date.toUTCString()}; path=/; SameSite=Lax; Secure`;

        this.consent = consent;
        this.applyConsent(consent);
    }

    applyConsent(consent) {
        // Analytics (Google Analytics 4)
        if (consent.analytics && typeof gtag === 'function') {
            gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        } else if (typeof gtag === 'function') {
            gtag('consent', 'update', {
                'analytics_storage': 'denied'
            });
        }

        // Marketing (pour futurs pixels Facebook/LinkedIn)
        if (consent.marketing) {
            window.cookieConsentMarketing = true;
            // Activer pixels marketing si presents
            this.enableMarketingPixels();
        }

        // Dispatch event pour autres scripts
        window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: consent }));
    }

    enableMarketingPixels() {
        // Facebook Pixel (si present)
        if (typeof fbq === 'function') {
            fbq('consent', 'grant');
        }

        // LinkedIn Insight Tag (si present)
        if (typeof _linkedin_partner_id !== 'undefined') {
            // LinkedIn tracking activé
        }
    }

    showBanner() {
        // Creer la banniere si elle n'existe pas
        if (!document.querySelector('.cookie-consent')) {
            this.createBanner();
        }

        // Afficher avec animation
        setTimeout(() => {
            document.querySelector('.cookie-consent')?.classList.add('is-visible');
        }, 1000);
    }

    hideBanner() {
        document.querySelector('.cookie-consent')?.classList.remove('is-visible');
    }

    t(key) {
        if (window.i18n && window.i18n.isReady()) {
            return window.i18n.t(key);
        }
        return key;
    }

    createBanner() {
        const banner = document.createElement('div');
        banner.className = 'cookie-consent';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', this.t('cookieConsent.title'));

        banner.innerHTML = `
            <div class="cookie-consent__container">
                <div class="cookie-consent__content">
                    <h3 class="cookie-consent__title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
                            <path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/>
                            <path d="M11 17v.01"/><path d="M7 14v.01"/>
                        </svg>
                        ${this.t('cookieConsent.title')}
                    </h3>
                    <p class="cookie-consent__text">
                        ${this.t('cookieConsent.text')}
                        <a href="/legal/privacy" target="_blank">${this.t('cookieConsent.privacyLink')}</a>
                    </p>
                </div>
                <div class="cookie-consent__actions">
                    <button class="cookie-consent__btn cookie-consent__btn--decline" data-action="decline">
                        ${this.t('cookieConsent.decline')}
                    </button>
                    <button class="cookie-consent__btn cookie-consent__btn--settings" data-action="settings">
                        ${this.t('cookieConsent.customize')}
                    </button>
                    <button class="cookie-consent__btn cookie-consent__btn--accept" data-action="accept">
                        ${this.t('cookieConsent.acceptAll')}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);
        this.createSettingsModal();
    }

    createSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'cookie-settings-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-label', this.t('cookieConsent.settingsTitle'));

        modal.innerHTML = `
            <div class="cookie-settings-modal__content">
                <div class="cookie-settings-modal__header">
                    <h3 class="cookie-settings-modal__title">${this.t('cookieConsent.settingsTitle')}</h3>
                    <button class="cookie-settings-modal__close" data-action="close-modal" aria-label="${this.t('cookieConsent.close')}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <div class="cookie-setting">
                    <div class="cookie-setting__header">
                        <span class="cookie-setting__name">${this.t('cookieConsent.essential')}</span>
                        <label class="cookie-toggle">
                            <input type="checkbox" checked disabled>
                            <span class="cookie-toggle__slider"></span>
                        </label>
                    </div>
                    <p class="cookie-setting__desc">
                        ${this.t('cookieConsent.essentialDesc')}
                    </p>
                </div>

                <div class="cookie-setting">
                    <div class="cookie-setting__header">
                        <span class="cookie-setting__name">${this.t('cookieConsent.analytics')}</span>
                        <label class="cookie-toggle">
                            <input type="checkbox" id="cookie-analytics" checked>
                            <span class="cookie-toggle__slider"></span>
                        </label>
                    </div>
                    <p class="cookie-setting__desc">
                        ${this.t('cookieConsent.analyticsDesc')}
                    </p>
                </div>

                <div class="cookie-setting">
                    <div class="cookie-setting__header">
                        <span class="cookie-setting__name">${this.t('cookieConsent.marketing')}</span>
                        <label class="cookie-toggle">
                            <input type="checkbox" id="cookie-marketing">
                            <span class="cookie-toggle__slider"></span>
                        </label>
                    </div>
                    <p class="cookie-setting__desc">
                        ${this.t('cookieConsent.marketingDesc')}
                    </p>
                </div>

                <div class="cookie-settings-modal__footer">
                    <button class="cookie-consent__btn cookie-consent__btn--decline" data-action="save-settings">
                        ${this.t('cookieConsent.saveChoices')}
                    </button>
                    <button class="cookie-consent__btn cookie-consent__btn--accept" data-action="accept-all">
                        ${this.t('cookieConsent.acceptAllBtn')}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showSettingsModal() {
        document.querySelector('.cookie-settings-modal')?.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
    }

    hideSettingsModal() {
        document.querySelector('.cookie-settings-modal')?.classList.remove('is-visible');
        document.body.style.overflow = '';
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;

            switch (action) {
                case 'accept':
                case 'accept-all':
                    this.acceptAll();
                    break;
                case 'decline':
                    this.declineAll();
                    break;
                case 'settings':
                    this.showSettingsModal();
                    break;
                case 'close-modal':
                    this.hideSettingsModal();
                    break;
                case 'save-settings':
                    this.saveSettings();
                    break;
            }
        });

        // Fermer modal avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSettingsModal();
            }
        });

        // Fermer modal en cliquant en dehors
        document.querySelector('.cookie-settings-modal')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('cookie-settings-modal')) {
                this.hideSettingsModal();
            }
        });
    }

    acceptAll() {
        this.setConsent({
            essential: true,
            analytics: true,
            marketing: true,
            timestamp: new Date().toISOString()
        });
        this.hideBanner();
        this.hideSettingsModal();
    }

    declineAll() {
        this.setConsent({
            essential: true,
            analytics: false,
            marketing: false,
            timestamp: new Date().toISOString()
        });
        this.hideBanner();
        this.hideSettingsModal();
    }

    saveSettings() {
        const analytics = document.getElementById('cookie-analytics')?.checked || false;
        const marketing = document.getElementById('cookie-marketing')?.checked || false;

        this.setConsent({
            essential: true,
            analytics,
            marketing,
            timestamp: new Date().toISOString()
        });
        this.hideBanner();
        this.hideSettingsModal();
    }
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    window.cookieConsent = new CookieConsent();
});

// Export pour usage externe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CookieConsent;
}
