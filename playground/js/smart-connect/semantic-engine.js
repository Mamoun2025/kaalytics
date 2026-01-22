/* ============================================
   SMART CONNECT - Semantic Engine
   Analyzes module relationships and affinities
   Now integrates with unified SemanticEngine
   ============================================ */

const SmartConnectSemantic = (function() {
    'use strict';

    // === STATE ===
    let affinityData = null;
    let isLoaded = false;
    let useUnifiedEngine = false;

    // === INIT ===
    async function init() {
        // Try to use unified SemanticEngine if available
        if (typeof SemanticEngine !== 'undefined') {
            const unified = await SemanticEngine.init();
            if (unified) {
                useUnifiedEngine = true;
                isLoaded = true;
                console.log('[SmartConnect:Semantic] Using unified SemanticEngine');
                return true;
            }
        }

        // Fallback to local data
        try {
            const response = await fetch('data/smart-connect/module-affinities.json');
            affinityData = await response.json();
            isLoaded = true;
            console.log('[SmartConnect:Semantic] Loaded affinity data (fallback)');
            return true;
        } catch (error) {
            console.error('[SmartConnect:Semantic] Failed to load:', error);
            return false;
        }
    }

    // === GET MODULE AFFINITY ===
    function getModuleAffinity(moduleId1, moduleId2) {
        if (!isLoaded) return { affinity: 50, flow: 'bidirectional', priority: 3 };

        // Use unified engine if available
        if (useUnifiedEngine && typeof SemanticEngine !== 'undefined') {
            return SemanticEngine.getModuleAffinity(moduleId1, moduleId2);
        }

        // Check direct pair (fallback)
        const key1 = `${moduleId1}+${moduleId2}`;
        const key2 = `${moduleId2}+${moduleId1}`;

        if (affinityData.module_pairs[key1]) {
            return affinityData.module_pairs[key1];
        }
        if (affinityData.module_pairs[key2]) {
            const pair = affinityData.module_pairs[key2];
            // Reverse flow direction
            return {
                ...pair,
                flow: reverseFlow(pair.flow)
            };
        }

        // Fall back to dimension affinity
        return getDimensionBasedAffinity(moduleId1, moduleId2);
    }

    // === GET DIMENSION-BASED AFFINITY ===
    function getDimensionBasedAffinity(moduleId1, moduleId2) {
        const dim1 = getDimensionFromModuleId(moduleId1);
        const dim2 = getDimensionFromModuleId(moduleId2);

        if (!dim1 || !dim2) return { affinity: 50, flow: 'bidirectional', priority: 3 };

        const affinity = affinityData.dimension_affinities[dim1]?.[dim2] || 50;

        return {
            affinity,
            flow: 'bidirectional',
            priority: 3,
            inferred: true
        };
    }

    // === GET DIMENSION FROM MODULE ID ===
    function getDimensionFromModuleId(moduleId) {
        const prefixMap = {
            'ops': 'operations',
            'intel': 'intelligence',
            'growth': 'growth',
            'engage': 'engagement',
            'brand': 'brand',
            'integ': 'integration',
            'sec': 'security',
            'ent': 'enterprise'
        };

        const prefix = moduleId.split('-')[0];
        return prefixMap[prefix] || null;
    }

    // === REVERSE FLOW ===
    function reverseFlow(flow) {
        if (flow === 'from-to') return 'to-from';
        if (flow === 'to-from') return 'from-to';
        return flow;
    }

    // === GET BEST CONNECTIONS FOR MODULE ===
    function getBestConnectionsFor(moduleId, availableModules, existingConnections) {
        if (!isLoaded) return [];

        const suggestions = [];
        const connectedModules = getConnectedModules(moduleId, existingConnections);

        availableModules.forEach(otherModule => {
            if (otherModule.templateId === moduleId) return;
            if (connectedModules.has(otherModule.templateId)) return;

            const affinity = getModuleAffinity(moduleId, otherModule.templateId);

            if (affinity.affinity >= 70) {
                suggestions.push({
                    targetModule: otherModule,
                    affinity: affinity.affinity,
                    flow: affinity.flow,
                    priority: affinity.priority,
                    inferred: affinity.inferred || false
                });
            }
        });

        // Sort by affinity (highest first), then by priority
        suggestions.sort((a, b) => {
            if (b.affinity !== a.affinity) return b.affinity - a.affinity;
            return a.priority - b.priority;
        });

        return suggestions;
    }

    // === GET ALL SUGGESTED CONNECTIONS ===
    function getAllSuggestedConnections(modules, existingConnections) {
        if (!isLoaded || modules.length < 2) return [];

        const suggestions = [];
        const existingPairs = new Set();

        // Build set of existing connections
        existingConnections.forEach(conn => {
            const m1 = DimensionsData.getPlacedModule(conn.fromModule);
            const m2 = DimensionsData.getPlacedModule(conn.toModule);
            if (m1 && m2) {
                existingPairs.add(`${m1.templateId}+${m2.templateId}`);
                existingPairs.add(`${m2.templateId}+${m1.templateId}`);
            }
        });

        // Check all module pairs
        for (let i = 0; i < modules.length; i++) {
            for (let j = i + 1; j < modules.length; j++) {
                const m1 = modules[i];
                const m2 = modules[j];

                const pairKey = `${m1.templateId}+${m2.templateId}`;
                if (existingPairs.has(pairKey)) continue;

                const affinity = getModuleAffinity(m1.templateId, m2.templateId);

                if (affinity.affinity >= 75) {
                    suggestions.push({
                        from: m1,
                        to: m2,
                        affinity: affinity.affinity,
                        flow: affinity.flow,
                        priority: affinity.priority,
                        inferred: affinity.inferred || false
                    });
                }
            }
        }

        // Sort by affinity and priority
        suggestions.sort((a, b) => {
            if (b.affinity !== a.affinity) return b.affinity - a.affinity;
            return a.priority - b.priority;
        });

        return suggestions;
    }

    // === GET CONNECTED MODULES ===
    function getConnectedModules(moduleId, connections) {
        const connected = new Set();

        connections.forEach(conn => {
            const fromModule = DimensionsData.getPlacedModule(conn.fromModule);
            const toModule = DimensionsData.getPlacedModule(conn.toModule);

            if (fromModule?.templateId === moduleId && toModule) {
                connected.add(toModule.templateId);
            }
            if (toModule?.templateId === moduleId && fromModule) {
                connected.add(fromModule.templateId);
            }
        });

        return connected;
    }

    // === GET MODULE CATEGORY ===
    function getModuleCategory(moduleId) {
        if (!isLoaded) return null;

        for (const [category, modules] of Object.entries(affinityData.module_categories)) {
            if (modules.includes(moduleId)) {
                return category;
            }
        }
        return null;
    }

    // === GET LAYOUT HINT ===
    function getLayoutHint(moduleId) {
        if (!isLoaded) return null;
        return affinityData.layout_hints[moduleId] || null;
    }

    // === GET FLOW PATTERNS ===
    function getFlowPatterns() {
        if (!isLoaded) return {};
        return affinityData.flow_patterns;
    }

    // === PUBLIC API ===
    return {
        init,
        getModuleAffinity,
        getBestConnectionsFor,
        getAllSuggestedConnections,
        getModuleCategory,
        getLayoutHint,
        getFlowPatterns,
        isReady: () => isLoaded
    };

})();
