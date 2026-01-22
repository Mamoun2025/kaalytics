/* ============================================
   SEMANTIC LOADER v1.1
   Centralized loading of rich semantic content
   Single source of truth for modules & synergies
   ============================================ */

/**
 * @typedef {Object} TransformationStory
 * @property {string} intro - Introduction narrative
 * @property {string} deep_narrative - Narrative approfondie
 * @property {string} business_impact - Impact business
 */

/**
 * @typedef {Object} RichModule
 * @property {string} name - Nom du module
 * @property {string} tagline - Accroche courte
 * @property {string} description_short - Description courte
 * @property {string} description_full - Description complète
 * @property {TransformationStory} transformation_story - Histoire de transformation
 */

/**
 * @typedef {Object} RichSynergy
 * @property {string} name - Nom de la synergie
 * @property {string} tagline - Accroche courte
 * @property {string} story_paragraph - Paragraphe narratif
 * @property {string} impact_narrative - Narrative d'impact
 */

/**
 * @typedef {Object} ThreadMapping
 * @property {string} primary - Thread principal
 * @property {string[]} secondary - Threads secondaires
 */

/**
 * @typedef {Object} LoadResult
 * @property {boolean} success - Chargement réussi
 * @property {number} modulesCount - Nombre de modules chargés
 * @property {number} synergiesCount - Nombre de synergies chargées
 * @property {string[]} errors - Erreurs rencontrées
 */

const SemanticLoader = (function() {
    'use strict';

    // === CONTENT CACHE ===
    const cache = {
        modules: {},      // templateId -> module data
        synergies: {},    // "id1+id2" -> synergy data
        multi: {},        // "id1+id2+id3" -> multi-synergy data
        threads: {},      // threadId -> thread definition
        threadMapping: {} // templateId -> { primary, secondary }
    };

    // === STATE ===
    let isLoaded = false;
    let loadPromise = null;
    let loadErrors = [];

    // === DIMENSIONS TO LOAD ===
    const DIMENSIONS = [
        'operations', 'growth', 'intelligence', 'engagement',
        'brand', 'integration', 'enterprise', 'security',
        'construction', 'logistics', 'mining', 'manufacturing'
    ];

    // === VALIDATION ===

    /**
     * Valide la structure d'un module
     * @param {Object} data - Données du module
     * @returns {boolean} True si valide
     */
    function validateModule(data) {
        return data &&
               typeof data === 'object' &&
               typeof data.name === 'string' &&
               data.name.length > 0;
    }

    /**
     * Valide la structure d'une synergie
     * @param {Object} data - Données de la synergie
     * @returns {boolean} True si valide
     */
    function validateSynergy(data) {
        return data &&
               typeof data === 'object' &&
               typeof data.name === 'string' &&
               data.name.length > 0;
    }

    // === INIT ===

    /**
     * Initialise le chargement de tout le contenu sémantique
     * @returns {Promise<LoadResult>} Résultat du chargement
     */
    async function init() {
        // Return existing promise if already loading
        if (loadPromise) {
            return loadPromise;
        }

        loadPromise = (async () => {
            loadErrors = [];

            try {
                await Promise.all([
                    loadRichContent(),
                    loadNarrativeThreads()
                ]);
                isLoaded = true;

                const result = {
                    success: true,
                    modulesCount: Object.keys(cache.modules).length,
                    synergiesCount: Object.keys(cache.synergies).length,
                    errors: loadErrors
                };

                console.log('[SemanticLoader] Content loaded:', result);

                if (loadErrors.length > 0) {
                    console.warn('[SemanticLoader] Partial load with errors:', loadErrors);
                }

                return result;
            } catch (error) {
                loadErrors.push(`Critical: ${error.message}`);
                console.error('[SemanticLoader] Failed to load:', error);
                return {
                    success: false,
                    modulesCount: 0,
                    synergiesCount: 0,
                    errors: loadErrors
                };
            }
        })();

        return loadPromise;
    }

    // === LOAD RICH CONTENT ===

    /**
     * Charge le contenu riche de toutes les dimensions
     * @private
     */
    async function loadRichContent() {
        const loadPromises = DIMENSIONS.map(async (dim) => {
            // Load modules
            try {
                const modulesRes = await fetch(`data/semantic/content/modules-${dim}-rich.json`);
                if (modulesRes.ok) {
                    const data = await modulesRes.json();
                    if (data.modules && typeof data.modules === 'object') {
                        let validCount = 0;
                        Object.entries(data.modules).forEach(([key, value]) => {
                            if (validateModule(value)) {
                                cache.modules[key] = value;
                                validCount++;
                            } else {
                                loadErrors.push(`Invalid module: ${key} in ${dim}`);
                            }
                        });
                    }
                } else if (modulesRes.status !== 404) {
                    loadErrors.push(`modules-${dim}: HTTP ${modulesRes.status}`);
                }
            } catch (e) {
                loadErrors.push(`modules-${dim}: ${e.message}`);
            }

            // Load synergies
            try {
                const synergiesRes = await fetch(`data/semantic/content/synergies-${dim}-rich.json`);
                if (synergiesRes.ok) {
                    const data = await synergiesRes.json();
                    if (data.connections && typeof data.connections === 'object') {
                        Object.entries(data.connections).forEach(([key, value]) => {
                            if (validateSynergy(value)) {
                                cache.synergies[key] = value;
                            } else {
                                loadErrors.push(`Invalid synergy: ${key} in ${dim}`);
                            }
                        });
                    }
                    if (data.multi_connections && typeof data.multi_connections === 'object') {
                        Object.assign(cache.multi, data.multi_connections);
                    }
                } else if (synergiesRes.status !== 404) {
                    loadErrors.push(`synergies-${dim}: HTTP ${synergiesRes.status}`);
                }
            } catch (e) {
                loadErrors.push(`synergies-${dim}: ${e.message}`);
            }
        });

        await Promise.all(loadPromises);
    }

    // === LOAD NARRATIVE THREADS ===

    /**
     * Charge les threads narratifs
     * @private
     */
    async function loadNarrativeThreads() {
        try {
            const response = await fetch('data/semantic/narrative-threads.json');
            if (response.ok) {
                const data = await response.json();
                cache.threads = data.threads || {};
                cache.threadMapping = data.moduleThreadMapping || {};
            } else if (response.status !== 404) {
                loadErrors.push(`narrative-threads: HTTP ${response.status}`);
            }
        } catch (error) {
            loadErrors.push(`narrative-threads: ${error.message}`);
        }
    }

    // === GETTERS ===

    /**
     * Récupère les données enrichies d'un module
     * @param {string} templateId - ID du template (ex: 'ops-map')
     * @returns {RichModule|null} Données du module ou null si non trouvé
     */
    function getModule(templateId) {
        if (!templateId || typeof templateId !== 'string') {
            return null;
        }
        return cache.modules[templateId] || null;
    }

    /**
     * Récupère une synergie entre deux modules (ordre flexible)
     * @param {string} templateId1 - Premier module
     * @param {string} templateId2 - Second module
     * @returns {RichSynergy|null} Données de synergie ou null
     */
    function getSynergy(templateId1, templateId2) {
        if (!templateId1 || !templateId2) {
            return null;
        }
        const key1 = `${templateId1}+${templateId2}`;
        const key2 = `${templateId2}+${templateId1}`;
        return cache.synergies[key1] || cache.synergies[key2] || null;
    }

    /**
     * Récupère une multi-synergie (3+ modules)
     * @param {string[]} templateIds - Liste des IDs de modules
     * @returns {Object|null} Données de multi-synergie ou null
     */
    function getMultiSynergy(templateIds) {
        if (!Array.isArray(templateIds) || templateIds.length < 3) {
            return null;
        }
        const sorted = [...templateIds].sort();
        const key = sorted.join('+');
        return cache.multi[key] || null;
    }

    /**
     * Récupère les threads associés à un module
     * @param {string} templateId - ID du template
     * @returns {ThreadMapping} Mapping des threads
     */
    function getModuleThreads(templateId) {
        if (!templateId) {
            return { primary: null, secondary: [] };
        }
        const mapping = cache.threadMapping[templateId];
        if (!mapping) {
            return { primary: null, secondary: [] };
        }
        return {
            primary: mapping.primary || null,
            secondary: Array.isArray(mapping.secondary) ? mapping.secondary : []
        };
    }

    /**
     * Récupère la définition d'un thread narratif
     * @param {string} threadId - ID du thread
     * @returns {Object|null} Définition du thread ou null
     */
    function getThread(threadId) {
        if (!threadId) {
            return null;
        }
        return cache.threads[threadId] || null;
    }

    /**
     * Récupère tous les threads narratifs
     * @returns {Object} Dictionnaire des threads
     */
    function getAllThreads() {
        return cache.threads;
    }

    /**
     * Récupère les erreurs de chargement
     * @returns {string[]} Liste des erreurs
     */
    function getLoadErrors() {
        return [...loadErrors];
    }

    /**
     * Récupère les statistiques du cache
     * @returns {Object} Statistiques
     */
    function getStats() {
        return {
            modules: Object.keys(cache.modules).length,
            synergies: Object.keys(cache.synergies).length,
            multiSynergies: Object.keys(cache.multi).length,
            threads: Object.keys(cache.threads).length,
            errors: loadErrors.length
        };
    }

    // === PUBLIC API ===
    return {
        init,
        isLoaded: () => isLoaded,

        // Module access
        getModule,

        // Synergy access
        getSynergy,
        getMultiSynergy,

        // Thread access
        getModuleThreads,
        getThread,
        getAllThreads,

        // Diagnostics
        getLoadErrors,
        getStats
    };

})();
