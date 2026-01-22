/* ============================================
   SMART CONNECT - Main Controller
   Version 2.0 - Complete refactor with proper UX
   ============================================

   Modules:
   - sounds.js          : Audio feedback
   - state.js           : Undo/Redo with snapshots
   - ui.js              : Toasts, progress, preview panel
   - layout-optimizer.js: Hierarchical grid layout
   - collision-detector.js: Line crossing detection
   - semantic-engine.js : Module affinities

   ============================================ */

const SmartConnect = (function() {
    'use strict';

    // === STATE ===
    let isInitialized = false;
    let isProcessing = false;

    // === INIT ===
    async function init() {
        if (isInitialized) return true;

        console.log('[SmartConnect] Initializing v2.0...');

        // Initialize sounds
        SmartConnectSounds?.init?.();

        // Initialize semantic engine
        const semanticReady = await SmartConnectSemantic.init();
        if (!semanticReady) {
            console.warn('[SmartConnect] Semantic engine not available, using defaults');
        }

        // Create UI
        const button = SmartConnectUI.createButton();
        if (button) {
            button.addEventListener('click', handleClick);
        }

        isInitialized = true;
        console.log('[SmartConnect] Initialized successfully');
        return true;
    }

    // === HANDLE CLICK ===
    async function handleClick() {
        if (isProcessing) return;

        // Check if preset is active
        if (typeof DimensionsPresets !== 'undefined' && DimensionsPresets.isPresetActive()) {
            SmartConnectSounds?.warning?.();
            SmartConnectUI.showToast('Configuration déjà optimisée', {
                icon: '✓',
                type: 'warning',
                duration: 3000
            });
            return;
        }

        // Check minimum modules
        const modules = DimensionsData.getPlacedModules();
        if (modules.length < 2) {
            SmartConnectSounds?.warning?.();
            SmartConnectUI.showToast('Ajoutez au moins 2 modules', {
                icon: '⚠️',
                type: 'warning',
                duration: 3000
            });
            return;
        }

        // Start optimization
        await runOptimization();
    }

    // === RUN OPTIMIZATION ===
    async function runOptimization() {
        isProcessing = true;
        SmartConnectUI.setButtonProcessing(true);
        SmartConnectUI.showProgress();

        // Take snapshot for undo
        SmartConnectState.takeSnapshot('Avant optimisation');

        // Play start sound
        SmartConnectSounds?.start?.();

        try {
            const modules = DimensionsData.getPlacedModules();
            const connections = DimensionsData.getConnections();

            // Count initial crossings
            const initialCrossings = CollisionDetector.countCrossings(connections, modules);

            SmartConnectUI.setProgress(20);

            // Step 1: Optimize layout
            const positions = SmartConnectLayout.optimizeLayout(modules, connections);
            if (positions && positions.length > 0) {
                await SmartConnectLayout.applyLayout(positions, true);
                SmartConnectSounds?.layoutComplete?.();
            }

            SmartConnectUI.setProgress(50);
            await sleep(100);

            // Step 2: Connect isolated modules
            const updatedModules = DimensionsData.getPlacedModules();
            const connectionsCreated = await connectIsolatedModules(updatedModules);

            SmartConnectUI.setProgress(75);

            // Step 3: Re-optimize layout if new connections were created
            if (connectionsCreated > 0) {
                const newPositions = SmartConnectLayout.optimizeLayout(
                    DimensionsData.getPlacedModules(),
                    DimensionsData.getConnections()
                );
                if (newPositions && newPositions.length > 0) {
                    await SmartConnectLayout.applyLayout(newPositions, true);
                }
            }

            SmartConnectUI.setProgress(100);

            // Calculate final stats
            const finalConnections = DimensionsData.getConnections();
            const finalModules = DimensionsData.getPlacedModules();
            const finalCrossings = CollisionDetector.countCrossings(finalConnections, finalModules);
            const crossingsReduced = initialCrossings - finalCrossings;

            // Show result
            showResult(connectionsCreated, crossingsReduced);

        } catch (error) {
            console.error('[SmartConnect] Error:', error);
            SmartConnectSounds?.error?.();
            SmartConnectUI.showToast('Une erreur est survenue', {
                icon: '❌',
                type: 'error',
                duration: 4000
            });
        }

        SmartConnectUI.hideProgress();
        SmartConnectUI.setButtonProcessing(false);
        isProcessing = false;
    }

    // === CONNECT ISOLATED MODULES ===
    async function connectIsolatedModules(modules) {
        const connections = DimensionsData.getConnections();
        const connectedIds = new Set();
        let created = 0;

        // Build set of connected module IDs
        connections.forEach(c => {
            connectedIds.add(c.fromModule);
            connectedIds.add(c.toModule);
        });

        // If no connections exist, connect first two modules
        if (connections.length === 0 && modules.length >= 2) {
            const ports = CollisionDetector.findBestPorts(modules[0], modules[1], [], modules);
            const result = DimensionsData.addConnection(modules[0].id, ports.from, modules[1].id, ports.to);
            if (result) {
                connectedIds.add(modules[0].id);
                connectedIds.add(modules[1].id);
                created++;
                SmartConnectSounds?.connectionCreated?.();
            }
        }

        // Connect isolated modules
        for (const mod of modules) {
            if (connectedIds.has(mod.id)) continue;

            const target = findBestTarget(mod, modules, connectedIds);
            if (!target) continue;

            const currentConnections = DimensionsData.getConnections();
            const ports = CollisionDetector.findBestPorts(mod, target, currentConnections, modules);

            const result = DimensionsData.addConnection(mod.id, ports.from, target.id, ports.to);
            if (result) {
                connectedIds.add(mod.id);
                created++;
                SmartConnectSounds?.connectionCreated?.();
                await sleep(100); // Small delay for visual feedback
            }
        }

        return created;
    }

    // === FIND BEST TARGET FOR CONNECTION ===
    function findBestTarget(module, allModules, connectedIds) {
        let bestTarget = null;
        let bestScore = -Infinity;

        allModules.forEach(other => {
            if (other.id === module.id) return;
            if (connectedIds.size > 0 && !connectedIds.has(other.id)) return;

            let score = 50;

            // Get semantic affinity
            try {
                const aff = SmartConnectSemantic.getModuleAffinity(
                    module.templateId || module.id,
                    other.templateId || other.id
                );
                score = aff?.affinity || 50;
            } catch (e) {}

            // Same dimension bonus
            if (module.dimension?.id === other.dimension?.id) {
                score += 20;
            }

            // Proximity bonus
            if (typeof module.x === 'number' && typeof other.x === 'number') {
                const dist = Math.hypot(other.x - module.x, other.y - module.y);
                score += Math.max(0, 100 - dist / 5);
            }

            // Collision penalty
            const currentConns = DimensionsData.getConnections();
            const collision = CollisionDetector.wouldCollide(
                module, other, 'right', 'left', currentConns, allModules
            );
            if (collision.collision) {
                score -= 50;
            }

            if (score > bestScore) {
                bestScore = score;
                bestTarget = other;
            }
        });

        return bestTarget;
    }

    // === SHOW RESULT ===
    function showResult(connectionsCreated, crossingsReduced) {
        SmartConnectSounds?.success?.();

        let message = '';
        let icon = '✨';

        if (connectionsCreated > 0 && crossingsReduced > 0) {
            message = `${connectionsCreated} connexion${connectionsCreated > 1 ? 's' : ''} + ${crossingsReduced} croisement${crossingsReduced > 1 ? 's' : ''} en moins`;
            icon = '🎯';
        } else if (connectionsCreated > 0) {
            message = `${connectionsCreated} connexion${connectionsCreated > 1 ? 's' : ''} ajoutée${connectionsCreated > 1 ? 's' : ''}`;
            icon = '🔗';
        } else if (crossingsReduced > 0) {
            message = `${crossingsReduced} croisement${crossingsReduced > 1 ? 's' : ''} en moins`;
            icon = '✂️';
        } else {
            message = 'Layout optimisé';
            icon = '📐';
        }

        // Show toast with undo option
        SmartConnectUI.showToast(message, {
            icon,
            type: 'success',
            duration: 5000,
            showUndo: true,
            onUndo: handleUndo
        });

        // Also show undo button
        SmartConnectUI.showUndoButton(handleUndo, 15);
    }

    // === HANDLE UNDO ===
    function handleUndo() {
        const success = SmartConnectState.undo();
        if (success) {
            SmartConnectUI.hideUndoButton();
            SmartConnectUI.showToast('Modifications annulées', {
                icon: '↩️',
                type: 'default',
                duration: 3000
            });
        }
    }

    // === UTILITIES ===
    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    // === PUBLIC API ===
    return {
        init,
        optimize: runOptimization,
        undo: handleUndo,
        isReady: () => isInitialized,
        isProcessing: () => isProcessing
    };

})();
