// Globe des zones d'intervention, calculé (demande de Mamoun du 28/11/2026 : ajout des Émirats et des États-Unis).
// Les globes générés par image inventaient des noms de villes et les plaçaient mal : ici la géographie est exacte.
// Sortie : DIR/globe-fond.svg (terres en points, graticule, limbe) à convertir en WebP,
//          DIR/globe-reseau.json (positions des villes et tracés des arcs dans le même repère 1920 x 1080).
// Usage : NODE_PATH=<dossier avec d3-geo, topojson-client, world-atlas> node scripts/design/globe/genere.mjs DIR
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { geoOrthographic, geoPath, geoGraticule10, geoContains, geoInterpolate, geoBounds } from 'd3-geo';
import { feature } from 'topojson-client';

const require = createRequire(import.meta.url);
const LARGEUR = 1920, HAUTEUR = 1080;
const VILLES = [
    { code: 'CA', lon: -73.57, lat: 45.5 }, { code: 'US', lon: -74.0, lat: 40.71 },
    { code: 'MA', lon: -7.59, lat: 33.57 }, { code: 'FR', lon: 2.35, lat: 48.86 },
    { code: 'BE', lon: 4.35, lat: 50.85 }, { code: 'CH', lon: 6.14, lat: 46.2 },
    { code: 'AE', lon: 55.27, lat: 25.2 },
];
const ORIGINE = 'MA';

const sortie = process.argv[2];
mkdirSync(sortie, { recursive: true });
const monde = JSON.parse(readFileSync(require.resolve('world-atlas/land-50m.json'), 'utf8'));
const terres = feature(monde, monde.objects.land);
// Un polygone par terre, avec sa boîte : chaque point n'est testé que contre les terres proches (rapide).
const morceaux = terres.features.flatMap((f) => (f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates]))
    .map((anneaux) => { const g = { type: 'Polygon', coordinates: anneaux }; return { g, b: geoBounds(g) }; });
const surTerre = (lon, lat) => morceaux.some(({ g, b }) => lat >= b[0][1] && lat <= b[1][1]
    && (b[0][0] <= b[1][0] ? lon >= b[0][0] && lon <= b[1][0] : lon >= b[0][0] || lon <= b[1][0]) && geoContains(g, [lon, lat]));

// Globe large, centré sur l'Atlantique nord-est, haut du globe dans l'image : du Québec au Golfe.
const projection = geoOrthographic().rotate([12, -36, 0]).scale(1000).translate([LARGEUR / 2 + 40, HAUTEUR * 0.6]).clipAngle(90);
const trace = geoPath(projection);

// Terres en points : grille régulière en latitude, pas en longitude corrigé par la latitude.
const points = [];
for (let lat = -5; lat <= 82; lat += 1.15) {
    const pas = 1.15 / Math.max(Math.cos((lat * Math.PI) / 180), 0.25);
    for (let lon = -110; lon < 95; lon += pas) {
        if (!surTerre(lon, lat)) continue;
        const p = projection([lon, lat]);
        if (!p || p[1] < -20 || p[1] > HAUTEUR + 20 || p[0] < -20 || p[0] > LARGEUR + 20) continue;
        // face visible seulement
        const r = projection.rotate();
        const vu = Math.cos(((lat) * Math.PI) / 180) * Math.cos(((lon + r[0]) * Math.PI) / 180) * Math.cos((-r[1] * Math.PI) / 180)
            + Math.sin((lat * Math.PI) / 180) * Math.sin((-r[1] * Math.PI) / 180);
        if (vu <= 0.02) continue;
        points.push(`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${(1.5 + 1.1 * vu).toFixed(2)}" fill-opacity="${(0.35 + 0.55 * vu).toFixed(2)}"/>`);
    }
}

const disque = trace({ type: 'Sphere' });
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGEUR}" height="${HAUTEUR}" viewBox="0 0 ${LARGEUR} ${HAUTEUR}">
<defs>
  <radialGradient id="corps" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#0d2a21"/><stop offset="0.7" stop-color="#06140f"/><stop offset="1" stop-color="#030a07"/></radialGradient>
  <radialGradient id="limbe" cx="50%" cy="50%" r="50%"><stop offset="0.86" stop-color="#10b981" stop-opacity="0"/><stop offset="0.985" stop-color="#34d399" stop-opacity="0.55"/><stop offset="1" stop-color="#a7f3d0" stop-opacity="0.9"/></radialGradient>
</defs>
<rect width="100%" height="100%" fill="#040a08"/>
<path d="${disque}" fill="url(#corps)"/>
<path d="${trace(geoGraticule10())}" fill="none" stroke="#34d399" stroke-opacity="0.13" stroke-width="1"/>
<path d="${trace(terres)}" fill="#10b981" fill-opacity="0.07" stroke="#34d399" stroke-opacity="0.35" stroke-width="1"/>
<g fill="#5eeaa8">${points.join('')}</g>
<path d="${disque}" fill="url(#limbe)"/>
</svg>`;
writeFileSync(`${sortie}/globe-fond.svg`, svg);

// Villes et arcs : courbe du grand cercle, relevée vers le haut au milieu pour l'effet d'altitude.
const ou = Object.fromEntries(VILLES.map((v) => [v.code, projection([v.lon, v.lat]).map((n) => +n.toFixed(1))]));
const arcs = VILLES.filter((v) => v.code !== ORIGINE).map((v) => {
    const a = VILLES.find((x) => x.code === ORIGINE);
    const chemin = geoInterpolate([a.lon, a.lat], [v.lon, v.lat]);
    const pts = [];
    for (let t = 0; t <= 1.0001; t += 0.05) {
        const [x, y] = projection(chemin(t));
        pts.push([x, y - Math.sin(Math.PI * t) * Math.min(160, 40 + Math.hypot(ou[v.code][0] - ou.MA[0], ou[v.code][1] - ou.MA[1]) * 0.18)]);
    }
    return { vers: v.code, d: 'M' + pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join(' L') };
});
writeFileSync(`${sortie}/globe-reseau.json`, JSON.stringify({ largeur: LARGEUR, hauteur: HAUTEUR, villes: ou, arcs }, null, 1));
console.log(`${points.length} points de terre, villes :`, JSON.stringify(ou));
