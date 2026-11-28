// Maquette de l'accueil : déclenche l'assemblage du mur quand il entre dans l'écran (une fois) et fait tourner le compteur.
// Le mouvement des briques est en CSS (assemblage.css) ; ici, seulement la classe et le chiffre.
(function () {
    'use strict';

    var mur = document.querySelector('.mur');
    var compte = document.getElementById('compte');
    if (!mur || !document.documentElement.classList.contains('anime') || !('IntersectionObserver' in window)) return;

    var TOTAL = 8;
    var PAS_MS = 120;   // même cadence que les délais posés en CSS
    var ARRIVEE_MS = 520;
    compte.textContent = '0';

    var veille = new IntersectionObserver(function (entrees) {
        if (!entrees[0].isIntersecting) return;
        veille.disconnect();
        mur.classList.add('est-assemble');
        for (var rang = 1; rang <= TOTAL; rang += 1) {
            window.setTimeout(function (n) { compte.textContent = String(n); }, ARRIVEE_MS + (rang - 1) * PAS_MS, rang);
        }
    }, { threshold: 0.45 });
    veille.observe(mur);
})();
