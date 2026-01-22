/* ============================================
   SEMANTIC ENGINE - Unified API
   Central hub for all semantic operations
   ============================================ */

const SemanticEngine = (function() {
    'use strict';

    // === STATE ===
    let isInitialized = false;
    let ontology = null;
    let relationships = null;
    let milestones = null;
    let chapters = null;
    let visions = null;

    // === INIT ===
    async function init() {
        try {
            const results = await Promise.all([
                fetch('data/semantic/core/ontology.json').then(r => r.json()),
                fetch('data/semantic/core/relationships.json').then(r => r.json()),
                fetch('data/semantic/storytelling/milestones.json').then(r => r.json()),
                fetch('data/semantic/storytelling/chapters.json').then(r => r.json()),
                fetch('data/semantic/storytelling/visions.json').then(r => r.json())
            ]);

            ontology = results[0];
            relationships = results[1];
            milestones = results[2];
            chapters = results[3];
            visions = results[4];

            isInitialized = true;
            console.log('[SemanticEngine] Initialized with unified data');
            return true;
        } catch (error) {
            console.error('[SemanticEngine] Failed to initialize:', error);
            return false;
        }
    }

    // === ONTOLOGY QUERIES ===

    function getCapability(moduleId) {
        if (!isInitialized) return null;
        return ontology.capabilities[moduleId] || null;
    }

    function getModuleValue(moduleId) {
        const cap = getCapability(moduleId);
        return cap?.value || null;
    }

    function getModuleCategory(moduleId) {
        const cap = getCapability(moduleId);
        return cap?.category || null;
    }

    function getModulesProviding(capability) {
        if (!isInitialized) return [];
        return Object.entries(ontology.capabilities)
            .filter(([_, cap]) => cap.provides.includes(capability))
            .map(([id]) => id);
    }

    function getModulesEnabling(capability) {
        if (!isInitialized) return [];
        return Object.entries(ontology.capabilities)
            .filter(([_, cap]) => cap.enables.includes(capability))
            .map(([id]) => id);
    }

    function getTransformationStage(moduleCount) {
        if (!isInitialized) return ontology?.transformation_stages?.[0] || null;

        const stages = ontology.transformation_stages;
        let currentStage = stages[0];

        for (const stage of stages) {
            if (moduleCount >= stage.threshold) {
                currentStage = stage;
            } else {
                break;
            }
        }

        return currentStage;
    }

    function getAllTransformationStages() {
        if (!isInitialized) return [];
        return ontology.transformation_stages;
    }

    function getIndustryArc(industryId) {
        if (!isInitialized) return null;
        return ontology.industry_arcs[industryId] || null;
    }

    function getAllIndustryArcs() {
        if (!isInitialized) return {};
        return ontology.industry_arcs;
    }

    function detectIndustryArc(placedModuleIds) {
        if (!isInitialized || placedModuleIds.length === 0) return null;

        const scores = {};

        for (const [arcId, arc] of Object.entries(ontology.industry_arcs)) {
            let score = 0;
            arc.starter_modules.forEach(modId => {
                if (placedModuleIds.includes(modId)) score += 3;
            });
            arc.core_modules.forEach(modId => {
                if (placedModuleIds.includes(modId)) score += 2;
            });
            arc.expansion_modules.forEach(modId => {
                if (placedModuleIds.includes(modId)) score += 1;
            });
            scores[arcId] = score;
        }

        let bestArc = null;
        let bestScore = 2; // Minimum threshold

        for (const [arcId, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestScore = score;
                bestArc = arcId;
            }
        }

        return bestArc ? { id: bestArc, ...ontology.industry_arcs[bestArc], score: bestScore } : null;
    }

    // === RELATIONSHIP QUERIES ===

    function getModuleAffinity(moduleId1, moduleId2) {
        if (!isInitialized) return { affinity: 50, flow: 'bidirectional', priority: 3 };

        const key1 = `${moduleId1}+${moduleId2}`;
        const key2 = `${moduleId2}+${moduleId1}`;

        if (relationships.module_pairs[key1]) {
            return relationships.module_pairs[key1];
        }
        if (relationships.module_pairs[key2]) {
            const pair = relationships.module_pairs[key2];
            return {
                ...pair,
                flow: reverseFlow(pair.flow)
            };
        }

        // Fallback to dimension-based affinity
        return getDimensionBasedAffinity(moduleId1, moduleId2);
    }

    function getDimensionBasedAffinity(moduleId1, moduleId2) {
        const dim1 = getDimensionFromModuleId(moduleId1);
        const dim2 = getDimensionFromModuleId(moduleId2);

        if (!dim1 || !dim2) return { affinity: 50, flow: 'bidirectional', priority: 3 };

        const affinity = relationships.dimension_affinities[dim1]?.[dim2] || 50;

        return {
            affinity,
            flow: 'bidirectional',
            priority: 3,
            inferred: true
        };
    }

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

    function reverseFlow(flow) {
        if (flow === 'from-to') return 'to-from';
        if (flow === 'to-from') return 'from-to';
        return flow;
    }

    function getBestConnectionsFor(moduleId, availableModules, existingConnections) {
        if (!isInitialized) return [];

        const suggestions = [];
        const connectedIds = getConnectedModuleIds(moduleId, existingConnections);

        availableModules.forEach(mod => {
            const targetId = mod.templateId || mod.id;
            if (targetId === moduleId) return;
            if (connectedIds.has(targetId)) return;

            const affinity = getModuleAffinity(moduleId, targetId);
            if (affinity.affinity >= 70) {
                suggestions.push({
                    targetModule: mod,
                    ...affinity
                });
            }
        });

        suggestions.sort((a, b) => {
            if (b.affinity !== a.affinity) return b.affinity - a.affinity;
            return (a.priority || 3) - (b.priority || 3);
        });

        return suggestions;
    }

    function getConnectedModuleIds(moduleId, connections) {
        const connected = new Set();
        connections.forEach(conn => {
            if (conn.fromModule === moduleId) connected.add(conn.toModule);
            if (conn.toModule === moduleId) connected.add(conn.fromModule);
        });
        return connected;
    }

    function getFlowPatterns() {
        if (!isInitialized) return {};
        return relationships.flow_patterns;
    }

    // === STORYTELLING QUERIES ===

    function getMilestone(milestoneId) {
        if (!isInitialized) return null;
        return milestones.milestones[milestoneId] || null;
    }

    function getAllMilestones() {
        if (!isInitialized) return {};
        return milestones.milestones;
    }

    function checkMilestoneCondition(milestoneId, stats) {
        const milestone = getMilestone(milestoneId);
        if (!milestone) return false;

        const { type, value } = milestone.condition;

        switch (type) {
            case 'module_count':
                return stats.moduleCount >= value;
            case 'connection_count':
                return stats.connectionCount >= value;
            case 'dimension_count':
                return stats.dimensionCount >= value;
            case 'cross_dimension_connections':
                return stats.crossDimensionConnections >= value;
            case 'max_dimension_modules':
                return stats.maxDimensionModules >= value;
            case 'connection_ratio':
                return stats.moduleCount >= 3 && stats.connectionCount >= stats.moduleCount * value;
            case 'level':
                return stats.level >= value;
            case 'modules_present':
                return value.every(modId => stats.placedModuleIds?.includes(modId));
            default:
                return false;
        }
    }

    function getChapter(chapterId) {
        if (!isInitialized) return null;
        return chapters.chapters[chapterId] || null;
    }

    function getCurrentChapter(moduleCount) {
        if (!isInitialized) return chapters?.chapters?.genesis || null;

        let currentChapter = chapters.chapters.genesis;

        for (const chapter of Object.values(chapters.chapters)) {
            if (moduleCount >= chapter.threshold) {
                currentChapter = chapter;
            }
        }

        return currentChapter;
    }

    function getAllChapters() {
        if (!isInitialized) return {};
        return chapters.chapters;
    }

    function getArchitectureType(analysis) {
        if (!isInitialized) return null;

        const { moduleCount, dimensionCount, connectionCount, crossDimensionConnections, strongestCount } = analysis;

        if (dimensionCount >= 4 && connectionCount >= 5) {
            return chapters.architecture_types.ecosystem;
        } else if (strongestCount >= 4) {
            return chapters.architecture_types.specialized;
        } else if (crossDimensionConnections >= 3) {
            return chapters.architecture_types.integrated;
        } else if (dimensionCount >= 3) {
            return chapters.architecture_types.diversified;
        } else if (moduleCount > 0) {
            return chapters.architecture_types.focused;
        }

        return null;
    }

    // === VISION QUERIES ===

    function getVision(visionId) {
        if (!isInitialized) return null;
        return visions.visions[visionId] || null;
    }

    function getAllVisions() {
        if (!isInitialized) return {};
        return visions.visions;
    }

    function detectVision(placedModules) {
        if (!isInitialized || placedModules.length < 2) return null;

        const placedIds = placedModules.map(m => m.templateId || m.id);
        const scores = {};

        for (const [visionId, vision] of Object.entries(visions.visions)) {
            let score = 0;
            vision.core_modules.forEach(modId => {
                if (placedIds.includes(modId)) score += 2;
            });
            vision.expansion_modules.forEach(modId => {
                if (placedIds.includes(modId)) score += 1;
            });
            scores[visionId] = score;
        }

        let bestVision = null;
        let bestScore = 3; // Minimum threshold

        for (const [visionId, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestScore = score;
                bestVision = visionId;
            }
        }

        return bestVision ? { id: bestVision, ...visions.visions[bestVision], score: bestScore } : null;
    }

    function getRecommendationReason(fromModuleId, toModuleId) {
        if (!isInitialized) return null;
        return visions.recommendation_reasons[fromModuleId]?.[toModuleId] || null;
    }

    // === PUBLIC API ===
    return {
        init,
        isReady: () => isInitialized,

        // Ontology
        getCapability,
        getModuleValue,
        getModuleCategory,
        getModulesProviding,
        getModulesEnabling,
        getTransformationStage,
        getAllTransformationStages,
        getIndustryArc,
        getAllIndustryArcs,
        detectIndustryArc,

        // Relationships
        getModuleAffinity,
        getDimensionBasedAffinity,
        getBestConnectionsFor,
        getFlowPatterns,

        // Storytelling
        getMilestone,
        getAllMilestones,
        checkMilestoneCondition,
        getChapter,
        getCurrentChapter,
        getAllChapters,
        getArchitectureType,

        // Visions
        getVision,
        getAllVisions,
        detectVision,
        getRecommendationReason
    };

})();
