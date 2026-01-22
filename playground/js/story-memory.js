/* ============================================
   STORY MEMORY v1.0
   Persistent Narrative State Management
   Memory of the transformation journey
   ============================================ */

const StoryMemory = (function() {
    'use strict';

    // === CORE STATE ===
    const state = {
        // Timeline: Ordered history of all events
        timeline: [],

        // Chapters: Narrative structure
        chapters: {
            current: 'genesis',
            completed: [],
            data: {}
        },

        // Narrative Threads: Thematic threads strength
        threads: {},

        // Transformation metrics
        transformation: {
            score: 0,
            dominantDimension: null,
            dominantThread: null,
            architectureType: null,
            keyStrengths: [],
            opportunities: []
        },

        // Story paragraphs (accumulated text)
        paragraphs: [],

        // Last rendered state (for diff)
        lastRender: {
            moduleCount: 0,
            connectionCount: 0,
            paragraphCount: 0
        }
    };

    // === CHAPTER DEFINITIONS ===
    const CHAPTERS = {
        genesis: {
            id: 'genesis',
            title: "L'Éveil",
            threshold: 0,
            maxModules: 0,
            openingLine: "Votre transformation digitale attend son premier pas.",
            style: 'intro'
        },
        foundation: {
            id: 'foundation',
            title: "Les Fondations",
            threshold: 1,
            maxModules: 3,
            openingLine: "Les premières pierres de votre architecture digitale sont posées.",
            closingLine: "Ces fondations solides appellent maintenant l'expansion.",
            style: 'building'
        },
        expansion: {
            id: 'expansion',
            title: "L'Expansion",
            threshold: 4,
            maxModules: 7,
            openingLine: "Votre système s'étend et gagne en capacités.",
            closingLine: "L'heure est venue d'intégrer ces capacités en un tout cohérent.",
            style: 'growing'
        },
        integration: {
            id: 'integration',
            title: "L'Intégration",
            threshold: 8,
            maxModules: 12,
            openingLine: "Les synergies se multiplient, créant un écosystème intégré.",
            closingLine: "Votre architecture atteint sa maturité. La transformation s'accélère.",
            style: 'connecting'
        },
        acceleration: {
            id: 'acceleration',
            title: "L'Accélération",
            threshold: 13,
            maxModules: 18,
            openingLine: "Chaque nouvelle capacité amplifie les précédentes.",
            closingLine: "Vous êtes aux portes de la transformation complète.",
            style: 'accelerating'
        },
        transformation: {
            id: 'transformation',
            title: "La Transformation",
            threshold: 19,
            maxModules: Infinity,
            openingLine: "Votre entreprise opère désormais à un niveau supérieur.",
            style: 'complete'
        }
    };

    // === CHAPTER ORDER ===
    const CHAPTER_ORDER = ['genesis', 'foundation', 'expansion', 'integration', 'acceleration', 'transformation'];

    // === INITIALIZATION ===
    function init() {
        // Initialize chapter data
        Object.keys(CHAPTERS).forEach(chapterId => {
            state.chapters.data[chapterId] = {
                ...CHAPTERS[chapterId],
                paragraphs: [],
                startedAt: null,
                completedAt: null
            };
        });

        // Set genesis as current
        state.chapters.current = 'genesis';
        state.chapters.data.genesis.startedAt = Date.now();

        console.log('[StoryMemory] Initialized');
    }

    // === TIMELINE MANAGEMENT ===

    /**
     * Add an event to the timeline
     */
    function addEvent(event) {
        const timelineEvent = {
            id: generateEventId(),
            timestamp: Date.now(),
            chapterAtTime: state.chapters.current,
            ...event
        };

        state.timeline.push(timelineEvent);

        // Emit event for listeners
        emitChange('timeline', timelineEvent);

        return timelineEvent;
    }

    /**
     * Add module event
     */
    function addModuleEvent(module, paragraph) {
        return addEvent({
            type: 'module_added',
            moduleId: module.id,
            templateId: module.templateId,
            moduleName: module.name,
            dimensionId: module.dimension?.id,
            dimensionName: module.dimension?.title,
            paragraph: paragraph
        });
    }

    /**
     * Add connection event
     */
    function addConnectionEvent(connection, fromModule, toModule, synergy, paragraph) {
        return addEvent({
            type: 'connection_added',
            connectionId: connection.id,
            fromModuleId: fromModule.id,
            fromTemplateId: fromModule.templateId,
            fromName: fromModule.name,
            toModuleId: toModule.id,
            toTemplateId: toModule.templateId,
            toName: toModule.name,
            synergyName: synergy?.name || null,
            isCrossDimension: fromModule.dimension?.id !== toModule.dimension?.id,
            paragraph: paragraph
        });
    }

    /**
     * Add module removed event
     */
    function addModuleRemovedEvent(module) {
        return addEvent({
            type: 'module_removed',
            moduleId: module.id,
            templateId: module.templateId,
            moduleName: module.name
        });
    }

    /**
     * Add connection removed event
     */
    function addConnectionRemovedEvent(connection) {
        return addEvent({
            type: 'connection_removed',
            connectionId: connection.id
        });
    }

    /**
     * Get recent events
     */
    function getRecentEvents(count = 5) {
        return state.timeline.slice(-count);
    }

    /**
     * Get last event
     */
    function getLastEvent() {
        return state.timeline[state.timeline.length - 1] || null;
    }

    /**
     * Get events by type
     */
    function getEventsByType(type) {
        return state.timeline.filter(e => e.type === type);
    }

    // === CHAPTER MANAGEMENT ===

    /**
     * Get current chapter
     */
    function getCurrentChapter() {
        return state.chapters.data[state.chapters.current];
    }

    /**
     * Check and update chapter based on module count
     */
    function updateChapter(moduleCount) {
        const currentChapter = state.chapters.current;
        let newChapter = 'genesis';

        // Find appropriate chapter based on thresholds
        for (let i = CHAPTER_ORDER.length - 1; i >= 0; i--) {
            const chapterId = CHAPTER_ORDER[i];
            if (moduleCount >= CHAPTERS[chapterId].threshold) {
                newChapter = chapterId;
                break;
            }
        }

        // Check for chapter transition
        if (newChapter !== currentChapter) {
            const transition = {
                from: currentChapter,
                to: newChapter,
                direction: CHAPTER_ORDER.indexOf(newChapter) > CHAPTER_ORDER.indexOf(currentChapter) ? 'forward' : 'backward'
            };

            // Mark current chapter as completed (if moving forward)
            if (transition.direction === 'forward') {
                state.chapters.data[currentChapter].completedAt = Date.now();
                if (!state.chapters.completed.includes(currentChapter)) {
                    state.chapters.completed.push(currentChapter);
                }
            }

            // Set new chapter
            state.chapters.current = newChapter;
            if (!state.chapters.data[newChapter].startedAt) {
                state.chapters.data[newChapter].startedAt = Date.now();
            }

            emitChange('chapter', transition);

            return transition;
        }

        return null;
    }

    /**
     * Add paragraph to current chapter
     */
    function addParagraphToChapter(paragraph, metadata = {}) {
        const chapterId = state.chapters.current;
        const paragraphData = {
            id: generateParagraphId(),
            text: paragraph,
            timestamp: Date.now(),
            ...metadata
        };

        state.chapters.data[chapterId].paragraphs.push(paragraphData);
        state.paragraphs.push(paragraphData);

        emitChange('paragraph', paragraphData);

        return paragraphData;
    }

    /**
     * Get all paragraphs for current story
     */
    function getAllParagraphs() {
        return state.paragraphs;
    }

    /**
     * Get paragraphs by chapter
     */
    function getParagraphsByChapter(chapterId) {
        return state.chapters.data[chapterId]?.paragraphs || [];
    }

    // === THREAD MANAGEMENT ===

    /**
     * Initialize a thread
     */
    function initThread(threadId, threadDef) {
        if (!state.threads[threadId]) {
            state.threads[threadId] = {
                id: threadId,
                name: threadDef.name,
                icon: threadDef.icon,
                strength: 0,
                modules: [],
                connections: [],
                lastContribution: null,
                lastParagraph: null
            };
        }
    }

    /**
     * Contribute to a thread (module or connection added)
     */
    function contributeToThread(threadId, contribution) {
        if (!state.threads[threadId]) {
            console.warn(`[StoryMemory] Thread ${threadId} not initialized`);
            return;
        }

        const thread = state.threads[threadId];
        thread.strength++;
        thread.lastContribution = Date.now();

        if (contribution.type === 'module') {
            thread.modules.push(contribution.moduleId);
        } else if (contribution.type === 'connection') {
            thread.connections.push(contribution.connectionId);
        }

        if (contribution.paragraph) {
            thread.lastParagraph = contribution.paragraph;
        }

        emitChange('thread', { threadId, thread });
    }

    /**
     * Get thread by ID
     */
    function getThread(threadId) {
        return state.threads[threadId] || null;
    }

    /**
     * Get all active threads (strength > 0)
     */
    function getActiveThreads() {
        return Object.values(state.threads)
            .filter(t => t.strength > 0)
            .sort((a, b) => b.strength - a.strength);
    }

    /**
     * Get dominant thread
     */
    function getDominantThread() {
        const active = getActiveThreads();
        return active.length > 0 ? active[0] : null;
    }

    /**
     * Get thread strength for a specific thread
     */
    function getThreadStrength(threadId) {
        return state.threads[threadId]?.strength || 0;
    }

    // === TRANSFORMATION METRICS ===

    /**
     * Update transformation metrics
     */
    function updateTransformation(metrics) {
        Object.assign(state.transformation, metrics);
        emitChange('transformation', state.transformation);
    }

    /**
     * Get transformation state
     */
    function getTransformation() {
        return { ...state.transformation };
    }

    /**
     * Calculate and update score
     */
    function updateScore(modules, connections, analysis) {
        let score = 0;

        // Base: modules (max 40 pts)
        score += Math.min(modules.length * 2.5, 40);

        // Diversity: dimensions (max 20 pts)
        const dimensionCount = Object.keys(analysis.dimensions || {}).length;
        score += Math.min(dimensionCount * 3, 20);

        // Connections (max 20 pts)
        score += Math.min(connections.length * 2, 20);

        // Thread strength bonus (max 10 pts)
        const activeThreads = getActiveThreads();
        const threadBonus = activeThreads.reduce((sum, t) => sum + Math.min(t.strength, 3), 0);
        score += Math.min(threadBonus, 10);

        // Cross-dimension synergies (max 10 pts)
        const crossDimCount = analysis.crossDimensionConnections || 0;
        score += Math.min(crossDimCount * 2.5, 10);

        state.transformation.score = Math.round(Math.min(score, 100));

        return state.transformation.score;
    }

    // === STATE QUERIES ===

    /**
     * Get full state (for debugging)
     */
    function getState() {
        return { ...state };
    }

    /**
     * Get context for story building
     */
    function getStoryContext() {
        return {
            timeline: state.timeline,
            currentChapter: getCurrentChapter(),
            completedChapters: state.chapters.completed,
            paragraphCount: state.paragraphs.length,
            activeThreads: getActiveThreads(),
            dominantThread: getDominantThread(),
            transformation: state.transformation,
            lastEvent: getLastEvent()
        };
    }

    /**
     * Check if this is the first module
     */
    function isFirstModule() {
        return getEventsByType('module_added').length === 0;
    }

    /**
     * Check if this is the first connection
     */
    function isFirstConnection() {
        return getEventsByType('connection_added').length === 0;
    }

    /**
     * Get module count from timeline
     */
    function getModuleCount() {
        const added = getEventsByType('module_added').length;
        const removed = getEventsByType('module_removed').length;
        return added - removed;
    }

    // === RESET ===

    /**
     * Reset all state (when canvas is cleared)
     */
    function reset() {
        state.timeline = [];
        state.paragraphs = [];
        state.chapters.current = 'genesis';
        state.chapters.completed = [];

        // Reset chapter data
        Object.keys(state.chapters.data).forEach(chapterId => {
            state.chapters.data[chapterId].paragraphs = [];
            state.chapters.data[chapterId].startedAt = null;
            state.chapters.data[chapterId].completedAt = null;
        });
        state.chapters.data.genesis.startedAt = Date.now();

        // Reset threads
        Object.keys(state.threads).forEach(threadId => {
            state.threads[threadId].strength = 0;
            state.threads[threadId].modules = [];
            state.threads[threadId].connections = [];
            state.threads[threadId].lastContribution = null;
            state.threads[threadId].lastParagraph = null;
        });

        // Reset transformation
        state.transformation = {
            score: 0,
            dominantDimension: null,
            dominantThread: null,
            architectureType: null,
            keyStrengths: [],
            opportunities: []
        };

        // Reset last render
        state.lastRender = {
            moduleCount: 0,
            connectionCount: 0,
            paragraphCount: 0
        };

        emitChange('reset', null);

        console.log('[StoryMemory] State reset');
    }

    // === EVENT SYSTEM ===
    const listeners = {};

    function on(event, callback) {
        if (!listeners[event]) {
            listeners[event] = [];
        }
        listeners[event].push(callback);
    }

    function off(event, callback) {
        if (listeners[event]) {
            listeners[event] = listeners[event].filter(cb => cb !== callback);
        }
    }

    function emitChange(event, data) {
        if (listeners[event]) {
            listeners[event].forEach(cb => cb(data));
        }
        if (listeners['*']) {
            listeners['*'].forEach(cb => cb(event, data));
        }
    }

    // === UTILITIES ===

    function generateEventId() {
        return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function generateParagraphId() {
        return 'par_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // === PUBLIC API ===
    return {
        // Initialization
        init,
        reset,

        // Timeline
        addModuleEvent,
        addConnectionEvent,
        addModuleRemovedEvent,
        addConnectionRemovedEvent,
        getRecentEvents,
        getLastEvent,
        getEventsByType,

        // Chapters
        getCurrentChapter,
        updateChapter,
        addParagraphToChapter,
        getAllParagraphs,
        getParagraphsByChapter,
        CHAPTERS,
        CHAPTER_ORDER,

        // Threads
        initThread,
        contributeToThread,
        getThread,
        getActiveThreads,
        getDominantThread,
        getThreadStrength,

        // Transformation
        updateTransformation,
        getTransformation,
        updateScore,

        // Queries
        getState,
        getStoryContext,
        isFirstModule,
        isFirstConnection,
        getModuleCount,

        // Events
        on,
        off
    };

})();

// Initialization is now handled explicitly in dimensions-playground.html
