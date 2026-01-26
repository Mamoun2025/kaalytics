/**
 * KAALYTICS - Footer Loader
 * ==========================
 * Charge dynamiquement le footer modulaire
 *
 * Usage dans HTML:
 * <div id="footer-container"
 *      data-footer="full|simple|minimal">
 * </div>
 * <script src="{{path}}/components/footer/footer-loader.js"></script>
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURATION
    // ========================================

    const CONFIG = window.FOOTER_CONFIG || {};
    const DEFAULTS = {
        variant: 'full',      // 'full' | 'simple' | 'minimal'
        containerId: 'footer-container'
    };

    // ========================================
    // PATH DETECTION
    // ========================================

    function detectRootPath() {
        const scripts = document.querySelectorAll('script[src*="footer-loader"]');
        if (scripts.length > 0) {
            const src = scripts[0].getAttribute('src');
            const depth = (src.match(/\.\.\//g) || []).length;
            return '../'.repeat(depth);
        }

        const path = window.location.pathname;
        const segments = path.split('/').filter(s => s && !s.includes('.'));
        const projectRoot = ['kaalytics'];
        const relevantSegments = segments.filter(s => !projectRoot.includes(s));

        return relevantSegments.length === 0 ? '' : '../'.repeat(relevantSegments.length);
    }

    function replaceRootPlaceholders(html, rootPath) {
        return html.replace(/\{\{ROOT\}\}/g, rootPath);
    }

    // ========================================
    // FOOTER LOADING
    // ========================================

    async function loadFooterTemplate(rootPath) {
        const templateUrl = rootPath + 'components/footer/footer.html';

        try {
            const response = await fetch(templateUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error('[Footer] Erreur chargement template:', error);
            return null;
        }
    }

    function extractFooterContent(html) {
        const match = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
        if (match) {
            return '<footer' + html.match(/<footer([^>]*)>/i)[1] + '>' + match[1] + '</footer>';
        }
        return html;
    }

    function applyVariant(container, variant) {
        if (variant === 'simple') {
            // Cacher newsletter et colonnes detaillees
            container.querySelectorAll('[data-footer-full]').forEach(el => {
                el.style.display = 'none';
            });
        } else if (variant === 'minimal') {
            // Garder uniquement le bottom
            container.querySelectorAll('.footer__newsletter, .footer__main').forEach(el => {
                el.style.display = 'none';
            });
        }
    }

    function initInteractions(container) {
        // Update year
        const yearEl = container.querySelector('#currentYear');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }

        // Newsletter form with Formspree
        const form = container.querySelector('#newsletterForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = form.querySelector('input[type="email"]').value;
                const btn = form.querySelector('button');
                const originalText = btn.textContent;

                // Loading state
                btn.textContent = 'Envoi...';
                btn.disabled = true;

                try {
                    const response = await fetch(form.action, {
                        method: 'POST',
                        body: new FormData(form),
                        headers: { 'Accept': 'application/json' }
                    });

                    if (response.ok) {
                        // Success
                        form.innerHTML = `
                            <div class="footer__newsletter-success">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                    <polyline points="22 4 12 14.01 9 11.01"/>
                                </svg>
                                <span>Merci ! Vous recevrez bientot nos actualites.</span>
                            </div>
                        `;

                        // GA4 tracking
                        if (typeof gtag === 'function') {
                            gtag('event', 'newsletter_signup', {
                                'event_category': 'Newsletter',
                                'event_label': 'Footer Form',
                                'email_domain': email.split('@')[1]
                            });
                        }

                        // Dispatch event
                        window.dispatchEvent(new CustomEvent('newsletterSubscribe', { detail: { email } }));
                    } else {
                        throw new Error('Server error');
                    }
                } catch (error) {
                    console.error('[Footer] Newsletter error:', error);
                    btn.textContent = 'Erreur';
                    btn.style.background = '#ef4444';
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.background = '';
                        btn.disabled = false;
                    }, 2000);
                }
            });
        }
    }

    // ========================================
    // MAIN INITIALIZATION
    // ========================================

    async function init() {
        const container = document.getElementById(CONFIG.containerId || DEFAULTS.containerId);
        const variant = CONFIG.variant || container?.dataset?.footer || DEFAULTS.variant;

        const rootPath = detectRootPath();
        console.log('[Footer] Root path detected:', rootPath || '(root)');

        const template = await loadFooterTemplate(rootPath);
        if (!template) {
            console.error('[Footer] Impossible de charger le template');
            return;
        }

        let footerHTML = extractFooterContent(template);
        footerHTML = replaceRootPlaceholders(footerHTML, rootPath);

        let targetContainer = container;
        if (!targetContainer) {
            targetContainer = document.createElement('div');
            targetContainer.id = DEFAULTS.containerId;
            document.body.appendChild(targetContainer);
        }

        targetContainer.innerHTML = footerHTML;

        const footer = targetContainer.querySelector('.footer');
        if (footer) {
            applyVariant(targetContainer, variant);
            initInteractions(targetContainer);
        }

        // Dispatch event
        window.dispatchEvent(new CustomEvent('footerLoaded', { detail: { footer, variant } }));

        console.log('[Footer] Charge avec succes:', { variant });
    }

    // ========================================
    // EXECUTION
    // ========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
