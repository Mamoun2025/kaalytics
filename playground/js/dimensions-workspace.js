/* ============================================
   DIMENSIONS WORKSPACE
   Drag & Drop Canvas - Module autonome
   ============================================ */

const DimensionsWorkspace = (function() {
    'use strict';

    // === DOM REFS ===
    let workspace = null;
    let canvas = null;
    let emptyState = null;
    let infoPanel = null;

    // === DRAG STATE ===
    let isDraggingFromSidebar = false;
    let sidebarDragData = null;

    // === INIT ===
    function init(workspaceSelector) {
        workspace = document.querySelector(workspaceSelector);

        if (!workspace) {
            console.error('[Workspace] Element not found:', workspaceSelector);
            return;
        }

        canvas = workspace.querySelector('.canvas-container') || workspace;
        emptyState = workspace.querySelector('.empty-state');
        infoPanel = document.querySelector('.info-panel');

        bindDOMEvents();
        bindDataEvents();
        updateUI();

        console.log('[Workspace] Initialized');
    }

    // === DOM EVENT BINDING ===
    function bindDOMEvents() {
        // Drag & drop from sidebar
        workspace.addEventListener('dragover', onDragOver);
        workspace.addEventListener('dragleave', onDragLeave);
        workspace.addEventListener('drop', onDrop);

        // Click to deselect
        workspace.addEventListener('click', onWorkspaceClick);

        // Keyboard shortcuts
        document.addEventListener('keydown', onKeyDown);
    }

    // === DATA EVENT BINDING ===
    function bindDataEvents() {
        DimensionsData.on('moduleAdded', onModuleAdded);
        DimensionsData.on('moduleRemoved', onModuleRemoved);
        DimensionsData.on('stateChanged', updateUI);
        DimensionsData.on('restored', onDataRestored);
    }

    // === RESTORE MODULES FROM STORAGE ===
    function onDataRestored(data) {
        console.log('[Workspace] Restoring modules from storage...', data);

        // Clear any existing module elements first
        const existingModules = canvas.querySelectorAll('.placed-module');
        existingModules.forEach(el => el.remove());

        // Recreate each module visually
        if (data.modules && data.modules.length > 0) {
            data.modules.forEach(module => {
                const element = createModuleElement(module);
                canvas.appendChild(element);
            });

            console.log(`[Workspace] Restored ${data.modules.length} modules`);
        }

        // Redraw connections after modules are placed
        setTimeout(() => {
            if (typeof DimensionsConnections !== 'undefined') {
                DimensionsConnections.redraw();
            }
            updateUI();
        }, 100);
    }

    // === DRAG OVER (from sidebar) ===
    function onDragOver(e) {
        if (!isDraggingFromSidebar) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        workspace.classList.add('drag-over');
    }

    // === DRAG LEAVE ===
    function onDragLeave(e) {
        if (!workspace.contains(e.relatedTarget)) {
            workspace.classList.remove('drag-over');
        }
    }

    // === DROP (from sidebar) ===
    function onDrop(e) {
        e.preventDefault();
        workspace.classList.remove('drag-over');

        // Get drag data
        let data;
        try {
            data = JSON.parse(e.dataTransfer.getData('text/plain'));
        } catch {
            data = sidebarDragData;
        }

        if (!data || !data.moduleId) return;

        // Convert screen position to canvas space
        const canvasPos = screenToCanvas(e.clientX, e.clientY);

        // Center offset (module is ~200x120)
        const rawX = Math.max(20, canvasPos.x - 100);
        const rawY = Math.max(20, canvasPos.y - 60);

        // Snap to grid
        const snappedPos = snapPositionToGrid(rawX, rawY);

        // Find valid position without collision
        const validPos = findValidPosition(snappedPos.x, snappedPos.y);
        const finalPos = snapPositionToGrid(validPos.x, validPos.y);
        createModule(data.moduleId, finalPos.x, finalPos.y);

        // Clear preset flag - user is modifying the workspace
        if (typeof DimensionsPresets !== 'undefined' && DimensionsPresets.clearPresetFlag) {
            DimensionsPresets.clearPresetFlag();
        }
    }

    // === MODULE DIMENSIONS ===
    const MODULE_WIDTH = 200;
    const MODULE_HEIGHT = 95;
    const MODULE_PADDING = 20; // Minimum space between modules

    // === SNAP-TO-GRID CONFIG ===
    const GRID_SIZE = 20; // Grid cell size in pixels
    const SNAP_ENABLED = true;

    // Snap coordinate to grid
    function snapToGrid(value) {
        if (!SNAP_ENABLED) return value;
        return Math.round(value / GRID_SIZE) * GRID_SIZE;
    }

    // Snap position to grid
    function snapPositionToGrid(x, y) {
        return {
            x: snapToGrid(x),
            y: snapToGrid(y)
        };
    }

    // === COLLISION DETECTION ===
    function checkCollision(x, y, excludeModuleId = null) {
        const modules = DimensionsData.getPlacedModules();

        for (const module of modules) {
            if (module.id === excludeModuleId) continue;

            // Check if rectangles overlap (with padding)
            const overlap = !(
                x + MODULE_WIDTH + MODULE_PADDING <= module.x ||
                x >= module.x + MODULE_WIDTH + MODULE_PADDING ||
                y + MODULE_HEIGHT + MODULE_PADDING <= module.y ||
                y >= module.y + MODULE_HEIGHT + MODULE_PADDING
            );

            if (overlap) return module;
        }
        return null;
    }

    // === FIND NEAREST VALID POSITION ===
    function findValidPosition(targetX, targetY, excludeModuleId = null) {
        // If no collision, return original position
        if (!checkCollision(targetX, targetY, excludeModuleId)) {
            return { x: targetX, y: targetY };
        }

        // Search in expanding circles for a valid spot
        const searchRadius = 50;
        const maxAttempts = 20;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const radius = searchRadius * attempt;

            // Try 8 directions around the target
            const angles = [0, 45, 90, 135, 180, 225, 270, 315];

            for (const angle of angles) {
                const rad = angle * (Math.PI / 180);
                const testX = Math.max(20, targetX + Math.cos(rad) * radius);
                const testY = Math.max(20, targetY + Math.sin(rad) * radius);

                if (!checkCollision(testX, testY, excludeModuleId)) {
                    return { x: testX, y: testY };
                }
            }
        }

        // Fallback: stack below all modules
        const modules = DimensionsData.getPlacedModules();
        let maxY = 0;
        modules.forEach(m => {
            if (m.id !== excludeModuleId) {
                maxY = Math.max(maxY, m.y + MODULE_HEIGHT + MODULE_PADDING);
            }
        });

        return { x: targetX, y: maxY + 20 };
    }

    // === TOUCH DROP (called from sidebar) ===
    function handleTouchDrop(clientX, clientY, data) {
        const rect = workspace.getBoundingClientRect();

        // Check if within workspace
        if (clientX < rect.left || clientX > rect.right ||
            clientY < rect.top || clientY > rect.bottom) {
            return;
        }

        const canvasPos = screenToCanvas(clientX, clientY);
        const rawX = Math.max(20, canvasPos.x - 100);
        const rawY = Math.max(20, canvasPos.y - 60);

        // Snap to grid
        const snappedPos = snapPositionToGrid(rawX, rawY);

        // Find valid position without collision
        const validPos = findValidPosition(snappedPos.x, snappedPos.y);
        const finalPos = snapPositionToGrid(validPos.x, validPos.y);
        createModule(data.moduleId, finalPos.x, finalPos.y);
    }

    // === SET DRAGGING STATE (called from sidebar) ===
    function setDragging(dragging, data) {
        isDraggingFromSidebar = dragging;
        sidebarDragData = data;
        if (!dragging) {
            workspace.classList.remove('drag-over');
        }
    }

    // === CREATE MODULE ===
    function createModule(moduleId, x, y) {
        const placed = DimensionsData.addPlacedModule(moduleId, x, y);
        if (!placed) return null;

        const element = createModuleElement(placed);
        canvas.appendChild(element);

        // Entry animation
        element.classList.add('module-enter');

        // Spark effect
        createSparkEffect(x + 90, y + 50);

        return placed;
    }

    // === CREATE MODULE DOM ELEMENT ===
    function createModuleElement(module) {
        const el = document.createElement('div');
        el.className = 'placed-module';
        el.id = module.id;
        el.style.left = `${module.x}px`;
        el.style.top = `${module.y}px`;
        el.style.setProperty('--dimension-color', module.dimension.color);
        el.dataset.moduleId = module.id;

        // ARIA attributes for accessibility
        el.setAttribute('role', 'listitem');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `Module ${module.name} de la dimension ${module.dimension.title}. ${module.desc}`);
        el.setAttribute('aria-grabbed', 'false');

        // Use HeroIcons if available, fallback to emoji
        const iconHtml = typeof HeroIcons !== 'undefined'
            ? HeroIcons.getDimensionIcon(module.dimension.id, { size: 18, strokeWidth: 2, className: 'module-icon' })
            : module.dimension.emoji;

        el.innerHTML = `
            <div class="port port-top" data-port="top" data-module="${module.id}" role="button" tabindex="-1" aria-label="Port haut pour connexion"></div>
            <div class="port port-bottom" data-port="bottom" data-module="${module.id}" role="button" tabindex="-1" aria-label="Port bas pour connexion"></div>
            <div class="port port-left" data-port="left" data-module="${module.id}" role="button" tabindex="-1" aria-label="Port gauche pour connexion"></div>
            <div class="port port-right" data-port="right" data-module="${module.id}" role="button" tabindex="-1" aria-label="Port droit pour connexion"></div>
            <div class="placed-module-header">
                <span class="placed-module-emoji" aria-hidden="true">${iconHtml}</span>
                <span class="placed-module-title">${module.name}</span>
            </div>
            <div class="placed-module-desc">${module.desc}</div>
        `;

        setupModuleInteractions(el, module);
        return el;
    }

    // === SETUP MODULE INTERACTIONS ===
    function setupModuleInteractions(element, module) {
        let isDragging = false;
        let offsetX, offsetY;

        // Select on click
        element.addEventListener('click', (e) => {
            if (e.target.closest('.port')) return;
            e.stopPropagation();
            DimensionsData.selectModule(module.id);
            updateSelection();
        });

        // Drag module
        element.addEventListener('mousedown', (e) => {
            if (e.target.closest('.port')) return;
            if (e.button !== 0) return; // Left click only

            isDragging = true;
            element.classList.add('selected', 'dragging');

            // Get current scale
            const scale = getScale();

            // Calculate offset from click to module top-left
            const rect = element.getBoundingClientRect();
            offsetX = (e.clientX - rect.left) / scale;
            offsetY = (e.clientY - rect.top) / scale;

            DimensionsData.selectModule(module.id);
            updateSelection();

            function onMouseMove(e) {
                if (!isDragging) return;

                // Convert screen position to canvas space
                const canvasPos = screenToCanvas(e.clientX, e.clientY);

                // Apply offset to keep module under cursor
                const x = Math.max(0, canvasPos.x - offsetX);
                const y = Math.max(0, canvasPos.y - offsetY);

                element.style.left = `${x}px`;
                element.style.top = `${y}px`;

                // Check for collision and show visual feedback
                const collision = checkCollision(x, y, module.id);
                element.classList.toggle('collision', !!collision);

                DimensionsData.updateModulePosition(module.id, x, y);

                // Redraw connections
                if (typeof DimensionsConnections !== 'undefined') {
                    DimensionsConnections.redraw();
                }
            }

            function onMouseUp() {
                isDragging = false;
                element.classList.remove('dragging', 'collision');

                // Get current position
                const currentX = parseFloat(element.style.left) || 0;
                const currentY = parseFloat(element.style.top) || 0;

                // Snap to grid first
                const snapped = snapPositionToGrid(currentX, currentY);

                // Find valid position if there's collision
                const validPos = findValidPosition(snapped.x, snapped.y, module.id);

                // Final snap to grid
                const finalPos = snapPositionToGrid(validPos.x, validPos.y);

                // Apply snapped position
                element.style.left = `${finalPos.x}px`;
                element.style.top = `${finalPos.y}px`;
                DimensionsData.updateModulePosition(module.id, finalPos.x, finalPos.y);

                // Redraw connections at final position
                if (typeof DimensionsConnections !== 'undefined') {
                    DimensionsConnections.redraw();
                }

                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // Port interactions - Dual mode: Click-to-Click AND Drag & Drop
        const ports = element.querySelectorAll('.port');

        ports.forEach(port => {
            // MouseDown: Start drag mode
            port.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                if (typeof DimensionsConnections !== 'undefined') {
                    DimensionsConnections.startConnectionDrag(
                        module.id,
                        port.dataset.port,
                        e.clientX,
                        e.clientY
                    );
                }
            });

            // Click: Handle click-to-click mode (second click to complete)
            port.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof DimensionsConnections !== 'undefined') {
                    DimensionsConnections.handlePortClick(
                        module.id,
                        port.dataset.port,
                        e.clientX,
                        e.clientY
                    );
                }
            });

            port.addEventListener('mouseenter', () => {
                if (typeof DimensionsConnections !== 'undefined') {
                    DimensionsConnections.highlightPort(port);
                }
            });

            port.addEventListener('mouseleave', () => {
                if (typeof DimensionsConnections !== 'undefined') {
                    DimensionsConnections.unhighlightPort(port);
                }
            });
        });
    }

    // === DATA EVENT HANDLERS ===
    function onModuleAdded(module) {
        updateUI();
    }

    function onModuleRemoved(module) {
        const element = document.getElementById(module.id);
        if (element) element.remove();
        updateUI();
    }

    // === WORKSPACE CLICK (deselect) ===
    function onWorkspaceClick(e) {
        if (e.target === workspace ||
            e.target.classList.contains('workspace-grid') ||
            e.target.classList.contains('canvas-container')) {
            DimensionsData.selectModule(null);
            updateSelection();
        }
    }

    // === KEYBOARD SHORTCUTS ===
    function onKeyDown(e) {
        const selected = DimensionsData.getSelectedModule();

        // Delete/Backspace
        if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            DimensionsData.removePlacedModule(selected);
        }

        // Escape
        if (e.key === 'Escape') {
            DimensionsData.selectModule(null);
            updateSelection();
            if (typeof DimensionsConnections !== 'undefined') {
                DimensionsConnections.cancelConnection();
            }
        }

        // Arrow keys to move selected module
        if (selected && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            e.preventDefault();

            const module = DimensionsData.getPlacedModule(selected);
            if (!module) return;

            const step = e.shiftKey ? 50 : 10; // Shift for bigger steps
            let newX = module.x;
            let newY = module.y;

            switch (e.key) {
                case 'ArrowUp':    newY = Math.max(0, module.y - step); break;
                case 'ArrowDown':  newY = module.y + step; break;
                case 'ArrowLeft':  newX = Math.max(0, module.x - step); break;
                case 'ArrowRight': newX = module.x + step; break;
            }

            // Update position
            DimensionsData.updateModulePosition(selected, newX, newY);

            // Update visual
            const element = document.getElementById(selected);
            if (element) {
                element.style.left = `${newX}px`;
                element.style.top = `${newY}px`;
            }

            // Redraw connections
            if (typeof DimensionsConnections !== 'undefined') {
                DimensionsConnections.redraw();
            }
        }

        // Tab navigation between placed modules
        if (e.key === 'Tab' && !e.target.closest('.sidebar')) {
            const modules = [...canvas.querySelectorAll('.placed-module')];
            if (modules.length === 0) return;

            const currentIndex = modules.findIndex(m => m.id === selected);

            if (e.shiftKey) {
                // Previous module
                const prevIndex = currentIndex <= 0 ? modules.length - 1 : currentIndex - 1;
                e.preventDefault();
                DimensionsData.selectModule(modules[prevIndex].id);
                modules[prevIndex].focus();
                updateSelection();
            } else if (currentIndex !== -1) {
                // Next module
                const nextIndex = (currentIndex + 1) % modules.length;
                e.preventDefault();
                DimensionsData.selectModule(modules[nextIndex].id);
                modules[nextIndex].focus();
                updateSelection();
            }
        }
    }

    // === UPDATE SELECTION VISUALS ===
    function updateSelection() {
        const selected = DimensionsData.getSelectedModule();
        workspace.querySelectorAll('.placed-module').forEach(el => {
            el.classList.toggle('selected', el.id === selected);
        });
    }

    // === UPDATE UI ===
    function updateUI() {
        const stats = DimensionsData.getStats();

        // Empty state
        if (emptyState) {
            emptyState.style.display = stats.moduleCount === 0 ? 'block' : 'none';
        }

        // Info panel
        if (infoPanel) {
            if (stats.moduleCount > 0) {
                infoPanel.classList.add('visible');
                const modCount = infoPanel.querySelector('#moduleCount');
                const connCount = infoPanel.querySelector('#connectionCount');
                if (modCount) modCount.textContent = stats.moduleCount;
                if (connCount) connCount.textContent = stats.connectionCount;
            } else {
                infoPanel.classList.remove('visible');
            }
        }
    }

    // === COORDINATE HELPERS ===
    function screenToCanvas(screenX, screenY) {
        if (typeof DimensionsViewport !== 'undefined') {
            return DimensionsViewport.screenToCanvas(screenX, screenY);
        }
        // Fallback
        const rect = workspace.getBoundingClientRect();
        return {
            x: screenX - rect.left,
            y: screenY - rect.top
        };
    }

    function getScale() {
        if (typeof DimensionsViewport !== 'undefined') {
            return DimensionsViewport.getScale();
        }
        return 1;
    }

    // === SPARK EFFECT ===
    function createSparkEffect(x, y) {
        const container = document.createElement('div');
        container.className = 'connection-spark';

        // Convert canvas position to screen for effect placement
        let screenX = x, screenY = y;
        if (typeof DimensionsViewport !== 'undefined') {
            const screen = DimensionsViewport.canvasToScreen(x, y);
            screenX = screen.x;
            screenY = screen.y;
        }

        container.style.left = `${screenX}px`;
        container.style.top = `${screenY}px`;

        for (let i = 0; i < 10; i++) {
            const spark = document.createElement('div');
            spark.className = 'spark-particle';
            const angle = (i / 10) * Math.PI * 2;
            const distance = 30 + Math.random() * 40;
            spark.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
            spark.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
            container.appendChild(spark);
        }

        document.body.appendChild(container);
        setTimeout(() => container.remove(), 500);
    }

    // === GETTERS ===
    function getWorkspaceElement() {
        return workspace;
    }

    function getCanvasElement() {
        return canvas;
    }

    // === FIND FREE POSITION (public) ===
    // Find a position that doesn't overlap with existing modules (grid-aligned)
    function findFreePosition() {
        const modules = DimensionsData.getPlacedModules();
        const baseX = snapToGrid(100);
        const baseY = snapToGrid(100);
        const gridSpacingX = snapToGrid(240);
        const gridSpacingY = snapToGrid(160);

        // Try grid positions
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 6; col++) {
                const x = snapToGrid(baseX + col * gridSpacingX);
                const y = snapToGrid(baseY + row * gridSpacingY);

                if (!checkCollision(x, y)) {
                    return { x, y };
                }
            }
        }

        // Fallback: stack below all modules
        let maxY = 0;
        modules.forEach(m => {
            maxY = Math.max(maxY, m.y + MODULE_HEIGHT + MODULE_PADDING);
        });

        return { x: baseX, y: snapToGrid(maxY + 20) };
    }

    // === ADD MODULE AT FREE POSITION (public) ===
    function addModuleAtFreePosition(moduleId) {
        const pos = findFreePosition();
        createModule(moduleId, pos.x, pos.y);
    }

    // === PUBLIC API ===
    return {
        init,
        setDragging,
        handleTouchDrop,
        createModule,
        getWorkspaceElement,
        getCanvasElement,
        updateUI,
        updateSelection,
        findFreePosition,
        addModuleAtFreePosition
    };

})();
