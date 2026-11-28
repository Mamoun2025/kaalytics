// Thème Kaalytics 2026 : barre de navigation dynamique au défilement (branché sur toutes les pages par theme.py).
// - classe navbar--capsule dès qu'on quitte le haut de page (capsule flottante, navigation.css) ;
// - fil de lumière et perle : deux éléments ajoutés dans la barre, déplacés par transform seulement
//   (couche à part, rien n'est recalculé ni repeint pendant le défilement).
(function () {
    'use strict';

    var enAttente = false;
    var etatCapsule = null;
    var fil = null;
    var perle = null;

    function preparer(nav) {
        var conteneur = nav.querySelector('.navbar__container');
        if (!conteneur || conteneur.querySelector('.navbar__fil')) return;
        fil = document.createElement('span');
        fil.className = 'navbar__fil';
        fil.setAttribute('aria-hidden', 'true');
        perle = document.createElement('span');
        perle.className = 'navbar__perle';
        perle.setAttribute('aria-hidden', 'true');
        conteneur.appendChild(fil);
        conteneur.appendChild(perle);
    }

    function peindre() {
        enAttente = false;
        var nav = document.querySelector('.navbar');
        if (!nav) return;
        if (!fil) preparer(nav);
        var y = window.scrollY;
        var capsule = y > 24;
        if (capsule !== etatCapsule) {
            nav.classList.toggle('navbar--capsule', capsule);
            etatCapsule = capsule;
        }
        if (!fil) return;
        var course = document.documentElement.scrollHeight - window.innerHeight;
        var avance = course > 0 ? Math.min(1, y / course) : 0;
        fil.style.transform = 'scaleX(' + avance.toFixed(4) + ')';
        perle.style.transform = 'translate3d(' + (avance * fil.offsetWidth).toFixed(1) + 'px,0,0)';
    }

    function demander() {
        if (enAttente) return;
        enAttente = true;
        requestAnimationFrame(peindre);
    }

    window.addEventListener('scroll', demander, { passive: true });
    window.addEventListener('resize', function () { demander(); }, { passive: true });
    // La barre est injectée par navbar-loader.js : on la prépare dès qu'elle arrive.
    if ('MutationObserver' in window) {
        var veille = new MutationObserver(function () {
            if (!document.querySelector('.navbar .navbar__container')) return;
            veille.disconnect();
            demander();
        });
        veille.observe(document.documentElement, { childList: true, subtree: true });
    }
    document.addEventListener('DOMContentLoaded', demander);
})();
