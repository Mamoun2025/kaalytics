/**
 * Textes du bandeau de consentement.
 *
 * Ils vivaient dans assets/locales/*.json, chargés par un ancien système de
 * traduction qui réécrivait les pages au chargement. Ce système a été retiré :
 * il écrasait le contenu à jour du HTML par une copie périmée. Les libellés
 * ci-dessous sont repris mot pour mot de ces fichiers, sans aucune retouche.
 *
 * La langue vient de l'attribut lang du document, lui-même piloté par l'URL
 * (/en/... en anglais, le reste en français).
 */
(function () {
    'use strict';

    const TEXTES = {
        fr: {
            title: 'Nous respectons votre vie privée',
            text: 'Nous utilisons des cookies pour améliorer votre expérience et analyser le trafic.',
            privacyLink: 'Politique de confidentialité',
            decline: 'Refuser',
            customize: 'Personnaliser',
            acceptAll: 'Accepter tout',
            settingsTitle: 'Paramètres des cookies',
            close: 'Fermer',
            essential: 'Cookies essentiels',
            essentialDesc: 'Nécessaires au fonctionnement du site. Ils ne peuvent pas être désactivés.',
            analytics: 'Cookies analytiques',
            analyticsDesc: 'Nous aident à comprendre comment vous utilisez le site (Google Analytics).',
            marketing: 'Cookies marketing',
            marketingDesc: "Utilisés pour vous montrer des publicités pertinentes sur d'autres sites.",
            saveChoices: 'Enregistrer mes choix',
            acceptAllBtn: 'Tout accepter',
        },
        en: {
            title: 'We respect your privacy',
            text: 'We use cookies to improve your experience and analyze traffic.',
            privacyLink: 'Privacy Policy',
            decline: 'Decline',
            customize: 'Customize',
            acceptAll: 'Accept all',
            settingsTitle: 'Cookie settings',
            close: 'Close',
            essential: 'Essential cookies',
            essentialDesc: 'Necessary for the site to function. They cannot be disabled.',
            analytics: 'Analytics cookies',
            analyticsDesc: 'Help us understand how you use the site (Google Analytics).',
            marketing: 'Marketing cookies',
            marketingDesc: 'Used to show you relevant ads on other sites.',
            saveChoices: 'Save my choices',
            acceptAllBtn: 'Accept all',
        },
    };

    /**
     * Rend le libellé d'une clé « cookieConsent.xxx » dans la langue de la page.
     * Une clé inconnue renvoie la clé elle-même : visible en développement,
     * plutôt qu'un blanc silencieux en production.
     */
    window.texteConsentement = function (cle) {
        const langue = (document.documentElement.lang || 'fr').toLowerCase().startsWith('en')
            ? 'en'
            : 'fr';
        const nom = String(cle).replace(/^cookieConsent\./, '');
        return TEXTES[langue][nom] || TEXTES.fr[nom] || cle;
    };
})();
