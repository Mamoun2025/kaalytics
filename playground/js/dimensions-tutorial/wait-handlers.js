/* ============================================
   TUTORIAL WAIT HANDLERS - User Interaction Listeners
   ============================================ */

const TutorialWaitHandlers = (function() {
    'use strict';

    let currentObserver = null;
    let currentHandler = null;

    // Cleanup current handler
    function cleanup() {
        if (currentObserver) {
            currentObserver.disconnect();
            currentObserver = null;
        }
        if (currentHandler) {
            currentHandler.element?.removeEventListener(currentHandler.event, currentHandler.fn);
            currentHandler = null;
        }
    }

    // Wait for dimension click/expand
    function waitForDimensionClick(onComplete, targetSelector = '.dimension-group:first-child') {
        cleanup();

        const dim = document.querySelector(targetSelector);
        if (!dim) {
            console.warn('[WaitHandlers] Dimension group not found');
            setTimeout(onComplete, 500);
            return;
        }

        // Check if already expanded
        if (!dim.classList.contains('collapsed')) {
            console.log('[WaitHandlers] Dimension already expanded');
            onComplete();
            return;
        }

        const header = dim.querySelector('.dimension-header');
        if (!header) {
            console.warn('[WaitHandlers] Dimension header not found');
            setTimeout(onComplete, 500);
            return;
        }

        const handler = () => {
            console.log('[WaitHandlers] Dimension clicked!');
            header.removeEventListener('click', handler);
            currentHandler = null;

            // Play success sound
            if (typeof TutorialSounds !== 'undefined') {
                TutorialSounds.success();
            }

            // Show success message
            if (typeof TutorialUI !== 'undefined') {
                TutorialUI.showSuccess('Bien joué !');
            }

            setTimeout(onComplete, 800);
        };

        header.addEventListener('click', handler);
        currentHandler = { element: header, event: 'click', fn: handler };

        // Draw attention to the header
        if (typeof TutorialOverlay !== 'undefined') {
            TutorialOverlay.showPointer(header, 'right', 50);
        }
    }

    // Wait for module to be dropped
    function waitForModuleDrop(minCount, onComplete, targetSelector) {
        cleanup();

        const canvas = document.querySelector('.canvas-container');
        if (!canvas) {
            console.warn('[WaitHandlers] Canvas not found');
            setTimeout(onComplete, 500);
            return;
        }

        const currentCount = canvas.querySelectorAll('.placed-module').length;
        console.log('[WaitHandlers] Waiting for module drop, current:', currentCount, 'min:', minCount);

        if (currentCount >= minCount) {
            console.log('[WaitHandlers] Already have enough modules');
            onComplete();
            return;
        }

        // Show pointer to source module if target selector provided
        if (targetSelector && typeof TutorialOverlay !== 'undefined') {
            const sourceModule = document.querySelector(targetSelector);
            if (sourceModule) {
                TutorialOverlay.showPointer(sourceModule, 'right', 40);
                TutorialOverlay.showHighlight(sourceModule, { pulse: true });
            }
        }

        // Watch for new modules
        currentObserver = new MutationObserver((mutations) => {
            const count = canvas.querySelectorAll('.placed-module').length;
            if (count >= minCount) {
                console.log('[WaitHandlers] Module dropped! Count:', count);
                cleanup();

                // Play success sound
                if (typeof TutorialSounds !== 'undefined') {
                    TutorialSounds.success();
                }

                // Show success message
                if (typeof TutorialUI !== 'undefined') {
                    const msg = minCount === 1 ? 'Parfait !' : 'Excellent !';
                    TutorialUI.showSuccess(msg);
                }

                // Hide pointer
                if (typeof TutorialOverlay !== 'undefined') {
                    TutorialOverlay.hidePointers();
                }

                setTimeout(onComplete, 800);
            }
        });

        currentObserver.observe(canvas, { childList: true, subtree: true });
    }

    // Wait for connection to be created
    function waitForConnection(onComplete) {
        cleanup();

        const connectionsLayer = document.querySelector('.connections-layer');
        if (!connectionsLayer) {
            console.warn('[WaitHandlers] Connections layer not found');
            setTimeout(onComplete, 500);
            return;
        }

        // Check if already have connections
        const currentConnections = connectionsLayer.querySelectorAll('path:not(.temp-connection)').length;
        if (currentConnections > 0) {
            console.log('[WaitHandlers] Already have connections');
            onComplete();
            return;
        }

        // Show pointers to placed modules
        if (typeof TutorialOverlay !== 'undefined') {
            const modules = document.querySelectorAll('.placed-module');
            if (modules.length >= 2) {
                TutorialOverlay.showPointer(modules[0], 'down', 40);
            }
        }

        // Watch for new connections
        currentObserver = new MutationObserver(() => {
            const paths = connectionsLayer.querySelectorAll('path:not(.temp-connection)');
            if (paths.length > 0) {
                console.log('[WaitHandlers] Connection created!');
                cleanup();

                // Play success sound
                if (typeof TutorialSounds !== 'undefined') {
                    TutorialSounds.success();
                }

                // Show success message
                if (typeof TutorialUI !== 'undefined') {
                    TutorialUI.showSuccess('Synergie créée !');
                }

                // Hide pointers
                if (typeof TutorialOverlay !== 'undefined') {
                    TutorialOverlay.hidePointers();
                }

                setTimeout(onComplete, 800);
            }
        });

        currentObserver.observe(connectionsLayer, { childList: true, subtree: true });
    }

    // Wait for element to appear
    function waitForElement(selector, onComplete, timeout = 5000) {
        cleanup();

        const el = document.querySelector(selector);
        if (el) {
            onComplete(el);
            return;
        }

        const startTime = Date.now();

        currentObserver = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                cleanup();
                onComplete(el);
            } else if (Date.now() - startTime > timeout) {
                cleanup();
                onComplete(null);
            }
        });

        currentObserver.observe(document.body, { childList: true, subtree: true });
    }

    // Wait for click on specific element
    function waitForClick(selector, onComplete) {
        cleanup();

        const el = document.querySelector(selector);
        if (!el) {
            console.warn('[WaitHandlers] Element not found for click:', selector);
            setTimeout(onComplete, 500);
            return;
        }

        const handler = () => {
            console.log('[WaitHandlers] Element clicked:', selector);
            el.removeEventListener('click', handler);
            currentHandler = null;

            // Play click sound
            if (typeof TutorialSounds !== 'undefined') {
                TutorialSounds.click();
            }

            onComplete();
        };

        el.addEventListener('click', handler);
        currentHandler = { element: el, event: 'click', fn: handler };

        // Show pointer
        if (typeof TutorialOverlay !== 'undefined') {
            TutorialOverlay.showPointer(el, 'down', 40);
        }
    }

    // Setup wait based on type
    function setup(type, targetSelector, onComplete) {
        console.log('[WaitHandlers] Setting up wait for:', type);

        switch (type) {
            case 'dimensionClick':
                waitForDimensionClick(onComplete, targetSelector);
                break;
            case 'moduleDrop':
                waitForModuleDrop(1, onComplete, targetSelector);
                break;
            case 'secondModule':
                waitForModuleDrop(2, onComplete, targetSelector);
                break;
            case 'connection':
                waitForConnection(onComplete);
                break;
            case 'click':
                waitForClick(targetSelector, onComplete);
                break;
            case 'element':
                waitForElement(targetSelector, onComplete);
                break;
            default:
                console.warn('[WaitHandlers] Unknown wait type:', type);
                setTimeout(onComplete, 500);
        }
    }

    return {
        cleanup,
        setup,
        waitForDimensionClick,
        waitForModuleDrop,
        waitForConnection,
        waitForElement,
        waitForClick
    };

})();

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TutorialWaitHandlers;
}
