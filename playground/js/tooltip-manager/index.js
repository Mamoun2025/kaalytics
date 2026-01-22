/* ============================================
   TOOLTIP MANAGER - Main Entry Point
   Ergonomic tooltip visibility control
   ============================================

   Modules:
   - state-detector.js : Detects drag/connect/click states
   - controller.js     : Controls tooltip visibility

   Purpose:
   - Suppress tooltips during module dragging
   - Suppress tooltips during connection building
   - Suppress tooltips on any mousedown
   - Only show tooltips on clean hover

   ============================================ */

const TooltipManager = (function() {
    'use strict';

    let isInitialized = false;

    // === INIT ===
    function init() {
        if (isInitialized) return;

        // Initialize sub-modules in order
        TooltipStateDetector.init();
        TooltipController.init();

        // Also patch DimensionsTooltips if loaded
        patchTooltips();

        isInitialized = true;
        console.log('[TooltipManager] Initialized - ergonomic mode enabled');
    }

    // === PATCH EXISTING TOOLTIPS ===
    function patchTooltips() {
        if (typeof DimensionsTooltips === 'undefined') {
            console.log('[TooltipManager] DimensionsTooltips not found, will retry...');
            setTimeout(patchTooltips, 200);
            return;
        }

        // Store original functions
        const originalInit = DimensionsTooltips.init;

        // Override init to add our hooks after tooltips are ready
        DimensionsTooltips.init = async function() {
            await originalInit.call(DimensionsTooltips);
            hookTooltipEvents();
        };

        // If already initialized, hook now
        const tooltipEl = document.querySelector('.rich-tooltip');
        if (tooltipEl) {
            hookTooltipEvents();
        }
    }

    // === HOOK TOOLTIP EVENTS ===
    function hookTooltipEvents() {
        const workspace = document.getElementById('workspace');
        if (!workspace) return;

        // Add capturing listener to intercept mouseover before tooltips handle it
        workspace.addEventListener('mouseover', (e) => {
            if (TooltipStateDetector.isBlocked()) {
                // Stop the event from reaching DimensionsTooltips
                e.stopImmediatePropagation();
            }
        }, true);

        // Also add mousedown listener to hide immediately
        workspace.addEventListener('mousedown', () => {
            TooltipController.hideImmediately();
        }, true);

        console.log('[TooltipManager] Tooltip events hooked');
    }

    // === PUBLIC API (forwarding) ===
    return {
        init,
        canShow: () => TooltipController.canShow(),
        hideImmediately: () => TooltipController.hideImmediately(),
        getState: () => TooltipController.getState(),
        enable: () => TooltipController.enable(),
        disable: () => TooltipController.disable()
    };

})();

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure other modules are loaded
    setTimeout(() => {
        TooltipManager.init();
    }, 100);
});
