#!/usr/bin/env python3
"""Génère sections/modules-ia/modules-ia.en.js (radar des modules, version anglaise)
à partir de modules-ia.js (FR) + le dictionnaire FR->EN de gen-en.py.
Traduit uniquement les chaînes en prose ; garde code/sélecteurs/noms de marque.

Usage: python3 scripts/gen-modules-en.py [--report]
"""
import re, sys, importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('gen', ROOT / 'scripts/gen-en.py')
gen = importlib.util.module_from_spec(spec); spec.loader.exec_module(gen)

SRC = ROOT / 'sections/modules-ia/modules-ia.js'
DST = ROOT / 'sections/modules-ia/modules-ia.en.js'
CODE = set('<>{}=/\\_#`$|')

def is_prose(s):
    return (' ' in s) and len(s) >= 6 and not any(c in CODE for c in s) \
        and re.search(r'[A-Za-zÀ-ÿ]{3,}', s) and not s.strip().startswith(('.', '#', 'http'))

# corrections d'articles élidés collés (l'/d' avant un mot désormais anglais)
FIXUPS = {
    "L\\'artificial intelligence that works while you sleep": "Artificial intelligence that works while you sleep",
}

def main():
    d = gen.build_dict()
    src = SRC.read_text(encoding='utf-8')
    report = []
    def repl(m):
        q = m.group(0); inner = q[1:-1]
        if is_prose(inner):
            key = gen.norm(inner)
            if key in d:
                return q[0] + d[key] + q[0]
            if gen.looks_french(inner) and inner != 'use strict':
                report.append(inner)
        return q
    out = re.sub(r"'([^'\\]*)'", repl, src)
    for a, b in FIXUPS.items():
        out = out.replace(a, b)
    if '--report' in sys.argv:
        print(f"FR non traduit: {len(report)}")
        for r in report[:40]: print('  ·', r[:100])
        return
    DST.write_text(out, encoding='utf-8')
    print(f"écrit {DST.relative_to(ROOT)} ({len(report)} FR résiduels — déjà EN/marque)")

if __name__ == '__main__':
    main()
