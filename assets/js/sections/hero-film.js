/**
 * Hero : boucle vidéo de fond (26/11/2026)
 * - Film chargé seulement si l'utilisateur n'a demandé ni moins d'animations ni économie de données.
 * - Apparition en fondu dès la première image affichée (pas d'écran noir).
 * - Pause quand le hero sort de l'écran ou que l'onglet est caché (batterie, processeur).
 */
(function () {
    'use strict';

    var cadre = document.querySelector('.hero__film');
    var film = cadre && cadre.querySelector('.hero__film-video');
    if (!film) return;

    var moinsAnime = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var economie = navigator.connection && navigator.connection.saveData;
    if (moinsAnime || economie) {
        film.removeAttribute('autoplay');
        film.preload = 'none';
        film.pause();
        return;
    }

    var visible = true;

    function lancer() {
        if (!visible || document.hidden) return;
        var lecture = film.play();
        if (lecture && lecture.catch) lecture.catch(function () { /* lecture bloquée : l'image fixe reste */ });
    }

    // Le film peut démarrer (autoplay) avant ce script : on vérifie l'état présent, puis on écoute.
    function montrer() { cadre.classList.add('is-playing'); }
    if (!film.paused && film.readyState >= 2) montrer();
    film.addEventListener('playing', montrer, { once: true });
    film.addEventListener('timeupdate', montrer, { once: true });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entrees) {
            visible = entrees[0].isIntersecting;
            if (visible) lancer(); else film.pause();
        }, { threshold: 0.05 }).observe(cadre);
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) film.pause(); else lancer();
    });

    lancer();
})();
