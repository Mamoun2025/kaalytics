// Maquette de l'accueil : film du hero. Fondu dès la première image, pause hors écran ou onglet caché.
(function () {
    'use strict';

    var cadre = document.querySelector('.hero__film');
    var film = cadre && cadre.querySelector('video');
    if (!film) return;

    function montrer() { cadre.classList.add('est-pret'); }
    if (film.readyState >= 2) montrer();
    film.addEventListener('loadeddata', montrer, { once: true });
    film.addEventListener('playing', montrer, { once: true });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        film.pause();
        return;
    }

    var visible = true;
    function lancer() {
        if (!visible || document.hidden) return;
        var lecture = film.play();
        if (lecture && lecture.catch) lecture.catch(function () { /* lecture bloquée : l'image fixe reste */ });
    }

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entrees) {
            visible = entrees[0].isIntersecting;
            if (visible) lancer(); else film.pause();
        }, { threshold: 0.02 }).observe(cadre);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) film.pause(); else lancer(); });
})();
