// Maquette de l'accueil : les huit briques arrivent une à une et se collent autour de l'ERP, puis le mur se referme.
(function () {
    'use strict';
    if (!window.maquette || !window.maquette.anime) return;

    var mur = document.querySelector('.mur');
    var briques = gsap.utils.toArray('.brique');
    var compte = document.getElementById('compte');
    var ECART = 16; // jeu entre les briques avant la fermeture, en pixels

    gsap.set(mur, { '--jeu': ECART + 'px' });
    compte.textContent = '0';

    var scene = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
            trigger: '.assemblage', start: 'top top', end: '+=2400', scrub: 0.7,
            pin: '.assemblage__scene', anticipatePin: 1
        }
    });

    // L'ERP est déjà là quand la scène arrive : les briques viennent à lui.
    scene.fromTo('.socle', { scale: 0.92 }, { scale: 1, duration: 0.6 }, 0);

    briques.forEach(function (brique, rang) {
        var dx = Number(brique.dataset.x);
        var dy = Number(brique.dataset.y);
        scene.from(brique, {
            x: function () { return dx * window.innerWidth * 0.55 + (dy === 0 ? 0 : dx * 40); },
            y: function () { return dy * window.innerHeight * 0.6 + (dx === 0 ? 0 : dy * 60); },
            rotation: (rang % 2 ? 1 : -1) * (14 + rang * 3),
            scale: 0.55, opacity: 0, duration: 0.9,
            onComplete: function () { compte.textContent = String(Math.max(Number(compte.textContent), rang + 1)); },
            onReverseComplete: function () { compte.textContent = String(rang); }
        }, 0.35 + rang * 0.42);
    });

    // Fermeture : le jeu tombe à zéro, les briques se collent, un éclair court sur les jointures.
    var fin = 0.35 + briques.length * 0.42 + 0.5;
    scene
        .to(mur, { '--jeu': '0px', duration: 0.55, ease: 'power2.in' }, fin)
        .to(mur, { '--eclair': 1, duration: 0.18, ease: 'power1.out' }, fin + 0.5)
        .to(mur, { '--eclair': 0, scale: 1.03, duration: 0.7, ease: 'power2.out' }, fin + 0.68)
        .to({}, { duration: 0.6 });
})();
