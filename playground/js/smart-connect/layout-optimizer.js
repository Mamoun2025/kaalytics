/* ============================================
   SMART CONNECT - Layout Optimizer
   Grid-based hierarchical layout with routing channels
   Version 2.0 - Dynamic sizing & better algorithms
   ============================================ */

const SmartConnectLayout = (function() {
    'use strict';

    // === DEFAULT CONFIG ===
    const DEFAULT_CONFIG = {
        moduleWidth: 200,
        moduleHeight: 80,
        horizontalGap: 150,
        verticalGap: 180,
        startY: 60,
        padding: 30,
        animationDuration: 500
    };

    let config = { ...DEFAULT_CONFIG };

    // === GET CANVAS DIMENSIONS ===
    function getCanvasBounds() {
        const canvas = document.querySelector('.canvas-container');
        if (!canvas) {
            return { width: 1200, height: 800, left: 0, top: 0 };
        }

        const rect = canvas.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
            left: 0,
            top: 0
        };
    }

    // === CALCULATE DYNAMIC CENTER ===
    function getDynamicCenterX() {
        const bounds = getCanvasBounds();
        // Account for sidebar (approximately 280px)
        const sidebarWidth = 280;
        const availableWidth = bounds.width;
        return Math.max(400, availableWidth / 2);
    }

    // === UPDATE CONFIG ===
    function updateConfig(newConfig) {
        config = { ...config, ...newConfig };
    }

    // === RESET CONFIG ===
    function resetConfig() {
        config = { ...DEFAULT_CONFIG };
    }

    // === OPTIMIZE LAYOUT ===
    function optimizeLayout(modules, connections, options = {}) {
        if (!modules || modules.length === 0) return [];

        const opts = {
            centerX: getDynamicCenterX(),
            ...options
        };

        // Build adjacency map
        const adj = buildAdjacency(modules, connections);

        // Assign tiers (vertical levels)
        const tiers = assignTiers(modules, adj);

        // Group by tier
        const tierGroups = groupByTier(modules, tiers);

        // Sort within tiers to minimize crossings
        sortTiersToMinimizeCrossings(tierGroups, adj, connections);

        // Calculate positions with routing channels
        return calculatePositions(tierGroups, opts.centerX);
    }

    // === BUILD ADJACENCY ===
    function buildAdjacency(modules, connections) {
        const adj = new Map();
        modules.forEach(m => adj.set(m.id, { neighbors: [], degree: 0 }));

        connections.forEach(c => {
            if (adj.has(c.fromModule) && adj.has(c.toModule)) {
                adj.get(c.fromModule).neighbors.push(c.toModule);
                adj.get(c.toModule).neighbors.push(c.fromModule);
                adj.get(c.fromModule).degree++;
                adj.get(c.toModule).degree++;
            }
        });

        return adj;
    }

    // === ASSIGN TIERS (BFS from most connected node) ===
    function assignTiers(modules, adj) {
        const tiers = new Map();

        // Find root (most connected module)
        let root = modules[0];
        let maxDegree = 0;
        modules.forEach(m => {
            const d = adj.get(m.id)?.degree || 0;
            if (d > maxDegree) {
                maxDegree = d;
                root = m;
            }
        });

        // BFS to assign tiers
        const queue = [root.id];
        const visited = new Set([root.id]);
        tiers.set(root.id, 0);

        while (queue.length > 0) {
            const current = queue.shift();
            const currentTier = tiers.get(current);
            const neighbors = adj.get(current)?.neighbors || [];

            neighbors.forEach(nId => {
                if (!visited.has(nId)) {
                    visited.add(nId);
                    tiers.set(nId, currentTier + 1);
                    queue.push(nId);
                }
            });
        }

        // Unvisited modules go to last tier
        let maxTier = 0;
        tiers.forEach(t => { if (t > maxTier) maxTier = t; });
        modules.forEach(m => {
            if (!tiers.has(m.id)) tiers.set(m.id, maxTier + 1);
        });

        return tiers;
    }

    // === GROUP BY TIER ===
    function groupByTier(modules, tiers) {
        const groups = new Map();

        modules.forEach(m => {
            const tier = tiers.get(m.id) || 0;
            if (!groups.has(tier)) groups.set(tier, []);
            groups.get(tier).push(m);
        });

        return [...groups.keys()]
            .sort((a, b) => a - b)
            .map(tier => ({ tier, modules: groups.get(tier) }));
    }

    // === SORT TO MINIMIZE CROSSINGS (Barycenter method) ===
    function sortTiersToMinimizeCrossings(tierGroups, adj, connections) {
        // Multiple passes with barycenter method
        for (let iter = 0; iter < 5; iter++) {
            // Forward pass
            for (let i = 1; i < tierGroups.length; i++) {
                sortByBarycenter(tierGroups[i].modules, tierGroups[i-1].modules, adj);
            }
            // Backward pass
            for (let i = tierGroups.length - 2; i >= 0; i--) {
                sortByBarycenter(tierGroups[i].modules, tierGroups[i+1].modules, adj);
            }
        }

        // Additional: group by dimension within tier for visual coherence
        tierGroups.forEach(group => {
            group.modules.sort((a, b) => {
                const dimA = a.dimension?.id || '';
                const dimB = b.dimension?.id || '';
                if (dimA !== dimB) return dimA.localeCompare(dimB);
                return 0;
            });
        });
    }

    // === SORT BY BARYCENTER ===
    function sortByBarycenter(current, reference, adj) {
        if (!current || !reference || reference.length === 0) return;

        const bary = new Map();

        current.forEach((m, idx) => {
            const neighbors = adj.get(m.id)?.neighbors || [];
            const positions = [];

            neighbors.forEach(nId => {
                const refIdx = reference.findIndex(r => r.id === nId);
                if (refIdx !== -1) positions.push(refIdx);
            });

            bary.set(m.id, positions.length > 0
                ? positions.reduce((a, b) => a + b, 0) / positions.length
                : idx);
        });

        current.sort((a, b) => (bary.get(a.id) || 0) - (bary.get(b.id) || 0));
    }

    // === CALCULATE POSITIONS ===
    function calculatePositions(tierGroups, centerX) {
        const positions = [];
        const bounds = getCanvasBounds();

        tierGroups.forEach((group, tierIndex) => {
            const y = config.startY + tierIndex * config.verticalGap;
            const tierWidth = group.modules.length * (config.moduleWidth + config.horizontalGap) - config.horizontalGap;
            const startX = centerX - tierWidth / 2;

            group.modules.forEach((m, idx) => {
                const x = startX + idx * (config.moduleWidth + config.horizontalGap);
                positions.push({
                    moduleId: m.id,
                    x: Math.max(config.padding, Math.min(x, bounds.width - config.moduleWidth - config.padding)),
                    y: Math.max(config.padding, y),
                    tier: group.tier
                });
            });
        });

        return positions;
    }

    // === APPLY LAYOUT ===
    function applyLayout(positions, animate = true) {
        if (!positions || positions.length === 0) return Promise.resolve();

        return new Promise((resolve) => {
            const duration = animate ? config.animationDuration : 0;

            positions.forEach((pos, index) => {
                const el = document.getElementById(pos.moduleId);
                if (!el) return;

                if (animate) {
                    el.style.transition = `left ${duration}ms ease-out, top ${duration}ms ease-out`;
                }

                el.style.left = pos.x + 'px';
                el.style.top = pos.y + 'px';

                // Update data after animation
                setTimeout(() => {
                    el.style.transition = '';
                    DimensionsData.updateModulePosition(pos.moduleId, pos.x, pos.y);
                }, duration);
            });

            // Redraw connections after all modules moved
            setTimeout(() => {
                if (DimensionsConnections?.redraw) {
                    DimensionsConnections.redraw();
                }
                resolve();
            }, duration + 50);
        });
    }

    // === CALCULATE PREVIEW POSITIONS ===
    function calculatePreviewPositions(modules, connections) {
        const positions = optimizeLayout(modules, connections);
        const changes = [];

        positions.forEach(pos => {
            const module = modules.find(m => m.id === pos.moduleId);
            if (module && (module.x !== pos.x || module.y !== pos.y)) {
                changes.push({
                    moduleId: pos.moduleId,
                    from: { x: module.x, y: module.y },
                    to: { x: pos.x, y: pos.y }
                });
            }
        });

        return { positions, changes };
    }

    // === GET CONFIG ===
    function getConfig() {
        return { ...config };
    }

    return {
        optimizeLayout,
        applyLayout,
        calculatePreviewPositions,
        getConfig,
        updateConfig,
        resetConfig,
        getCanvasBounds,
        getDynamicCenterX
    };

})();
