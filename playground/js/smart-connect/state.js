/* ============================================
   SMART CONNECT - State Manager
   Handles undo/redo with snapshots
   ============================================ */

const SmartConnectState = (function() {
    'use strict';

    // === CONFIG ===
    const CONFIG = {
        maxSnapshots: 10,      // Maximum undo history
        undoTimeout: 15000     // Auto-dismiss undo button after 15s
    };

    // === STATE ===
    let snapshots = [];
    let currentIndex = -1;
    let undoTimer = null;

    // === TAKE SNAPSHOT ===
    function takeSnapshot(label = 'Optimization') {
        // Get current state from DimensionsData
        const modules = DimensionsData.getPlacedModules().map(m => ({
            id: m.id,
            templateId: m.templateId,
            x: m.x,
            y: m.y,
            dimension: m.dimension
        }));

        const connections = DimensionsData.getConnections().map(c => ({
            id: c.id,
            fromModule: c.fromModule,
            fromPort: c.fromPort,
            toModule: c.toModule,
            toPort: c.toPort
        }));

        const snapshot = {
            label,
            timestamp: Date.now(),
            modules,
            connections
        };

        // Remove any snapshots after current index (for redo)
        snapshots = snapshots.slice(0, currentIndex + 1);

        // Add new snapshot
        snapshots.push(snapshot);
        currentIndex = snapshots.length - 1;

        // Limit history
        if (snapshots.length > CONFIG.maxSnapshots) {
            snapshots.shift();
            currentIndex--;
        }

        console.log('[SmartConnect:State] Snapshot taken:', label, `(${modules.length} modules, ${connections.length} connections)`);

        return snapshot;
    }

    // === RESTORE SNAPSHOT ===
    function restoreSnapshot(index) {
        if (index < 0 || index >= snapshots.length) {
            console.warn('[SmartConnect:State] Invalid snapshot index:', index);
            return false;
        }

        const snapshot = snapshots[index];
        console.log('[SmartConnect:State] Restoring snapshot:', snapshot.label);

        try {
            // Clear current state
            const currentModules = DimensionsData.getPlacedModules();
            const currentConnections = DimensionsData.getConnections();

            // Remove all connections first
            currentConnections.forEach(c => {
                DimensionsData.removeConnection(c.id);
            });

            // Remove modules that shouldn't exist
            const snapshotModuleIds = new Set(snapshot.modules.map(m => m.id));
            currentModules.forEach(m => {
                if (!snapshotModuleIds.has(m.id)) {
                    DimensionsData.removeModule(m.id);
                }
            });

            // Restore module positions
            snapshot.modules.forEach(m => {
                const el = document.getElementById(m.id);
                if (el) {
                    el.style.transition = 'left 0.4s ease-out, top 0.4s ease-out';
                    el.style.left = m.x + 'px';
                    el.style.top = m.y + 'px';

                    setTimeout(() => {
                        el.style.transition = '';
                        DimensionsData.updateModulePosition(m.id, m.x, m.y);
                    }, 400);
                }
            });

            // Restore connections after positions are set
            setTimeout(() => {
                snapshot.connections.forEach(c => {
                    DimensionsData.addConnection(c.fromModule, c.fromPort, c.toModule, c.toPort);
                });

                // Redraw connections
                if (DimensionsConnections?.redraw) {
                    DimensionsConnections.redraw();
                }
            }, 450);

            currentIndex = index;
            return true;

        } catch (error) {
            console.error('[SmartConnect:State] Error restoring snapshot:', error);
            return false;
        }
    }

    // === UNDO ===
    function undo() {
        if (!canUndo()) {
            console.log('[SmartConnect:State] Nothing to undo');
            return false;
        }

        const success = restoreSnapshot(currentIndex - 1);
        if (success) {
            SmartConnectSounds?.undo?.();
        }
        return success;
    }

    // === REDO ===
    function redo() {
        if (!canRedo()) {
            console.log('[SmartConnect:State] Nothing to redo');
            return false;
        }

        return restoreSnapshot(currentIndex + 1);
    }

    // === CAN UNDO/REDO ===
    function canUndo() {
        return currentIndex > 0;
    }

    function canRedo() {
        return currentIndex < snapshots.length - 1;
    }

    // === GET LAST SNAPSHOT ===
    function getLastSnapshot() {
        return snapshots[currentIndex] || null;
    }

    // === GET PREVIOUS SNAPSHOT (for undo preview) ===
    function getPreviousSnapshot() {
        return currentIndex > 0 ? snapshots[currentIndex - 1] : null;
    }

    // === CLEAR HISTORY ===
    function clearHistory() {
        snapshots = [];
        currentIndex = -1;
        console.log('[SmartConnect:State] History cleared');
    }

    // === COMPARE STATES ===
    function compareWithCurrent(snapshot) {
        if (!snapshot) return null;

        const currentModules = DimensionsData.getPlacedModules();
        const currentConnections = DimensionsData.getConnections();

        let movedModules = 0;
        let addedConnections = 0;
        let removedConnections = 0;

        // Check moved modules
        snapshot.modules.forEach(oldMod => {
            const currentMod = currentModules.find(m => m.id === oldMod.id);
            if (currentMod && (currentMod.x !== oldMod.x || currentMod.y !== oldMod.y)) {
                movedModules++;
            }
        });

        // Check connection changes
        const oldConnIds = new Set(snapshot.connections.map(c => `${c.fromModule}-${c.toModule}`));
        const currentConnIds = new Set(currentConnections.map(c => `${c.fromModule}-${c.toModule}`));

        currentConnIds.forEach(id => {
            if (!oldConnIds.has(id)) addedConnections++;
        });

        oldConnIds.forEach(id => {
            if (!currentConnIds.has(id)) removedConnections++;
        });

        return {
            movedModules,
            addedConnections,
            removedConnections,
            hasChanges: movedModules > 0 || addedConnections > 0 || removedConnections > 0
        };
    }

    // === START UNDO TIMER ===
    function startUndoTimer(callback) {
        clearUndoTimer();

        let remaining = CONFIG.undoTimeout / 1000;

        undoTimer = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearUndoTimer();
                callback?.();
            } else {
                // Update timer display if callback provided
                callback?.(remaining);
            }
        }, 1000);

        return CONFIG.undoTimeout / 1000;
    }

    // === CLEAR UNDO TIMER ===
    function clearUndoTimer() {
        if (undoTimer) {
            clearInterval(undoTimer);
            undoTimer = null;
        }
    }

    return {
        takeSnapshot,
        restoreSnapshot,
        undo,
        redo,
        canUndo,
        canRedo,
        getLastSnapshot,
        getPreviousSnapshot,
        clearHistory,
        compareWithCurrent,
        startUndoTimer,
        clearUndoTimer,
        getConfig: () => CONFIG
    };

})();
