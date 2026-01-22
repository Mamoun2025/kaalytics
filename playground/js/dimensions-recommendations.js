/* ============================================
   DIMENSIONS RECOMMENDATIONS
   Smart Module Suggestions - Module autonome
   ============================================ */

const DimensionsRecommendations = (function() {
    'use strict';

    // === VISIONS (orientations stratégiques) ===
    const VISIONS = {
        terrain: {
            name: "Vision Terrain",
            icon: "🗺️",
            description: "Maîtrise des opérations physiques",
            modules: ["ops-map", "ops-fleet", "ops-routes", "ops-maintenance", "integ-iot"]
        },
        revenue: {
            name: "Vision Revenue",
            icon: "💰",
            description: "Maximisation du chiffre d'affaires",
            modules: ["growth-crm", "growth-pipeline", "growth-scoring", "intel-forecast", "intel-margins"]
        },
        client: {
            name: "Vision Client",
            icon: "👥",
            description: "Excellence de l'expérience client",
            modules: ["growth-insights", "growth-whatsapp", "engage-campaigns", "growth-churn", "brand-web"]
        },
        efficiency: {
            name: "Vision Efficacité",
            icon: "⚡",
            description: "Optimisation des processus",
            modules: ["ops-scheduling", "intel-reports", "ent-erp", "integ-sync", "ops-kpi"]
        },
        security: {
            name: "Vision Sécurité",
            icon: "🛡️",
            description: "Protection des actifs",
            modules: ["sec-detect", "sec-response", "sec-backup", "sec-encrypt", "sec-compliance"]
        },
        data: {
            name: "Vision Data",
            icon: "📊",
            description: "Intelligence par les données",
            modules: ["intel-ml", "intel-dashboards", "intel-alerts", "integ-etl", "engage-analytics"]
        }
    };

    // === RAISONS DE RECOMMANDATION ===
    const RECOMMENDATION_REASONS = {
        "ops-fleet": {
            "ops-map": "Visualisez chaque véhicule sur carte en temps réel",
            "ops-routes": "Optimisez les trajets selon positions réelles",
            "ops-maintenance": "Planifiez la maintenance selon l'usage réel"
        },
        "ops-map": {
            "ops-fleet": "Suivez votre flotte sur la carte interactive",
            "integ-iot": "Connectez capteurs et équipements terrain",
            "ops-routes": "Visualisez et optimisez les itinéraires"
        },
        "ops-routes": {
            "ops-fleet": "Trajets calculés selon positions véhicules",
            "ops-map": "Vision cartographique des optimisations",
            "intel-forecast": "Prévisions qui informent la planification"
        },
        "ops-maintenance": {
            "ops-fleet": "Maintenance basée sur usage réel des véhicules",
            "integ-iot": "Capteurs qui prédisent les pannes",
            "ops-alerts": "Alertes automatiques avant problèmes"
        },
        "growth-crm": {
            "growth-scoring": "Priorisez automatiquement vos prospects",
            "growth-pipeline": "Suivez chaque opportunité jusqu'à signature",
            "growth-insights": "Connaissance client à 360°"
        },
        "growth-pipeline": {
            "growth-crm": "Alimentez le pipeline depuis le CRM",
            "growth-quotes": "Devis rapides pour accélérer les deals",
            "intel-forecast": "Prévisions basées sur pipeline réel"
        },
        "intel-banks": {
            "intel-cashflow": "Suivez les flux en temps réel",
            "intel-forecast": "Prévisions trésorerie précises",
            "ent-erp": "Réconciliation automatique"
        },
        "intel-ml": {
            "intel-forecast": "Prédictions alimentées par l'IA",
            "intel-alerts": "Détection d'anomalies intelligente",
            "growth-scoring": "Scoring leads par machine learning"
        },
        "sec-detect": {
            "sec-response": "Réponse automatique aux menaces détectées",
            "sec-audit": "Traçabilité complète des incidents",
            "intel-alerts": "Alertes unifiées sécurité + business"
        },
        "ent-erp": {
            "intel-reports": "Rapports automatiques depuis l'ERP",
            "integ-universal": "Connectez tous vos outils",
            "ent-hr": "Gestion RH intégrée"
        },
        "brand-identity": {
            "brand-web": "Site cohérent avec votre identité",
            "brand-docs": "Documents à votre image",
            "brand-system": "Cohérence sur tous les supports"
        },
        "engage-campaigns": {
            "engage-budget": "Optimisez l'allocation automatiquement",
            "engage-analytics": "Mesurez chaque campagne",
            "engage-ab": "Testez et améliorez continuellement"
        }
    };

    // === STATE ===
    let panelElement = null;
    let narratives = null;

    // === INIT ===
    async function init(panelSelector) {
        panelElement = document.querySelector(panelSelector);

        try {
            const response = await fetch('data/narratives.json');
            narratives = await response.json();
        } catch (error) {
            console.error('[Recommendations] Failed to load narratives');
        }

        bindDataEvents();
        console.log('[Recommendations] Initialized');
    }

    // === DATA EVENTS ===
    function bindDataEvents() {
        DimensionsData.on('moduleAdded', onModuleChange);
        DimensionsData.on('moduleRemoved', onModuleChange);
        DimensionsData.on('connectionAdded', onModuleChange);
        DimensionsData.on('connectionRemoved', onModuleChange);
        DimensionsData.on('selectionChanged', onSelectionChange);
    }

    function onModuleChange() {
        updateRecommendations();
    }

    function onSelectionChange(moduleId) {
        if (moduleId) {
            updateRecommendations(moduleId);
        }
    }

    // === GET RECOMMENDATIONS ===
    function getRecommendations(focusModuleId = null) {
        const placedModules = DimensionsData.getPlacedModules();
        const placedIds = placedModules.map(m => m.templateId);
        const connections = DimensionsData.getConnections();

        if (placedModules.length === 0) {
            return getStarterRecommendations();
        }

        const recommendations = [];
        const addedIds = new Set();

        // Get module to focus on (selected or last added)
        let focusModule = null;
        if (focusModuleId) {
            focusModule = placedModules.find(m => m.id === focusModuleId);
        }
        if (!focusModule && placedModules.length > 0) {
            focusModule = placedModules[placedModules.length - 1];
        }

        if (focusModule && narratives?.modules[focusModule.templateId]) {
            const moduleData = narratives.modules[focusModule.templateId];
            const connectsWith = moduleData.connects_well_with || [];

            // Get recommendations from connects_well_with
            connectsWith.forEach(recId => {
                if (!placedIds.includes(recId) && !addedIds.has(recId)) {
                    const recModule = narratives.modules[recId];
                    if (recModule) {
                        const reason = RECOMMENDATION_REASONS[focusModule.templateId]?.[recId]
                            || getDefaultReason(focusModule.templateId, recId);

                        recommendations.push({
                            id: recId,
                            name: getModuleName(recId),
                            dimension: getDimensionForModule(recId),
                            reason: reason,
                            priority: 'high',
                            fromModule: focusModule.name
                        });
                        addedIds.add(recId);
                    }
                }
            });
        }

        // Add vision-based recommendations
        const activeVision = detectVision(placedModules);
        if (activeVision) {
            VISIONS[activeVision].modules.forEach(modId => {
                if (!placedIds.includes(modId) && !addedIds.has(modId) && recommendations.length < 5) {
                    recommendations.push({
                        id: modId,
                        name: getModuleName(modId),
                        dimension: getDimensionForModule(modId),
                        reason: `Renforce votre ${VISIONS[activeVision].name}`,
                        priority: 'medium',
                        vision: activeVision
                    });
                    addedIds.add(modId);
                }
            });
        }

        return recommendations.slice(0, 4);
    }

    // === STARTER RECOMMENDATIONS ===
    function getStarterRecommendations() {
        return [
            {
                id: "ent-erp",
                name: "ERP Complet",
                dimension: getDimensionForModule("ent-erp"),
                reason: "Fondation solide pour toute transformation",
                priority: "starter"
            },
            {
                id: "growth-crm",
                name: "CRM Intelligent",
                dimension: getDimensionForModule("growth-crm"),
                reason: "Commencez par maîtriser vos relations clients",
                priority: "starter"
            },
            {
                id: "ops-fleet",
                name: "Suivi de Flotte",
                dimension: getDimensionForModule("ops-fleet"),
                reason: "Visibilité immédiate sur vos opérations",
                priority: "starter"
            }
        ];
    }

    // === DETECT VISION ===
    function detectVision(modules) {
        const visionScores = {};

        modules.forEach(m => {
            for (const [visionId, vision] of Object.entries(VISIONS)) {
                if (vision.modules.includes(m.templateId)) {
                    visionScores[visionId] = (visionScores[visionId] || 0) + 1;
                }
            }
        });

        let topVision = null;
        let topScore = 0;
        for (const [visionId, score] of Object.entries(visionScores)) {
            if (score > topScore) {
                topScore = score;
                topVision = visionId;
            }
        }

        return topScore >= 2 ? topVision : null;
    }

    // === HELPERS ===
    function getModuleName(moduleId) {
        const names = {
            // Opérations Terrain
            "ops-map": "Carte Intelligente",
            "ops-routes": "Optimisation Trajets",
            "ops-maintenance": "Maintenance Prédictive",
            "ops-inventory": "Gestion des Stocks",
            "ops-fleet": "Suivi de Flotte",
            "ops-scheduling": "Planning Équipes",
            "ops-alerts": "Alertes Terrain",
            "ops-kpi": "KPIs Opérationnels",
            "ops-sites": "Gestion Chantiers",
            "ops-machines": "Planning Machines",
            "ops-field": "App Terrain",
            "ops-weather": "Météo Prédictive",
            // Intelligence Financière
            "intel-banks": "Multi-Banque",
            "intel-ml": "IA Prédictive",
            "intel-reports": "Rapports Auto",
            "intel-dashboards": "Tableaux de Bord",
            "intel-cashflow": "Analyse Trésorerie",
            "intel-margins": "Analyse Marges",
            "intel-forecast": "Prévisions Revenue",
            "intel-alerts": "Détection Anomalies",
            // Croissance & CRM
            "growth-crm": "CRM Intelligent",
            "growth-whatsapp": "Bot WhatsApp",
            "growth-pipeline": "Pipeline Commercial",
            "growth-insights": "Vision Client 360",
            "growth-scoring": "Scoring Leads",
            "growth-followup": "Relances Auto",
            "growth-quotes": "Devis Intelligents",
            "growth-churn": "Prévention Churn",
            // Marketing & Engagement
            "engage-campaigns": "Campagnes IA",
            "engage-content": "Moteur Contenu",
            "engage-budget": "Optimisation Budget",
            "engage-attribution": "Attribution Marketing",
            "engage-email": "Automation Email",
            "engage-social": "Gestion Réseaux",
            "engage-ab": "Tests A/B",
            "engage-analytics": "Analytics Marketing",
            // Marque & Design
            "brand-identity": "Identité de Marque",
            "brand-web": "Site Web",
            "brand-docs": "Templates Documents",
            "brand-system": "Design System",
            "brand-ui": "Design UI/UX",
            "brand-motion": "Motion Design",
            "brand-print": "Supports Print",
            "brand-social": "Assets Réseaux",
            // Intégration
            "integ-universal": "Connecteur Universel",
            "integ-sync": "Sync Temps Réel",
            "integ-api": "Hub API",
            "integ-etl": "ETL Intelligent",
            "integ-iot": "Passerelle IoT",
            "integ-legacy": "Pont Legacy",
            "integ-queue": "File de Messages",
            "integ-monitor": "Monitoring Flux",
            // Sécurité
            "sec-detect": "Détection Menaces",
            "sec-response": "Réponse Auto",
            "sec-compliance": "Conformité",
            "sec-audit": "Piste d'Audit",
            "sec-access": "Contrôle Accès",
            "sec-encrypt": "Chiffrement",
            "sec-backup": "Sauvegarde Intelligente",
            "sec-pentest": "Scan Vulnérabilités",
            // Entreprise
            "ent-erp": "ERP Complet",
            "ent-custom": "Modules Sur-Mesure",
            "ent-deploy": "Déploiement Rapide",
            "ent-support": "Support Expert",
            "ent-hr": "Gestion RH",
            "ent-purchase": "Achats",
            "ent-project": "Gestion Projets",
            "ent-docs": "Hub Documents"
        };
        return names[moduleId] || moduleId;
    }

    function getDimensionForModule(moduleId) {
        const prefix = moduleId.split('-')[0];
        const mapping = {
            ops: { id: 'operations', color: '#0d9488', emoji: '🏗️' },
            intel: { id: 'intelligence', color: '#10b981', emoji: '💰' },
            growth: { id: 'growth', color: '#10b981', emoji: '🚀' },
            engage: { id: 'engagement', color: '#059669', emoji: '✨' },
            brand: { id: 'brand', color: '#14b8a6', emoji: '🎨' },
            integ: { id: 'integration', color: '#0d9488', emoji: '🔌' },
            sec: { id: 'security', color: '#065f46', emoji: '🛡️' },
            ent: { id: 'enterprise', color: '#0d9488', emoji: '📦' }
        };
        return mapping[prefix] || { id: 'unknown', color: '#888', emoji: '📦' };
    }

    function getDefaultReason(fromId, toId) {
        return `Synergie naturelle avec ${getModuleName(fromId)}`;
    }

    // === UPDATE PANEL ===
    function updateRecommendations(focusModuleId = null) {
        if (!panelElement) return;

        const recommendations = getRecommendations(focusModuleId);
        const activeVision = detectVision(DimensionsData.getPlacedModules());

        // Update vision indicator
        const visionEl = panelElement.querySelector('.reco-vision');
        if (visionEl && activeVision) {
            const vision = VISIONS[activeVision];
            visionEl.innerHTML = `${vision.icon} ${vision.name}`;
            visionEl.style.display = 'block';
        } else if (visionEl) {
            visionEl.style.display = 'none';
        }

        // Update recommendations list
        const listEl = panelElement.querySelector('.reco-list');
        if (listEl) {
            if (recommendations.length > 0) {
                listEl.innerHTML = recommendations.map(rec => `
                    <div class="reco-item" data-module-id="${rec.id}" draggable="true">
                        <div class="reco-header">
                            <span class="reco-emoji">${rec.dimension.emoji}</span>
                            <span class="reco-name">${rec.name}</span>
                            ${rec.priority === 'high' ? '<span class="reco-badge">Recommandé</span>' : ''}
                        </div>
                        <div class="reco-reason">${rec.reason}</div>
                    </div>
                `).join('');

                // Add drag handlers
                listEl.querySelectorAll('.reco-item').forEach(item => {
                    setupRecoDrag(item);
                });
            } else {
                listEl.innerHTML = '<div class="reco-empty">Ajoutez des modules pour voir les recommandations</div>';
            }
        }
    }

    // === DRAG FROM RECOMMENDATIONS ===
    function setupRecoDrag(item) {
        item.addEventListener('dragstart', (e) => {
            const moduleId = item.dataset.moduleId;
            e.dataTransfer.setData('text/plain', JSON.stringify({ moduleId }));
            e.dataTransfer.effectAllowed = 'copy';
            item.classList.add('dragging');

            if (typeof DimensionsWorkspace !== 'undefined') {
                DimensionsWorkspace.setDragging(true, { moduleId });
            }
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            if (typeof DimensionsWorkspace !== 'undefined') {
                DimensionsWorkspace.setDragging(false, null);
            }
        });

        // Click to add directly (at free position)
        item.addEventListener('click', () => {
            const moduleId = item.dataset.moduleId;
            if (typeof DimensionsWorkspace !== 'undefined') {
                DimensionsWorkspace.addModuleAtFreePosition(moduleId);
            }
        });
    }

    // === PUBLIC API ===
    return {
        init,
        getRecommendations,
        updateRecommendations,
        VISIONS
    };

})();
