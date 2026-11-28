// Maquette de l'accueil : entrée du titre mot par mot (du flou vers le net), puis sortie du hero au défilement.
(function () {
    'use strict';

    // Le film peut être prêt avant l'écoute posée dans la page : on rattrape.
    var film = document.querySelector('.hero__film video');
    if (film && film.readyState >= 2) film.parentNode.classList.add('est-pret');

    if (!window.maquette || !window.maquette.anime) return;

    // Chaque mot devient un bloc animable ; la ligne en dégradé reste entière pour garder son reflet.
    var premiere = document.querySelector('.hero__ligne:not(.hero__ligne--eclat)');
    premiere.innerHTML = premiere.textContent.trim().split(' ').map(function (mot) {
        return '<span class="hero__mot">' + mot + '</span>';
    }).join(' ');

    var entree = gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 0.15 });
    entree
        .from('.hero__mot', { yPercent: 70, opacity: 0, filter: 'blur(16px)', duration: 1.1, stagger: 0.12 })
        .from('.hero__ligne--eclat', { yPercent: 60, opacity: 0, scale: 0.94, duration: 1.2 }, '-=0.75')
        .from('.hero__chapeau', { y: 24, opacity: 0, duration: 0.9 }, '-=0.7')
        .from('.hero .bouton', { y: 20, opacity: 0, duration: 0.8 }, '-=0.6')
        .from('.barre', { yPercent: -40, opacity: 0, duration: 0.8 }, 0.2);

    // Sortie : le film recule et s'éteint, le texte monte, la section suivante arrive dans la même lumière.
    var paysage = window.matchMedia('(orientation: landscape), (min-width: 1101px)').matches;
    var sortie = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
    });
    sortie.to('.hero__texte', { yPercent: -28, opacity: 0, filter: 'blur(10px)' }, 0);
    if (paysage) {
        sortie.to('.hero__film', { scale: 1.16, yPercent: 10, opacity: 0.25 }, 0);
    }
})();
