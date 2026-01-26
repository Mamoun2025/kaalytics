/**
 * Live Chat Integration - Crisp
 * Chat en direct pour support client
 *
 * CONFIGURATION:
 * Remplacer CRISP_WEBSITE_ID par votre ID Crisp
 * Obtenez-le sur: https://app.crisp.chat/settings/website/
 */

(function() {
    'use strict';

    // Configuration - REMPLACER PAR VOTRE ID CRISP
    const CRISP_WEBSITE_ID = 'YOUR_CRISP_WEBSITE_ID';

    // Ne pas charger si ID non configure
    if (CRISP_WEBSITE_ID === 'YOUR_CRISP_WEBSITE_ID') {
        console.log('[Crisp] Website ID not configured. Skipping initialization.');
        return;
    }

    // Initialiser Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

    // Configuration Crisp
    window.$crisp.push(['config', 'color:theme', '#10b981']); // Couleur verte Kaalytics

    // Charger le script Crisp
    (function() {
        const script = document.createElement('script');
        script.src = 'https://client.crisp.chat/l.js';
        script.async = true;
        document.getElementsByTagName('head')[0].appendChild(script);
    })();

    // Events Crisp -> GA4
    window.$crisp.push(['on', 'chat:opened', function() {
        if (typeof gtag === 'function') {
            gtag('event', 'chat_opened', {
                'event_category': 'Live Chat',
                'event_label': 'Chat Widget Opened'
            });
        }
    }]);

    window.$crisp.push(['on', 'message:sent', function() {
        if (typeof gtag === 'function') {
            gtag('event', 'chat_message_sent', {
                'event_category': 'Live Chat',
                'event_label': 'User Message Sent'
            });
        }
    }]);

    console.log('[Crisp] Initialized');
})();
