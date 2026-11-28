// Maquette de l'accueil : défilement adouci (Lenis), barre posée, dérive du fond, fil de la démarche, profondeur des images.
(function () {
    'use strict';

    var barre = document.querySelector('.barre');
    function poserBarre() { barre.classList.toggle('est-posee', window.scrollY > 40); }
    window.addEventListener('scroll', poserBarre, { passive: true });
    poserBarre();

    var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.maquette = { anime: !calme && !!window.gsap && !!window.ScrollTrigger };
    if (!window.maquette.anime) return;

    gsap.registerPlugin(ScrollTrigger);

    // Défilement adouci à la molette ; le doigt garde le défilement natif du téléphone.
    if (window.Lenis) {
        var lenis = new Lenis({ duration: 1.15, smoothWheel: true });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (temps) { lenis.raf(temps * 1000); });
        gsap.ticker.lagSmoothing(0);
        document.querySelectorAll('a[href^="#"]').forEach(function (lien) {
            lien.addEventListener('click', function (evenement) {
                var cible = document.querySelector(lien.getAttribute('href'));
                if (!cible) return;
                evenement.preventDefault();
                lenis.scrollTo(cible, { duration: 1.6 });
            });
        });
    }

    // Fond : les nappes de brume remontent à des vitesses différentes sur toute la page.
    gsap.utils.toArray('.aurore i').forEach(function (nappe, rang) {
        gsap.to(nappe, {
            yPercent: -120 - rang * 60, xPercent: rang % 2 ? -18 : 22, ease: 'none',
            scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1.2 }
        });
    });

    gsap.fromTo('.fil span', { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: '#demarche', start: 'top 70%', end: 'center 45%', scrub: 0.8 }
    });

    // Images des cas et du globe : léger glissement en profondeur.
    gsap.utils.toArray('.cas img').forEach(function (image) {
        gsap.fromTo(image, { yPercent: 8, scale: 1.06 }, { yPercent: -4, scale: 1, ease: 'none', scrollTrigger: { trigger: image, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    });
    gsap.fromTo('.zones__globe', { yPercent: 14, rotate: -4 }, { yPercent: -10, rotate: 2, ease: 'none', scrollTrigger: { trigger: '.zones', start: 'top bottom', end: 'bottom top', scrub: 1 } });
    gsap.fromTo('.appel__fond', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.appel', start: 'top bottom', end: 'bottom bottom', scrub: 1 } });
})();
