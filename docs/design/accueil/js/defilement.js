// Maquette de l'accueil : défilement natif, sans bibliothèque. Une seule écoute du défilement, regroupée par image
// (requestAnimationFrame) : barre posée, sortie du hero, fil de la démarche. Écritures en transform et opacity seulement.
(function () {
    'use strict';

    var racine = document.documentElement;
    var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!calme) racine.classList.add('anime');

    var barre = document.querySelector('.barre');
    var hero = document.querySelector('.hero');
    var texte = document.querySelector('.hero__texte');
    var demarche = document.getElementById('demarche');
    var fil = document.querySelector('.fil span');
    var paysage = window.matchMedia('(orientation: landscape), (min-width: 1101px)');
    var enAttente = false;

    function borne(valeur) { return Math.min(1, Math.max(0, valeur)); }

    function peindre() {
        enAttente = false;
        var y = window.scrollY;
        var h = window.innerHeight;
        barre.classList.toggle('est-posee', y > 40);
        if (calme) return;

        // Sortie du hero : le texte monte et s'efface sur la première moitié d'écran (ordinateur seulement).
        if (paysage.matches) {
            var sortie = borne(y / (hero.offsetHeight * 0.6));
            texte.style.transform = 'translate3d(0,' + (-90 * sortie).toFixed(1) + 'px,0)';
            texte.style.opacity = (1 - sortie).toFixed(3);
        }

        // Fil de la démarche : rempli entre l'entrée de la section et son milieu.
        var cadre = demarche.getBoundingClientRect();
        if (cadre.top < h && cadre.bottom > 0) {
            fil.parentNode.style.setProperty('--avance', borne((h * 0.85 - cadre.top) / (h * 0.6)).toFixed(3));
        }
    }

    function demander() {
        if (enAttente) return;
        enAttente = true;
        requestAnimationFrame(peindre);
    }

    window.addEventListener('scroll', demander, { passive: true });
    window.addEventListener('resize', demander, { passive: true });
    peindre();
})();
