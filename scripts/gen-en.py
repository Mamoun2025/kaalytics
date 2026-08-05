#!/usr/bin/env python3
"""Générateur de la version anglaise /en/ à partir des pages FR (source de vérité).

Dictionnaire FR->EN = paires assets/locales/{fr,en}.json (mêmes clés)
                      + i18n/en-supplement.json (chaînes hors dico, traduites main).
Pour chaque page FR : clone -> /en/<path>, traduit les nœuds de texte visibles,
préfixe les liens absolus par /en/, lang=en, hreflang + canonical, meta/title/OG.
Ne touche jamais au code/attributs/URLs. Protège les noms de marque.

Usage: python3 scripts/gen-en.py <page1.html> [page2.html ...]   (--report pour la couverture seule)
"""
import json, re, sys, os, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://kaalytics.com"
PROTECT = ['Sales Intelligence','Marketing Automation','Financial Operations','Supply Chain Command',
           'ERP Connect','Digital Platform','AI Engine','Command Center','FleetOps','Kaalytics',
           'Daedalia','Made in Morocco','Daedalia AI']

def norm(s): return re.sub(r'\s+', ' ', s).strip()

def flatten(d, pre=''):
    out = {}
    for k, v in d.items():
        nk = f"{pre}{k}"
        if isinstance(v, dict): out.update(flatten(v, nk + '.'))
        elif isinstance(v, str): out[nk] = v
    return out

def build_dict():
    fr = flatten(json.load(open(ROOT/'assets/locales/fr.json', encoding='utf-8')))
    en = flatten(json.load(open(ROOT/'assets/locales/en.json', encoding='utf-8')))
    d = {}
    for k in fr:
        if k in en and norm(fr[k]) and norm(fr[k]) != norm(en[k]):
            d[norm(fr[k])] = en[k]
    sup = ROOT/'i18n/en-supplement.json'
    if sup.exists():
        for f, e in json.load(open(sup, encoding='utf-8')).items():
            d[norm(f)] = e
    return d

TAGBLOCK = re.compile(r'(<script[\s\S]*?</script>|<style[\s\S]*?</style>|<[^>]+>)', re.I)
FRENCH = re.compile(r'[a-zàâéèêîïôûùç]{2,}', re.I)

def looks_french(s):
    s = norm(s)
    if len(s) < 3 or not FRENCH.search(s): return False
    for ph in PROTECT:
        if norm(s) == norm(ph): return False
    return bool(re.search(r'[A-Za-zÀ-ÿ]', s))

def translate_page(html, d, report):
    parts = TAGBLOCK.split(html)
    for i in range(0, len(parts), 2):
        seg = parts[i]
        key = norm(seg)
        if not key: continue
        if key in d:
            parts[i] = seg.replace(seg.strip(), d[key], 1) if seg.strip() else seg
        elif looks_french(key):
            report.append(key)
    return ''.join(parts)

RESOURCE = re.compile(r'\.(css|js|png|jpe?g|svg|ico|webp|gif|woff2?|ttf|mp4|webm|json|xml|txt|pdf)(\?|$)', re.I)
def _is_resource(url):
    return url.startswith('assets/') or RESOURCE.search(url) or \
           re.match(r'(favicon|manifest|robots|sitemap|apple-touch|android-chrome|browserconfig|humans)', url)

def fix_links(html):
    def repl(m):
        attr, url, q = m.group(1), m.group(2), m.group(3)
        if url.startswith(('http', '//', '#', 'mailto:', 'tel:', 'data:', '/en/')):
            return m.group(0)
        # ressources -> chemin absolu racine (assets partagés)
        if not url.startswith('/') and _is_resource(url):
            return f'{attr}/{url}{q}'
        # liens de PAGE absolus internes -> /en/
        if url.startswith('/') and not url.startswith('//') and not _is_resource(url):
            return f'{attr}/en{url}{q}'
        # liens de page relatifs (about.html, modules/x.html) : gardés (résolvent dans /en/)
        return m.group(0)
    return re.sub(r'(src="|href=")([^"]+)(")', repl, html)

def add_hreflang(html, rel_path):
    fr_url = f"{BASE}/{rel_path}".replace('/index.html', '/').replace('.html', '')
    en_url = f"{BASE}/en/{rel_path}".replace('/index.html', '/').replace('.html', '')
    tags = (f'\n    <link rel="canonical" href="{en_url}">'
            f'\n    <link rel="alternate" hreflang="fr" href="{fr_url}">'
            f'\n    <link rel="alternate" hreflang="en" href="{en_url}">'
            f'\n    <link rel="alternate" hreflang="x-default" href="{fr_url}">')
    # retirer canonicals/hreflang FR existants puis injecter avant </head>
    html = re.sub(r'\s*<link rel="canonical"[^>]*>', '', html)
    html = re.sub(r'\s*<link rel="alternate" hreflang="[^"]*"[^>]*>', '', html)
    return html.replace('</head>', tags + '\n</head>', 1)

def gen_component(rel, d):
    """Traduit un fragment de composant (navbar/footer) -> <stem>.en.html.
    Texte seul : ni hreflang, ni lang, ni réécriture de liens ({{ROOT}} géré par le loader)."""
    src = ROOT / rel
    report = []
    out = translate_page(src.read_text(encoding='utf-8'), d, report)
    dst = src.with_name(src.stem + '.en' + src.suffix)
    dst.write_text(out, encoding='utf-8')
    print(f"{rel}: {len(report)} FR restant -> {dst.relative_to(ROOT)}")

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    report_only = '--report' in sys.argv
    d = build_dict()
    print(f"[gen-en] dictionnaire FR->EN : {len(d)} entrées")
    if '--component' in sys.argv:
        for rel in args:
            gen_component(rel, d)
        return
    for rel in args:
        src = ROOT / rel
        html = src.read_text(encoding='utf-8')
        report = []
        out = translate_page(html, d, report)
        out = re.sub(r'<html([^>]*)\blang="fr"', r'<html\1lang="en"', out)
        out = fix_links(out)
        out = add_hreflang(out, rel)
        # variantes EN des JS partagés à contenu FR (radar des modules)
        out = out.replace('modules-ia/modules-ia.js', 'modules-ia/modules-ia.en.js')
        cov = f"{rel}: {len(report)} chaînes FR non traduites"
        print(cov)
        for r in report[:200]: print("   ·", r)
        if not report_only:
            dst = ROOT / 'en' / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_text(out, encoding='utf-8')
            print(f"   -> écrit {dst.relative_to(ROOT)}")

if __name__ == '__main__':
    main()
