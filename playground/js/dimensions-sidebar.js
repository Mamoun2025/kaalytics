/* ============================================
   DIMENSIONS SIDEBAR - Collapsible Dimensions
   ============================================ */

const DimensionsSidebar = (function() {
    'use strict';

    let container = null;
    let dimensions = [];

    // Initialize sidebar
    function init(containerSelector) {
        container = document.querySelector(containerSelector);
        if (!container) {
            console.error('Sidebar container not found:', containerSelector);
            return;
        }

        // Get dimensions from data module
        dimensions = DimensionsData.getDimensions();
        render();
        setupEventListeners();
        bindDataEvents();
    }

    // Listen for module changes to update placed state
    function bindDataEvents() {
        DimensionsData.on('moduleAdded', (module) => {
            updateModulePlacedState(module.templateId, true);
        });

        DimensionsData.on('moduleRemoved', (module) => {
            updateModulePlacedState(module.templateId, false);
        });

        DimensionsData.on('cleared', () => {
            // Re-enable all modules
            container.querySelectorAll('.module-item.placed').forEach(item => {
                item.classList.remove('placed');
                item.setAttribute('draggable', 'true');
                // Remove badge
                const badge = item.querySelector('.module-placed-badge');
                if (badge) badge.remove();
            });
        });
    }

    // Update a module's placed state in the sidebar
    function updateModulePlacedState(moduleId, isPlaced) {
        const moduleItem = container.querySelector(`[data-module-id="${moduleId}"]`);
        if (moduleItem) {
            if (isPlaced) {
                moduleItem.classList.add('placed');
                moduleItem.setAttribute('draggable', 'false');
                // Add badge if not exists
                if (!moduleItem.querySelector('.module-placed-badge')) {
                    const badge = document.createElement('div');
                    badge.className = 'module-placed-badge';
                    badge.innerHTML = '<i data-lucide="check" class="icon-xs"></i>';
                    moduleItem.appendChild(badge);
                    // Re-initialize Lucide for the new icon
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons({ nodes: [badge] });
                    }
                }
            } else {
                moduleItem.classList.remove('placed');
                moduleItem.setAttribute('draggable', 'true');
                // Remove badge
                const badge = moduleItem.querySelector('.module-placed-badge');
                if (badge) badge.remove();
            }
        }
    }

    // Check if a module is already placed
    function isModulePlaced(moduleId) {
        const placedModules = DimensionsData.getPlacedModules();
        return placedModules.some(m => m.templateId === moduleId);
    }

    // Track collapsed state
    let allCollapsed = false;

    // Render the sidebar
    function render() {
        if (!container || !dimensions.length) return;

        const html = `
            <div class="sidebar-header">
                <div class="sidebar-title"><i data-lucide="boxes" class="icon-sm"></i> Dimensions</div>
                <div class="sidebar-subtitle">Glissez les modules sur le canvas</div>
                <button class="sidebar-toggle-btn" id="sidebarToggleBtn">
                    <i data-lucide="chevron-down" class="sidebar-toggle-icon icon-xs"></i>
                    <span class="sidebar-toggle-text">Réduire tout</span>
                </button>
            </div>
            <div class="dimensions-list">
                ${dimensions.map(renderDimension).join('')}
            </div>
        `;

        container.innerHTML = html;

        // Initialize Lucide icons in sidebar
        if (typeof lucide !== 'undefined') {
            lucide.createIcons({ nodes: [container] });
        }

        // Setup toggle button
        const toggleBtn = container.querySelector('#sidebarToggleBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleAll);
        }
    }

    // Toggle all dimensions
    function toggleAll() {
        allCollapsed = !allCollapsed;
        const btn = container.querySelector('#sidebarToggleBtn');
        const textEl = btn?.querySelector('.sidebar-toggle-text');
        const iconEl = btn?.querySelector('.sidebar-toggle-icon');

        if (allCollapsed) {
            collapseAll();
            if (textEl) textEl.textContent = 'Développer tout';
            if (iconEl) iconEl.style.transform = 'rotate(-90deg)';
        } else {
            expandAll();
            if (textEl) textEl.textContent = 'Réduire tout';
            if (iconEl) iconEl.style.transform = 'rotate(0deg)';
        }
    }

    // Render a single dimension group
    function renderDimension(dimension) {
        // Use HeroIcons if available, fallback to emoji
        const iconHtml = typeof HeroIcons !== 'undefined'
            ? HeroIcons.getDimensionIcon(dimension.id, { size: 22, strokeWidth: 2, className: 'dimension-icon' })
            : dimension.emoji;

        return `
            <div class="dimension-group" data-dimension="${dimension.id}">
                <div class="dimension-header">
                    <div class="dimension-emoji">${iconHtml}</div>
                    <div class="dimension-info">
                        <div class="dimension-title">${dimension.title}</div>
                        <div class="dimension-count">${dimension.modules.length} modules</div>
                    </div>
                    <div class="dimension-toggle">
                        <i data-lucide="chevron-down" class="icon-sm"></i>
                    </div>
                </div>
                <div class="modules-list">
                    ${dimension.modules.map(m => renderModule(m, dimension)).join('')}
                </div>
            </div>
        `;
    }

    // Render a single module item
    function renderModule(module, dimension) {
        const placed = isModulePlaced(module.id);
        return `
            <div class="module-item${placed ? ' placed' : ''}"
                 draggable="${placed ? 'false' : 'true'}"
                 data-module-id="${module.id}"
                 data-dimension-id="${dimension.id}">
                <div class="module-color" style="background: ${dimension.color}"></div>
                <div class="module-content">
                    <div class="module-name">${module.name}</div>
                    <div class="module-desc">${module.desc}</div>
                </div>
                ${placed ? '<div class="module-placed-badge"><i data-lucide="check" class="icon-xs"></i></div>' : ''}
            </div>
        `;
    }

    // Setup event listeners
    function setupEventListeners() {
        if (!container) return;

        // Dimension header click (toggle collapse)
        container.addEventListener('click', (e) => {
            const header = e.target.closest('.dimension-header');
            if (header) {
                const group = header.closest('.dimension-group');
                if (group) {
                    group.classList.toggle('collapsed');
                }
                return;
            }

            // Module click (add to workspace)
            const moduleItem = e.target.closest('.module-item');
            if (moduleItem && !moduleItem.classList.contains('placed')) {
                const moduleId = moduleItem.dataset.moduleId;
                if (moduleId && typeof DimensionsWorkspace !== 'undefined') {
                    DimensionsWorkspace.addModuleAtFreePosition(moduleId);
                }
            }
        });

        // Module drag start
        container.addEventListener('dragstart', handleDragStart);
        container.addEventListener('dragend', handleDragEnd);

        // Touch support for mobile
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);
    }

    // Drag handlers
    function handleDragStart(e) {
        const moduleItem = e.target.closest('.module-item');
        if (!moduleItem) return;

        // Prevent dragging if already placed
        if (moduleItem.classList.contains('placed')) {
            e.preventDefault();
            return;
        }

        const moduleId = moduleItem.dataset.moduleId;
        const dimensionId = moduleItem.dataset.dimensionId;

        e.dataTransfer.setData('text/plain', JSON.stringify({
            moduleId,
            dimensionId
        }));
        e.dataTransfer.effectAllowed = 'copy';

        moduleItem.classList.add('dragging');

        // Create drag image
        const dragImage = createDragImage(moduleItem);
        e.dataTransfer.setDragImage(dragImage, 90, 30);

        // Notify workspace
        if (typeof DimensionsWorkspace !== 'undefined') {
            DimensionsWorkspace.setDragging(true, { moduleId, dimensionId });
        }
    }

    function handleDragEnd(e) {
        const moduleItem = e.target.closest('.module-item');
        if (moduleItem) {
            moduleItem.classList.remove('dragging');
        }

        // Remove any drag images
        document.querySelectorAll('.drag-image-temp').forEach(el => el.remove());

        // Notify workspace
        if (typeof DimensionsWorkspace !== 'undefined') {
            DimensionsWorkspace.setDragging(false, null);
        }
    }

    // Create custom drag image
    function createDragImage(moduleItem) {
        const clone = moduleItem.cloneNode(true);
        clone.classList.add('drag-image-temp');
        clone.style.cssText = `
            position: absolute;
            top: -1000px;
            left: -1000px;
            width: ${moduleItem.offsetWidth}px;
            opacity: 0.9;
            transform: rotate(2deg);
            pointer-events: none;
        `;
        document.body.appendChild(clone);
        return clone;
    }

    // Touch handlers for mobile
    let touchDragData = null;
    let touchClone = null;

    function handleTouchStart(e) {
        const moduleItem = e.target.closest('.module-item');
        if (!moduleItem) return;

        // Prevent touch drag if already placed
        if (moduleItem.classList.contains('placed')) {
            return;
        }

        const touch = e.touches[0];
        touchDragData = {
            moduleId: moduleItem.dataset.moduleId,
            dimensionId: moduleItem.dataset.dimensionId,
            startX: touch.clientX,
            startY: touch.clientY,
            isDragging: false
        };

        moduleItem.classList.add('touch-active');
    }

    function handleTouchMove(e) {
        if (!touchDragData) return;

        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchDragData.startX);
        const deltaY = Math.abs(touch.clientY - touchDragData.startY);

        // Start drag after threshold
        if (!touchDragData.isDragging && (deltaX > 10 || deltaY > 10)) {
            touchDragData.isDragging = true;
            createTouchClone(touch);

            if (typeof DimensionsWorkspace !== 'undefined') {
                DimensionsWorkspace.setDragging(true, touchDragData);
            }
        }

        if (touchDragData.isDragging) {
            e.preventDefault();
            updateTouchClone(touch);
        }
    }

    function handleTouchEnd(e) {
        document.querySelectorAll('.touch-active').forEach(el => {
            el.classList.remove('touch-active');
        });

        if (touchDragData && touchDragData.isDragging) {
            const touch = e.changedTouches[0];

            if (typeof DimensionsWorkspace !== 'undefined') {
                DimensionsWorkspace.handleTouchDrop(touch.clientX, touch.clientY, touchDragData);
            }
        }

        if (touchClone) {
            touchClone.remove();
            touchClone = null;
        }

        touchDragData = null;

        if (typeof DimensionsWorkspace !== 'undefined') {
            DimensionsWorkspace.setDragging(false, null);
        }
    }

    function createTouchClone(touch) {
        const moduleItem = container.querySelector(`[data-module-id="${touchDragData.moduleId}"]`);
        if (!moduleItem) return;

        touchClone = moduleItem.cloneNode(true);
        touchClone.style.cssText = `
            position: fixed;
            z-index: 10000;
            width: ${moduleItem.offsetWidth}px;
            opacity: 0.9;
            transform: translate(-50%, -50%) rotate(2deg);
            pointer-events: none;
            box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        `;
        document.body.appendChild(touchClone);
        updateTouchClone(touch);
    }

    function updateTouchClone(touch) {
        if (touchClone) {
            touchClone.style.left = `${touch.clientX}px`;
            touchClone.style.top = `${touch.clientY}px`;
        }
    }

    // Collapse/expand all
    function collapseAll() {
        container.querySelectorAll('.dimension-group').forEach(group => {
            group.classList.add('collapsed');
        });
    }

    function expandAll() {
        container.querySelectorAll('.dimension-group').forEach(group => {
            group.classList.remove('collapsed');
        });
    }

    // Toggle specific dimension
    function toggleDimension(dimensionId) {
        const group = container.querySelector(`[data-dimension="${dimensionId}"]`);
        if (group) {
            group.classList.toggle('collapsed');
        }
    }

    // Update after data change
    function refresh() {
        dimensions = DimensionsData.getDimensions();
        render();
        setupEventListeners();
    }

    // Public API
    return {
        init,
        render,
        refresh,
        collapseAll,
        expandAll,
        toggleDimension
    };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DimensionsSidebar;
}
