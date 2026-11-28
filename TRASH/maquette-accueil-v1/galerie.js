// Maquette de l'accueil : galerie des modules entraînée par le défilement (ordinateur). Au téléphone, glissement au doigt.
(function () {
    'use strict';
    if (!window.maquette || !window.maquette.anime) return;
    if (!window.matchMedia('(min-width: 901px)').matches) return;

    var piste = document.querySelector('.piste');
    function course() { return Math.max(0, piste.scrollWidth - window.innerWidth); }

    gsap.to(piste, {
        x: function () { return -course(); }, ease: 'none',
        scrollTrigger: {
            trigger: '.modules', start: 'top top', end: function () { return '+=' + course(); },
            scrub: 0.7, pin: '.modules__scene', anticipatePin: 1, invalidateOnRefresh: true
        }
    });
})();
