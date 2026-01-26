/**
 * Newsletter Form Handler
 * Gestion du formulaire newsletter avec Formspree
 */

(function() {
    'use strict';

    function init() {
        const form = document.getElementById('newsletterForm');
        if (!form) return;

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            const email = form.querySelector('input[type="email"]').value;

            // Etat loading
            btn.disabled = true;
            btn.textContent = 'Envoi...';

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    // Succes
                    form.innerHTML = `
                        <div class="footer__newsletter-success">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                            <span>Merci ! Vous etes inscrit a notre newsletter.</span>
                        </div>
                    `;

                    // Track GA4
                    if (typeof gtag === 'function') {
                        gtag('event', 'newsletter_signup', {
                            'event_category': 'Newsletter',
                            'event_label': 'Footer Form',
                            'email_domain': email.split('@')[1]
                        });
                    }
                } else {
                    throw new Error('Erreur serveur');
                }
            } catch (error) {
                btn.disabled = false;
                btn.textContent = originalText;
                btn.style.background = '#ef4444';
                setTimeout(() => {
                    btn.style.background = '';
                }, 2000);
                console.error('Newsletter error:', error);
            }
        });
    }

    // Lancer au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
