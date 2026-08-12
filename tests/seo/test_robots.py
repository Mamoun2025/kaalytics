from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AI_BOTS = [
    "GPTBot", "ChatGPT-User", "CCBot", "anthropic-ai",
    "Claude-Web", "Google-Extended", "PerplexityBot",
]


def parse_groups(text):
    """Retourne {user_agent_minuscule: [regles]} depuis un robots.txt."""
    groups, current = {}, []
    for raw in text.splitlines():
        line = raw.split("#")[0].strip()
        if not line:
            continue
        key, _, value = line.partition(":")
        key, value = key.strip().lower(), value.strip()
        if key == "user-agent":
            current = groups.setdefault(value.lower(), [])
        elif key in ("allow", "disallow") and current is not None:
            current.append((key, value))
    return groups


def test_aucun_crawler_ia_bloque():
    groups = parse_groups((ROOT / "robots.txt").read_text(encoding="utf-8"))
    for bot in AI_BOTS:
        rules = groups.get(bot.lower(), [])
        assert ("disallow", "/") not in rules, f"{bot} est encore bloque"


def test_sous_ressources_de_rendu_autorisees():
    text = (ROOT / "robots.txt").read_text(encoding="utf-8")
    assert "Disallow: /assets/js/" not in text
    assert "Disallow: /components/" not in text


def test_trash_reste_bloque():
    rules = parse_groups((ROOT / "robots.txt").read_text(encoding="utf-8"))["*"]
    assert ("disallow", "/TRASH/") in rules


def test_sitemap_declare_et_directive_host_retiree():
    text = (ROOT / "robots.txt").read_text(encoding="utf-8")
    assert "Sitemap: https://kaalytics.com/sitemap.xml" in text
    assert "Host:" not in text


def test_aucun_user_agent_declare_deux_fois():
    text = (ROOT / "robots.txt").read_text(encoding="utf-8")
    agents = [
        l.split(":", 1)[1].strip().lower()
        for l in text.splitlines()
        if l.strip().lower().startswith("user-agent:")
    ]
    assert len(agents) == len(set(agents)), "AhrefsBot ou SemrushBot declare deux fois"


def test_llms_txt_present_et_liste_les_sections():
    text = (ROOT / "llms.txt").read_text(encoding="utf-8")
    for section in ("/modules/", "/industries/", "/blog/", "/guides/"):
        assert section in text
