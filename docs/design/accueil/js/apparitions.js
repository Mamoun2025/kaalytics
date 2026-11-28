// Maquette de l'accueil : apparitions des têtes de section et des éléments marqués.
// Chargé en dernier : les scènes épinglées (assemblage, galerie) doivent exister avant le calcul des positions.
(function () {
    'use strict';
    if (!window.maquette || !window.maquette.anime) return;

    // Apparitions : têtes de section et éléments marqués, une fois, sans rebond.
    gsap.utils.toArray('.tete:not(.modules .tete), [data-apparition]').forEach(function (element) {
        gsap.from(element, {
            y: 44, opacity: 0, filter: 'blur(8px)', duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: element, start: 'top 88%', once: true }
        });
    });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
