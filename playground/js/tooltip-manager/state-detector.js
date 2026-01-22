/* ============================================
   TOOLTIP MANAGER - State Detector
   Detects when tooltips should be suppressed
   ============================================ */

const TooltipStateDetector = (function() {
    'use strict';

    // === STATE ===
    const state = {
        isMouseDown: false,
        isDraggingModule: false,
        isConnecting: false,
        mouseDownTimestamp: 0
    };

    // === INIT ===
    function init() {
        bindEvents();
        console.log('[TooltipState] State detector initialized');
    }

    // === BIND GLOBAL EVENTS ===
    function bindEvents() {
        // Global mousedown - suppress tooltips immediately
        document.addEventListener('mousedown', onMouseDown, true);
        document.addEventListener('mouseup', onMouseUp, true);

        // Touch events
        document.addEventListener('touchstart', onTouchStart, true);
        document.addEventListener('touchend', onTouchEnd, true);

        // Watch for drag start/end (via MutationObserver)
        observeDraggingClass();
    }

    // === MOUSE HANDLERS ===
    function onMouseDown(e) {
        // Ignore right-clicks
        if (e.button !== 0) return;

        state.isMouseDown = true;
        state.mouseDownTimestamp = Date.now();

        // Check if clicking on a placed module (potential drag)
        const placedModule = e.target.closest('.placed-module');
        if (placedModule && !e.target.closest('.port')) {
            state.isDraggingModule = true;
        }

        // Notify listeners
        notifyChange();
    }

    function onMouseUp(e) {
        state.isMouseDown = false;
        state.isDraggingModule = false;

        // Small delay to avoid showing tooltip right after action
        setTimeout(() => {
            notifyChange();
        }, 100);
    }

    // === TOUCH HANDLERS ===
    function onTouchStart(e) {
        state.isMouseDown = true;
        state.mouseDownTimestamp = Date.now();

        const placedModule = e.target.closest('.placed-module');
        if (placedModule && !e.target.closest('.port')) {
            state.isDraggingModule = true;
        }

        notifyChange();
    }

    function onTouchEnd(e) {
        state.isMouseDown = false;
        state.isDraggingModule = false;

        setTimeout(() => {
            notifyChange();
        }, 100);
    }

    // === OBSERVE DRAGGING CLASS ===
    function observeDraggingClass() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const el = mutation.target;
                    if (el.classList.contains('placed-module')) {
                        if (el.classList.contains('dragging')) {
                            state.isDraggingModule = true;
                            notifyChange();
                        } else if (!document.querySelector('.placed-module.dragging')) {
                            state.isDraggingModule = false;
                            notifyChange();
                        }
                    }
                }
            });
        });

        // Start observing when workspace is ready
        const startObserving = () => {
            const workspace = document.querySelector('.workspace');
            if (workspace) {
                observer.observe(workspace, {
                    attributes: true,
                    subtree: true,
                    attributeFilter: ['class']
                });
            } else {
                setTimeout(startObserving, 100);
            }
        };

        startObserving();
    }

    // === CHECK CONNECTION STATE ===
    function checkConnectionState() {
        // Check body class (most reliable)
        if (document.body.classList.contains('connecting')) {
            return true;
        }

        // Check DimensionsConnections API
        if (typeof DimensionsConnections !== 'undefined' &&
            typeof DimensionsConnections.isConnecting === 'function') {
            return DimensionsConnections.isConnecting();
        }

        return false;
    }

    // === LISTENERS ===
    const listeners = new Set();

    function addListener(callback) {
        listeners.add(callback);
    }

    function removeListener(callback) {
        listeners.delete(callback);
    }

    function notifyChange() {
        const blocked = isBlocked();
        listeners.forEach(callback => {
            try {
                callback(blocked);
            } catch (e) {
                console.warn('[TooltipState] Listener error:', e);
            }
        });
    }

    // === PUBLIC STATE CHECK ===
    function isBlocked() {
        // Update connection state on each check
        state.isConnecting = checkConnectionState();

        return state.isMouseDown ||
               state.isDraggingModule ||
               state.isConnecting;
    }

    function getState() {
        return {
            isMouseDown: state.isMouseDown,
            isDraggingModule: state.isDraggingModule,
            isConnecting: checkConnectionState(),
            blocked: isBlocked()
        };
    }

    // === PUBLIC API ===
    return {
        init,
        isBlocked,
        getState,
        addListener,
        removeListener
    };

})();
