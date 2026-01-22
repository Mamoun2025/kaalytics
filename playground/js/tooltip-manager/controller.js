/* ============================================
   TOOLTIP MANAGER - Controller
   Controls tooltip visibility based on state
   ============================================ */

const TooltipController = (function() {
    'use strict';

    // === CONFIG ===
    const CONFIG = {
        showDelay: 400,        // ms before showing tooltip
        hideDelay: 150,        // ms before hiding tooltip
        quickHideDelay: 50     // ms for immediate hide on action
    };

    // === STATE ===
    let isEnabled = true;
    let showTimeout = null;
    let hideTimeout = null;
    let currentTooltipTarget = null;

    // === INIT ===
    function init() {
        // Listen for state changes
        TooltipStateDetector.addListener(onStateChange);

        console.log('[TooltipController] Controller initialized');
    }

    // === STATE CHANGE HANDLER ===
    function onStateChange(blocked) {
        if (blocked) {
            // Immediately hide any visible tooltip
            hideImmediately();
            // Cancel any pending show
            cancelPendingShow();
        }
    }

    // === CAN SHOW TOOLTIP ===
    function canShow() {
        if (!isEnabled) return false;
        if (TooltipStateDetector.isBlocked()) return false;
        return true;
    }

    // === SCHEDULE SHOW ===
    function scheduleShow(target, callback) {
        // Cancel any pending operations
        cancelPendingHide();
        cancelPendingShow();

        // Check if we can show
        if (!canShow()) {
            return false;
        }

        currentTooltipTarget = target;

        showTimeout = setTimeout(() => {
            // Re-check state before showing
            if (canShow() && currentTooltipTarget === target) {
                callback();
            }
        }, CONFIG.showDelay);

        return true;
    }

    // === SCHEDULE HIDE ===
    function scheduleHide(callback) {
        cancelPendingShow();

        hideTimeout = setTimeout(() => {
            callback();
            currentTooltipTarget = null;
        }, CONFIG.hideDelay);
    }

    // === HIDE IMMEDIATELY ===
    function hideImmediately() {
        cancelPendingShow();
        cancelPendingHide();

        // Call DimensionsTooltips.hideTooltip if available
        if (typeof DimensionsTooltips !== 'undefined' &&
            typeof DimensionsTooltips.hideTooltip === 'function') {
            DimensionsTooltips.hideTooltip();
        }

        currentTooltipTarget = null;
    }

    // === CANCEL PENDING ===
    function cancelPendingShow() {
        if (showTimeout) {
            clearTimeout(showTimeout);
            showTimeout = null;
        }
    }

    function cancelPendingHide() {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
    }

    // === ENABLE/DISABLE ===
    function enable() {
        isEnabled = true;
    }

    function disable() {
        isEnabled = false;
        hideImmediately();
    }

    // === GET STATE ===
    function getState() {
        return {
            isEnabled,
            canShow: canShow(),
            hasPendingShow: !!showTimeout,
            hasPendingHide: !!hideTimeout,
            currentTarget: currentTooltipTarget,
            detectorState: TooltipStateDetector.getState()
        };
    }

    // === PUBLIC API ===
    return {
        init,
        canShow,
        scheduleShow,
        scheduleHide,
        hideImmediately,
        cancelPendingShow,
        cancelPendingHide,
        enable,
        disable,
        getState,
        getConfig: () => ({ ...CONFIG })
    };

})();
