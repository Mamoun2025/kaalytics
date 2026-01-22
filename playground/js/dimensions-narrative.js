/* ============================================
   DIMENSIONS NARRATIVE ENGINE v5.1
   Memory-Based Semantic Storytelling
   Uses StoryMemory + StoryBuilder
   ============================================ */

const DimensionsNarrative = (function() {
    'use strict';

    // === STATE ===
    let narratives = null;
    let panelElement = null;

    // === INIT ===
    async function init(panelSelector) {
        panelElement = document.querySelector(panelSelector);

        try {
            // Load base narratives
            const response = await fetch('data/narratives.json');
            narratives = await response.json();

            // Wait for v5 engines
            await waitForEngines();
            console.log('[Narrative] Engine v5.1 initialized with StoryMemory + StoryBuilder');
        } catch (error) {
            console.error('[Narrative] Failed to load:', error);
            return;
        }

        bindDataEvents();
        setupCTA();
        render();
    }

    // === WAIT FOR V5 ENGINES ===
    async function waitForEngines() {
        let attempts = 0;
        while (!StoryBuilder.isLoaded() && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
    }

    // === DATA EVENTS ===
    function bindDataEvents() {
        DimensionsData.on('moduleAdded', (m) => {
            if (StoryBuilder.isLoaded()) {
                const modules = DimensionsData.getPlacedModules();
                const isFirstOfDimension = modules.filter(mod =>
                    mod.dimension?.id === m.dimension?.id
                ).length === 1;

                StoryBuilder.buildModuleParagraph(m, { isFirstOfDimension });

                // Check for chapter transition
                const moduleCount = StoryMemory.getModuleCount();
                const transition = StoryMemory.updateChapter(moduleCount);
                if (transition) {
                    StoryBuilder.buildChapterTransition(transition.from, transition.to);
                }
            }
            render();
        });

        DimensionsData.on('moduleRemoved', (m) => {
            StoryMemory.addModuleRemovedEvent(m);
            const moduleCount = StoryMemory.getModuleCount();
            StoryMemory.updateChapter(moduleCount);
            render();
        });

        DimensionsData.on('connectionAdded', (c) => {
            if (StoryBuilder.isLoaded()) {
                const fromModule = DimensionsData.getPlacedModule(c.fromModule);
                const toModule = DimensionsData.getPlacedModule(c.toModule);
                if (fromModule && toModule) {
                    StoryBuilder.buildConnectionParagraph(c, fromModule, toModule);
                }
            }
            render();
        });

        DimensionsData.on('connectionRemoved', (c) => {
            StoryMemory.addConnectionRemovedEvent(c);
            render();
        });

        DimensionsData.on('moduleNested', () => render());
        DimensionsData.on('moduleUnnested', () => render());

        DimensionsData.on('cleared', () => {
            StoryMemory.reset();
            render();
        });
    }

    // === MAIN RENDER ===
    function render() {
        if (!panelElement || !narratives) return;

        const modules = DimensionsData.getPlacedModules();
        const connections = DimensionsData.getConnections();
        const stats = DimensionsData.getStats();
        const analysis = analyzeArchitecture(modules, connections);

        // Update transformation score
        StoryMemory.updateScore(modules, connections, analysis);

        // Add updating class for animation
        panelElement.classList.add('updating');

        setTimeout(() => {
            const chapter = StoryMemory.getCurrentChapter();
            const moduleCount = stats.moduleCount;

            // Update headline section
            const headlineEl = panelElement.querySelector('.narrative-text');
            if (headlineEl) {
                if (moduleCount === 0) {
                    headlineEl.innerHTML = `
                        <strong>Votre transformation digitale</strong>
                        <div class="narrative-subtext">Glissez un module pour commencer</div>
                    `;
                } else {
                    const chapterIcon = getChapterIcon(chapter.style);
                    headlineEl.innerHTML = `
                        <span style="font-size: 18px; margin-right: 6px;">${chapterIcon}</span>
                        <strong>${chapter.title}</strong>
                    `;
                }
            }

            // Render succinct summary
            const bulletsEl = panelElement.querySelector('.narrative-bullets');
            if (bulletsEl) {
                const storyHtml = StoryBuilder.renderStoryHtml();
                if (storyHtml) {
                    bulletsEl.innerHTML = storyHtml;
                    bulletsEl.style.display = 'block';
                    bulletsEl.classList.add('flowing-story');
                } else {
                    bulletsEl.style.display = 'none';
                }
            }

            // Hide old sections (not used in v5)
            const synergiesEl = panelElement.querySelector('.narrative-synergies');
            const valuesEl = panelElement.querySelector('.narrative-values');
            if (synergiesEl) synergiesEl.style.display = 'none';
            if (valuesEl) valuesEl.style.display = 'none';

            // Update stats
            const modCountEl = panelElement.querySelector('#narrativeModules');
            const connCountEl = panelElement.querySelector('#narrativeConnections');
            if (modCountEl) modCountEl.textContent = stats.moduleCount;
            if (connCountEl) connCountEl.textContent = stats.connectionCount;

            // Update architecture badge
            updateArchitectureBadge(analysis);

            // Update CTA state
            updateCTAState(stats.moduleCount);

            // Remove updating class
            setTimeout(() => {
                panelElement.classList.remove('updating');
                panelElement.classList.add('updated');
                setTimeout(() => panelElement.classList.remove('updated'), 600);
            }, 100);
        }, 150);
    }

    // === GET CHAPTER ICON ===
    function getChapterIcon(style) {
        const icons = {
            intro: '✨',
            building: '🏗️',
            growing: '🌱',
            connecting: '🔗',
            accelerating: '🚀',
            complete: '👑'
        };
        return icons[style] || '📖';
    }

    // === ANALYZE ARCHITECTURE ===
    function analyzeArchitecture(modules, connections) {
        const analysis = {
            moduleCount: modules.length,
            connectionCount: connections.length,
            dimensions: {},
            dimensionCount: 0,
            strongestDimension: null,
            strongestCount: 0,
            completeDimensions: [],
            crossDimensionConnections: 0,
            sameDimensionConnections: 0,
            maturityLevel: 'starter',
            architectureType: null
        };

        // Count modules per dimension
        modules.forEach(m => {
            const dimId = m.dimension.id;
            if (!analysis.dimensions[dimId]) {
                analysis.dimensions[dimId] = {
                    id: dimId,
                    name: m.dimension.title,
                    emoji: m.dimension.emoji,
                    color: m.dimension.color,
                    modules: [],
                    count: 0
                };
            }
            analysis.dimensions[dimId].modules.push(m);
            analysis.dimensions[dimId].count++;

            if (analysis.dimensions[dimId].count > analysis.strongestCount) {
                analysis.strongestCount = analysis.dimensions[dimId].count;
                analysis.strongestDimension = analysis.dimensions[dimId];
            }
        });

        analysis.dimensionCount = Object.keys(analysis.dimensions).length;

        // Check for complete dimensions (6+ modules)
        Object.values(analysis.dimensions).forEach(dim => {
            if (dim.count >= 6) {
                analysis.completeDimensions.push(dim);
            }
        });

        // Analyze connections
        connections.forEach(conn => {
            const fromModule = DimensionsData.getPlacedModule(conn.fromModule);
            const toModule = DimensionsData.getPlacedModule(conn.toModule);
            if (fromModule && toModule) {
                if (fromModule.dimension.id === toModule.dimension.id) {
                    analysis.sameDimensionConnections++;
                } else {
                    analysis.crossDimensionConnections++;
                }
            }
        });

        // Determine maturity level
        if (modules.length === 0) {
            analysis.maturityLevel = 'empty';
        } else if (modules.length <= 2) {
            analysis.maturityLevel = 'starter';
        } else if (modules.length <= 5) {
            analysis.maturityLevel = 'emerging';
        } else if (modules.length <= 10) {
            analysis.maturityLevel = 'developing';
        } else if (modules.length <= 15) {
            analysis.maturityLevel = 'advanced';
        } else {
            analysis.maturityLevel = 'enterprise';
        }

        // Determine architecture type
        if (analysis.dimensionCount >= 4 && connections.length >= 5) {
            analysis.architectureType = 'ecosystem';
        } else if (analysis.strongestCount >= 4) {
            analysis.architectureType = 'specialized';
        } else if (analysis.crossDimensionConnections >= 3) {
            analysis.architectureType = 'integrated';
        } else if (analysis.dimensionCount >= 3) {
            analysis.architectureType = 'diversified';
        } else if (modules.length > 0) {
            analysis.architectureType = 'focused';
        }

        return analysis;
    }

    // === UPDATE ARCHITECTURE BADGE ===
    function updateArchitectureBadge(analysis) {
        let badge = panelElement.querySelector('.architecture-badge');

        if (analysis.moduleCount === 0) {
            if (badge) badge.style.display = 'none';
            return;
        }

        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'architecture-badge';
            const header = panelElement.querySelector('.narrative-header');
            if (header) header.appendChild(badge);
        }

        const badgeTexts = {
            focused: 'Fondation',
            specialized: 'Spécialiste',
            diversified: 'Multi-axes',
            integrated: 'Intégré',
            ecosystem: 'Écosystème'
        };

        badge.textContent = badgeTexts[analysis.architectureType] || '';
        badge.style.display = analysis.architectureType ? 'inline-block' : 'none';
    }

    // === CTA STATE ===
    function updateCTAState(moduleCount) {
        const ctaBtn = document.getElementById('ctaAudit');
        if (!ctaBtn) return;

        if (moduleCount > 0) {
            ctaBtn.classList.add('has-modules');
        } else {
            ctaBtn.classList.remove('has-modules');
        }
    }

    // === CTA CLICK HANDLER ===
    function setupCTA() {
        const ctaBtn = document.getElementById('ctaAudit');
        if (!ctaBtn) return;

        ctaBtn.addEventListener('click', () => {
            const stats = DimensionsData.getStats();

            if (stats.moduleCount === 0) {
                ctaBtn.classList.add('shake');
                setTimeout(() => ctaBtn.classList.remove('shake'), 500);
                showCTATooltip('Ajoutez des modules pour obtenir votre diagnostic');
                return;
            }

            if (typeof DimensionsAuditModal !== 'undefined') {
                DimensionsAuditModal.open();
            }
        });
    }

    // === CTA TOOLTIP ===
    function showCTATooltip(message) {
        const ctaBtn = document.getElementById('ctaAudit');
        if (!ctaBtn) return;

        let tooltip = document.querySelector('.cta-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'cta-tooltip';
            ctaBtn.parentElement.appendChild(tooltip);
        }

        tooltip.textContent = message;
        tooltip.classList.add('visible');

        setTimeout(() => {
            tooltip.classList.remove('visible');
        }, 3000);
    }

    // === PUBLIC API ===
    return {
        init,
        render
    };

})();
