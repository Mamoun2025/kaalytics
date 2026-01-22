/* ============================================
   TABLET MODE - UI Components v2.0
   Tablet-specific interface elements
   - FAB button
   - Zoom controls
   - Panel toggles (sidebar + right panel)
   - Context menu
   - Connection indicator
   ============================================ */

const TabletUI = (function() {
    'use strict';

    // === STATE ===
    let isInitialized = false;
    let elements = {
        fab: null,
        quickMenu: null,
        contextMenu: null,
        connectionIndicator: null,
        zoomControls: null
    };

    // === INIT ===
    function init() {
        if (!DeviceDetector.isTablet() && !DeviceDetector.isPhone()) {
            console.log('[TabletUI] Not a tablet/phone, skipping');
            return;
        }

        createUI();
        bindEvents();
        setupPanelToggles();
        isInitialized = true;

        console.log('[TabletUI] Initialized v2.0');
    }

    // === CREATE UI ELEMENTS ===
    function createUI() {
        createFAB();
        createQuickMenu();
        createContextMenu();
        createConnectionIndicator();
        createZoomControls();
    }

    // === FAB (Floating Action Button) ===
    function createFAB() {
        elements.fab = document.createElement('button');
        elements.fab.className = 'tablet-fab';
        elements.fab.innerHTML = HeroIcons.getSvgString('plus', { size: 24, strokeWidth: 2.5 });
        elements.fab.setAttribute('aria-label', 'Ajouter un module');
        document.body.appendChild(elements.fab);
    }

    // === QUICK MENU ===
    function createQuickMenu() {
        elements.quickMenu = document.createElement('div');
        elements.quickMenu.className = 'tablet-quick-menu';
        document.body.appendChild(elements.quickMenu);
    }

    function showQuickMenu() {
        if (!elements.quickMenu) return;

        // Get dimensions from data
        const dimensions = typeof DimensionsData !== 'undefined'
            ? DimensionsData.getDimensions()
            : [];

        let html = '';
        dimensions.forEach(dim => {
            const iconHtml = typeof HeroIcons !== 'undefined'
                ? HeroIcons.getDimensionIcon(dim.id, { size: 24, strokeWidth: 2 })
                : dim.emoji;

            html += `
                <div class="tablet-quick-menu-item" data-dimension="${dim.id}">
                    <div class="icon" style="color: ${dim.color}">${iconHtml}</div>
                    <div>
                        <div style="font-weight: 600; color: var(--text-primary)">${dim.title}</div>
                        <div style="font-size: 11px; color: var(--text-secondary)">${dim.modules.length} modules</div>
                    </div>
                </div>
            `;
        });

        elements.quickMenu.innerHTML = html;
        elements.quickMenu.classList.add('visible');

        // Hide on outside tap
        setTimeout(() => {
            document.addEventListener('touchstart', hideQuickMenuOnOutside, { once: true });
        }, 100);
    }

    function hideQuickMenu() {
        elements.quickMenu?.classList.remove('visible');
    }

    function hideQuickMenuOnOutside(e) {
        if (!elements.quickMenu?.contains(e.target) && !elements.fab?.contains(e.target)) {
            hideQuickMenu();
        }
    }

    // === CONTEXT MENU ===
    function createContextMenu() {
        elements.contextMenu = document.createElement('div');
        elements.contextMenu.className = 'tablet-context-menu';
        elements.contextMenu.innerHTML = `
            <div class="tablet-context-menu-item" data-action="info">
                ${HeroIcons.getSvgString('information-circle', { size: 20 })}
                <span>Informations</span>
            </div>
            <div class="tablet-context-menu-item" data-action="connect">
                ${HeroIcons.getSvgString('link', { size: 20 })}
                <span>Connecter</span>
            </div>
            <div class="tablet-context-menu-item danger" data-action="delete">
                ${HeroIcons.getSvgString('trash', { size: 20 })}
                <span>Supprimer</span>
            </div>
        `;
        document.body.appendChild(elements.contextMenu);
    }

    function showContextMenu(moduleId, x, y) {
        if (!elements.contextMenu) return;

        elements.contextMenu.dataset.moduleId = moduleId;

        // Position menu
        const menuRect = elements.contextMenu.getBoundingClientRect();
        let left = x - menuRect.width / 2;
        let top = y - menuRect.height - 20;

        // Keep on screen
        if (left < 10) left = 10;
        if (left + menuRect.width > window.innerWidth - 10) {
            left = window.innerWidth - menuRect.width - 10;
        }
        if (top < 10) {
            top = y + 20; // Show below if no room above
        }

        elements.contextMenu.style.left = left + 'px';
        elements.contextMenu.style.top = top + 'px';
        elements.contextMenu.classList.add('visible');

        // Hide on outside tap
        setTimeout(() => {
            document.addEventListener('touchstart', hideContextMenuOnOutside, { once: true });
        }, 100);
    }

    function hideContextMenu() {
        elements.contextMenu?.classList.remove('visible');
    }

    function hideContextMenuOnOutside(e) {
        if (!elements.contextMenu?.contains(e.target)) {
            hideContextMenu();
        }
    }

    // === CONNECTION INDICATOR ===
    function createConnectionIndicator() {
        elements.connectionIndicator = document.createElement('div');
        elements.connectionIndicator.className = 'tablet-connection-indicator';
        elements.connectionIndicator.innerHTML = `
            <span>Mode connexion</span>
            <button class="cancel-btn">
                ${HeroIcons.getSvgString('x-mark', { size: 16, strokeWidth: 2.5 })}
            </button>
        `;
        document.body.appendChild(elements.connectionIndicator);
    }

    function showConnectionIndicator() {
        elements.connectionIndicator?.classList.add('visible');
    }

    function hideConnectionIndicator() {
        elements.connectionIndicator?.classList.remove('visible');
    }

    // === ZOOM CONTROLS ===
    function createZoomControls() {
        elements.zoomControls = document.createElement('div');
        elements.zoomControls.className = 'tablet-zoom-controls';
        elements.zoomControls.innerHTML = `
            <button class="tablet-zoom-btn" data-action="zoom-in" aria-label="Zoom in">
                ${HeroIcons.getSvgString('plus', { size: 20, strokeWidth: 2 })}
            </button>
            <button class="tablet-zoom-btn" data-action="zoom-out" aria-label="Zoom out">
                ${HeroIcons.getSvgString('minus', { size: 20, strokeWidth: 2 })}
            </button>
            <button class="tablet-zoom-btn" data-action="zoom-reset" aria-label="Reset zoom">
                ${HeroIcons.getSvgString('arrow-path', { size: 20, strokeWidth: 2 })}
            </button>
        `;
        document.body.appendChild(elements.zoomControls);
    }

    // === PANEL TOGGLES ===
    function setupPanelToggles() {
        setupSidebarToggle();
        setupRightPanelToggle();
    }

    // Sidebar toggle (tap header to expand/collapse)
    function setupSidebarToggle() {
        const sidebar = document.querySelector('.sidebar');
        const sidebarHeader = sidebar?.querySelector('.sidebar-header');

        if (!sidebar || !sidebarHeader) return;

        // Touch on header toggles expansion
        sidebarHeader.addEventListener('touchstart', (e) => {
            // Prevent if dragging module
            if (document.body.classList.contains('is-dragging-module')) return;

            e.stopPropagation();
        }, { passive: true });

        sidebarHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });

        // Swipe gesture for sidebar
        let startY = 0;
        let startTransform = 0;

        sidebar.addEventListener('touchstart', (e) => {
            if (e.target.closest('.module-item')) return; // Don't interfere with module drag
            startY = e.touches[0].clientY;
            const expanded = sidebar.classList.contains('expanded');
            startTransform = expanded ? 0 : 100;
        }, { passive: true });

        sidebar.addEventListener('touchmove', (e) => {
            if (e.target.closest('.module-item')) return;
            const deltaY = e.touches[0].clientY - startY;
            const threshold = 50;

            // Swipe up to expand, down to collapse
            if (deltaY < -threshold && !sidebar.classList.contains('expanded')) {
                sidebar.classList.add('expanded');
            } else if (deltaY > threshold && sidebar.classList.contains('expanded')) {
                sidebar.classList.remove('expanded');
            }
        }, { passive: true });
    }

    function toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        sidebar.classList.toggle('expanded');
    }

    // Right panel toggle
    function setupRightPanelToggle() {
        const rightPanel = document.getElementById('rightPanel');
        if (!rightPanel) return;

        // Create a clickable handle element (since ::before can't receive events)
        const handle = document.createElement('div');
        handle.className = 'right-panel-handle';
        handle.style.cssText = `
            position: absolute;
            cursor: pointer;
            z-index: 20;
            background: transparent;
        `;
        rightPanel.appendChild(handle);

        // Update handle position based on orientation
        function updateHandlePosition() {
            const isPortrait = window.matchMedia('(orientation: portrait)').matches;
            if (isPortrait) {
                // Top center handle
                handle.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 30px;
                    cursor: pointer;
                    z-index: 20;
                `;
            } else {
                // Left side handle
                handle.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: -30px;
                    width: 50px;
                    height: 100%;
                    cursor: pointer;
                    z-index: 20;
                `;
            }
        }

        updateHandlePosition();
        window.addEventListener('resize', updateHandlePosition);
        window.addEventListener('orientationchange', () => {
            setTimeout(updateHandlePosition, 100);
        });

        // Handle click
        handle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleRightPanel();
        });

        // Swipe gesture for right panel
        let startX = 0;
        let startY = 0;
        let isTap = true;

        rightPanel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isTap = true;
        }, { passive: true });

        rightPanel.addEventListener('touchmove', (e) => {
            const dx = Math.abs(e.touches[0].clientX - startX);
            const dy = Math.abs(e.touches[0].clientY - startY);
            if (dx > 10 || dy > 10) isTap = false;
        }, { passive: true });

        rightPanel.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const threshold = 50;
            const isPortrait = window.matchMedia('(orientation: portrait)').matches;

            // If it's a tap on handle area (when collapsed), expand
            if (isTap && !rightPanel.classList.contains('expanded')) {
                const rect = rightPanel.getBoundingClientRect();
                if (isPortrait) {
                    if (endY >= rect.top && endY <= rect.top + 50) {
                        toggleRightPanel();
                        return;
                    }
                } else {
                    if (endX >= rect.left - 30 && endX <= rect.left + 20) {
                        toggleRightPanel();
                        return;
                    }
                }
            }

            if (isPortrait) {
                // Swipe up to expand, down to collapse
                if (deltaY < -threshold && !rightPanel.classList.contains('expanded')) {
                    rightPanel.classList.add('expanded');
                } else if (deltaY > threshold && rightPanel.classList.contains('expanded')) {
                    rightPanel.classList.remove('expanded');
                }
            } else {
                // Swipe left to expand, right to collapse
                if (deltaX < -threshold && !rightPanel.classList.contains('expanded')) {
                    rightPanel.classList.add('expanded');
                } else if (deltaX > threshold && rightPanel.classList.contains('expanded')) {
                    rightPanel.classList.remove('expanded');
                }
            }
        }, { passive: true });
    }

    function toggleRightPanel() {
        const rightPanel = document.getElementById('rightPanel');
        if (!rightPanel) return;
        rightPanel.classList.toggle('expanded');
    }

    // === BIND EVENTS ===
    function bindEvents() {
        // FAB click
        elements.fab?.addEventListener('click', () => {
            if (elements.quickMenu?.classList.contains('visible')) {
                hideQuickMenu();
            } else {
                showQuickMenu();
            }
        });

        // Quick menu item click
        elements.quickMenu?.addEventListener('click', (e) => {
            const item = e.target.closest('.tablet-quick-menu-item');
            if (item) {
                const dimId = item.dataset.dimension;
                expandDimensionInSidebar(dimId);
                hideQuickMenu();
            }
        });

        // Context menu actions
        elements.contextMenu?.addEventListener('click', (e) => {
            const item = e.target.closest('.tablet-context-menu-item');
            if (item) {
                const action = item.dataset.action;
                const moduleId = elements.contextMenu.dataset.moduleId;
                handleContextMenuAction(action, moduleId);
                hideContextMenu();
            }
        });

        // Connection indicator cancel
        elements.connectionIndicator?.querySelector('.cancel-btn')?.addEventListener('click', () => {
            if (typeof TabletGestures !== 'undefined') {
                TabletGestures.cancelConnection();
            }
            if (typeof DimensionsConnections !== 'undefined') {
                DimensionsConnections.cancelConnection();
            }
            hideConnectionIndicator();
        });

        // Zoom controls
        elements.zoomControls?.addEventListener('click', (e) => {
            const btn = e.target.closest('.tablet-zoom-btn');
            if (!btn) return;

            const action = btn.dataset.action;
            if (typeof DimensionsViewport !== 'undefined') {
                switch (action) {
                    case 'zoom-in':
                        DimensionsViewport.zoomIn?.();
                        break;
                    case 'zoom-out':
                        DimensionsViewport.zoomOut?.();
                        break;
                    case 'zoom-reset':
                        DimensionsViewport.resetZoom?.();
                        break;
                }
            }
        });
    }

    // === CONTEXT MENU ACTIONS ===
    function handleContextMenuAction(action, moduleId) {
        switch (action) {
            case 'delete':
                if (typeof DimensionsData !== 'undefined') {
                    DimensionsData.removePlacedModule(moduleId);
                }
                break;

            case 'info':
                // Could show info modal
                console.log('Show info for:', moduleId);
                break;

            case 'connect':
                // Start connection mode from this module
                const module = document.getElementById(moduleId);
                const port = module?.querySelector('.port-right');
                if (module && port) {
                    // Simulate touch to start connection
                    const rect = port.getBoundingClientRect();
                    if (typeof DimensionsConnections !== 'undefined') {
                        DimensionsConnections.startConnectionDrag(
                            moduleId,
                            'right',
                            rect.left + rect.width / 2,
                            rect.top + rect.height / 2
                        );
                    }
                    showConnectionIndicator();
                }
                break;
        }
    }

    // === HELPER: EXPAND DIMENSION IN SIDEBAR ===
    function expandDimensionInSidebar(dimensionId) {
        const sidebar = document.querySelector('.sidebar');
        const group = sidebar?.querySelector(`[data-dimension="${dimensionId}"]`);

        if (sidebar && group) {
            sidebar.classList.add('expanded');
            group.classList.remove('collapsed');
            group.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // === TOAST FOR TABLET ===
    function showToast(message, options = {}) {
        const { icon = 'check', duration = 3000 } = options;

        const toast = document.createElement('div');
        toast.className = 'tablet-toast';
        toast.innerHTML = `
            <span class="toast-icon">${HeroIcons.getSvgString(icon, { size: 20 })}</span>
            <span>${message}</span>
        `;
        toast.style.cssText = `
            position: fixed;
            bottom: 150px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--surface);
            border: 1px solid var(--border);
            padding: 10px 16px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 2000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 12px;
            animation: slideUp 0.3s ease-out;
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // === DESTROY ===
    function destroy() {
        Object.values(elements).forEach(el => el?.remove());
        elements = {};
        isInitialized = false;
    }

    // === PUBLIC API ===
    return {
        init,
        destroy,
        showQuickMenu,
        hideQuickMenu,
        showContextMenu,
        hideContextMenu,
        showConnectionIndicator,
        hideConnectionIndicator,
        showToast,
        toggleSidebar,
        toggleRightPanel,
        isInitialized: () => isInitialized
    };

})();
