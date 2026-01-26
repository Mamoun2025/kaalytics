/**
 * Marketing Pixels Integration
 * Facebook Pixel + LinkedIn Insight Tag
 *
 * IMPORTANT: Ces pixels ne sont actives que si l'utilisateur
 * a accepte les cookies marketing dans le cookie consent.
 *
 * CONFIGURATION:
 * - Facebook Pixel ID: Remplacer FB_PIXEL_ID
 * - LinkedIn Partner ID: Remplacer LINKEDIN_PARTNER_ID
 */

(function() {
    'use strict';

    // Configuration - REMPLACER PAR VOS IDS
    const FB_PIXEL_ID = 'YOUR_FACEBOOK_PIXEL_ID';
    const LINKEDIN_PARTNER_ID = 'YOUR_LINKEDIN_PARTNER_ID';

    // Verifier le consentement marketing
    function hasMarketingConsent() {
        try {
            const consent = document.cookie
                .split('; ')
                .find(row => row.startsWith('kaalytics_cookie_consent='));

            if (consent) {
                const data = JSON.parse(decodeURIComponent(consent.split('=')[1]));
                return data.marketing === true;
            }
        } catch (e) {}
        return false;
    }

    // ========================================
    // Facebook Pixel
    // ========================================
    function initFacebookPixel() {
        if (FB_PIXEL_ID === 'YOUR_FACEBOOK_PIXEL_ID') {
            console.log('[FB Pixel] Not configured. Skipping.');
            return;
        }

        if (!hasMarketingConsent()) {
            console.log('[FB Pixel] Marketing consent not granted. Skipping.');
            return;
        }

        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');

        fbq('init', FB_PIXEL_ID);
        fbq('track', 'PageView');

        console.log('[FB Pixel] Initialized');
    }

    // ========================================
    // LinkedIn Insight Tag
    // ========================================
    function initLinkedInInsight() {
        if (LINKEDIN_PARTNER_ID === 'YOUR_LINKEDIN_PARTNER_ID') {
            console.log('[LinkedIn] Not configured. Skipping.');
            return;
        }

        if (!hasMarketingConsent()) {
            console.log('[LinkedIn] Marketing consent not granted. Skipping.');
            return;
        }

        window._linkedin_partner_id = LINKEDIN_PARTNER_ID;
        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
        window._linkedin_data_partner_ids.push(LINKEDIN_PARTNER_ID);

        (function(l) {
            if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
            window.lintrk.q=[]}
            var s = document.getElementsByTagName("script")[0];
            var b = document.createElement("script");
            b.type = "text/javascript";b.async = true;
            b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
            s.parentNode.insertBefore(b, s);
        })(window.lintrk);

        console.log('[LinkedIn] Initialized');
    }

    // ========================================
    // Tracking Events
    // ========================================
    window.trackFBEvent = function(eventName, params = {}) {
        if (typeof fbq === 'function' && hasMarketingConsent()) {
            fbq('track', eventName, params);
        }
    };

    window.trackLinkedInConversion = function(conversionId) {
        if (typeof lintrk === 'function' && hasMarketingConsent()) {
            lintrk('track', { conversion_id: conversionId });
        }
    };

    // ========================================
    // Auto-track conversions
    // ========================================
    function setupAutoTracking() {
        // Track form submissions as Lead
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', function() {
                window.trackFBEvent('Lead', {
                    content_name: this.id || 'contact_form'
                });
            });
        });

        // Track demo/contact button clicks
        document.querySelectorAll('a[href*="contact"], a[href*="demo"]').forEach(link => {
            link.addEventListener('click', function() {
                window.trackFBEvent('InitiateCheckout', {
                    content_name: this.textContent.trim()
                });
            });
        });
    }

    // ========================================
    // Initialize when consent is given
    // ========================================
    function init() {
        initFacebookPixel();
        initLinkedInInsight();
        setupAutoTracking();
    }

    // Ecouter les changements de consentement
    window.addEventListener('cookieConsentUpdated', function(e) {
        if (e.detail && e.detail.marketing) {
            init();
        }
    });

    // Verifier au chargement si consentement deja donne
    if (hasMarketingConsent()) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }
})();
