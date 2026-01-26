/**
 * WebP Detection & Modern Image Loading
 * Detecte le support WebP et ajoute une classe au body
 */

(function() {
    'use strict';

    function supportsWebP() {
        const canvas = document.createElement('canvas');
        if (canvas.getContext && canvas.getContext('2d')) {
            return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        }
        return false;
    }

    // Ajouter classe au body
    if (supportsWebP()) {
        document.documentElement.classList.add('webp');
    } else {
        document.documentElement.classList.add('no-webp');
    }

    // Exposer globalement
    window.supportsWebP = supportsWebP();
})();
