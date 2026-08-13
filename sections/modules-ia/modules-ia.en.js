/**
 * MODULES IA - Interactive Hub
 * Version: 3.0 (8 Modules Kaalytics)
 *
 * Features:
 * - 8 module nodes with info panel
 * - Keyboard navigation (1-8, arrows)
 * - Smooth transitions & effects
 */

(function() {
    'use strict';

    // =============================================
    // MODULE DATA — 8 Modules Kaalytics
    // =============================================
    const MODULES_CONFIG = {
        'sales-intelligence': {
            title: 'Sales Intelligence',
            icon: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
            description: 'ERP-connected KPI dashboard, 3-level algorithmic prospect scoring, interactive map with optimized routes, quote generation in 30 seconds. Your sales reps know what to sell, to whom, and when.',
            features: [
                'Real-time Command Center',
                '3-level Matching Engine',
                'Interactive map + routes',
                'Automated Quote Agent',
                'B2B customer portal',
                'Daily Executive KPIs'
            ],
            videos: [
                '/assets/videos/sales/sales-1.mp4',
                '/assets/videos/sales/sales-2.mp4',
                '/assets/videos/sales/sales-3.mp4'
            ],
            link: 'modules/sales-intelligence'
        },
        'marketing-automation': {
            title: 'Marketing Automation',
            icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
            description: 'Targeted email campaigns with audience scoring, native pixel tracking, scheduled follow-ups. Every click feeds your sales pipeline. Measurable ROI in real time.',
            features: [
                'AI-targeted campaigns',
                'Marketing → Sales pipeline',
                'Pixel tracking ouvertures/clics',
                'Automated contact enrichment',
                'Product compatibility matrices'
            ],
            videos: [
                '/assets/videos/marketing/marketing-1.mp4',
                '/assets/videos/odoo/odoo-1.mp4',
                '/assets/videos/connectivity/connectivity-1.mp4'
            ],
            link: 'modules/marketing-automation'
        },
        'financial-operations': {
            title: 'Financial Operations',
            icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
            description: 'Cash flow under control. Order-delivery-invoice billing tracking, collections agent with automatic escalating reminders, real-time detection of uninvoiced orders.',
            features: [
                'Multi-year Finance Dashboard',
                'Billing pipeline with no gaps',
                'Escalating Collections Agent',
                'Real-time uninvoiced detection'
            ],
            videos: [
                '/assets/videos/odoo/odoo-1.mp4',
                '/assets/videos/odoo/odoo-2.mp4',
                '/assets/videos/connectivity/connectivity-4.mp4'
            ],
            link: 'modules/financial-operations'
        },
        'supply-chain': {
            title: 'Supply Chain Command',
            icon: '<rect x="1" y="6" width="6" height="6" rx="1"/><rect x="9" y="6" width="6" height="6" rx="1"/><rect x="17" y="6" width="6" height="6" rx="1"/><path d="M4 12v4a2 2 0 002 2h12a2 2 0 002-2v-4"/>',
            description: 'From supplier to end customer, every link is visible. Purchase planning, sales forecasting, automatic bottleneck detection, consolidated multi-entity inventory.',
            features: [
                'Operational Delivery Desk',
                'Supplier purchase planning',
                'Sales forecasting',
                'Complete value chain',
                'Automated pricing review'
            ],
            videos: [
                '/assets/videos/industrial/industrial-2.mp4',
                '/assets/videos/connectivity/connectivity-3.mp4',
                '/assets/videos/odoo/odoo-2.mp4'
            ],
            link: 'modules/supply-chain'
        },
        'fleetops': {
            title: 'FleetOps',
            icon: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
            description: 'Complete fleet management. Real-time GPS location, predictive maintenance, DA-RFQ-PO procurement workflow, profitability per asset and per job site. Every machine tracked, every intervention anticipated.',
            features: [
                'Real-time GPS Tracking',
                'AI Predictive Maintenance',
                'Procurement DA→RFQ→PO',
                'Project & job-site management',
                'TCO cost analysis',
                'Resource planning'
            ],
            videos: [
                '/assets/videos/industrial/industrial-1.mp4',
                '/assets/videos/industrial/industrial-2.mp4',
                '/assets/videos/industrial/industrial-3.mp4',
                '/assets/videos/industrial/industrial-4.mp4',
                '/assets/videos/industrial/industrial-5.mp4',
                '/assets/videos/industrial/industrial-6.mp4'
            ],
            link: 'modules/fleetops'
        },
        'erp-connect': {
            title: 'ERP Connect',
            icon: '<circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>',
            description: 'We plug into your existing ERP. Real-time read and write, bidirectional connectors for Odoo, SAP, Sage, Dynamics. Custom modules, deployed dashboards, mobile field interfaces.',
            features: [
                'Bidirectional connectors',
                'Custom ERP modules',
                'VPS-connected dashboards',
                'Mobile & field'
            ],
            videos: [
                '/assets/videos/connectivity/connectivity-1.mp4',
                '/assets/videos/connectivity/connectivity-2.mp4',
                '/assets/videos/connectivity/connectivity-3.mp4'
            ],
            link: 'modules/erp-connect'
        },
        'digital-platform': {
            title: 'Digital Platform',
            icon: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
            description: 'Complete digital presence. Premium responsive website, SEO and organic search, blog and content, B2B e-commerce connected to your ERP with real-time inventory and dynamic pricing.',
            features: [
                'Pro Website 2026 design',
                'Full SEO & search optimization',
                'Blog & content marketing',
                'ERP-connected B2B e-commerce',
                'Product data scraping'
            ],
            videos: [
                '/assets/videos/odoo/odoo-2.mp4',
                '/assets/videos/sales/sales-1.mp4',
                '/assets/videos/connectivity/connectivity-2.mp4'
            ],
            link: 'modules/digital-platform'
        },
        'ai-engine': {
            title: 'AI Engine',
            icon: '<path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/><circle cx="12" cy="12" r="3"/>',
            description: 'Artificial intelligence that works while you sleep. Specialized autonomous agents, intelligent email-to-action parsing, market research, business plans, and dynamic pricing.',
            features: [
                'Autonomous AI agents',
                'Intelligent NLP parsing',
                'Automated market research',
                'Multi-scenario business plans',
                'Pricing intelligence'
            ],
            videos: [
                '/assets/videos/cyber/cyber-1.mp4',
                '/assets/videos/cyber/cyber-2.mp4',
                '/assets/videos/architecture/ai-infrastructure-showcase.mp4'
            ],
            link: 'modules/ai-engine'
        }
    };

    const MODULE_ORDER = [
        'sales-intelligence', 'marketing-automation', 'financial-operations', 'supply-chain',
        'fleetops', 'erp-connect', 'digital-platform', 'ai-engine'
    ];

    // =============================================
    // STATE
    // =============================================
    let currentModule = 'sales-intelligence';
    let videoPool = [];
    let playedVideos = [];
    let isLoading = false;
    let elements = {};

    // =============================================
    // UTILITIES
    // =============================================
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    function getBasePath() {
        const path = window.location.pathname;
        if (path.includes('/sections/')) return '../../';
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
    }

    function pickNextVideo() {
        if (videoPool.length === 0) initVideoPool(currentModule);
        const nextVideo = videoPool.shift();
        playedVideos.push(nextVideo);
        return nextVideo;
    }

    function loadAndPlayVideo(videoPath) {
        if (isLoading || !elements.video) return;
        isLoading = true;
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
                isLoading = false;
                elements.video.style.opacity = '1';
                if (videoPool.length > 0) loadAndPlayVideo(pickNextVideo());
            };
        }, 100);

        const config = MODULES_CONFIG[currentModule];
        if (elements.counter) {
            elements.counter.textContent = `Demo ${playedVideos.length}/${config.videos.length}`;
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
        if (elements.panelTitle) elements.panelTitle.textContent = config.title;
        if (elements.panelBadge) {
            elements.panelBadge.textContent = '';
        }
        if (elements.panelDesc) elements.panelDesc.textContent = config.description;

        if (elements.panelFeatures) {
            elements.panelFeatures.innerHTML = config.features.map(f => `
                <li class="module-info-panel__feature">
                    <span class="module-info-panel__feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </span>
                    <span class="module-info-panel__feature-text">${f}</span>
                </li>
            `).join('');
        }

        if (elements.panelStats) {
            elements.panelStats.innerHTML = '';
        }

        if (elements.panelCta) {
            elements.panelCta.href = config.link || '#contact';
            elements.panelCta.textContent = 'View module';
        }
        if (elements.infoPanel) elements.infoPanel.classList.add('visible');
    }

    function switchModule(module, showPanel = false) {
        if (!MODULES_CONFIG[module]) return;
        if (module === currentModule && videoPool.length > 0 && !showPanel) return;

        currentModule = module;
        const config = MODULES_CONFIG[module];

        initVideoPool(module);
        loadAndPlayVideo(pickNextVideo());

        if (elements.title) elements.title.textContent = config.title;

        elements.nodes.forEach(n => n.classList.toggle('active', n.dataset.module === module));
        elements.lines.forEach(l => l.classList.toggle('active', l.dataset.module === module));
        elements.dots.forEach(d => d.classList.toggle('active', d.dataset.module === module));

        if (showPanel) updateInfoPanel(module);

        document.dispatchEvent(new CustomEvent('modulesIA:moduleChanged', { detail: { module, config } }));
    }

    // =============================================
    // EVENT HANDLERS
    // =============================================
    function handleNodeClick(e) {
        switchModule(e.currentTarget.dataset.module, true);
    }

    function handlePrevClick(e) {
        e.stopPropagation();
        if (playedVideos.length > 1) {
            const current = playedVideos.pop();
            videoPool.unshift(current);
            loadAndPlayVideo(playedVideos[playedVideos.length - 1]);
        }
    }

    function handleNextClick(e) {
        e.stopPropagation();
        loadAndPlayVideo(pickNextVideo());
    }

    function handleKeydown(e) {
        if (e.key === 'Escape' && elements.infoPanel) {
            elements.infoPanel.classList.remove('visible');
            return;
        }
        if (e.key === 'ArrowLeft' && elements.prevBtn) { elements.prevBtn.click(); return; }
        if (e.key === 'ArrowRight' && elements.nextBtn) { elements.nextBtn.click(); return; }

        const keyIndex = ['1','2','3','4','5','6','7','8'].indexOf(e.key);
        if (keyIndex !== -1 && MODULE_ORDER[keyIndex]) {
            switchModule(MODULE_ORDER[keyIndex], true);
        }
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
        elements.nodes.forEach(n => n.addEventListener('click', handleNodeClick));
        if (elements.prevBtn) elements.prevBtn.addEventListener('click', handlePrevClick);
        if (elements.nextBtn) elements.nextBtn.addEventListener('click', handleNextClick);
        if (elements.video) elements.video.addEventListener('ended', () => loadAndPlayVideo(pickNextVideo()));
        if (elements.panelClose) {
            elements.panelClose.addEventListener('click', () => elements.infoPanel.classList.remove('visible'));
        }
        if (elements.center) elements.center.addEventListener('click', () => updateInfoPanel(currentModule));
        document.addEventListener('keydown', handleKeydown);

        // Auto-hide panel when scrolling away from section
        window.addEventListener('scroll', function() {
            const section = document.querySelector('.section-modules-ia');
            if (section && elements.infoPanel && elements.infoPanel.classList.contains('visible')) {
                const rect = section.getBoundingClientRect();
                if (rect.bottom < 0 || rect.top > window.innerHeight) {
                    elements.infoPanel.classList.remove('visible');
                }
            }
        });
    }

    function initModulesIA(options = {}) {
        const { initialModule = 'sales-intelligence' } = options;
        const section = document.querySelector('.section-modules-ia');
        if (!section) return;

        cacheElements();
        bindEvents();
        switchModule(initialModule, false);

        const initialLine = document.querySelector(`.connection-line[data-module="${initialModule}"]`);
        if (initialLine) initialLine.classList.add('active');
    }

    window.ModulesIA = {
        init: initModulesIA,
        switchModule: switchModule,
        getConfig: () => MODULES_CONFIG,
        getCurrentModule: () => currentModule
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initModulesIA());
    } else {
        initModulesIA();
    }

})();
