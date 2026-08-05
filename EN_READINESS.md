# EN Readiness — activer le site full-anglais

_Statut : le site est FR canonique (defaut `fr`, auto-detection navigateur desactivee, systeme i18n unique = `assets/js/i18n/i18n.js` + `/assets/locales/*.json`, 1035 cles). Ce document liste ce qui reste pour un EN 100% propre, sans melange._

## Ce qui marche deja
- Dictionnaires `assets/locales/fr.json` + `en.json` : **1035 cles** chacun.
- **130 / 203** cles `data-i18n` de prod ont deja une traduction EN.
- Bascule via `?lang=en` ou le lang-switcher (aujourd'hui masque).

## Gap 1 — 73 cles `data-i18n` utilisees dans le HTML mais ABSENTES du dico
_(en mode EN elles gardent le texte FR par defaut = melange)_

- `chatbot.name`  — components/chatbot/chatbot.html
- `chatbot.placeholder`  — components/chatbot/chatbot.html
- `chatbot.poweredBy`  — components/chatbot/chatbot.html
- `chatbot.quick.demo`  — components/chatbot/chatbot.html
- `chatbot.quick.pricing`  — components/chatbot/chatbot.html
- `chatbot.quick.roi`  — components/chatbot/chatbot.html
- `chatbot.quick.whatsapp`  — components/chatbot/chatbot.html
- `chatbot.status`  — components/chatbot/chatbot.html
- `chatbot.welcome`  — components/chatbot/chatbot.html
- `contactPage.consent`  — contact.html
- `features.badge`  — components/sections/features.html
- `features.cta`  — components/sections/features.html
- `features.subtitle`  — components/sections/features.html
- `features.title`  — components/sections/features.html
- `footer.contact.title`  — components/footer/footer.html
- `footer.description`  — components/footer/footer.html
- `footer.industries.btp`  — components/footer/footer.html
- `footer.industries.location`  — components/footer/footer.html
- `footer.industries.mines`  — components/footer/footer.html
- `footer.industries.title`  — components/footer/footer.html
- `footer.industries.transport`  — components/footer/footer.html
- `footer.newsletter.btn`  — components/footer/footer.html
- `footer.products.daedalia`  — components/footer/footer.html
- `footer.products.fleetops`  — components/footer/footer.html
- `footer.products.modules`  — components/footer/footer.html
- `footer.products.pricing`  — components/footer/footer.html
- `footer.products.title`  — components/footer/footer.html
- `footer.resources.blog`  — components/footer/footer.html
- `footer.resources.cases`  — components/footer/footer.html
- `footer.resources.guides`  — components/footer/footer.html
- `footer.resources.playground`  — components/footer/footer.html
- `footer.resources.title`  — components/footer/footer.html
- `footer.rights`  — components/footer/footer.html
- `hero.discover`  — components/sections/hero.html
- `hero.metric1`  — components/sections/hero.html
- `hero.metric2`  — components/sections/hero.html
- `hero.metric3`  — components/sections/hero.html
- `hero.metric4`  — components/sections/hero.html
- `hero.proof`  — components/sections/hero.html
- `nav.modules`  — components/navbar/navbar.html
- `nav.modules.aiDesc`  — components/navbar/navbar.html
- `nav.modules.aiEngine`  — components/navbar/navbar.html
- `nav.modules.digitalDesc`  — components/navbar/navbar.html
- `nav.modules.digitalPlatform`  — components/navbar/navbar.html
- `nav.modules.erpConnect`  — components/navbar/navbar.html
- `nav.modules.erpDesc`  — components/navbar/navbar.html
- `nav.modules.financialDesc`  — components/navbar/navbar.html
- `nav.modules.financialOperations`  — components/navbar/navbar.html
- `nav.modules.fleetops`  — components/navbar/navbar.html
- `nav.modules.fleetopsDesc`  — components/navbar/navbar.html
- `nav.modules.marketingAutomation`  — components/navbar/navbar.html
- `nav.modules.marketingDesc`  — components/navbar/navbar.html
- `nav.modules.salesDesc`  — components/navbar/navbar.html
- `nav.modules.salesIntelligence`  — components/navbar/navbar.html
- `nav.modules.supplyChain`  — components/navbar/navbar.html
- `nav.modules.supplyDesc`  — components/navbar/navbar.html
- `pricing.badge`  — components/sections/pricing.html
- `pricing.enterprise.cta`  — components/sections/pricing.html
- `pricing.enterprise.desc`  — components/sections/pricing.html
- `pricing.enterprise.title`  — components/sections/pricing.html
- `pricing.monthly`  — components/sections/pricing.html
- `pricing.save`  — components/sections/pricing.html
- `pricing.trust.secure`  — components/sections/pricing.html
- `pricing.trust.support`  — components/sections/pricing.html
- `pricing.trust.trial`  — components/sections/pricing.html
- `pricing.yearly`  — components/sections/pricing.html
- `testimonials.badge`  — components/sections/testimonials.html
- `testimonials.cta`  — components/sections/testimonials.html
- `testimonials.stat1`  — components/sections/testimonials.html
- `testimonials.stat2`  — components/sections/testimonials.html
- `testimonials.stat3`  — components/sections/testimonials.html
- `testimonials.subtitle`  — components/sections/testimonials.html
- `testimonials.title`  — components/sections/testimonials.html

## Gap 2 — 71 pages SANS aucun balisage `data-i18n`
_(100% figees en FR ; pour un EN complet il faut baliser + traduire, ou les exclure de l'EN)_

- about.html
- blog/digitalisation-flotte-btp.html
- blog/gps-tracking-erreurs.html
- blog/maintenance-predictive-guide.html
- blog/reduire-couts-flotte-ia.html
- blog/roi-gestion-flotte.html
- case-studies/index.html
- case-studies/locamat.html
- case-studies/terrafleet.html
- case-studies/transmaroc.html
- components/chatbot-widget.html
- components/cta-premium.html
- components/effects/3d-card-tilt.html
- components/effects/animated-counter.html
- components/effects/aurora-background.html
- components/effects/cursor-glow.html
- components/effects/floating-elements.html
- components/effects/glassmorphism-cards.html
- components/effects/glow-buttons.html
- components/effects/gradient-mesh.html
- components/effects/hover-underline.html
- components/effects/image-reveal.html
- components/effects/liquid-button.html
- components/effects/magnetic-cursor.html
- components/effects/morphing-shapes.html
- components/effects/neon-text.html
- components/effects/parallax-layers.html
- components/effects/particles-hero.html
- components/effects/scroll-reveal.html
- components/effects/spotlight-effect.html
- components/effects/text-scramble.html
- components/effects/typewriter-effect.html
- components/effects/wave-divider.html
- components/hero-premium.html
- components/index.html
- components/navbar/_example-usage.html
- components/roi-calculator.html
- faq.html
- guides/checklist-maintenance.html
- guides/comparatif-fleet-management.html
- guides/guide-flotte-btp.html
- guides/index.html
- industries/btp.html
- industries/distribution.html
- industries/industrie.html
- industries/location.html
- industries/mines.html
- industries/transport.html
- integrations.html
- legal/cookies.html
- legal/mentions.html
- legal/privacy.html
- legal/terms.html
- merci.html
- modules/ai-engine.html
- modules/digital-platform.html
- modules/erp-connect.html
- modules/financial-operations.html
- modules/fleetops.html
- modules/marketing-automation.html
- modules/sales-intelligence.html
- modules/supply-chain.html
- playground/index.html
- portail-client/index.html
- pricing.html
- products/daedalia.html
- products/fleetops.html
- resources/index.html
- sections/modules-ia/demo.html
- sections/modules-ia/editor.html
- sections/modules-ia/section-modules-ia.html

## Gap 3 — Titres/hero sans `data-i18n`
- « Vos systemes. Sous steroides. » (h1 home)
- « 8 modules pour transformer vos operations » (h2 home)
- « Pret a transformer vos operations ? » (CTA home)
  -> ajouter un attribut `data-i18n` + la cle EN correspondante.

## Gap 4 — SEO / hreflang
- `index.html` declare `hreflang` fr/en/**ar** : l'arabe n'existe pas -> retirer.
- Prevoir des URLs EN dediees (`?lang=en` OK court terme ; `/en/` recommande pour le SEO a terme).

## Activation (quand les gaps 1-3 sont combles)
1. Reactiver l'auto-detection navigateur dans `i18n.js::init()` (ligne `savedLang || this.defaultLang`) -> `savedLang || browserLang || this.defaultLang`.
2. Reafficher le lang-switcher (navbar).
3. Verifier page par page en mode EN (aucun texte FR residuel hors marque : noms de modules, « Made in Morocco »).
