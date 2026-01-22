/**
 * KAALYTICS - Chatbot Loader
 * ===========================
 * Charge dynamiquement le widget chatbot
 *
 * Usage:
 * <script src="{{path}}/components/chatbot/chatbot-loader.js"></script>
 *
 * Configuration optionnelle:
 * window.CHATBOT_CONFIG = {
 *   position: 'bottom-right',  // 'bottom-right' | 'bottom-left'
 *   theme: 'dark',             // 'dark' | 'light'
 *   whatsappNumber: '+212661718141'
 * };
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURATION
    // ========================================

    const CONFIG = window.CHATBOT_CONFIG || {};
    const DEFAULTS = {
        position: 'bottom-right',
        theme: 'dark',
        whatsappNumber: '+212661718141',
        containerId: 'chatbot-container'
    };

    // Reponses predefinies de l'IA
    const AI_RESPONSES = {
        pricing: {
            fr: "Nos tarifs FleetOps Pro:\n• Starter: 500€/mois (10-50 véhicules)\n• Professional: 1500€/mois (50-200 véhicules)\n• Enterprise: Sur mesure (200+ véhicules)\n\nTous incluent formation et support. Voulez-vous une démo personnalisée?",
            en: "FleetOps Pro Pricing:\n• Starter: €500/month (10-50 vehicles)\n• Professional: €1500/month (50-200 vehicles)\n• Enterprise: Custom (200+ vehicles)\n\nAll include training and support. Would you like a personalized demo?"
        },
        demo: {
            fr: "Super ! Pour organiser une démo personnalisée, vous pouvez:\n1. Remplir le formulaire sur notre page Contact\n2. Nous appeler au +212 661 718 141\n3. Nous écrire sur WhatsApp\n\nNous vous recontactons sous 24h !",
            en: "Great! To schedule a personalized demo, you can:\n1. Fill out the form on our Contact page\n2. Call us at +212 661 718 141\n3. Message us on WhatsApp\n\nWe'll get back to you within 24h!"
        },
        roi: {
            fr: "Avec FleetOps Pro, nos clients constatent en moyenne:\n• -30% sur les coûts de maintenance\n• -15% sur la consommation de carburant\n• ROI atteint en 4-6 mois\n\nUtilisez notre calculateur ROI pour une estimation personnalisée !",
            en: "With FleetOps Pro, our clients see on average:\n• -30% on maintenance costs\n• -15% on fuel consumption\n• ROI achieved in 4-6 months\n\nUse our ROI calculator for a personalized estimate!"
        },
        default: {
            fr: "Merci pour votre message ! Un conseiller Kaalytics vous répondra très bientôt. En attendant, n'hésitez pas à consulter nos tarifs ou demander une démo.",
            en: "Thank you for your message! A Kaalytics advisor will respond very soon. In the meantime, feel free to check our pricing or request a demo."
        }
    };

    // ========================================
    // PATH DETECTION
    // ========================================

    function detectRootPath() {
        const scripts = document.querySelectorAll('script[src*="chatbot-loader"]');
        if (scripts.length > 0) {
            const src = scripts[0].getAttribute('src');
            const depth = (src.match(/\.\.\//g) || []).length;
            return '../'.repeat(depth);
        }
        return '';
    }

    function replaceRootPlaceholders(html, rootPath) {
        return html.replace(/\{\{ROOT\}\}/g, rootPath);
    }

    // ========================================
    // CHATBOT LOADING
    // ========================================

    async function loadChatbotTemplate(rootPath) {
        const templateUrl = rootPath + 'components/chatbot/chatbot.html';

        try {
            const response = await fetch(templateUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } catch (error) {
            console.error('[Chatbot] Erreur chargement template:', error);
            return null;
        }
    }

    function extractChatbotContent(html) {
        const match = html.match(/<div class="chatbot"[^>]*>([\s\S]*?)<\/div>\s*$/i);
        if (match) {
            return html.match(/<div class="chatbot"[\s\S]*$/i)[0];
        }
        return html;
    }

    // ========================================
    // CHATBOT INTERACTIONS
    // ========================================

    function getCurrentLang() {
        return document.documentElement.lang || 'fr';
    }

    function addMessage(container, content, isBot = true) {
        const messagesEl = container.querySelector('#chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot__message chatbot__message--${isBot ? 'bot' : 'user'}`;

        if (isBot) {
            messageDiv.innerHTML = `
                <div class="chatbot__message-avatar">
                    <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <div class="chatbot__message-content"><p>${content.replace(/\n/g, '<br>')}</p></div>
            `;
        } else {
            messageDiv.innerHTML = `<div class="chatbot__message-content"><p>${content}</p></div>`;
        }

        messagesEl.appendChild(messageDiv);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        return messageDiv;
    }

    function showTypingIndicator(container) {
        const messagesEl = container.querySelector('#chatbotMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chatbot__message chatbot__message--bot chatbot__typing';
        typingDiv.innerHTML = `
            <div class="chatbot__message-avatar">
                <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
            </div>
            <div class="chatbot__message-content">
                <div class="chatbot__typing-dots"><span></span><span></span><span></span></div>
            </div>
        `;
        messagesEl.appendChild(typingDiv);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return typingDiv;
    }

    function handleQuickAction(container, action) {
        const lang = getCurrentLang();

        if (action === 'whatsapp') {
            const number = CONFIG.whatsappNumber || DEFAULTS.whatsappNumber;
            window.open(`https://wa.me/${number.replace(/[^0-9]/g, '')}`, '_blank');
            return;
        }

        // Add user message
        const userMessages = {
            pricing: { fr: 'Quels sont vos tarifs ?', en: 'What are your prices?' },
            demo: { fr: 'Je souhaite une démo', en: 'I would like a demo' },
            roi: { fr: 'Quel est le ROI ?', en: 'What is the ROI?' }
        };

        addMessage(container, userMessages[action]?.[lang] || userMessages[action]?.fr, false);

        // Show typing then response
        const typing = showTypingIndicator(container);
        setTimeout(() => {
            typing.remove();
            const response = AI_RESPONSES[action]?.[lang] || AI_RESPONSES[action]?.fr || AI_RESPONSES.default[lang];
            addMessage(container, response, true);
        }, 1000 + Math.random() * 500);
    }

    function handleUserInput(container, message) {
        if (!message.trim()) return;

        addMessage(container, message, false);

        // Clear input
        const input = container.querySelector('#chatbotInput');
        if (input) input.value = '';

        // Show typing then response
        const typing = showTypingIndicator(container);
        const lang = getCurrentLang();

        setTimeout(() => {
            typing.remove();
            addMessage(container, AI_RESPONSES.default[lang], true);
        }, 1500 + Math.random() * 1000);
    }

    function initInteractions(container) {
        const toggle = container.querySelector('#chatbotToggle');
        const window_ = container.querySelector('#chatbotWindow');
        const minimize = container.querySelector('#chatbotMinimize');
        const quickBtns = container.querySelectorAll('.chatbot__quick-btn');
        const input = container.querySelector('#chatbotInput');
        const sendBtn = container.querySelector('#chatbotSend');
        const badge = container.querySelector('.chatbot__badge');

        let isOpen = false;

        // Toggle chat
        function toggleChat(open) {
            isOpen = open ?? !isOpen;
            container.classList.toggle('chatbot--open', isOpen);
            toggle.setAttribute('aria-expanded', isOpen);
            if (isOpen && badge) badge.style.display = 'none';
        }

        toggle?.addEventListener('click', () => toggleChat());
        minimize?.addEventListener('click', () => toggleChat(false));

        // Quick actions
        quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                handleQuickAction(container, btn.dataset.action);
            });
        });

        // Send message
        function sendMessage() {
            const message = input?.value;
            if (message) handleUserInput(container, message);
        }

        sendBtn?.addEventListener('click', sendMessage);
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Auto-open after delay (optional)
        if (CONFIG.autoOpen) {
            setTimeout(() => {
                if (!isOpen) {
                    toggleChat(true);
                }
            }, CONFIG.autoOpenDelay || 5000);
        }
    }

    // ========================================
    // CSS INJECTION
    // ========================================

    function injectStyles() {
        if (document.getElementById('chatbot-styles')) return;

        const css = `
        .chatbot { position: fixed; bottom: 24px; right: 24px; z-index: 9999; font-family: 'Inter', sans-serif; }
        .chatbot--left { right: auto; left: 24px; }

        .chatbot__toggle {
            width: 60px; height: 60px; border-radius: 50%; border: none;
            background: linear-gradient(135deg, #10b981, #0d9488);
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
            transition: all 0.3s ease; position: relative;
        }
        .chatbot__toggle:hover { transform: scale(1.1); }
        .chatbot__icon { width: 28px; height: 28px; color: white; transition: all 0.3s; }
        .chatbot__icon--close { position: absolute; opacity: 0; transform: rotate(-90deg); }
        .chatbot--open .chatbot__icon--chat { opacity: 0; transform: rotate(90deg); }
        .chatbot--open .chatbot__icon--close { opacity: 1; transform: rotate(0); }

        .chatbot__badge {
            position: absolute; top: -5px; right: -5px; width: 20px; height: 20px;
            background: #ef4444; color: white; border-radius: 50%;
            font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center;
        }

        .chatbot__window {
            position: absolute; bottom: 80px; right: 0; width: 360px;
            background: rgba(10, 20, 18, 0.98); backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            opacity: 0; visibility: hidden; transform: translateY(20px) scale(0.95);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex; flex-direction: column; max-height: 500px;
        }
        .chatbot--open .chatbot__window { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }

        .chatbot__header {
            padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex; align-items: center; justify-content: space-between;
        }
        .chatbot__header-info { display: flex; align-items: center; gap: 12px; }
        .chatbot__avatar { width: 40px; height: 40px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .chatbot__avatar svg { width: 24px; height: 24px; color: white; }
        .chatbot__name { color: white; font-weight: 600; font-size: 14px; margin: 0; }
        .chatbot__status { color: #10b981; font-size: 12px; }
        .chatbot__minimize { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; padding: 8px; }
        .chatbot__minimize:hover { color: white; }
        .chatbot__minimize svg { width: 20px; height: 20px; }

        .chatbot__messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; min-height: 200px; }
        .chatbot__message { display: flex; gap: 8px; max-width: 90%; }
        .chatbot__message--user { margin-left: auto; flex-direction: row-reverse; }
        .chatbot__message-avatar { width: 28px; height: 28px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .chatbot__message-avatar svg { width: 16px; height: 16px; color: white; }
        .chatbot__message-content { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 10px 14px; }
        .chatbot__message--user .chatbot__message-content { background: linear-gradient(135deg, #10b981, #0d9488); }
        .chatbot__message-content p { color: white; font-size: 13px; line-height: 1.5; margin: 0; }

        .chatbot__typing-dots { display: flex; gap: 4px; }
        .chatbot__typing-dots span { width: 6px; height: 6px; background: rgba(255,255,255,0.5); border-radius: 50%; animation: typing 1s infinite; }
        .chatbot__typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .chatbot__typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }

        .chatbot__quick-actions { padding: 12px 16px; display: flex; flex-wrap: wrap; gap: 8px; border-top: 1px solid rgba(255,255,255,0.05); }
        .chatbot__quick-btn {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            padding: 6px 12px; border-radius: 20px; color: rgba(255,255,255,0.7);
            font-size: 12px; cursor: pointer; transition: all 0.2s;
        }
        .chatbot__quick-btn:hover { background: rgba(16,185,129,0.2); border-color: #10b981; color: #10b981; }

        .chatbot__input-area { padding: 12px 16px; display: flex; gap: 8px; border-top: 1px solid rgba(255,255,255,0.1); }
        .chatbot__input {
            flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px; padding: 10px 16px; color: white; font-size: 13px;
        }
        .chatbot__input::placeholder { color: rgba(255,255,255,0.4); }
        .chatbot__input:focus { outline: none; border-color: #10b981; }
        .chatbot__send {
            width: 40px; height: 40px; background: #10b981; border: none; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
        }
        .chatbot__send:hover { background: #0d9488; transform: scale(1.1); }
        .chatbot__send svg { width: 18px; height: 18px; color: white; }

        .chatbot__footer { padding: 8px 16px; text-align: center; font-size: 10px; color: rgba(255,255,255,0.3); }
        .chatbot__footer strong { color: #10b981; }

        @media (max-width: 480px) {
            .chatbot__window { width: calc(100vw - 32px); right: -8px; bottom: 70px; }
        }
        `;

        const style = document.createElement('style');
        style.id = 'chatbot-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ========================================
    // MAIN INITIALIZATION
    // ========================================

    async function init() {
        const rootPath = detectRootPath();
        console.log('[Chatbot] Root path detected:', rootPath || '(root)');

        const template = await loadChatbotTemplate(rootPath);
        if (!template) {
            console.error('[Chatbot] Impossible de charger le template');
            return;
        }

        // Inject styles
        injectStyles();

        // Create container
        let container = document.getElementById(CONFIG.containerId || DEFAULTS.containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = DEFAULTS.containerId;
            document.body.appendChild(container);
        }

        // Insert HTML
        let chatbotHTML = extractChatbotContent(template);
        chatbotHTML = replaceRootPlaceholders(chatbotHTML, rootPath);
        container.innerHTML = chatbotHTML;

        // Apply position
        const chatbot = container.querySelector('.chatbot');
        if (chatbot && (CONFIG.position || DEFAULTS.position) === 'bottom-left') {
            chatbot.classList.add('chatbot--left');
        }

        // Init interactions
        initInteractions(container);

        // Dispatch event
        window.dispatchEvent(new CustomEvent('chatbotLoaded', { detail: { container } }));

        console.log('[Chatbot] Charge avec succes');
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
