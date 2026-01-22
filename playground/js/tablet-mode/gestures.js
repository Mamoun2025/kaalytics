/* ============================================
   TABLET MODE - Touch Gestures v2.0
   Ultra-fluid touch handling for presentations
   Uses GPU acceleration & requestAnimationFrame
   ============================================ */

const TabletGestures = (function() {
    'use strict';

    // === CONFIG ===
    const CONFIG = {
        longPressDelay: 400,
        tapThreshold: 15,
        dragThreshold: 8,
        // Pinch zoom
        pinchZoomSensitivity: 0.01,
        minPinchDistance: 50
    };

    // === STATE ===
    let isEnabled = false;
    let rafId = null;

    // Touch tracking
    let activeTouches = new Map();
    let initialPinchDistance = 0;
    let initialScale = 1;
    let lastPinchCenter = null;

    // Long press
    let longPressTimer = null;
    let longPressTarget = null;

    // Drag state (GPU-accelerated)
    const dragState = {
        active: false,
        element: null,
        moduleId: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        offsetX: 0,
        offsetY: 0,
        needsUpdate: false
    };

    // Pan state
    const panState = {
        active: false,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        velocityX: 0,
        velocityY: 0,
        needsUpdate: false
    };

    // Connection state
    const connectionState = {
        active: false,
        startModule: null,
        startPort: null,
        needsUpdate: false,
        currentX: 0,
        currentY: 0
    };

    // === INIT ===
    function init() {
        if (!DeviceDetector.isTouchDevice()) {
            console.log('[TabletGestures] Not a touch device, skipping');
            return;
        }

        bindEvents();
        startRenderLoop();
        isEnabled = true;

        console.log('[TabletGestures] v2.0 Ultra-fluid mode initialized');
    }

    // === RENDER LOOP (60 FPS) ===
    function startRenderLoop() {
        function tick() {
            // Process drag updates
            if (dragState.needsUpdate) {
                applyDragTransform();
                dragState.needsUpdate = false;
            }

            // Process pan updates
            if (panState.needsUpdate) {
                applyPanTransform();
                panState.needsUpdate = false;
            }

            // Process connection updates
            if (connectionState.needsUpdate) {
                updateConnectionLine();
                connectionState.needsUpdate = false;
            }

            rafId = requestAnimationFrame(tick);
        }
        rafId = requestAnimationFrame(tick);
    }

    // === BIND EVENTS ===
    function bindEvents() {
        const workspace = document.querySelector('.workspace');
        if (!workspace) return;

        // Use passive: false only where we need preventDefault
        workspace.addEventListener('touchstart', onTouchStart, { passive: false });
        workspace.addEventListener('touchmove', onTouchMove, { passive: false });
        workspace.addEventListener('touchend', onTouchEnd, { passive: true });
        workspace.addEventListener('touchcancel', onTouchCancel, { passive: true });

        // Prevent context menu on long press
        workspace.addEventListener('contextmenu', e => e.preventDefault());
    }

    // === TOUCH START ===
    function onTouchStart(e) {
        const touches = e.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            activeTouches.set(touches[i].identifier, {
                startX: touches[i].clientX,
                startY: touches[i].clientY,
                currentX: touches[i].clientX,
                currentY: touches[i].clientY,
                startTime: Date.now()
            });
        }

        // Multi-touch: Pinch zoom
        if (activeTouches.size >= 2) {
            e.preventDefault();
            cancelLongPress();
            cancelDrag();
            startPinchZoom();
            return;
        }

        // Single touch
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);

        const port = target?.closest('.port');
        const module = target?.closest('.placed-module');

        if (port && module) {
            // Start connection
            e.preventDefault();
            startConnection(module, port, touch);
        } else if (module) {
            // Potential drag - don't prevent default yet (allow scroll detection)
            startLongPress(module, touch);
            prepareDrag(module, touch);
        } else {
            // Start pan
            startPan(touch);
        }
    }

    // === TOUCH MOVE ===
    function onTouchMove(e) {
        const touches = e.changedTouches;

        // Update touch positions
        for (let i = 0; i < touches.length; i++) {
            const data = activeTouches.get(touches[i].identifier);
            if (data) {
                data.currentX = touches[i].clientX;
                data.currentY = touches[i].clientY;
            }
        }

        // Multi-touch: Pinch zoom
        if (activeTouches.size >= 2) {
            e.preventDefault();
            handlePinchZoom();
            return;
        }

        const touch = e.touches[0];
        if (!touch) return;

        const data = activeTouches.get(touch.identifier);
        if (!data) return;

        const dx = touch.clientX - data.startX;
        const dy = touch.clientY - data.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Cancel long press if moved
        if (distance > CONFIG.tapThreshold) {
            cancelLongPress();
        }

        // Handle connection drag
        if (connectionState.active) {
            e.preventDefault();
            connectionState.currentX = touch.clientX;
            connectionState.currentY = touch.clientY;
            connectionState.needsUpdate = true;
            return;
        }

        // Handle module drag
        if (dragState.element && distance > CONFIG.dragThreshold) {
            e.preventDefault();

            if (!dragState.active) {
                activateDrag();
            }

            dragState.currentX = touch.clientX;
            dragState.currentY = touch.clientY;
            dragState.needsUpdate = true;
            return;
        }

        // Handle pan
        if (panState.active) {
            e.preventDefault();
            panState.lastX = touch.clientX;
            panState.lastY = touch.clientY;
            panState.needsUpdate = true;
        }
    }

    // === TOUCH END ===
    function onTouchEnd(e) {
        const touches = e.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            activeTouches.delete(touches[i].identifier);
        }

        cancelLongPress();

        // End pinch zoom
        if (activeTouches.size < 2) {
            endPinchZoom();
        }

        // End connection
        if (connectionState.active && activeTouches.size === 0) {
            const touch = e.changedTouches[0];
            finishConnection(touch);
        }

        // End drag
        if (dragState.active && activeTouches.size === 0) {
            finishDrag();
        }

        // End pan
        if (panState.active && activeTouches.size === 0) {
            endPan();
        }

        // Check for tap
        if (activeTouches.size === 0) {
            const touch = e.changedTouches[0];
            const data = { startX: touch.clientX, startY: touch.clientY };
            handleTap(touch, data);
        }
    }

    // === TOUCH CANCEL ===
    function onTouchCancel() {
        activeTouches.clear();
        cancelLongPress();
        cancelDrag();
        resetConnectionState();
        endPan();
    }

    // === PINCH ZOOM ===
    function startPinchZoom() {
        const touchArray = Array.from(activeTouches.values());
        if (touchArray.length < 2) return;

        initialPinchDistance = getPinchDistance(touchArray[0], touchArray[1]);
        initialScale = DimensionsViewport?.getScale() || 1;
        lastPinchCenter = getPinchCenter(touchArray[0], touchArray[1]);

        document.body.classList.add('pinch-zooming');
    }

    function handlePinchZoom() {
        const touchArray = Array.from(activeTouches.values());
        if (touchArray.length < 2) return;

        const currentDistance = getPinchDistance(touchArray[0], touchArray[1]);
        const currentCenter = getPinchCenter(touchArray[0], touchArray[1]);

        // Calculate zoom delta
        const distanceDelta = currentDistance - initialPinchDistance;
        const zoomDelta = distanceDelta * CONFIG.pinchZoomSensitivity;

        // Apply zoom at pinch center
        if (typeof DimensionsViewport !== 'undefined') {
            const workspace = document.querySelector('.workspace');
            const rect = workspace.getBoundingClientRect();

            DimensionsViewport.zoomAt(
                zoomDelta,
                currentCenter.x - rect.left,
                currentCenter.y - rect.top
            );
        }

        // Update for next frame
        initialPinchDistance = currentDistance;
        lastPinchCenter = currentCenter;
    }

    function endPinchZoom() {
        document.body.classList.remove('pinch-zooming');
        initialPinchDistance = 0;
        lastPinchCenter = null;
    }

    function getPinchDistance(t1, t2) {
        const dx = t2.currentX - t1.currentX;
        const dy = t2.currentY - t1.currentY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function getPinchCenter(t1, t2) {
        return {
            x: (t1.currentX + t2.currentX) / 2,
            y: (t1.currentY + t2.currentY) / 2
        };
    }

    // === PAN ===
    function startPan(touch) {
        panState.active = true;
        panState.startX = touch.clientX;
        panState.startY = touch.clientY;
        panState.lastX = touch.clientX;
        panState.lastY = touch.clientY;

        document.body.classList.add('is-panning');
    }

    function applyPanTransform() {
        if (!panState.active) return;

        const dx = panState.lastX - panState.startX;
        const dy = panState.lastY - panState.startY;

        // Apply pan delta to viewport
        if (typeof DimensionsViewport !== 'undefined' && (dx !== 0 || dy !== 0)) {
            DimensionsViewport.panBy(dx, dy);
        }

        // Update start for next delta
        panState.startX = panState.lastX;
        panState.startY = panState.lastY;
    }

    function endPan() {
        panState.active = false;
        document.body.classList.remove('is-panning');
    }

    // === LONG PRESS ===
    function startLongPress(module, touch) {
        longPressTarget = module;
        longPressTimer = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(30);
            TabletUI.showContextMenu(module.id, touch.clientX, touch.clientY);
            cancelDrag();
        }, CONFIG.longPressDelay);
    }

    function cancelLongPress() {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        longPressTarget = null;
    }

    // === MODULE DRAG (GPU Accelerated) ===
    function prepareDrag(module, touch) {
        const rect = module.getBoundingClientRect();

        dragState.element = module;
        dragState.moduleId = module.id;
        dragState.startX = touch.clientX;
        dragState.startY = touch.clientY;
        dragState.currentX = touch.clientX;
        dragState.currentY = touch.clientY;
        dragState.offsetX = touch.clientX - rect.left;
        dragState.offsetY = touch.clientY - rect.top;
        dragState.active = false;
    }

    function activateDrag() {
        if (!dragState.element) return;

        dragState.active = true;

        // Optimize: disable pointer events on other elements
        document.body.classList.add('is-dragging-module');
        dragState.element.classList.add('dragging');

        // Prepare for transform-based movement
        dragState.element.style.willChange = 'transform';
        dragState.element.style.zIndex = '1000';
    }

    function applyDragTransform() {
        if (!dragState.active || !dragState.element) return;

        // Convert touch position to canvas coordinates
        const canvasPos = screenToCanvas(dragState.currentX, dragState.currentY);

        // Calculate new position
        const newX = canvasPos.x - dragState.offsetX;
        const newY = canvasPos.y - dragState.offsetY;

        // Apply position directly (faster than transform for absolute positioned elements)
        dragState.element.style.left = Math.max(0, newX) + 'px';
        dragState.element.style.top = Math.max(0, newY) + 'px';

        // Update data model (throttled)
        if (typeof DimensionsData !== 'undefined') {
            DimensionsData.updateModulePosition(dragState.moduleId, newX, newY);
        }
    }

    function finishDrag() {
        if (!dragState.active || !dragState.element) {
            resetDragState();
            return;
        }

        dragState.element.classList.remove('dragging');
        dragState.element.style.willChange = '';
        dragState.element.style.zIndex = '';

        document.body.classList.remove('is-dragging-module');

        // Final position update & connection redraw
        const x = parseFloat(dragState.element.style.left) || 0;
        const y = parseFloat(dragState.element.style.top) || 0;

        if (typeof DimensionsData !== 'undefined') {
            DimensionsData.updateModulePosition(dragState.moduleId, x, y);
        }

        if (typeof DimensionsConnections !== 'undefined') {
            DimensionsConnections.redraw();
        }

        resetDragState();
    }

    function cancelDrag() {
        if (dragState.element) {
            dragState.element.classList.remove('dragging');
            dragState.element.style.willChange = '';
            dragState.element.style.zIndex = '';
        }
        document.body.classList.remove('is-dragging-module');
        resetDragState();
    }

    function resetDragState() {
        dragState.active = false;
        dragState.element = null;
        dragState.moduleId = null;
        dragState.needsUpdate = false;
    }

    // === CONNECTION ===
    function startConnection(module, port, touch) {
        connectionState.active = true;
        connectionState.startModule = module.id;
        connectionState.startPort = port.dataset.port;
        connectionState.currentX = touch.clientX;
        connectionState.currentY = touch.clientY;

        TabletUI.showConnectionIndicator();
        module.classList.add('connecting');
        port.classList.add('active');

        // Show ports on other modules
        document.querySelectorAll('.placed-module').forEach(m => {
            if (m.id !== module.id) m.classList.add('show-ports');
        });

        // Start temp line
        if (typeof DimensionsConnections !== 'undefined') {
            DimensionsConnections.startConnectionDrag(
                module.id,
                port.dataset.port,
                touch.clientX,
                touch.clientY
            );
        }
    }

    function updateConnectionLine() {
        // Simulate mouse move for connection system
        const evt = new MouseEvent('mousemove', {
            clientX: connectionState.currentX,
            clientY: connectionState.currentY,
            bubbles: true
        });
        document.dispatchEvent(evt);
    }

    function finishConnection(touch) {
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const port = target?.closest('.port');
        const module = target?.closest('.placed-module');

        if (port && module && module.id !== connectionState.startModule) {
            if (typeof DimensionsData !== 'undefined') {
                DimensionsData.addConnection(
                    connectionState.startModule,
                    connectionState.startPort,
                    module.id,
                    port.dataset.port
                );
            }
            createSuccessFeedback(touch.clientX, touch.clientY);
        }

        if (typeof DimensionsConnections !== 'undefined') {
            DimensionsConnections.cancelConnection();
        }

        resetConnectionState();
    }

    function resetConnectionState() {
        TabletUI.hideConnectionIndicator();

        document.querySelectorAll('.placed-module.connecting').forEach(m => {
            m.classList.remove('connecting');
        });
        document.querySelectorAll('.port.active').forEach(p => {
            p.classList.remove('active');
        });
        document.querySelectorAll('.placed-module.show-ports').forEach(m => {
            m.classList.remove('show-ports');
        });

        connectionState.active = false;
        connectionState.startModule = null;
        connectionState.startPort = null;
        connectionState.needsUpdate = false;
    }

    // === TAP ===
    function handleTap(touch, data) {
        // Single tap on module = select
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const module = target?.closest('.placed-module');

        if (module && !dragState.active) {
            if (typeof DimensionsData !== 'undefined') {
                DimensionsData.selectModule(module.id);
            }
        }
    }

    // === UTILITIES ===
    function screenToCanvas(screenX, screenY) {
        if (typeof DimensionsViewport !== 'undefined') {
            return DimensionsViewport.screenToCanvas(screenX, screenY);
        }
        const workspace = document.querySelector('.workspace');
        const rect = workspace?.getBoundingClientRect() || { left: 0, top: 0 };
        return { x: screenX - rect.left, y: screenY - rect.top };
    }

    function createSuccessFeedback(x, y) {
        const el = document.createElement('div');
        el.className = 'tablet-touch-feedback success';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 400);
    }

    // === CLEANUP ===
    function destroy() {
        if (rafId) cancelAnimationFrame(rafId);
        activeTouches.clear();
        cancelLongPress();
        resetDragState();
        resetConnectionState();
        isEnabled = false;
    }

    // === PUBLIC API ===
    return {
        init,
        destroy,
        isEnabled: () => isEnabled,
        cancelConnection: resetConnectionState,
        cancelDrag
    };

})();
