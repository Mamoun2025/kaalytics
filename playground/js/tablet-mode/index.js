/* ============================================
   TABLET MODE - Main Entry Point
   Auto-initializes based on device detection
   ============================================

   Modules:
   - device-detector.js : Detects device type
   - gestures.js        : Touch gesture handling
   - ui.js              : Tablet UI components

   ============================================ */

const TabletMode = (function() {
    'use strict';

    let isActive = false;

    // === INIT ===
    function init() {
        // Initialize device detector first
        DeviceDetector.init();

        // Listen for device changes
        DeviceDetector.addListener(onDeviceChange);

        // Activate if tablet or phone
        if (DeviceDetector.isTablet() || DeviceDetector.isPhone()) {
            activate();
        }

        console.log('[TabletMode] Initialized, device:', DeviceDetector.getType());
    }

    // === ACTIVATE TABLET MODE ===
    function activate() {
        if (isActive) return;

        console.log('[TabletMode] Activating tablet mode...');

        // Initialize sub-modules
        TabletUI.init();
        TabletGestures.init();

        // Add tablet class for CSS
        document.body.classList.add('tablet-mode');

        // Disable desktop-only features
        disableDesktopFeatures();

        isActive = true;
        console.log('[TabletMode] Activated');
    }

    // === DEACTIVATE TABLET MODE ===
    function deactivate() {
        if (!isActive) return;

        console.log('[TabletMode] Deactivating...');

        // Remove tablet class
        document.body.classList.remove('tablet-mode');

        // Destroy UI
        TabletUI.destroy();

        // Re-enable desktop features
        enableDesktopFeatures();

        isActive = false;
        console.log('[TabletMode] Deactivated');
    }

    // === DEVICE CHANGE HANDLER ===
    function onDeviceChange(event, info) {
        if (event === 'typeChanged') {
            if (info.isTabletOrPhone && !isActive) {
                activate();
            } else if (info.isDesktop && isActive) {
                deactivate();
            }
        }
    }

    // === DISABLE DESKTOP FEATURES ===
    function disableDesktopFeatures() {
        // Disable tooltip manager for touch
        if (typeof TooltipManager !== 'undefined') {
            TooltipManager.disable?.();
        }

        // Disable desktop viewport controls
        const viewportControls = document.querySelector('.viewport-controls');
        if (viewportControls) {
            viewportControls.style.display = 'none';
        }
    }

    // === ENABLE DESKTOP FEATURES ===
    function enableDesktopFeatures() {
        if (typeof TooltipManager !== 'undefined') {
            TooltipManager.enable?.();
        }

        const viewportControls = document.querySelector('.viewport-controls');
        if (viewportControls) {
            viewportControls.style.display = '';
        }
    }

    // === PUBLIC API ===
    return {
        init,
        activate,
        deactivate,
        isActive: () => isActive,
        getDeviceInfo: () => DeviceDetector.getInfo()
    };

})();

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure other modules are loaded
    setTimeout(() => {
        TabletMode.init();
    }, 200);
});
