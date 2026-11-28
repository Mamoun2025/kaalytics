// Maquette de l'accueil : apparitions des têtes de section et des éléments marqués, une fois, en CSS (base.css).
// Les éléments d'un même groupe arrivent en décalé de 90 ms.
(function () {
    'use strict';

    var elements = document.querySelectorAll('.tete, [data-apparition]');
    if (!document.documentElement.classList.contains('anime') || !('IntersectionObserver' in window)) {
        elements.forEach(function (element) { element.classList.add('est-vu'); });
        return;
    }

    elements.forEach(function (element) {
        var freres = element.parentNode.querySelectorAll(':scope > [data-apparition]');
        var rang = Array.prototype.indexOf.call(freres, element);
        if (rang > 0) element.style.transitionDelay = (rang * 0.09) + 's';
    });

    var veille = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (entree) {
            if (!entree.isIntersecting) return;
            entree.target.classList.add('est-vu');
            veille.unobserve(entree.target);
        });
    }, { rootMargin: '0px 0px -8% 0px' });
    elements.forEach(function (element) { veille.observe(element); });
})();
