// Accueil 2026 : apparitions, assemblage des briques, fil de la démarche, sortie du texte du hero.
// Défilement natif ; une seule écoute du défilement regroupée par image ; transform et opacity seulement.
// Le film du hero reste piloté par /assets/js/sections/hero-film.js (inchangé).
(function () {
    'use strict';

    var accueil = document.querySelector('.accueil');
    if (!accueil) return;
    var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var observateur = 'IntersectionObserver' in window;
    if (calme || !observateur) return;
    accueil.classList.add('anime');

    // Apparitions : une fois, en décalé de 90 ms dans un même groupe.
    var elements = accueil.querySelectorAll('.tete, [data-apparition]');
    elements.forEach(function (element) {
        var freres = element.parentNode.querySelectorAll(':scope > [data-apparition]');
        var rang = Array.prototype.indexOf.call(freres, element);
        if (rang > 0) element.style.transitionDelay = (rang * 0.09) + 's';
    });
    var veilleApparitions = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (entree) {
            if (!entree.isIntersecting) return;
            entree.target.classList.add('est-vu');
            veilleApparitions.unobserve(entree.target);
        });
    }, { rootMargin: '0px 0px -8% 0px' });
    elements.forEach(function (element) { veilleApparitions.observe(element); });

    // Assemblage : les briques se collent quand le mur entre dans l'écran ; le compteur suit la cadence CSS.
    var mur = accueil.querySelector('.mur');
    var compte = document.getElementById('compte');
    if (mur && compte) {
        compte.textContent = '0';
        var veilleMur = new IntersectionObserver(function (entrees) {
            if (!entrees[0].isIntersecting) return;
            veilleMur.disconnect();
            mur.classList.add('est-assemble');
            for (var rang = 1; rang <= 8; rang += 1) {
                window.setTimeout(function (n) { compte.textContent = String(n); }, 520 + (rang - 1) * 120, rang);
            }
        }, { threshold: 0.45 });
        veilleMur.observe(mur);
    }

    // Défilement : sortie du texte du hero (ordinateur) et fil de la démarche.
    var texteHero = document.querySelector('.hero__content');
    var hero = document.querySelector('.hero');
    var demarche = document.getElementById('demarche');
    var fil = demarche && demarche.querySelector('.fil');
    var paysage = window.matchMedia('(orientation: landscape), (min-width: 1101px)');
    var scenes = Array.prototype.slice.call(accueil.querySelectorAll('.scene'));
    var enAttente = false;

    function borne(valeur) { return Math.min(1, Math.max(0, valeur)); }
    function peindre() {
        enAttente = false;
        var y = window.scrollY;
        var h = window.innerHeight;
        if (texteHero && hero && paysage.matches) {
            var sortie = borne(y / (hero.offsetHeight * 0.6));
            texteHero.style.transform = sortie ? 'translate3d(0,' + (-90 * sortie).toFixed(1) + 'px,0)' : '';
            texteHero.style.opacity = sortie ? (1 - sortie).toFixed(3) : '';
        }
        // Fonds : glissent moins vite que le contenu (profondeur), seulement quand leur section est à l'écran.
        scenes.forEach(function (scene) {
            var boite = scene.parentNode.getBoundingClientRect();
            if (boite.bottom < 0 || boite.top > h) return;
            var centre = (boite.top + boite.height / 2 - h / 2) / h;
            scene.style.transform = 'translate3d(-50%,' + (centre * -70).toFixed(1) + 'px,0)';
        });
        if (fil) {
            var cadre = demarche.getBoundingClientRect();
            if (cadre.top < h && cadre.bottom > 0) fil.style.setProperty('--avance', borne((h * 0.85 - cadre.top) / (h * 0.6)).toFixed(3));
        }
    }
    window.addEventListener('scroll', function () {
        if (enAttente) return;
        enAttente = true;
        requestAnimationFrame(peindre);
    }, { passive: true });
    peindre();
})();
