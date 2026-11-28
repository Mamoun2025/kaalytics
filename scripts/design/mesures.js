// Mesures faites dans la page par scripts/design/tour.py (une fonction, rend un objet JSON).
() => {
    const ARTICLES = /^(le|la|les|l'|l’|un|une|des|du|votre|vos|notre|nos|the|a|an|your|our)\s/i;
    const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

    const famille = (rgb) => {
        const m = rgb.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?/);
        if (!m || (m[4] !== undefined && parseFloat(m[4]) < 0.15)) return null;
        const [r, g, b] = [m[1], m[2], m[3]].map((v) => parseInt(v, 10) / 255);
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;
        if (max - min < 0.12) return null; // neutre
        const s = (max - min) / (1 - Math.abs(2 * l - 1) || 1);
        if (s < 0.3) return null;
        let h = 0;
        if (max === r) h = ((g - b) / (max - min)) % 6;
        else if (max === g) h = (b - r) / (max - min) + 2;
        else h = (r - g) / (max - min) + 4;
        h = (h * 60 + 360) % 360;
        if (h >= 125 && h < 185) return 'vert';
        if (h >= 185 && h < 250) return 'bleu';
        if (h >= 250 && h < 300) return 'violet';
        if (h >= 300 && h < 345) return 'rose';
        if (h >= 345 || h < 15) return 'rouge';
        if (h >= 15 && h < 40) return 'orange';
        return 'jaune';
    };

    const couleurs = {};
    const polices = {};
    let bordsGauches = 0;
    let rayonMax = 0;
    const visibles = [...document.querySelectorAll('body *')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    });
    for (const el of visibles) {
        const st = getComputedStyle(el);
        for (const valeur of [st.color, st.backgroundColor, st.borderTopColor]) {
            const f = famille(valeur);
            if (f) couleurs[f] = (couleurs[f] || 0) + 1;
        }
        const police = st.fontFamily.split(',')[0].replace(/["']/g, '').trim();
        polices[police] = (polices[police] || 0) + 1;
        const gauche = parseFloat(st.borderLeftWidth);
        if (gauche >= 2 && gauche > parseFloat(st.borderRightWidth) && famille(st.borderLeftColor)) {
            bordsGauches += 1;
        }
        rayonMax = Math.max(rayonMax, parseFloat(st.borderTopLeftRadius) || 0);
    }

    const titres = [...document.querySelectorAll('h1, h2, h3')]
        .map((h) => ({ niveau: h.tagName, texte: h.innerText.replace(/\s+/g, ' ').trim() }))
        .filter((t) => t.texte);
    const titresLongs = titres.filter((t) => t.texte.split(' ').length > 4 || ARTICLES.test(t.texte));

    return {
        debordement: document.documentElement.scrollWidth - window.innerWidth,
        hauteur: document.documentElement.scrollHeight,
        couleurs,
        polices,
        bordsGauches,
        rayonMax,
        emojis: EMOJI.test(document.body.innerText),
        nbTitres: titres.length,
        titresLongs: titresLongs.slice(0, 12),
        nbTitresLongs: titresLongs.length,
        h1: (titres.find((t) => t.niveau === 'H1') || {}).texte || '',
    };
}
