/**
 * Exit-Intent Popup
 * Affiche une popup quand l'utilisateur s'apprete a quitter la page
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'kaalytics_exit_popup_shown';
    const COOKIE_DAYS = 7; // Ne pas reafficher pendant 7 jours
    const DELAY_MS = 5000; // Attendre 5 secondes avant d'activer

    let popupEnabled = false;
    let popupShown = false;

    // Verifier si le popup a deja ete affiche recemment
    function hasBeenShown() {
        const shown = localStorage.getItem(STORAGE_KEY);
        if (!shown) return false;

        const shownDate = new Date(shown);
        const now = new Date();
        const daysDiff = (now - shownDate) / (1000 * 60 * 60 * 24);

        return daysDiff < COOKIE_DAYS;
    }

    // Marquer comme affiche
    function markAsShown() {
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }

    // Creer le popup
    function createPopup() {
        const popup = document.createElement('div');
        popup.className = 'exit-popup';
        popup.id = 'exitPopup';

        popup.innerHTML = `
            <div class="exit-popup__content">
                <button class="exit-popup__close" aria-label="Fermer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>

                <div class="exit-popup__main">
                    <div class="exit-popup__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </div>

                    <span class="exit-popup__badge">Offre exclusive</span>

                    <h2 class="exit-popup__title">Attendez ! Ne partez pas les mains vides</h2>

                    <p class="exit-popup__subtitle">
                        Recevez notre <strong>guide gratuit</strong> : "10 strategies pour reduire vos couts de flotte de 30%" + un audit personnalise offert.
                    </p>

                    <form class="exit-popup__form" id="exitPopupForm" action="https://formspree.io/f/xpwzgvqe" method="POST">
                        <input type="hidden" name="_subject" value="[Exit Popup] Nouveau lead">
                        <input type="hidden" name="source" value="exit_popup">
                        <input type="email" name="email" class="exit-popup__input" placeholder="Votre email professionnel" required>
                        <button type="submit" class="exit-popup__btn">
                            Recevoir le guide gratuit
                        </button>
                        <p class="exit-popup__note">
                            Pas de spam. Desabonnement en 1 clic.
                        </p>
                    </form>

                    <button class="exit-popup__skip">Non merci, je prefere payer plus cher</button>
                </div>

                <div class="exit-popup__success">
                    <div class="exit-popup__success-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                    </div>
                    <h2 class="exit-popup__title">Merci !</h2>
                    <p class="exit-popup__subtitle">
                        Verifiez votre boite mail. Le guide arrive dans quelques minutes.
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(popup);
        return popup;
    }

    // Afficher le popup
    function showPopup() {
        if (popupShown || hasBeenShown()) return;

        const popup = document.getElementById('exitPopup') || createPopup();
        popup.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
        popupShown = true;
        markAsShown();

        // Track GA4 event
        if (typeof gtag === 'function') {
            gtag('event', 'exit_popup_shown', {
                'event_category': 'Exit Intent',
                'event_label': 'Popup Displayed'
            });
        }
    }

    // Cacher le popup
    function hidePopup() {
        const popup = document.getElementById('exitPopup');
        if (popup) {
            popup.classList.remove('is-visible');
            document.body.style.overflow = '';
        }
    }

    // Gerer la soumission du formulaire
    function handleFormSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const email = formData.get('email');

        // Envoyer a Formspree via fetch
        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                // Afficher succes
                document.querySelector('.exit-popup__main').style.display = 'none';
                document.querySelector('.exit-popup__success').classList.add('is-visible');

                // Track conversion
                if (typeof gtag === 'function') {
                    gtag('event', 'exit_popup_conversion', {
                        'event_category': 'Exit Intent',
                        'event_label': 'Form Submitted',
                        'email_domain': email.split('@')[1]
                    });
                }

                // Fermer apres 3 secondes
                setTimeout(hidePopup, 3000);
            }
        }).catch(error => {
            console.error('Form error:', error);
        });
    }

    // Detecter l'intention de sortie
    function handleMouseLeave(e) {
        if (!popupEnabled || popupShown) return;

        // Verifier si le curseur sort par le haut (intention de fermer/changer d'onglet)
        if (e.clientY <= 0) {
            showPopup();
        }
    }

    // Initialiser
    function init() {
        // Ne pas afficher sur mobile (pas d'exit intent fiable)
        if ('ontouchstart' in window) return;

        // Ne pas afficher si deja affiche recemment
        if (hasBeenShown()) return;

        // Creer le popup (mais ne pas l'afficher)
        createPopup();

        // Activer apres un delai
        setTimeout(() => {
            popupEnabled = true;
        }, DELAY_MS);

        // Ecouter l'intention de sortie
        document.addEventListener('mouseleave', handleMouseLeave);

        // Gerer les clics
        document.addEventListener('click', (e) => {
            const popup = document.getElementById('exitPopup');
            if (!popup) return;

            // Fermer sur X ou skip
            if (e.target.closest('.exit-popup__close') || e.target.closest('.exit-popup__skip')) {
                hidePopup();

                if (typeof gtag === 'function') {
                    gtag('event', 'exit_popup_closed', {
                        'event_category': 'Exit Intent',
                        'event_label': e.target.closest('.exit-popup__skip') ? 'Skipped' : 'Closed'
                    });
                }
            }

            // Fermer si clic en dehors
            if (e.target === popup) {
                hidePopup();
            }
        });

        // Gerer la soumission du formulaire
        document.getElementById('exitPopupForm')?.addEventListener('submit', handleFormSubmit);

        // Fermer avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hidePopup();
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
