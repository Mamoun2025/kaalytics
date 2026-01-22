/* ============================================
   DIMENSIONS AUDIT MODAL
   Multi-step Lead Capture Form
   ============================================ */

const DimensionsAuditModal = (function() {
    'use strict';

    // === STATE ===
    let modalElement = null;
    let currentStep = 1;
    const totalSteps = 4;
    let formData = {
        // Step 1: Contact
        name: '',
        email: '',
        phone: '',
        // Step 2: Company
        company: '',
        industry: '',
        employees: '',
        // Step 3: Fleet
        hasFleet: null,
        fleetSize: '',
        machineTypes: [],
        // Step 4: Architecture (auto-filled)
        modules: [],
        connections: [],
        dimensions: []
    };

    // === INDUSTRY OPTIONS ===
    const industries = [
        { value: 'agriculture', label: 'Agriculture', icon: '🌾' },
        { value: 'btp', label: 'BTP / Construction', icon: '🏗️' },
        { value: 'transport', label: 'Transport / Logistique', icon: '🚚' },
        { value: 'industrie', label: 'Industrie / Manufacturing', icon: '🏭' },
        { value: 'energie', label: 'Énergie / Utilities', icon: '⚡' },
        { value: 'mining', label: 'Mines / Extraction', icon: '⛏️' },
        { value: 'services', label: 'Services', icon: '💼' },
        { value: 'commerce', label: 'Commerce / Distribution', icon: '🏪' },
        { value: 'autre', label: 'Autre', icon: '📋' }
    ];

    // === MACHINE TYPES ===
    const machineTypes = [
        { value: 'vehicules', label: 'Véhicules légers', icon: '🚗' },
        { value: 'camions', label: 'Camions / Poids lourds', icon: '🚛' },
        { value: 'engins', label: 'Engins de chantier', icon: '🚜' },
        { value: 'agricoles', label: 'Machines agricoles', icon: '🚜' },
        { value: 'industrielles', label: 'Machines industrielles', icon: '⚙️' },
        { value: 'manutention', label: 'Manutention / Chariots', icon: '📦' },
        { value: 'generateurs', label: 'Générateurs / Groupes', icon: '🔌' },
        { value: 'autre', label: 'Autre équipement', icon: '🔧' }
    ];

    // === INIT ===
    function init() {
        createModal();
        bindEvents();
        console.log('[AuditModal] Initialized');
    }

    // === CREATE MODAL ===
    function createModal() {
        modalElement = document.createElement('div');
        modalElement.className = 'audit-modal';
        modalElement.id = 'auditModal';
        modalElement.innerHTML = `
            <div class="audit-modal-backdrop"></div>
            <div class="audit-modal-container">
                <button class="audit-modal-close" id="auditModalClose">
                    <i data-lucide="x" class="icon-lg"></i>
                </button>

                <!-- Architecture Preview Hero -->
                <div class="audit-architecture-hero" id="architectureHero">
                    <div class="arch-hero-header">
                        <div class="arch-hero-badge">
                            <span class="arch-hero-icon"><i data-lucide="layout-grid" class="icon-md"></i></span>
                            <span class="arch-hero-label">Votre Architecture</span>
                        </div>
                        <div class="arch-hero-title">Prête pour l'analyse</div>
                    </div>

                    <div class="arch-hero-visual" id="archVisual">
                        <!-- Modules visuels générés dynamiquement -->
                    </div>

                    <div class="arch-hero-stats" id="archStats">
                        <!-- Stats générées dynamiquement -->
                    </div>

                    <div class="arch-hero-dimensions" id="archDimensions">
                        <!-- Dimensions générées dynamiquement -->
                    </div>
                </div>

                <!-- Progress -->
                <div class="audit-progress">
                    <div class="audit-progress-bar">
                        <div class="audit-progress-fill" style="width: 25%"></div>
                    </div>
                    <div class="audit-progress-steps">
                        <span class="audit-step-dot active" data-step="1">1</span>
                        <span class="audit-step-dot" data-step="2">2</span>
                        <span class="audit-step-dot" data-step="3">3</span>
                        <span class="audit-step-dot" data-step="4">4</span>
                    </div>
                </div>

                <!-- Steps Container -->
                <div class="audit-steps" id="auditSteps">
                    ${renderStep1()}
                    ${renderStep2()}
                    ${renderStep3()}
                    ${renderStep4()}
                </div>

                <!-- Navigation -->
                <div class="audit-nav">
                    <button class="audit-btn audit-btn-back" id="auditBack" style="visibility: hidden;">
                        <i data-lucide="arrow-left" class="icon-sm"></i> Retour
                    </button>
                    <button class="audit-btn audit-btn-next" id="auditNext">
                        Continuer <i data-lucide="arrow-right" class="icon-sm"></i>
                    </button>
                </div>

                <!-- Trust badges -->
                <div class="audit-trust">
                    <span class="trust-item"><i data-lucide="shield-check" class="icon-xs"></i> Données sécurisées</span>
                    <span class="trust-item"><i data-lucide="gift" class="icon-xs"></i> 100% Gratuit</span>
                    <span class="trust-item"><i data-lucide="zap" class="icon-xs"></i> Réponse 24h</span>
                </div>
            </div>
        `;
        document.body.appendChild(modalElement);
    }

    // === STEP 1: Contact ===
    function renderStep1() {
        return `
            <div class="audit-step active" data-step="1">
                <div class="audit-step-header">
                    <div class="audit-step-icon"><i data-lucide="user" class="icon-lg"></i></div>
                    <h2 class="audit-step-title">Vos coordonnées</h2>
                    <p class="audit-step-desc">Pour recevoir votre diagnostic personnalisé</p>
                </div>
                <div class="audit-fields">
                    <div class="audit-field">
                        <label class="audit-label">
                            <span class="label-icon"><i data-lucide="user-circle" class="icon-sm"></i></span>
                            Votre nom complet
                        </label>
                        <input type="text" class="audit-input" id="auditName"
                               placeholder="Ex: Mohammed Benali" autocomplete="name">
                    </div>
                    <div class="audit-field">
                        <label class="audit-label">
                            <span class="label-icon"><i data-lucide="mail" class="icon-sm"></i></span>
                            Email professionnel
                        </label>
                        <input type="email" class="audit-input" id="auditEmail"
                               placeholder="Ex: m.benali@entreprise.ma" autocomplete="email">
                    </div>
                    <div class="audit-field">
                        <label class="audit-label">
                            <span class="label-icon"><i data-lucide="phone" class="icon-sm"></i></span>
                            Téléphone <span class="optional">(optionnel)</span>
                        </label>
                        <input type="tel" class="audit-input" id="auditPhone"
                               placeholder="Ex: +212 6 00 00 00 00" autocomplete="tel">
                    </div>
                </div>
            </div>
        `;
    }

    // === STEP 2: Company ===
    function renderStep2() {
        return `
            <div class="audit-step" data-step="2">
                <div class="audit-step-header">
                    <div class="audit-step-icon"><i data-lucide="building-2" class="icon-lg"></i></div>
                    <h2 class="audit-step-title">Votre entreprise</h2>
                    <p class="audit-step-desc">Pour adapter nos recommandations à votre contexte</p>
                </div>
                <div class="audit-fields">
                    <div class="audit-field">
                        <label class="audit-label">
                            <span class="label-icon"><i data-lucide="tag" class="icon-sm"></i></span>
                            Nom de l'entreprise
                        </label>
                        <input type="text" class="audit-input" id="auditCompany"
                               placeholder="Ex: ACME Industries SARL">
                    </div>
                    <div class="audit-field">
                        <label class="audit-label">
                            <span class="label-icon"><i data-lucide="target" class="icon-sm"></i></span>
                            Secteur d'activité
                        </label>
                        <div class="audit-chips" id="industryChips">
                            ${industries.map(ind => `
                                <button class="audit-chip" data-value="${ind.value}">
                                    <span class="chip-icon">${ind.icon}</span>
                                    <span class="chip-label">${ind.label}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="audit-field">
                        <label class="audit-label">
                            <span class="label-icon"><i data-lucide="users" class="icon-sm"></i></span>
                            Taille de l'entreprise
                        </label>
                        <div class="audit-size-options" id="employeeOptions">
                            <button class="audit-size-btn" data-value="1-10">1-10</button>
                            <button class="audit-size-btn" data-value="11-50">11-50</button>
                            <button class="audit-size-btn" data-value="51-200">51-200</button>
                            <button class="audit-size-btn" data-value="201-500">201-500</button>
                            <button class="audit-size-btn" data-value="500+">500+</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // === STEP 3: Fleet ===
    function renderStep3() {
        return `
            <div class="audit-step" data-step="3">
                <div class="audit-step-header">
                    <div class="audit-step-icon"><i data-lucide="truck" class="icon-lg"></i></div>
                    <h2 class="audit-step-title">Votre parc machines</h2>
                    <p class="audit-step-desc">Pour évaluer le potentiel d'optimisation</p>
                </div>
                <div class="audit-fields">
                    <div class="audit-field">
                        <label class="audit-label">
                            <span class="label-icon"><i data-lucide="wrench" class="icon-sm"></i></span>
                            Avez-vous une flotte à gérer ?
                        </label>
                        <div class="audit-toggle-group" id="hasFleetToggle">
                            <button class="audit-toggle-btn" data-value="yes">
                                <span class="toggle-icon"><i data-lucide="check-circle" class="icon-sm"></i></span>
                                Oui, j'ai une flotte
                            </button>
                            <button class="audit-toggle-btn" data-value="no">
                                <span class="toggle-icon"><i data-lucide="x-circle" class="icon-sm"></i></span>
                                Non, pas de flotte
                            </button>
                        </div>
                    </div>

                    <div class="audit-fleet-details" id="fleetDetails" style="display: none;">
                        <div class="audit-field">
                            <label class="audit-label">
                                <span class="label-icon"><i data-lucide="bar-chart-3" class="icon-sm"></i></span>
                                Nombre de machines/véhicules
                            </label>
                            <div class="audit-range-group">
                                <input type="range" class="audit-range" id="fleetSizeRange"
                                       min="1" max="500" value="10">
                                <div class="audit-range-value">
                                    <span id="fleetSizeValue">10</span> machines
                                </div>
                            </div>
                        </div>
                        <div class="audit-field">
                            <label class="audit-label">
                                <span class="label-icon"><i data-lucide="factory" class="icon-sm"></i></span>
                                Types d'équipements <span class="optional">(plusieurs choix)</span>
                            </label>
                            <div class="audit-chips multi" id="machineTypeChips">
                                ${machineTypes.map(type => `
                                    <button class="audit-chip" data-value="${type.value}">
                                        <span class="chip-icon">${type.icon}</span>
                                        <span class="chip-label">${type.label}</span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // === STEP 4: Confirmation ===
    function renderStep4() {
        return `
            <div class="audit-step" data-step="4">
                <div class="audit-step-header success">
                    <div class="audit-step-icon">🎉</div>
                    <h2 class="audit-step-title">Votre Architecture Personnalisée</h2>
                    <p class="audit-step-desc">Récapitulatif de votre configuration</p>
                </div>

                <div class="audit-summary">
                    <!-- Architecture Recap Card -->
                    <div class="summary-card architecture-recap" id="architectureRecap">
                        <!-- Filled dynamically -->
                    </div>

                    <!-- ROI Estimation Card -->
                    <div class="summary-card roi-card" id="roiCard">
                        <!-- Filled dynamically -->
                    </div>

                    <!-- What you'll receive -->
                    <div class="summary-card highlight">
                        <div class="summary-header">
                            <span class="summary-icon">🎁</span>
                            <span class="summary-title">Ce que vous allez recevoir</span>
                        </div>
                        <ul class="summary-benefits">
                            <li>📊 <strong>Analyse complète</strong> de votre architecture</li>
                            <li>💡 <strong>Recommandations personnalisées</strong> par nos experts</li>
                            <li>📈 <strong>Estimation du ROI détaillée</strong> avec projections</li>
                            <li>🗺️ <strong>Roadmap de déploiement</strong> sur mesure</li>
                            <li>💰 <strong>Devis détaillé</strong> sans engagement</li>
                        </ul>
                    </div>

                    <div class="summary-guarantee">
                        <span class="guarantee-icon">🔒</span>
                        <span class="guarantee-text">
                            <strong>100% gratuit</strong> • Réponse sous 24h • Sans engagement
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    // === ROI CALCULATION ===
    const roiData = {
        'operations': { savings: 25, icon: '⚙️', benefit: 'Réduction des coûts opérationnels' },
        'intelligence': { savings: 30, icon: '📊', benefit: 'Décisions data-driven' },
        'growth': { savings: 40, icon: '📈', benefit: 'Augmentation du chiffre d\'affaires' },
        'engagement': { savings: 35, icon: '🎯', benefit: 'Amélioration conversion clients' },
        'brand': { savings: 20, icon: '✨', benefit: 'Image de marque premium' },
        'integration': { savings: 45, icon: '🔗', benefit: 'Élimination des silos de données' },
        'security': { savings: 50, icon: '🛡️', benefit: 'Réduction des risques cyber' },
        'enterprise': { savings: 35, icon: '🏢', benefit: 'Productivité globale' }
    };

    function calculateROI() {
        const dimensions = formData.dimensionDetails || [];
        let totalSavings = 0;
        let benefits = [];

        dimensions.forEach(dim => {
            const dimId = dim.title.toLowerCase().split(' ')[0];
            const roi = Object.entries(roiData).find(([key]) =>
                dim.title.toLowerCase().includes(key) || key.includes(dimId)
            );
            if (roi) {
                totalSavings += roi[1].savings * dim.count;
                benefits.push({
                    ...roi[1],
                    dimension: dim.title,
                    color: dim.color
                });
            }
        });

        // Cap and normalize
        const moduleCount = formData.modules.length;
        const connectionBonus = formData.connections * 5;
        const synergyMultiplier = 1 + (formData.connections * 0.1);

        let estimatedROI = Math.min(300, Math.round((totalSavings + connectionBonus) * synergyMultiplier));

        return {
            percentage: estimatedROI,
            benefits: benefits.slice(0, 4),
            timeToROI: moduleCount <= 3 ? '3-6 mois' : moduleCount <= 6 ? '6-12 mois' : '12-18 mois'
        };
    }

    // === BIND EVENTS ===
    function bindEvents() {
        // Close modal
        modalElement.querySelector('#auditModalClose').addEventListener('click', close);
        modalElement.querySelector('.audit-modal-backdrop').addEventListener('click', close);

        // Navigation
        modalElement.querySelector('#auditNext').addEventListener('click', nextStep);
        modalElement.querySelector('#auditBack').addEventListener('click', prevStep);

        // Industry chips
        modalElement.querySelector('#industryChips').addEventListener('click', (e) => {
            const chip = e.target.closest('.audit-chip');
            if (!chip) return;
            modalElement.querySelectorAll('#industryChips .audit-chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            formData.industry = chip.dataset.value;
        });

        // Employee size
        modalElement.querySelector('#employeeOptions').addEventListener('click', (e) => {
            const btn = e.target.closest('.audit-size-btn');
            if (!btn) return;
            modalElement.querySelectorAll('#employeeOptions .audit-size-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            formData.employees = btn.dataset.value;
        });

        // Has fleet toggle
        modalElement.querySelector('#hasFleetToggle').addEventListener('click', (e) => {
            const btn = e.target.closest('.audit-toggle-btn');
            if (!btn) return;
            modalElement.querySelectorAll('#hasFleetToggle .audit-toggle-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            formData.hasFleet = btn.dataset.value === 'yes';
            modalElement.querySelector('#fleetDetails').style.display = formData.hasFleet ? 'block' : 'none';
        });

        // Fleet size range
        const fleetRange = modalElement.querySelector('#fleetSizeRange');
        const fleetValue = modalElement.querySelector('#fleetSizeValue');
        fleetRange.addEventListener('input', () => {
            fleetValue.textContent = fleetRange.value;
            formData.fleetSize = fleetRange.value;
        });

        // Machine types (multi-select)
        modalElement.querySelector('#machineTypeChips').addEventListener('click', (e) => {
            const chip = e.target.closest('.audit-chip');
            if (!chip) return;
            chip.classList.toggle('selected');

            formData.machineTypes = Array.from(
                modalElement.querySelectorAll('#machineTypeChips .audit-chip.selected')
            ).map(c => c.dataset.value);
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalElement.classList.contains('open')) {
                close();
            }
        });
    }

    // === OPEN MODAL ===
    function open() {
        // Get current architecture data
        const stats = DimensionsData.getStats();
        const modules = DimensionsData.getPlacedModules();

        formData.modules = modules.map(m => ({
            id: m.templateId,
            name: m.name,
            emoji: m.dimension.emoji,
            color: m.dimension.color,
            dimension: m.dimension.title
        }));
        formData.dimensions = [...new Set(modules.map(m => m.dimension.title))];
        formData.connections = stats.connectionCount;

        // Build dimension data with colors
        const dimensionMap = {};
        modules.forEach(m => {
            if (!dimensionMap[m.dimension.title]) {
                dimensionMap[m.dimension.title] = {
                    title: m.dimension.title,
                    emoji: m.dimension.emoji,
                    color: m.dimension.color,
                    count: 0
                };
            }
            dimensionMap[m.dimension.title].count++;
        });
        formData.dimensionDetails = Object.values(dimensionMap);

        // Update architecture hero
        updateArchitectureHero();

        // Update summary
        updateSummary();

        // Show modal
        modalElement.classList.add('open');
        document.body.style.overflow = 'hidden';

        // Focus first input
        setTimeout(() => {
            modalElement.querySelector('#auditName').focus();
        }, 300);
    }

    // === UPDATE ARCHITECTURE HERO ===
    function updateArchitectureHero() {
        const heroVisual = modalElement.querySelector('#archVisual');
        const heroStats = modalElement.querySelector('#archStats');
        const heroDimensions = modalElement.querySelector('#archDimensions');

        if (!heroVisual || !heroStats || !heroDimensions) return;

        // Visual: Module blocks grouped by dimension
        const modulesByDimension = {};
        formData.modules.forEach(m => {
            if (!modulesByDimension[m.dimension]) {
                modulesByDimension[m.dimension] = [];
            }
            modulesByDimension[m.dimension].push(m);
        });

        heroVisual.innerHTML = Object.entries(modulesByDimension).map(([dim, mods]) => `
            <div class="arch-dimension-group">
                ${mods.map((m, i) => `
                    <div class="arch-module-block"
                         style="--color: ${m.color}; --delay: ${i * 0.1}s"
                         title="${m.name}">
                        <span class="arch-module-emoji">${m.emoji}</span>
                    </div>
                `).join('')}
            </div>
        `).join('');

        // Add connection lines visual
        if (formData.connections > 0) {
            heroVisual.innerHTML += `
                <div class="arch-connections-indicator">
                    <svg class="arch-connections-svg" viewBox="0 0 100 20">
                        <path d="M10 10 Q 30 5, 50 10 T 90 10"
                              fill="none"
                              stroke="var(--brand-yellow)"
                              stroke-width="2"
                              stroke-dasharray="4 2"
                              class="arch-connection-path"/>
                    </svg>
                    <span class="arch-connections-count">${formData.connections} synergies</span>
                </div>
            `;
        }

        // Stats
        heroStats.innerHTML = `
            <div class="arch-stat">
                <span class="arch-stat-value">${formData.modules.length}</span>
                <span class="arch-stat-label">Modules</span>
            </div>
            <div class="arch-stat-divider"></div>
            <div class="arch-stat">
                <span class="arch-stat-value">${formData.connections}</span>
                <span class="arch-stat-label">Connexions</span>
            </div>
            <div class="arch-stat-divider"></div>
            <div class="arch-stat">
                <span class="arch-stat-value">${formData.dimensionDetails.length}</span>
                <span class="arch-stat-label">Dimensions</span>
            </div>
        `;

        // Dimensions with colors
        heroDimensions.innerHTML = formData.dimensionDetails.map(d => `
            <div class="arch-dim-tag" style="--dim-color: ${d.color}">
                <span class="arch-dim-emoji">${d.emoji}</span>
                <span class="arch-dim-name">${d.title}</span>
                <span class="arch-dim-count">${d.count}</span>
            </div>
        `).join('');
    }

    // === CLOSE MODAL ===
    function close() {
        modalElement.classList.remove('open');
        document.body.style.overflow = '';

        // Reset to step 1
        setTimeout(() => {
            goToStep(1);
        }, 300);
    }

    // === NAVIGATION ===
    function nextStep() {
        if (currentStep === totalSteps) {
            submitForm();
            return;
        }

        if (!validateStep(currentStep)) return;

        saveStepData();
        goToStep(currentStep + 1);
    }

    function prevStep() {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    }

    function goToStep(step) {
        currentStep = step;

        // Update steps visibility
        modalElement.querySelectorAll('.audit-step').forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.step) === step);
        });

        // Update progress
        const progress = (step / totalSteps) * 100;
        modalElement.querySelector('.audit-progress-fill').style.width = `${progress}%`;

        // Update dots
        modalElement.querySelectorAll('.audit-step-dot').forEach(dot => {
            const dotStep = parseInt(dot.dataset.step);
            dot.classList.toggle('active', dotStep === step);
            dot.classList.toggle('completed', dotStep < step);
        });

        // Update nav buttons
        modalElement.querySelector('#auditBack').style.visibility = step > 1 ? 'visible' : 'hidden';

        const nextBtn = modalElement.querySelector('#auditNext');
        if (step === totalSteps) {
            nextBtn.innerHTML = '🚀 Envoyer ma demande';
            nextBtn.classList.add('submit');
        } else {
            nextBtn.innerHTML = 'Continuer →';
            nextBtn.classList.remove('submit');
        }

        // Update summary on last step
        if (step === totalSteps) {
            updateSummary();
        }
    }

    // === VALIDATION ===
    function validateStep(step) {
        let valid = true;
        let firstInvalid = null;

        if (step === 1) {
            const name = modalElement.querySelector('#auditName');
            const email = modalElement.querySelector('#auditEmail');

            if (!name.value.trim()) {
                name.classList.add('error');
                valid = false;
                firstInvalid = firstInvalid || name;
            } else {
                name.classList.remove('error');
            }

            if (!email.value.trim() || !isValidEmail(email.value)) {
                email.classList.add('error');
                valid = false;
                firstInvalid = firstInvalid || email;
            } else {
                email.classList.remove('error');
            }
        }

        if (step === 2) {
            if (!formData.industry) {
                modalElement.querySelector('#industryChips').classList.add('error');
                valid = false;
            } else {
                modalElement.querySelector('#industryChips').classList.remove('error');
            }
        }

        if (!valid && firstInvalid) {
            firstInvalid.focus();
            shakeElement(firstInvalid);
        }

        return valid;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function shakeElement(el) {
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 500);
    }

    // === SAVE STEP DATA ===
    function saveStepData() {
        if (currentStep === 1) {
            formData.name = modalElement.querySelector('#auditName').value.trim();
            formData.email = modalElement.querySelector('#auditEmail').value.trim();
            formData.phone = modalElement.querySelector('#auditPhone').value.trim();
        }
        if (currentStep === 2) {
            formData.company = modalElement.querySelector('#auditCompany').value.trim();
        }
    }

    // === UPDATE SUMMARY ===
    function updateSummary() {
        const architectureRecap = modalElement.querySelector('#architectureRecap');
        const roiCard = modalElement.querySelector('#roiCard');

        if (!architectureRecap || !roiCard) return;

        // Calculate ROI
        const roi = calculateROI();

        // Architecture Recap
        architectureRecap.innerHTML = `
            <div class="recap-header">
                <div class="recap-title-row">
                    <span class="recap-icon">🏗️</span>
                    <span class="recap-title">Votre Écosystème Digital</span>
                </div>
                <div class="recap-subtitle">${formData.modules.length} modules • ${formData.connections} synergies • ${formData.dimensionDetails.length} dimensions</div>
            </div>

            <div class="recap-dimensions">
                ${formData.dimensionDetails.map(dim => `
                    <div class="recap-dim" style="--dim-color: ${dim.color}">
                        <div class="recap-dim-header">
                            <span class="recap-dim-emoji">${dim.emoji}</span>
                            <span class="recap-dim-name">${dim.title}</span>
                            <span class="recap-dim-badge">${dim.count} module${dim.count > 1 ? 's' : ''}</span>
                        </div>
                        <div class="recap-dim-modules">
                            ${formData.modules
                                .filter(m => m.dimension === dim.title)
                                .map(m => `<span class="recap-module-chip">${m.name}</span>`)
                                .join('')}
                        </div>
                    </div>
                `).join('')}
            </div>

            ${formData.connections > 0 ? `
                <div class="recap-synergies">
                    <span class="synergy-icon">🔗</span>
                    <span class="synergy-text">
                        <strong>${formData.connections} synergies</strong> créent un effet multiplicateur sur votre ROI
                    </span>
                </div>
            ` : ''}
        `;

        // ROI Card
        roiCard.innerHTML = `
            <div class="roi-header">
                <div class="roi-title-row">
                    <span class="roi-icon">💰</span>
                    <span class="roi-title">ROI Potentiel Estimé</span>
                </div>
                <div class="roi-disclaimer">*Estimation basée sur nos déploiements clients</div>
            </div>

            <div class="roi-main">
                <div class="roi-percentage">
                    <span class="roi-value">${roi.percentage}</span>
                    <span class="roi-symbol">%</span>
                </div>
                <div class="roi-timeline">
                    <span class="roi-timeline-label">Retour estimé en</span>
                    <span class="roi-timeline-value">${roi.timeToROI}</span>
                </div>
            </div>

            <div class="roi-benefits">
                ${roi.benefits.map(b => `
                    <div class="roi-benefit" style="--benefit-color: ${b.color}">
                        <span class="roi-benefit-icon">${b.icon}</span>
                        <span class="roi-benefit-text">${b.benefit}</span>
                    </div>
                `).join('')}
            </div>

            <div class="roi-cta">
                <span class="roi-cta-icon">📈</span>
                <span class="roi-cta-text">Recevez une <strong>analyse ROI détaillée</strong> personnalisée pour votre entreprise</span>
            </div>
        `;
    }

    // === SUBMIT FORM ===
    function submitForm() {
        saveStepData();

        // Build complete submission
        const submission = {
            timestamp: new Date().toISOString(),
            contact: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            },
            company: {
                name: formData.company,
                industry: formData.industry,
                employees: formData.employees
            },
            fleet: {
                hasFleet: formData.hasFleet,
                size: formData.fleetSize,
                types: formData.machineTypes
            },
            architecture: {
                modules: formData.modules,
                dimensions: formData.dimensions,
                connections: formData.connections,
                export: DimensionsData.exportConfig()
            }
        };

        console.log('[AuditModal] Submission:', submission);

        // Show success state
        showSuccess();

        // Here you would send to your backend
        // fetch('/api/audit-request', { method: 'POST', body: JSON.stringify(submission) });
    }

    // === SUCCESS STATE ===
    function showSuccess() {
        const container = modalElement.querySelector('.audit-modal-container');
        container.innerHTML = `
            <div class="audit-success">
                <div class="success-animation">
                    <div class="success-circle">
                        <svg class="success-check" viewBox="0 0 52 52">
                            <circle cx="26" cy="26" r="25" fill="none"/>
                            <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                        </svg>
                    </div>
                </div>
                <h2 class="success-title">Demande envoyée ! 🎉</h2>
                <p class="success-message">
                    Merci <strong>${formData.name.split(' ')[0]}</strong> !<br>
                    Votre diagnostic personnalisé sera envoyé à<br>
                    <strong>${formData.email}</strong> sous 24h.
                </p>
                <div class="success-next">
                    <p>En attendant, continuez à explorer les possibilités...</p>
                    <button class="audit-btn audit-btn-next" onclick="DimensionsAuditModal.close()">
                        ← Retour au Playground
                    </button>
                </div>
            </div>
        `;
    }

    // === PUBLIC API ===
    return {
        init,
        open,
        close
    };

})();
