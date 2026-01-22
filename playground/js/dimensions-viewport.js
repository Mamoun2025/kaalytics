/* ============================================
   DIMENSIONS VIEWPORT
   Zoom & Pan - High Performance Edition
   ============================================ */

const DimensionsViewport = (function() {
    'use strict';

    // === STATE ===
    const state = {
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        minScale: 0.1,
        maxScale: 3,
        isPanning: false,
        panStartX: 0,
        panStartY: 0,
        panOffsetX: 0,
        panOffsetY: 0
    };

    // === PERFORMANCE STATE ===
    let rafId = null;
    let needsUpdate = false;
    let lastTransform = '';

    // === DOM REFS ===
    let workspace = null;
    let canvas = null;
    let zoomDisplay = null;

    // === INIT ===
    function init(workspaceSelector, canvasSelector) {
        workspace = document.querySelector(workspaceSelector);
        canvas = document.querySelector(canvasSelector);

        if (!workspace || !canvas) {
            console.error('[Viewport] Elements not found');
            return;
        }

        // Enable GPU acceleration
        enableGPUAcceleration();

        createZoomControls();
        bindEvents();

        // Start render loop
        startRenderLoop();

        // Ensure 100% zoom at startup
        reset();

        console.log('[Viewport] High-performance mode initialized at 100% zoom');
    }

    // === GPU ACCELERATION ===
    function enableGPUAcceleration() {
        // Force GPU layer for canvas
        canvas.style.willChange = 'transform';
        canvas.style.backfaceVisibility = 'hidden';
        canvas.style.perspective = '1000px';
        canvas.style.transformStyle = 'preserve-3d';

        // Optimize workspace
        workspace.style.willChange = 'scroll-position';
        workspace.style.contain = 'layout style';
    }

    // === RENDER LOOP (requestAnimationFrame) ===
    function startRenderLoop() {
        function tick() {
            if (needsUpdate) {
                applyTransformImmediate();
                needsUpdate = false;
            }
            rafId = requestAnimationFrame(tick);
        }
        rafId = requestAnimationFrame(tick);
    }

    // Request update (batched)
    function requestUpdate() {
        needsUpdate = true;
    }

    // === ZOOM CONTROLS UI ===
    function createZoomControls() {
        const controls = document.createElement('div');
        controls.className = 'zoom-controls';
        controls.innerHTML = `
            <button class="zoom-btn" data-action="out" title="Zoom out (-)"><i data-lucide="minus" class="icon-sm"></i></button>
            <div class="zoom-display">100%</div>
            <button class="zoom-btn" data-action="in" title="Zoom in (+)"><i data-lucide="plus" class="icon-sm"></i></button>
            <div class="zoom-separator"></div>
            <button class="zoom-btn" data-action="fit" title="Fit (F)"><i data-lucide="scan" class="icon-sm"></i></button>
            <button class="zoom-btn" data-action="reset" title="Reset (R)"><i data-lucide="rotate-ccw" class="icon-sm"></i></button>
            <div class="zoom-separator"></div>
            <button class="zoom-btn view-toggle active" data-action="sidebar" title="Dimensions (D)">
                <i data-lucide="panel-left" class="icon-sm"></i>
            </button>
            <button class="zoom-btn view-toggle active" data-action="panels" title="Panneaux (P)">
                <i data-lucide="panel-right" class="icon-sm"></i>
            </button>
            <button class="zoom-btn view-toggle" data-action="focus" title="Focus (Espace)">
                <i data-lucide="maximize-2" class="icon-sm"></i>
            </button>
        `;
        workspace.parentElement.appendChild(controls);
        zoomDisplay = controls.querySelector('.zoom-display');

        // Initialize Lucide icons in zoom controls
        if (typeof lucide !== 'undefined') {
            lucide.createIcons({ nodes: [controls] });
        }

        // Button clicks
        controls.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;
            if (action === 'in') zoomBy(0.1);
            if (action === 'out') zoomBy(-0.1);
            if (action === 'fit') fitContent();
            if (action === 'reset') reset();
            if (action === 'sidebar') toggleSidebar();
            if (action === 'panels') togglePanels();
            if (action === 'focus') toggleFocus();
        });
    }

    // === VIEW TOGGLES ===
    let sidebarVisible = true;
    let panelsVisible = true;

    function toggleSidebar() {
        sidebarVisible = !sidebarVisible;
        document.body.classList.toggle('sidebar-hidden', !sidebarVisible);
        document.querySelector('[data-action="sidebar"]').classList.toggle('active', sidebarVisible);
        exitFocusModeIfNeeded();
    }

    function togglePanels() {
        panelsVisible = !panelsVisible;
        document.body.classList.toggle('panels-hidden', !panelsVisible);
        document.querySelector('[data-action="panels"]').classList.toggle('active', panelsVisible);
        exitFocusModeIfNeeded();
    }

    function toggleFocus() {
        const isFocusMode = document.body.classList.contains('focus-mode');
        if (isFocusMode) {
            document.body.classList.remove('focus-mode', 'sidebar-hidden', 'panels-hidden');
            sidebarVisible = true;
            panelsVisible = true;
            document.querySelector('[data-action="sidebar"]').classList.add('active');
            document.querySelector('[data-action="panels"]').classList.add('active');
            document.querySelector('[data-action="focus"]').classList.remove('active');
        } else {
            document.body.classList.add('focus-mode');
            sidebarVisible = false;
            panelsVisible = false;
            document.querySelector('[data-action="sidebar"]').classList.remove('active');
            document.querySelector('[data-action="panels"]').classList.remove('active');
            document.querySelector('[data-action="focus"]').classList.add('active');
        }
    }

    function exitFocusModeIfNeeded() {
        if (sidebarVisible && panelsVisible) {
            document.body.classList.remove('focus-mode');
            document.querySelector('[data-action="focus"]').classList.remove('active');
        }
    }

    // === BIND EVENTS ===
    function bindEvents() {
        // Mouse wheel zoom
        workspace.addEventListener('wheel', onWheel, { passive: false });

        // Pan: mousedown on background
        workspace.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // Keyboard shortcuts
        document.addEventListener('keydown', onKeyDown);
    }

    // === WHEEL ZOOM ===
    // Sensitivity factor (lower = smoother, higher = faster)
    const ZOOM_SENSITIVITY = 0.0008;
    const ZOOM_MIN_DELTA = 0.01;
    const ZOOM_MAX_DELTA = 0.15;

    function onWheel(e) {
        e.preventDefault();

        // Normalize deltaY based on deltaMode
        // deltaMode: 0 = pixels, 1 = lines, 2 = pages
        let rawDelta = e.deltaY;

        if (e.deltaMode === 1) {
            // Lines mode (Firefox default) - multiply by line height (~40px)
            rawDelta *= 40;
        } else if (e.deltaMode === 2) {
            // Page mode - multiply by page height
            rawDelta *= 800;
        }

        // Apply sensitivity and clamp to reasonable range
        let delta = rawDelta * ZOOM_SENSITIVITY;

        // Clamp the delta to prevent extreme jumps
        if (delta > 0) {
            delta = Math.min(delta, ZOOM_MAX_DELTA);
            delta = Math.max(delta, ZOOM_MIN_DELTA);
        } else if (delta < 0) {
            delta = Math.max(delta, -ZOOM_MAX_DELTA);
            delta = Math.min(delta, -ZOOM_MIN_DELTA);
        }

        // Invert: scroll down = zoom out, scroll up = zoom in
        delta = -delta;

        // Zoom toward mouse position
        const rect = workspace.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        zoomAtSmooth(delta, mouseX, mouseY);
    }

    // Smooth zoom using multiplicative factor (more natural feel)
    function zoomAtSmooth(delta, pivotX, pivotY) {
        const oldScale = state.scale;

        // Use multiplicative zoom for more natural feel
        // delta > 0 means zoom in, delta < 0 means zoom out
        const factor = 1 + delta;
        const newScale = clamp(state.scale * factor, state.minScale, state.maxScale);

        if (Math.abs(newScale - oldScale) < 0.001) return;

        // Adjust offset to zoom toward pivot point
        const ratio = newScale / oldScale;
        state.offsetX = pivotX - (pivotX - state.offsetX) * ratio;
        state.offsetY = pivotY - (pivotY - state.offsetY) * ratio;
        state.scale = newScale;

        applyTransform();
    }

    // === ZOOM FUNCTIONS ===
    function zoomBy(delta) {
        const rect = workspace.getBoundingClientRect();
        zoomAt(delta, rect.width / 2, rect.height / 2);
    }

    function zoomAt(delta, pivotX, pivotY) {
        const oldScale = state.scale;
        const newScale = clamp(state.scale + delta, state.minScale, state.maxScale);

        if (newScale === oldScale) return;

        // Adjust offset to zoom toward pivot point
        const ratio = newScale / oldScale;
        state.offsetX = pivotX - (pivotX - state.offsetX) * ratio;
        state.offsetY = pivotY - (pivotY - state.offsetY) * ratio;
        state.scale = newScale;

        applyTransform();
    }

    function setZoom(scale) {
        state.scale = clamp(scale, state.minScale, state.maxScale);
        applyTransform();
    }

    // === PAN FUNCTIONS (High Performance) ===
    function onMouseDown(e) {
        // Only pan on background click (not on modules/ports)
        if (e.target.closest('.placed-module')) return;
        if (e.target.closest('.port')) return;
        if (e.button !== 0 && e.button !== 1) return; // Left or middle click

        state.isPanning = true;
        state.panStartX = e.clientX;
        state.panStartY = e.clientY;
        state.panOffsetX = state.offsetX;
        state.panOffsetY = state.offsetY;

        // Performance: disable pointer events on heavy elements during pan
        workspace.classList.add('panning');
        document.body.classList.add('is-panning');

        e.preventDefault();
    }

    function onMouseMove(e) {
        if (!state.isPanning) return;

        // Calculate delta
        const dx = e.clientX - state.panStartX;
        const dy = e.clientY - state.panStartY;

        state.offsetX = state.panOffsetX + dx;
        state.offsetY = state.panOffsetY + dy;

        // Request batched update (via RAF)
        requestUpdate();
    }

    function onMouseUp() {
        if (state.isPanning) {
            state.isPanning = false;
            workspace.classList.remove('panning');
            document.body.classList.remove('is-panning');

            // Final update with connections redraw
            applyTransformWithConnections();
        }
    }

    // === KEYBOARD ===
    const PAN_STEP = 80; // Pixels per arrow key press

    function onKeyDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // Zoom shortcuts
        if (e.key === 'f' || e.key === 'F') fitContent();
        if (e.key === 'r' || e.key === 'R') reset();
        if (e.key === '+' || e.key === '=') zoomBy(0.1);
        if (e.key === '-') zoomBy(-0.1);

        // View toggles
        if (e.key === 'd' || e.key === 'D') { e.preventDefault(); toggleSidebar(); }
        if (e.key === 'p' || e.key === 'P') { e.preventDefault(); togglePanels(); }
        if (e.key === ' ') { e.preventDefault(); toggleFocus(); }

        // Arrow keys for panning
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            panBy(0, PAN_STEP);
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            panBy(0, -PAN_STEP);
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            panBy(PAN_STEP, 0);
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            panBy(-PAN_STEP, 0);
        }
    }

    // === PAN BY OFFSET ===
    function panBy(dx, dy) {
        state.offsetX += dx;
        state.offsetY += dy;
        applyTransform();
    }

    // === TRANSFORM (High Performance) ===

    // Fast transform - NO connection redraw (used during pan)
    function applyTransformImmediate() {
        // Use translate3d for GPU acceleration
        const transform = `translate3d(${state.offsetX}px, ${state.offsetY}px, 0) scale(${state.scale})`;

        // Skip if transform hasn't changed
        if (transform === lastTransform) return;
        lastTransform = transform;

        canvas.style.transform = transform;

        // Update zoom display (lightweight)
        if (zoomDisplay) {
            zoomDisplay.textContent = `${Math.round(state.scale * 100)}%`;
        }
    }

    // Full transform with connections redraw (used after pan ends)
    function applyTransformWithConnections() {
        applyTransformImmediate();

        // Redraw connections immediately (no RAF delay since pan just ended)
        if (typeof DimensionsConnections !== 'undefined') {
            DimensionsConnections.redrawImmediate();
        }
    }

    // Standard transform (for zoom, fit, reset)
    function applyTransform() {
        applyTransformImmediate();

        // Debounce connections redraw during rapid changes
        if (typeof DimensionsConnections !== 'undefined') {
            // Only redraw if not panning
            if (!state.isPanning) {
                DimensionsConnections.redraw();
            }
        }
    }

    // === FIT & RESET ===
    function fitContent(options = {}) {
        const modules = canvas.querySelectorAll('.placed-module');
        if (modules.length === 0) {
            reset();
            return;
        }

        // Options
        const padding = options.padding || 80;  // More comfortable padding
        const maxFitScale = options.maxScale || 0.9;  // Don't zoom in too much (90% max)

        // Bounding box
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        modules.forEach(mod => {
            const x = parseFloat(mod.style.left) || 0;
            const y = parseFloat(mod.style.top) || 0;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + mod.offsetWidth);
            maxY = Math.max(maxY, y + mod.offsetHeight);
        });

        const contentW = maxX - minX + padding * 2;
        const contentH = maxY - minY + padding * 2;

        const wsRect = workspace.getBoundingClientRect();
        const scaleX = wsRect.width / contentW;
        const scaleY = wsRect.height / contentH;

        // Use the smaller scale to fit both dimensions, but cap at maxFitScale
        const fitScale = Math.min(scaleX, scaleY, maxFitScale);
        state.scale = clamp(fitScale, state.minScale, state.maxScale);

        // Center the content
        state.offsetX = (wsRect.width - contentW * state.scale) / 2 - (minX - padding) * state.scale;
        state.offsetY = (wsRect.height - contentH * state.scale) / 2 - (minY - padding) * state.scale;

        applyTransform();
    }

    function reset() {
        state.scale = 1;
        state.offsetX = 0;
        state.offsetY = 0;
        applyTransform();
    }

    // === COORDINATE CONVERSION ===
    // Screen coords -> Canvas coords
    function screenToCanvas(screenX, screenY) {
        const rect = workspace.getBoundingClientRect();
        return {
            x: (screenX - rect.left - state.offsetX) / state.scale,
            y: (screenY - rect.top - state.offsetY) / state.scale
        };
    }

    // Canvas coords -> Screen coords
    function canvasToScreen(canvasX, canvasY) {
        const rect = workspace.getBoundingClientRect();
        return {
            x: canvasX * state.scale + state.offsetX + rect.left,
            y: canvasY * state.scale + state.offsetY + rect.top
        };
    }

    // === GETTERS ===
    function getState() {
        return { ...state };
    }

    function getScale() {
        return state.scale;
    }

    function getOffset() {
        return { x: state.offsetX, y: state.offsetY };
    }

    // === UTILS ===
    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    // === TOUCH PAN SUPPORT ===
    function panBy(dx, dy) {
        state.offsetX += dx;
        state.offsetY += dy;
        requestUpdate();
    }

    // Direct offset set (for touch pan)
    function setOffset(x, y) {
        state.offsetX = x;
        state.offsetY = y;
        requestUpdate();
    }

    // Zoom in/out buttons
    function zoomIn() {
        zoomBy(0.15);
    }

    function zoomOut() {
        zoomBy(-0.15);
    }

    function resetZoom() {
        reset();
    }

    // === PUBLIC API ===
    return {
        init,
        zoomBy,
        zoomAt,
        zoomIn,
        zoomOut,
        setZoom,
        fitContent,
        reset,
        resetZoom,
        panBy,
        setOffset,
        screenToCanvas,
        canvasToScreen,
        getState,
        getScale,
        getOffset,
        applyTransform
    };

})();
