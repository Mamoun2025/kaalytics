// Mesures d'ergonomie faites dans la page par scripts/design/ergonomie.py (reçoit « tactile », rend { problemes }).
(tactile) => {
    const problemes = [];
    const L = window.innerWidth;
    const visible = (el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05;
    };
    const dansBarre = (el) => !!el.closest('.navbar, #navbar-container, .navbar__mobile-menu, .cookie-banner, [class*="cookie"]');
    const nom = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '');
    const texte = (el) => (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40);

    // Débordement horizontal
    const deborde = document.documentElement.scrollWidth - L;
    if (deborde > 2) problemes.push({ genre: 'debordement', detail: `page plus large de ${deborde} px` });

    // Texte du haut de page sous la barre fixe
    const barre = document.querySelector('.navbar');
    const basBarre = barre ? barre.getBoundingClientRect().bottom : 0;
    const feuilles = [...document.querySelectorAll('h1, h2, p, a, span, li, button')].filter((el) =>
        visible(el) && !dansBarre(el) && el.children.length === 0 && texte(el).length > 1);
    if (basBarre > 0) {
        const caches = feuilles.filter((el) => { const r = el.getBoundingClientRect(); return r.top < basBarre - 4 && r.bottom > 0; });
        if (caches.length) problemes.push({ genre: 'sous-barre', detail: caches.slice(0, 2).map((el) => `${nom(el)} « ${texte(el)} »`).join(', ') });
    }

    // Éléments qui sortent de l'écran à droite
    const sortants = feuilles.filter((el) => el.getBoundingClientRect().right > L + 2 && !el.closest('[style*="overflow"], .galerie, [class*="scroll"], [class*="carousel"], table'));
    if (sortants.length) problemes.push({ genre: 'debordement', detail: sortants.slice(0, 2).map((el) => `${nom(el)} « ${texte(el)} »`).join(', ') });

    // Colonnes trop étroites : blocs de texte longs, moins de 150 px de large
    const etroits = [...document.querySelectorAll('p, li, h3')].filter((el) => {
        if (!visible(el) || dansBarre(el)) return false;
        const r = el.getBoundingClientRect();
        return r.width < 150 && texte(el).length > 30 && !el.closest('table, .galerie, footer, .footer');
    });
    if (etroits.length > 2) problemes.push({ genre: 'colonnes-etroites', detail: `${etroits.length} blocs, ex. ${nom(etroits[0])} de ${Math.round(etroits[0].getBoundingClientRect().width)} px « ${texte(etroits[0])} »` });

    // Texte trop petit
    const petits = feuilles.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 12 && texte(el).length > 3 && !el.closest('footer, .footer'));
    if (petits.length > 2) problemes.push({ genre: 'texte-petit', detail: `${petits.length} éléments, ex. ${nom(petits[0])} ${getComputedStyle(petits[0]).fontSize} « ${texte(petits[0])} »` });

    // Cibles tactiles trop petites
    if (tactile) {
        const cibles = [...document.querySelectorAll('a, button, summary, [role="button"]')].filter((el) => {
            if (!visible(el) || dansBarre(el) || el.closest('p, li p, footer, .footer')) return false;
            const r = el.getBoundingClientRect();
            return r.height < 40 && r.width < 300 && texte(el).length > 0;
        });
        if (cibles.length > 2) problemes.push({ genre: 'cibles-petites', detail: `${cibles.length} liens ou boutons, ex. ${nom(cibles[0])} de ${Math.round(cibles[0].getBoundingClientRect().height)} px « ${texte(cibles[0])} »` });
    }

    // Titre principal centré mais décalé
    const h1 = document.querySelector('h1');
    if (h1 && visible(h1) && getComputedStyle(h1).textAlign === 'center') {
        const r = h1.getBoundingClientRect();
        const ecart = Math.round(r.left + r.width / 2 - L / 2);
        if (Math.abs(ecart) > 12) problemes.push({ genre: 'titre-decentre', detail: `h1 décalé de ${ecart} px « ${texte(h1)} »` });
    }

    // Bouton principal du hero : centré et entier, tenon compris (leçon du 28/11/2026 : brique décalée, tenon hors écran)
    const appel = document.querySelector('.hero__cta-main');
    if (appel && visible(appel) && L < 900) {
        const r = appel.getBoundingClientRect();
        const ecart = Math.round(r.left + r.width / 2 - L / 2);
        const tenon = parseFloat(getComputedStyle(appel, '::after').right) || 0;
        if (Math.abs(ecart) > 12 || r.right - Math.min(tenon, 0) > L) problemes.push({ genre: 'appel-decentre', detail: `bouton du hero décalé de ${ecart} px, bord droit à ${Math.round(r.right - Math.min(tenon, 0))} px` });
    }

    return { problemes, largeur: L };
}
