/* ============================================
   DIMENSIONS PRESETS
   Pre-configured Module Arrangements
   ============================================ */

const DimensionsPresets = (function() {
    'use strict';

    // === STATE ===
    let presetsIndex = null;
    let presetsCache = {};
    let selectorElement = null;
    let dropdownElement = null;
    let isOpen = false;
    let isPresetActive = false;  // Flag to prevent optimization of presets

    // === INIT ===
    async function init(selectorId) {
        selectorElement = document.getElementById(selectorId);

        if (!selectorElement) {
            console.error('[Presets] Selector element not found');
            return;
        }

        // Load presets index
        try {
            const response = await fetch('data/presets/index.json');
            presetsIndex = await response.json();
        } catch (error) {
            console.error('[Presets] Failed to load index:', error);
            return;
        }

        buildUI();
        bindEvents();

        console.log(`[Presets] Initialized with ${presetsIndex.presets.length} presets`);
    }

    // === BUILD UI ===
    function buildUI() {
        // Group presets by level
        const levels = presetsIndex.levels || {};
        const presetsByLevel = {};

        presetsIndex.presets.forEach(preset => {
            const level = preset.level || 1;
            if (!presetsByLevel[level]) {
                presetsByLevel[level] = [];
            }
            presetsByLevel[level].push(preset);
        });

        // Build level sections HTML
        const levelSectionsHTML = Object.keys(presetsByLevel)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(level => {
                const levelInfo = levels[level] || { name: `Niveau ${level}`, icon: '📦' };
                const presets = presetsByLevel[level];

                return `
                    <div class="preset-level-section" data-level="${level}">
                        <div class="preset-level-header">
                            <span class="preset-level-icon">${levelInfo.icon}</span>
                            <span class="preset-level-name">${levelInfo.name}</span>
                            <span class="preset-level-badge">Niveau ${level}</span>
                        </div>
                        <div class="preset-level-items">
                            ${presets.map(preset => `
                                <div class="preset-item" data-preset-id="${preset.id}" data-level="${level}">
                                    <div class="preset-item-icon">${preset.emoji}</div>
                                    <div class="preset-item-content">
                                        <div class="preset-item-name">${preset.name}</div>
                                        <div class="preset-item-desc">${preset.description}</div>
                                        <div class="preset-item-meta">
                                            <span class="preset-item-count">${preset.moduleCount} modules</span>
                                            ${preset.levelLabel ? `<span class="preset-item-label">${preset.levelLabel}</span>` : ''}
                                        </div>
                                    </div>
                                    <div class="preset-item-arrow"><i data-lucide="arrow-right" class="icon-sm"></i></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');

        selectorElement.innerHTML = `
            <button class="preset-trigger" id="presetTrigger">
                <span class="preset-trigger-icon"><i data-lucide="zap" class="icon-sm"></i></span>
                <span class="preset-trigger-text">Configs</span>
                <i data-lucide="chevron-down" class="preset-trigger-arrow icon-xs"></i>
            </button>
            <div class="preset-dropdown" id="presetDropdown">
                <div class="preset-dropdown-header">
                    <span class="preset-dropdown-title"><i data-lucide="layout-template" class="icon-sm"></i> Configurations recommandées</span>
                    <span class="preset-dropdown-subtitle">Architectures prêtes à l'emploi</span>
                </div>
                <div class="preset-list">
                    ${levelSectionsHTML}
                </div>
            </div>
        `;

        dropdownElement = selectorElement.querySelector('#presetDropdown');

        // Initialize Lucide icons in presets
        if (typeof lucide !== 'undefined') {
            lucide.createIcons({ nodes: [selectorElement] });
        }
    }

    // === BIND EVENTS ===
    function bindEvents() {
        // Toggle dropdown
        const trigger = selectorElement.querySelector('#presetTrigger');
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown();
        });

        // Preset selection
        selectorElement.querySelectorAll('.preset-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const presetId = item.dataset.presetId;
                loadPreset(presetId);
                closeDropdown();
            });
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!selectorElement.contains(e.target)) {
                closeDropdown();
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeDropdown();
            }
        });
    }

    // === TOGGLE DROPDOWN ===
    function toggleDropdown() {
        isOpen = !isOpen;
        selectorElement.classList.toggle('open', isOpen);
    }

    function closeDropdown() {
        isOpen = false;
        selectorElement.classList.remove('open');
    }

    // === LOAD PRESET ===
    async function loadPreset(presetId) {
        // Find preset info
        const presetInfo = presetsIndex.presets.find(p => p.id === presetId);
        if (!presetInfo) {
            console.error('[Presets] Preset not found:', presetId);
            return;
        }

        // Load preset data (with cache)
        let presetData = presetsCache[presetId];

        if (!presetData) {
            try {
                const response = await fetch(`data/presets/${presetInfo.file}`);
                presetData = await response.json();
                presetsCache[presetId] = presetData;
            } catch (error) {
                console.error('[Presets] Failed to load preset:', error);
                return;
            }
        }

        // Apply preset
        applyPreset(presetData);
    }

    // === APPLY PRESET ===
    function applyPreset(preset) {
        // Clear current workspace
        DimensionsData.clearAll();
        document.querySelectorAll('.placed-module').forEach(el => el.remove());
        document.getElementById('connectionsLayer').innerHTML = '';

        // Track created module IDs for connections
        const moduleIds = [];
        const moduleDelay = 80;  // ms between each module
        const connectionDelay = 60;  // ms between each connection

        // Create modules with animation delay
        preset.modules.forEach((modConfig, index) => {
            setTimeout(() => {
                const placed = DimensionsWorkspace.createModule(
                    modConfig.templateId,
                    modConfig.x,
                    modConfig.y
                );

                if (placed) {
                    moduleIds[index] = placed.id;

                    // Check if all modules created, then create connections
                    if (moduleIds.filter(Boolean).length === preset.modules.length) {
                        createPresetConnections(preset.connections, moduleIds, connectionDelay);
                    }
                }
            }, index * moduleDelay);
        });

        // Calculate total time: all modules + all connections + buffer
        const totalModuleTime = preset.modules.length * moduleDelay;
        const totalConnectionTime = (preset.connections?.length || 0) * connectionDelay;
        const fitDelay = totalModuleTime + totalConnectionTime + 400;  // Extra buffer for animations

        // Fit viewport after everything is placed and centered
        setTimeout(() => {
            if (typeof DimensionsViewport !== 'undefined') {
                DimensionsViewport.fitContent({ padding: 100, maxScale: 0.85 });
            }
        }, fitDelay);

        // Mark preset as active
        isPresetActive = true;
        console.log(`[Presets] Applied "${preset.name}"`);
    }

    // === CREATE CONNECTIONS ===
    function createPresetConnections(connections, moduleIds, delay = 60) {
        if (!connections || connections.length === 0) return;

        connections.forEach((conn, index) => {
            setTimeout(() => {
                const fromModuleId = moduleIds[conn.from.index];
                const toModuleId = moduleIds[conn.to.index];

                if (fromModuleId && toModuleId) {
                    DimensionsData.addConnection(
                        fromModuleId,
                        conn.from.port,
                        toModuleId,
                        conn.to.port
                    );
                }
            }, index * delay);
        });
    }

    // === GET PRESETS LIST ===
    function getPresets() {
        return presetsIndex?.presets || [];
    }

    // === CLEAR PRESET FLAG ===
    function clearPresetFlag() {
        isPresetActive = false;
    }

    // === PUBLIC API ===
    return {
        init,
        loadPreset,
        getPresets,
        isPresetActive: () => isPresetActive,
        clearPresetFlag
    };

})();
