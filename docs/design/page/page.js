// Page de suivi « Kaalytics · design » : pistes (avant/après), constats et liste des pages depuis etat.json.
(() => {
    const LARGEURS = ['1440', '1024', '768', '390'];
    const PISTES = [
        {
            id: 'clair', nom: 'Clair', resume: 'Film et pied sombres, contenu sur blanc',
            points: ['Bandes blanches et gris vert clair en alternance', 'Émeraude profonde #047857 pour le texte d\'accent, émeraude du logo pour les boutons', 'Lecture longue plus confortable : blog, guides, pages légales'],
            fiche: { Police: 'Geist', Formes: 'Cases plates, arrondi 8 px', Effort: 'Le plus fort : toutes les sections et images à reprendre sur fond clair', Règle: 'Conforme au « fond blanc » des supports clients' },
            nuances: ['#ffffff', '#f2f6f4', '#0b1512', '#4a5f56', '#047857', '#10b981', '#040a08'],
        },
        {
            id: 'sombre', nom: 'Sombre sobre', resume: 'Continuité de la palette validée',
            points: ['Fond #040a08 partout, une seule nuance de bande', 'Texte en lumière et gris verts, émeraude réservée aux accents', 'Lignes plates, filets fins, ni halo ni dégradé'],
            fiche: { Police: 'Inter (actuelle)', Formes: 'Lignes à filets, arrondi 6 px', Effort: 'Le plus faible : jetons et sections, images inchangées', Règle: 'Palette du 23/11/2026 appliquée telle quelle' },
            nuances: ['#040a08', '#0a1512', '#ecfdf5', '#8fa59c', '#5f7a70', '#10b981', '#34d399'],
        },
        {
            id: 'technique', nom: 'Technique', resume: 'Registre tableau de bord',
            points: ['Trame de colonnes visible, cases bordées', 'Libellés en IBM Plex Mono, angles droits', 'Émeraude employée comme un voyant : points d\'état, chiffres'],
            fiche: { Police: 'IBM Plex Sans et Mono', Formes: 'Registre à filets, arrondi 2 px', Effort: 'Moyen : jetons, sections et composants', Règle: 'Palette du 23/11/2026, filets en brume #184c3d' },
            nuances: ['#040a08', '#071210', '#ecfdf5', '#8fa59c', '#184c3d', '#10b981', '#34d399'],
        },
    ];
    const GABARITS = [
        ['index', 'Accueil FR'], ['en__index', 'Accueil EN'], ['modules__fleetops', 'Module · FleetOps'], ['industries__btp', 'Industrie · BTP'],
        ['blog__roi-gestion-flotte', 'Article de blog'], ['pricing', 'Tarifs'], ['contact', 'Contact'], ['about', 'À propos'],
    ];
    const FAMILLES = { bleu: 'bleu', violet: 'violet', rose: 'rose', rouge: 'rouge', orange: 'orange', jaune: 'jaune' };
    const etatVue = { piste: 'clair', largeur: '1440', largeurGabarit: '1440', langue: 'Toutes', pages: [] };
    const $ = (id) => document.getElementById(id);
    const creer = (balise, classe, texte) => {
        const el = document.createElement(balise);
        if (classe) el.className = classe;
        if (texte !== undefined) el.textContent = texte;
        return el;
    };

    function onglets(conteneur, valeurs, courant, choisir) {
        conteneur.replaceChildren(...valeurs.map(([valeur, libelle]) => {
            const bouton = creer('button', '', libelle);
            bouton.type = 'button';
            bouton.setAttribute('aria-selected', String(valeur === courant));
            bouton.addEventListener('click', () => choisir(valeur));
            return bouton;
        }));
    }

    function afficherPiste() {
        const piste = PISTES.find((p) => p.id === etatVue.piste);
        onglets($('onglets-pistes'), PISTES.map((p) => [p.id, p.nom]), piste.id, (v) => { etatVue.piste = v; afficherPiste(); });
        onglets($('onglets-largeurs'), LARGEURS.map((l) => [l, `${l} px`]), etatVue.largeur, (v) => { etatVue.largeur = v; afficherPiste(); });
        const bloc = creer('div', 'piste');
        bloc.append(creer('h3', '', piste.nom), creer('p', 'note', piste.resume));
        const liste = creer('ul');
        piste.points.forEach((point) => liste.append(creer('li', '', point)));
        const fiche = creer('dl');
        Object.entries(piste.fiche).forEach(([cle, valeur]) => fiche.append(creer('dt', '', cle), creer('dd', '', valeur)));
        const nuancier = creer('div', 'nuancier');
        piste.nuances.forEach((code) => {
            const nuance = creer('span', '', code);
            const pastille = creer('i');
            pastille.style.background = code;
            nuance.prepend(pastille);
            nuancier.append(nuance);
        });
        bloc.append(liste, fiche, nuancier);
        $('piste').replaceChildren(bloc);
        $('nom-apres').textContent = `piste ${piste.nom}`;
        $('img-avant').src = `medias/avant/${etatVue.largeur}/index.jpg`;
        $('img-apres').src = `medias/pistes/${piste.id}-${etatVue.largeur}.jpg`;
        document.querySelectorAll('#img-avant, #img-apres').forEach((img) => img.parentElement.classList.toggle('etroite', etatVue.largeur === '390'));
    }

    function afficherGabarit() {
        const choix = $('choix-gabarit');
        if (!choix.options.length) {
            GABARITS.forEach(([fichier, nom]) => choix.append(new Option(nom, fichier)));
            choix.addEventListener('change', afficherGabarit);
        }
        onglets($('onglets-largeurs-gabarit'), LARGEURS.map((l) => [l, `${l} px`]), etatVue.largeurGabarit, (v) => { etatVue.largeurGabarit = v; afficherGabarit(); });
        $('img-gabarit').src = `medias/avant/${etatVue.largeurGabarit}/${choix.value}.jpg`;
        $('img-gabarit').parentElement.classList.toggle('etroite', etatVue.largeurGabarit === '390');
    }

    function puces(page) {
        const liste = [];
        if (page.echecs.length) liste.push(['Capture en échec', true]);
        if (page.erreurs.length) liste.push(['Erreur JS', true]);
        if (page.absents.length) liste.push([`${page.absents.length} fichier absent`, true]);
        if (page.debordements.length) liste.push([`Débordement ${page.debordements.join(', ')}`, true]);
        const hors = Object.keys(page.horsPalette).filter((f) => page.horsPalette[f] >= 3);
        if (hors.length) liste.push([`Hors palette : ${hors.map((f) => FAMILLES[f] || f).join(', ')}`, false]);
        if (page.bordsGauches) liste.push([`${page.bordsGauches} bord gauche coloré`, false]);
        if (page.emojis) liste.push(['Emoji', false]);
        if (page.titresLongs) liste.push([`${page.titresLongs} titres à reprendre`, false]);
        return liste;
    }

    function afficherPages() {
        const seulement = $('filtre-constats').checked;
        onglets($('filtre-langue'), ['Toutes', 'FR', 'EN'].map((l) => [l, l]), etatVue.langue, (v) => { etatVue.langue = v; afficherPages(); });
        const groupes = new Map();
        etatVue.pages
            .filter((p) => etatVue.langue === 'Toutes' || p.langue === etatVue.langue)
            .filter((p) => !seulement || puces(p).length)
            .forEach((p) => groupes.set(p.gabarit, [...(groupes.get(p.gabarit) || []), p]));
        const blocs = [...groupes].map(([gabarit, pages]) => {
            const groupe = creer('div', 'groupe');
            groupe.append(creer('h3', '', `${gabarit} · ${pages.length}`));
            pages.forEach((page) => {
                const ligne = creer('details');
                const tete = creer('summary');
                tete.append(creer('code', '', `/${page.page.replace(/(index)?\.html$/, '')}`));
                const constats = puces(page);
                if (!constats.length) tete.append(creer('span', 'puce puce--ok', 'Sans constat'));
                constats.forEach(([texte, alerte]) => tete.append(creer('span', `puce${alerte ? ' puce--alerte' : ''}`, texte)));
                const detail = creer('div', 'detail');
                if (page.h1) detail.append(creer('p', '', `Titre : ${page.h1}`));
                if (page.exemplesTitres.length) detail.append(creer('p', '', `Titres à reprendre : ${page.exemplesTitres.join(' · ')}`));
                if (page.erreurs.length) detail.append(creer('p', '', `Erreurs : ${page.erreurs.join(' · ')}`));
                if (page.absents.length) detail.append(creer('p', '', `Absents : ${page.absents.join(' · ')}`));
                ligne.append(tete, detail);
                ligne.addEventListener('toggle', () => {
                    if (!ligne.open || !page.vignette || detail.querySelector('img')) return;
                    const image = creer('img');
                    image.alt = `Haut de page, ordinateur et téléphone : ${page.page}`;
                    image.src = `medias/vignettes/${page.fichier}.jpg`;
                    detail.append(image);
                });
                groupe.append(ligne);
            });
            return groupe;
        });
        $('pages').replaceChildren(...(blocs.length ? blocs : [creer('p', 'note', 'Aucune page pour ce filtre.')]));
    }

    function afficherConstats() {
        const pages = etatVue.pages;
        const compter = (test) => pages.filter(test).length;
        const horsPalette = (p) => Object.values(p.horsPalette).some((n) => n >= 3);
        const chiffres = [
            [pages.length, 'pages visitées, FR et EN'],
            [compter((p) => p.erreurs.length), 'pages avec erreur JS'],
            [compter((p) => p.debordements.length), 'pages avec débordement horizontal'],
            [compter(horsPalette), 'pages avec couleurs hors palette'],
            [pages.reduce((somme, p) => somme + p.titresLongs, 0), 'titres à reprendre'],
            [compter((p) => p.bordsGauches), 'pages avec bord gauche coloré'],
        ];
        $('chiffres').replaceChildren(...chiffres.map(([nombre, libelle]) => {
            const bloc = creer('div');
            bloc.append(creer('b', '', String(nombre)), creer('span', '', libelle));
            return bloc;
        }));
        $('resume-tour').textContent = `${pages.length} pages, 4 largeurs, ${pages.length * 4} captures`;
    }

    afficherPiste();
    afficherGabarit();
    $('filtre-constats').addEventListener('change', afficherPages);
    fetch('etat.json')
        .then((reponse) => (reponse.ok ? reponse.json() : Promise.reject(new Error(String(reponse.status)))))
        .then((donnees) => {
            etatVue.pages = donnees.pages;
            const lignes = donnees.constats.map(([titre, texte]) => {
                const ligne = creer('li');
                const bloc = creer('div');
                bloc.append(creer('strong', '', titre), creer('span', '', texte));
                ligne.append(bloc);
                return ligne;
            });
            $('constats').replaceChildren(...lignes);
            afficherConstats();
            afficherPages();
        })
        .catch(() => { $('pages').replaceChildren(creer('p', 'note', 'État des pages indisponible : fichier etat.json non chargé.')); });
})();
