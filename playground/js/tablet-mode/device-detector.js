/* ============================================
   TABLET MODE - Device Detector
   Auto-detects device type and capabilities
   ============================================ */

const DeviceDetector = (function() {
    'use strict';

    // === STATE ===
    let deviceInfo = null;
    let listeners = new Set();

    // === DETECT DEVICE ===
    function detect() {
        const ua = navigator.userAgent.toLowerCase();
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
        const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const isPortrait = screenHeight > screenWidth;

        // Device type detection
        let type = 'desktop';

        if (/ipad|tablet|playbook|silk/i.test(ua) ||
            (hasTouch && screenWidth >= 600 && screenWidth <= 1366)) {
            type = 'tablet';
        } else if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua) ||
                   (hasTouch && screenWidth < 600)) {
            type = 'phone';
        } else if (hasTouch && !hasFinePointer) {
            type = 'tablet'; // Touch device without mouse = probably tablet
        }

        // OS detection
        let os = 'unknown';
        if (/ipad|iphone|ipod/.test(ua)) os = 'ios';
        else if (/android/.test(ua)) os = 'android';
        else if (/windows/.test(ua)) os = 'windows';
        else if (/mac/.test(ua)) os = 'macos';
        else if (/linux/.test(ua)) os = 'linux';

        deviceInfo = {
            type,
            os,
            hasTouch,
            hasCoarsePointer,
            hasFinePointer,
            screenWidth,
            screenHeight,
            isPortrait,
            pixelRatio: window.devicePixelRatio || 1,
            isTabletOrPhone: type === 'tablet' || type === 'phone',
            isDesktop: type === 'desktop',
            timestamp: Date.now()
        };

        console.log('[DeviceDetector] Detected:', deviceInfo.type, deviceInfo.os);

        return deviceInfo;
    }

    // === INIT ===
    function init() {
        detect();

        // Listen for orientation/resize changes
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleOrientationChange);

        // Add device class to body
        updateBodyClass();

        // Log info
        console.log('[DeviceDetector] Initialized:', getInfo());

        return deviceInfo;
    }

    // === HANDLE RESIZE ===
    let resizeTimeout;
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const oldType = deviceInfo?.type;
            detect();
            updateBodyClass();

            if (oldType !== deviceInfo.type) {
                notifyListeners('typeChanged', deviceInfo);
            }
            notifyListeners('resize', deviceInfo);
        }, 150);
    }

    // === HANDLE ORIENTATION CHANGE ===
    function handleOrientationChange() {
        setTimeout(() => {
            detect();
            updateBodyClass();
            notifyListeners('orientationChanged', deviceInfo);
        }, 100);
    }

    // === UPDATE BODY CLASS ===
    function updateBodyClass() {
        if (!deviceInfo) return;

        document.body.classList.remove('device-desktop', 'device-tablet', 'device-phone');
        document.body.classList.remove('orientation-portrait', 'orientation-landscape');
        document.body.classList.remove('has-touch', 'no-touch');

        document.body.classList.add(`device-${deviceInfo.type}`);
        document.body.classList.add(deviceInfo.isPortrait ? 'orientation-portrait' : 'orientation-landscape');
        document.body.classList.add(deviceInfo.hasTouch ? 'has-touch' : 'no-touch');
    }

    // === LISTENERS ===
    function addListener(callback) {
        listeners.add(callback);
    }

    function removeListener(callback) {
        listeners.delete(callback);
    }

    function notifyListeners(event, data) {
        listeners.forEach(cb => {
            try {
                cb(event, data);
            } catch (e) {
                console.warn('[DeviceDetector] Listener error:', e);
            }
        });
    }

    // === GETTERS ===
    function getInfo() {
        return deviceInfo ? { ...deviceInfo } : detect();
    }

    function getType() {
        return deviceInfo?.type || detect().type;
    }

    function isTablet() {
        return getType() === 'tablet';
    }

    function isPhone() {
        return getType() === 'phone';
    }

    function isDesktop() {
        return getType() === 'desktop';
    }

    function isTouchDevice() {
        return deviceInfo?.hasTouch ?? detect().hasTouch;
    }

    function isPortrait() {
        return deviceInfo?.isPortrait ?? detect().isPortrait;
    }

    // === PUBLIC API ===
    return {
        init,
        detect,
        getInfo,
        getType,
        isTablet,
        isPhone,
        isDesktop,
        isTouchDevice,
        isPortrait,
        addListener,
        removeListener
    };

})();
