/**
 * MODULES IA - Interactive Hub
 * Version: 2.0 (Production Ready)
 *
 * Features:
 * - Random video playback per module
 * - Keyboard navigation (1-8, arrows)
 * - Info panel with module details
 * - Smooth transitions
 *
 * Usage:
 * 1. Include this script after the HTML
 * 2. Call initModulesIA() or let it auto-init on DOMContentLoaded
 */

(function() {
    'use strict';

    // =============================================
    // MODULE DATA
    // =============================================
    const MODULES_CONFIG = {
        daedalia: {
            title: 'Daedalia AI',
            icon: '<circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>',
            description: 'Assistant IA conversationnel de nouvelle generation. Daedalia comprend le contexte de votre entreprise et repond en langage naturel a toutes vos questions metier.',
            features: [
                'Comprehension contextuelle',
                'Multi-langues natif',
                'Integration donnees metier',
                'Apprentissage continu'
            ],
            stats: [
                { value: '95%', label: 'Precision' },
                { value: '<2s', label: 'Reponse' }
            ],
            videos: [
                'assets/videos/daedalia/daedalia-1.mp4',
                'assets/videos/daedalia/daedalia-2.mp4',
                'assets/videos/daedalia/daedalia-3.mp4',
                'assets/videos/daedalia/daedalia-4.mp4'
            ],
            link: '#daedalia'
        },
        industrial: {
            title: 'Industrial Operations',
            icon: '<path d="M2 20h20M5 20V8l7-5 7 5v12M9 20v-6h6v6"/>',
            description: 'Gestion complete de votre flotte industrielle avec IA predictive. Surveillance temps reel, alertes intelligentes et optimisation continue des operations.',
            features: [
                'Maintenance predictive IA',
                'Suivi GPS temps reel',
                'Alertes intelligentes',
                'Rapports automatises'
            ],
            stats: [
                { value: '-40%', label: 'Pannes' },
                { value: '+25%', label: 'Efficacite' }
            ],
            videos: [
                'assets/videos/industrial/industrial-1.mp4',
                'assets/videos/industrial/industrial-2.mp4',
                'assets/videos/industrial/industrial-3.mp4',
                'assets/videos/industrial/industrial-4.mp4',
                'assets/videos/industrial/industrial-5.mp4',
                'assets/videos/industrial/industrial-6.mp4'
            ],
            link: '#fleetops'
        },
        connectivity: {
            title: 'Connectivity & API',
            icon: '<circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83"/>',
            description: 'Integration transparente avec tous vos systemes existants. API REST puissante, webhooks en temps reel et synchronisation bidirectionnelle.',
            features: [
                'API REST documentee',
                'Webhooks temps reel',
                'SSO & OAuth 2.0',
                'SDK multi-langages'
            ],
            stats: [
                { value: '50+', label: 'Integrations' },
                { value: '99.9%', label: 'Uptime' }
            ],
            videos: [
                'assets/videos/connectivity/connectivity-1.mp4',
                'assets/videos/connectivity/connectivity-2.mp4',
                'assets/videos/connectivity/connectivity-3.mp4',
                'assets/videos/connectivity/connectivity-4.mp4',
                'assets/videos/connectivity/connectivity-5.mp4'
            ],
            link: '#api'
        },
        odoo: {
            title: 'Odoo Integration',
            icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
            description: 'Synchronisation bidirectionnelle avec Odoo ERP. Connectez ventes, stocks, comptabilite et RH pour une vision unifiee de votre entreprise.',
            features: [
                'Sync temps reel',
                'Tous modules Odoo',
                'Mapping personnalise',
                'Historique complet'
            ],
            stats: [
                { value: '100%', label: 'Compatibilite' },
                { value: '0', label: 'Perte donnees' }
            ],
            videos: [
                'assets/videos/odoo/odoo-1.mp4',
                'assets/videos/odoo/odoo-2.mp4',
                'assets/videos/odoo/odoo-3.mp4',
                'assets/videos/odoo/odoo-4.mp4'
            ],
            link: '#odoo'
        },
        'supply-chain': {
            title: 'Supply Chain',
            icon: '<rect x="1" y="6" width="6" height="6" rx="1"/><rect x="9" y="6" width="6" height="6" rx="1"/><rect x="17" y="6" width="6" height="6" rx="1"/><path d="M4 12v4a2 2 0 002 2h12a2 2 0 002-2v-4"/>',
            description: 'Optimisation logistique intelligente. Gestion predictive des stocks, planification automatique et tracabilite complete de la chaine d\'approvisionnement.',
            features: [
                'Stocks predictifs',
                'Planification auto',
                'Tracabilite complete',
                'Alertes ruptures'
            ],
            stats: [
                { value: '-30%', label: 'Stocks' },
                { value: '+20%', label: 'Rotation' }
            ],
            videos: [
                'assets/videos/supply-chain/supply-chain-1.mp4',
                'assets/videos/supply-chain/supply-chain-2.mp4',
                'assets/videos/supply-chain/supply-chain-3.mp4'
            ],
            link: '#supply-chain'
        },
        sales: {
            title: 'Sales Intelligence',
            icon: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
            description: 'Automatisation commerciale intelligente. Generation de devis, previsions IA et CRM integre pour accelerer vos cycles de vente.',
            features: [
                'Devis automatiques',
                'Previsions IA',
                'Pipeline visuel',
                'Scoring leads'
            ],
            stats: [
                { value: '+35%', label: 'Conversion' },
                { value: '-50%', label: 'Temps devis' }
            ],
            videos: [
                'assets/videos/sales/sales-1.mp4',
                'assets/videos/sales/sales-2.mp4',
                'assets/videos/sales/sales-3.mp4'
            ],
            link: '#sales'
        },
        cyber: {
            title: 'Cyber Security',
            icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
            description: 'Protection avancee de vos donnees et conformite reglementaire. Chiffrement bout-en-bout, audit trail complet et certifications internationales.',
            features: [
                'Chiffrement AES-256',
                'Conformite RGPD',
                'Audit trail complet',
                'Detection anomalies'
            ],
            stats: [
                { value: '0', label: 'Breches' },
                { value: 'ISO', label: '27001' }
            ],
            videos: [
                'assets/videos/cyber/cyber-1.mp4',
                'assets/videos/cyber/cyber-2.mp4'
            ],
            link: '#security'
        },
        marketing: {
            title: 'Marketing Analytics',
            icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
            description: 'Analyse marketing avancee avec attribution multi-touch. Mesurez le ROI de chaque campagne et optimisez vos investissements.',
            features: [
                'Attribution multi-touch',
                'ROI par canal',
                'Segmentation IA',
                'A/B testing'
            ],
            stats: [
                { value: '+60%', label: 'ROI' },
                { value: '360°', label: 'Vision' }
            ],
            videos: [
                'assets/videos/marketing/marketing-1.mp4'
            ],
            link: '#marketing'
        }
    };

    // Module order for keyboard navigation
    const MODULE_ORDER = ['daedalia', 'industrial', 'connectivity', 'odoo', 'supply-chain', 'sales', 'cyber', 'marketing'];

    // =============================================
    // STATE
    // =============================================
    let currentModule = 'daedalia';
    let videoPool = [];
    let playedVideos = [];
    let isLoading = false;

    // DOM Elements (cached after init)
    let elements = {};

    // =============================================
    // UTILITIES
    // =============================================

    /**
     * Fisher-Yates shuffle algorithm
     */
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Get base path for videos (handles different deployment locations)
     */
    function getBasePath() {
        // Check if we're in the sections folder (demo) or root
        const path = window.location.pathname;
        if (path.includes('/sections/')) {
            return '../../';
        }
        return '';
    }

    // =============================================
    // VIDEO MANAGEMENT
    // =============================================

    function initVideoPool(module) {
        const config = MODULES_CONFIG[module];
        const basePath = getBasePath();
        videoPool = shuffleArray(config.videos.map(v => basePath + v));
        playedVideos = [];
        console.log(`🎲 Pool initialized for ${module}:`, videoPool.length, 'videos');
    }

    function pickNextVideo() {
        if (videoPool.length === 0) {
            initVideoPool(currentModule);
            console.log('🔄 Pool recharged!');
        }
        const nextVideo = videoPool.shift();
        playedVideos.push(nextVideo);
        return nextVideo;
    }

    function loadAndPlayVideo(videoPath) {
        if (isLoading || !elements.video) return;
        isLoading = true;

        // Smooth transition
        elements.video.style.opacity = '0.5';

        setTimeout(() => {
            elements.video.src = videoPath;
            elements.video.load();

            elements.video.oncanplay = () => {
                isLoading = false;
                elements.video.style.opacity = '1';
                elements.video.play().catch(() => {});
            };

            elements.video.onerror = () => {
                console.warn('Video error:', videoPath);
                isLoading = false;
                elements.video.style.opacity = '1';
                if (videoPool.length > 0) {
                    loadAndPlayVideo(pickNextVideo());
                }
            };
        }, 100);

        // Update counter
        const config = MODULES_CONFIG[currentModule];
        const currentNum = playedVideos.length;
        if (elements.counter) {
            elements.counter.textContent = `Demo ${currentNum}/${config.videos.length}`;
        }
    }

    // =============================================
    // UI UPDATES
    // =============================================

    function updateInfoPanel(module) {
        const config = MODULES_CONFIG[module];
        if (!config) return;

        if (elements.panelIcon) {
            elements.panelIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2">${config.icon}</svg>`;
        }
        if (elements.panelTitle) {
            elements.panelTitle.textContent = config.title;
        }
        if (elements.panelBadge) {
            elements.panelBadge.textContent = `${config.videos.length} video${config.videos.length > 1 ? 's' : ''} demo`;
        }
        if (elements.panelDesc) {
            elements.panelDesc.textContent = config.description;
        }

        // Features
        if (elements.panelFeatures) {
            elements.panelFeatures.innerHTML = config.features.map(feature => `
                <li class="module-info-panel__feature">
                    <span class="module-info-panel__feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </span>
                    <span class="module-info-panel__feature-text">${feature}</span>
                </li>
            `).join('');
        }

        // Stats
        if (elements.panelStats) {
            elements.panelStats.innerHTML = config.stats.map(stat => `
                <div class="module-info-panel__stat">
                    <div class="module-info-panel__stat-value">${stat.value}</div>
                    <div class="module-info-panel__stat-label">${stat.label}</div>
                </div>
            `).join('');
        }

        // Update CTA link
        if (elements.panelCta) {
            elements.panelCta.href = config.link || '#contact';
        }

        // Show panel
        if (elements.infoPanel) {
            elements.infoPanel.classList.add('visible');
        }
    }

    function switchModule(module, showPanel = false) {
        if (!MODULES_CONFIG[module]) return;
        if (module === currentModule && videoPool.length > 0 && !showPanel) return;

        currentModule = module;
        const config = MODULES_CONFIG[module];

        // Init pool and play first video
        initVideoPool(module);
        const firstVideo = pickNextVideo();
        loadAndPlayVideo(firstVideo);

        // Update title
        if (elements.title) {
            elements.title.textContent = config.title;
        }

        // Update active states
        elements.nodes.forEach(n => n.classList.toggle('active', n.dataset.module === module));
        elements.lines.forEach(l => l.classList.toggle('active', l.dataset.module === module));
        elements.dots.forEach(d => d.classList.toggle('active', d.dataset.module === module));

        // Show panel if requested
        if (showPanel) {
            updateInfoPanel(module);
        }

        // Dispatch custom event for external listeners
        document.dispatchEvent(new CustomEvent('modulesIA:moduleChanged', {
            detail: { module, config }
        }));
    }

    // =============================================
    // EVENT HANDLERS
    // =============================================

    function handleNodeClick(e) {
        const node = e.currentTarget;
        const module = node.dataset.module;
        switchModule(module, true);
    }

    function handlePrevClick(e) {
        e.stopPropagation();
        if (playedVideos.length > 1) {
            const current = playedVideos.pop();
            videoPool.unshift(current);
            const prev = playedVideos[playedVideos.length - 1];
            loadAndPlayVideo(prev);
        }
    }

    function handleNextClick(e) {
        e.stopPropagation();
        const nextVideo = pickNextVideo();
        loadAndPlayVideo(nextVideo);
    }

    function handleVideoEnd() {
        console.log('▶️ Video ended - next random...');
        const nextVideo = pickNextVideo();
        loadAndPlayVideo(nextVideo);
    }

    function handleKeydown(e) {
        // Escape closes panel
        if (e.key === 'Escape' && elements.infoPanel) {
            elements.infoPanel.classList.remove('visible');
            return;
        }

        // Arrow navigation
        if (e.key === 'ArrowLeft' && elements.prevBtn) {
            elements.prevBtn.click();
            return;
        }
        if (e.key === 'ArrowRight' && elements.nextBtn) {
            elements.nextBtn.click();
            return;
        }

        // Number keys 1-8
        const keyIndex = ['1', '2', '3', '4', '5', '6', '7', '8'].indexOf(e.key);
        if (keyIndex !== -1 && MODULE_ORDER[keyIndex]) {
            switchModule(MODULE_ORDER[keyIndex], true);
        }
    }

    function handleCenterClick() {
        // Click on video opens panel for current module
        updateInfoPanel(currentModule);
    }

    // =============================================
    // INITIALIZATION
    // =============================================

    function cacheElements() {
        elements = {
            video: document.getElementById('modules-ia-video'),
            title: document.getElementById('modules-ia-title'),
            counter: document.getElementById('modules-ia-counter'),
            nodes: document.querySelectorAll('.section-modules-ia .module-node'),
            lines: document.querySelectorAll('.section-modules-ia .connection-line'),
            dots: document.querySelectorAll('.section-modules-ia .connection-dot'),
            prevBtn: document.getElementById('modules-ia-prev'),
            nextBtn: document.getElementById('modules-ia-next'),
            infoPanel: document.getElementById('modules-ia-panel'),
            panelClose: document.getElementById('modules-ia-panel-close'),
            panelIcon: document.getElementById('modules-ia-panel-icon'),
            panelTitle: document.getElementById('modules-ia-panel-title'),
            panelBadge: document.getElementById('modules-ia-panel-badge'),
            panelDesc: document.getElementById('modules-ia-panel-desc'),
            panelFeatures: document.getElementById('modules-ia-panel-features'),
            panelStats: document.getElementById('modules-ia-panel-stats'),
            panelCta: document.getElementById('modules-ia-panel-cta'),
            center: document.querySelector('.section-modules-ia .modules-ia__center')
        };
    }

    function bindEvents() {
        // Node clicks
        elements.nodes.forEach(node => {
            node.addEventListener('click', handleNodeClick);
        });

        // Navigation
        if (elements.prevBtn) {
            elements.prevBtn.addEventListener('click', handlePrevClick);
        }
        if (elements.nextBtn) {
            elements.nextBtn.addEventListener('click', handleNextClick);
        }

        // Video end
        if (elements.video) {
            elements.video.addEventListener('ended', handleVideoEnd);
        }

        // Close panel
        if (elements.panelClose) {
            elements.panelClose.addEventListener('click', () => {
                elements.infoPanel.classList.remove('visible');
            });
        }

        // Center click
        if (elements.center) {
            elements.center.addEventListener('click', handleCenterClick);
        }

        // Keyboard
        document.addEventListener('keydown', handleKeydown);
    }

    /**
     * Initialize the Modules IA section
     * @param {Object} options - Configuration options
     * @param {string} options.initialModule - Module to show first (default: 'daedalia')
     */
    function initModulesIA(options = {}) {
        const { initialModule = 'daedalia' } = options;

        // Check if section exists
        const section = document.querySelector('.section-modules-ia');
        if (!section) {
            console.warn('Modules IA section not found');
            return;
        }

        cacheElements();
        bindEvents();

        // Start with initial module
        switchModule(initialModule, false);

        // Activate initial connection line
        const initialLine = document.querySelector(`.connection-line[data-module="${initialModule}"]`);
        if (initialLine) {
            initialLine.classList.add('active');
        }

        console.log('✅ Modules IA initialized');
    }

    // =============================================
    // PUBLIC API
    // =============================================

    window.ModulesIA = {
        init: initModulesIA,
        switchModule: switchModule,
        getConfig: () => MODULES_CONFIG,
        getCurrentModule: () => currentModule
    };

    // Auto-init on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initModulesIA());
    } else {
        initModulesIA();
    }

})();
