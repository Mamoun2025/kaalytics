/* ============================================
   DIMENSIONS CONNECTIONS
   Click-to-Connect System - Ultra-ergonomic
   ============================================ */

const DimensionsConnections = (function() {
    'use strict';

    // === CONFIG ===
    const CONFIG = {
        portSnapRadius: 50,      // Pixels to snap to nearest port
        portHitRadius: 30,       // Hit area for port detection
        curveIntensity: 0.4,     // Bezier curve intensity
        minCurve: 40,            // Minimum curve offset
        maxCurve: 120            // Maximum curve offset
    };

    // === STATE ===
    const state = {
        isConnecting: false,
        startModule: null,
        startPort: null,
        tempLine: null,
        nearestPort: null,      // Currently nearest port for snap
        allPorts: [],           // Cache of all port positions
        isDragging: false,      // True if user is dragging (mouse held down)
        hasMoved: false         // True if mouse moved during drag
    };

    // === DOM REFS ===
    let svgLayer = null;
    let canvas = null;
    let workspace = null;

    // === INIT ===
    function init(svgSelector) {
        svgLayer = document.querySelector(svgSelector);

        if (!svgLayer) {
            console.error('[Connections] SVG layer not found:', svgSelector);
            return;
        }

        canvas = svgLayer.parentElement;
        workspace = document.querySelector('.workspace');

        bindEvents();
        bindDataEvents();

        console.log('[Connections] Initialized (ergonomic mode)');
    }

    // === EVENT BINDING ===
    function bindEvents() {
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('keydown', onKeyDown);

        // Click outside to cancel connection
        if (workspace) {
            workspace.addEventListener('click', onWorkspaceClick);
        }

        // Touch support
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd);

        // Direct click handler on SVG layer for connection deletion (event delegation)
        if (svgLayer) {
            svgLayer.addEventListener('click', onSVGClick, true); // Use capture phase
        }
    }

    // === SVG CLICK HANDLER (for deleting connections) ===
    function onSVGClick(e) {
        // Find the connection group or hit area
        const hitArea = e.target.closest('.connection-hit-area');
        const group = e.target.closest('.connection-group');

        if (hitArea || group) {
            e.stopPropagation();
            e.preventDefault();

            // Get connection ID from either element
            const connectionId = hitArea
                ? hitArea.getAttribute('data-connection-id')
                : group.getAttribute('data-connection-group');

            if (connectionId) {
                console.log('[Connections] Deleting connection:', connectionId);
                DimensionsData.removeConnection(connectionId);
            }
        }
    }

    function bindDataEvents() {
        DimensionsData.on('connectionAdded', onConnectionAdded);
        DimensionsData.on('connectionRemoved', onConnectionRemoved);
        DimensionsData.on('moduleMoved', redraw);
        DimensionsData.on('moduleRemoved', redraw);
    }

    // === CACHE ALL PORTS ===
    function cacheAllPorts() {
        state.allPorts = [];
        const modules = DimensionsData.getPlacedModules();

        modules.forEach(module => {
            // Skip nested modules (hidden)
            if (module.parentId) return;

            ['top', 'bottom', 'left', 'right'].forEach(portType => {
                const pos = getPortCanvasPosition(module.id, portType);
                if (pos) {
                    state.allPorts.push({
                        moduleId: module.id,
                        portType,
                        x: pos.x,
                        y: pos.y
                    });
                }
            });
        });
    }

    // === FIND NEAREST PORT ===
    function findNearestPort(canvasX, canvasY, excludeModuleId = null) {
        let nearest = null;
        let minDist = CONFIG.portSnapRadius;

        state.allPorts.forEach(port => {
            if (port.moduleId === excludeModuleId) return;

            const dx = port.x - canvasX;
            const dy = port.y - canvasY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                nearest = port;
            }
        });

        return nearest;
    }

    // === HANDLE PORT CLICK (Click-to-Connect mode) ===
    function handlePortClick(moduleId, portType, clientX, clientY) {
        // If we just finished a drag, ignore the click event
        if (state.hasMoved) {
            return;
        }

        if (!state.isConnecting) {
            // First click: START connection
            startConnection(moduleId, portType, clientX, clientY, false);
        } else {
            // Second click: END connection
            if (moduleId !== state.startModule) {
                // Create connection
                const connection = DimensionsData.addConnection(
                    state.startModule,
                    state.startPort,
                    moduleId,
                    portType
                );

                if (connection) {
                    // Visual feedback
                    const endMod = document.getElementById(moduleId);
                    if (endMod) {
                        const portEl = endMod.querySelector(`[data-port="${portType}"]`);
                        if (portEl) createSparkEffect(portEl);
                    }

                    markPortConnected(state.startModule, state.startPort);
                    markPortConnected(moduleId, portType);
                }
            }
            // Reset connection state
            cancelConnection();
        }
    }

    // === START CONNECTION (from mousedown for drag mode) ===
    function startConnectionDrag(moduleId, portType, clientX, clientY) {
        startConnection(moduleId, portType, clientX, clientY, true);
    }

    // === START CONNECTION ===
    function startConnection(moduleId, portType, clientX, clientY, isDrag = false) {
        state.isConnecting = true;
        state.startModule = moduleId;
        state.startPort = portType;
        state.isDragging = isDrag;
        state.hasMoved = false;

        // Add connecting class to body for cursor
        document.body.classList.add('connecting');

        // Cache all ports for snap detection
        cacheAllPorts();

        // Get port position in canvas space
        const pos = getPortCanvasPosition(moduleId, portType);
        if (!pos) {
            cancelConnection();
            return;
        }

        // Create temporary SVG path
        state.tempLine = createSVGPath('temp-connection');
        state.tempLine.setAttribute('d', `M ${pos.x} ${pos.y} L ${pos.x} ${pos.y}`);
        svgLayer.appendChild(state.tempLine);

        // Visual feedback - highlight start module
        const moduleEl = document.getElementById(moduleId);
        if (moduleEl) {
            moduleEl.classList.add('connecting');
            const portEl = moduleEl.querySelector(`[data-port="${portType}"]`);
            if (portEl) portEl.classList.add('active');
        }

        // Show all other ports
        showAllPorts(moduleId);

        // Body cursor
        document.body.style.cursor = 'crosshair';
    }

    // === SHOW ALL PORTS (visual hint during connection) ===
    function showAllPorts(excludeModuleId) {
        document.querySelectorAll('.placed-module').forEach(mod => {
            if (mod.id !== excludeModuleId && !mod.classList.contains('nested-child')) {
                mod.classList.add('show-ports');
            }
        });
    }

    // === HIDE ALL PORTS ===
    function hideAllPorts() {
        document.querySelectorAll('.placed-module.show-ports').forEach(mod => {
            mod.classList.remove('show-ports');
        });
    }

    // === MOUSE MOVE (during connection) ===
    function onMouseMove(e) {
        if (!state.isConnecting || !state.tempLine) return;

        // Track that the mouse has moved (for distinguishing click vs drag)
        state.hasMoved = true;

        // Convert screen position to canvas space
        const canvasPos = screenToCanvas(e.clientX, e.clientY);

        // Get start port position
        const startPos = getPortCanvasPosition(state.startModule, state.startPort);
        if (!startPos) return;

        // Find nearest port for snap
        const nearest = findNearestPort(canvasPos.x, canvasPos.y, state.startModule);

        // Update snap highlight
        updateSnapHighlight(nearest);

        // End position: snap to nearest port or follow cursor
        let endPos = canvasPos;
        let endPort = null;

        if (nearest) {
            endPos = { x: nearest.x, y: nearest.y };
            endPort = nearest.portType;
        }

        // Update temp line with smooth bezier curve
        const d = createBezierPath(startPos, endPos, state.startPort, endPort);
        state.tempLine.setAttribute('d', d);

        // Visual feedback: change temp line style when snapped
        if (nearest) {
            state.tempLine.classList.add('snapped');
        } else {
            state.tempLine.classList.remove('snapped');
        }
    }

    // === TOUCH MOVE ===
    function onTouchMove(e) {
        if (!state.isConnecting) return;
        e.preventDefault();

        const touch = e.touches[0];
        onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }

    // === UPDATE SNAP HIGHLIGHT ===
    function updateSnapHighlight(nearest) {
        // Remove previous highlight
        if (state.nearestPort) {
            const prevMod = document.getElementById(state.nearestPort.moduleId);
            if (prevMod) {
                const prevPort = prevMod.querySelector(`[data-port="${state.nearestPort.portType}"]`);
                if (prevPort) prevPort.classList.remove('snap-target');
                prevMod.classList.remove('snap-target-module');
            }
        }

        state.nearestPort = nearest;

        // Add new highlight
        if (nearest) {
            const mod = document.getElementById(nearest.moduleId);
            if (mod) {
                const port = mod.querySelector(`[data-port="${nearest.portType}"]`);
                if (port) port.classList.add('snap-target');
                mod.classList.add('snap-target-module');
            }
        }
    }

    // === MOUSE UP (end connection) ===
    function onMouseUp(e) {
        if (!state.isConnecting) return;

        // If we were dragging and mouse moved, try to complete connection
        if (state.isDragging && state.hasMoved) {
            // Check if we have a snapped port
            if (state.nearestPort) {
                const endModuleId = state.nearestPort.moduleId;
                const endPortType = state.nearestPort.portType;

                // Create connection
                const connection = DimensionsData.addConnection(
                    state.startModule,
                    state.startPort,
                    endModuleId,
                    endPortType
                );

                if (connection) {
                    // Visual feedback
                    const endMod = document.getElementById(endModuleId);
                    if (endMod) {
                        const portEl = endMod.querySelector(`[data-port="${endPortType}"]`);
                        if (portEl) createSparkEffect(portEl);
                    }

                    markPortConnected(state.startModule, state.startPort);
                    markPortConnected(endModuleId, endPortType);
                }
                cancelConnection();
            } else {
                // Dragged but no target - cancel
                cancelConnection();
            }
        }
        // If it was a click (no drag), stay in connecting mode for click-to-click
        state.isDragging = false;
    }

    // === CLICK OUTSIDE (cancel connection in click mode) ===
    function onWorkspaceClick(e) {
        if (!state.isConnecting) return;

        // If clicking on a port, let handlePortClick handle it
        if (e.target.closest('.port')) return;

        // If clicking on a connection (SVG path), don't interfere
        if (e.target.closest('.connection-hit-area') ||
            e.target.closest('.connection-group') ||
            e.target.tagName === 'path') return;

        // If we just finished a drag, don't cancel
        if (state.hasMoved) {
            state.hasMoved = false;
            return;
        }

        // Clicking anywhere else cancels the connection
        cancelConnection();
    }

    // === TOUCH END ===
    function onTouchEnd(e) {
        onMouseUp(e);
    }

    // === KEYBOARD ===
    function onKeyDown(e) {
        if (e.key === 'Escape' && state.isConnecting) {
            cancelConnection();
        }
    }

    // === CANCEL CONNECTION ===
    function cancelConnection() {
        if (state.tempLine) {
            state.tempLine.remove();
            state.tempLine = null;
        }

        // Clear snap highlight
        updateSnapHighlight(null);

        if (state.startModule) {
            const moduleEl = document.getElementById(state.startModule);
            if (moduleEl) {
                moduleEl.classList.remove('connecting');
                const portEl = moduleEl.querySelector(`[data-port="${state.startPort}"]`);
                if (portEl) portEl.classList.remove('active');
            }
        }

        hideAllPorts();

        state.isConnecting = false;
        state.startModule = null;
        state.startPort = null;
        state.nearestPort = null;
        state.allPorts = [];

        // Remove connecting class from body
        document.body.classList.remove('connecting');
    }

    // === DATA EVENT HANDLERS ===
    function onConnectionAdded(connection) {
        drawConnection(connection);
        updateStats();
    }

    function onConnectionRemoved(connection) {
        // Remove the entire group
        const groupEl = svgLayer.querySelector(`[data-connection-group="${connection.id}"]`);
        if (groupEl) {
            groupEl.remove();
        } else {
            // Fallback: remove individual elements (backward compatibility)
            const pathEl = svgLayer.querySelector(`[data-connection-id="${connection.id}"]`);
            const flowEl = svgLayer.querySelector(`[data-connection-flow="${connection.id}"]`);
            const visibleEl = svgLayer.querySelector(`[data-connection-visible="${connection.id}"]`);
            if (pathEl) pathEl.remove();
            if (flowEl) flowEl.remove();
            if (visibleEl) visibleEl.remove();
        }

        // Update port visual states
        updatePortState(connection.fromModule, connection.fromPort);
        updatePortState(connection.toModule, connection.toPort);

        updateStats();
    }

    // === DRAW CONNECTION ===
    function drawConnection(connection) {
        const startPos = getPortCanvasPosition(connection.fromModule, connection.fromPort);
        const endPos = getPortCanvasPosition(connection.toModule, connection.toPort);

        if (!startPos || !endPos) return;

        const pathD = createBezierPath(startPos, endPos, connection.fromPort, connection.toPort);

        // Container group for all connection elements
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('data-connection-group', connection.id);
        group.classList.add('connection-group');

        // Visible stroke (the main yellow line) - added first (bottom)
        const visiblePath = createSVGPath('connection-path-visible');
        visiblePath.setAttribute('d', pathD);
        visiblePath.setAttribute('data-connection-visible', connection.id);
        group.appendChild(visiblePath);

        // Flow animation path (direction indicator)
        const flow = createSVGPath('connection-flow');
        flow.setAttribute('data-connection-flow', connection.id);
        flow.setAttribute('d', pathD);
        group.appendChild(flow);

        // Flow particles (enhanced direction indicator)
        const particles = createSVGPath('connection-flow-particles');
        particles.setAttribute('data-connection-particles', connection.id);
        particles.setAttribute('d', pathD);
        group.appendChild(particles);

        // Hit area (invisible, for clicks) - added last (top, to receive events)
        const hitArea = createSVGPath('connection-hit-area');
        hitArea.setAttribute('data-connection-id', connection.id);
        hitArea.setAttribute('d', pathD);
        group.appendChild(hitArea);

        svgLayer.appendChild(group);

        // Click = instant delete
        hitArea.addEventListener('click', (e) => {
            e.stopPropagation();
            DimensionsData.removeConnection(connection.id);
        });

        // Hover = dim effect
        hitArea.addEventListener('mouseenter', () => {
            group.classList.add('hover');
        });

        hitArea.addEventListener('mouseleave', () => {
            group.classList.remove('hover');
        });
    }

    // === REDRAW ALL CONNECTIONS ===
    let redrawRAF = null;

    function redraw() {
        // Use RAF to batch multiple redraw calls
        if (redrawRAF) return;

        redrawRAF = requestAnimationFrame(() => {
            redrawRAF = null;
            redrawImmediate();
        });
    }

    // Immediate redraw (no batching)
    function redrawImmediate() {
        svgLayer.innerHTML = '';
        const connections = DimensionsData.getConnections();
        connections.forEach(drawConnection);
    }

    // === COORDINATE CONVERSION ===
    function screenToCanvas(screenX, screenY) {
        if (typeof DimensionsViewport !== 'undefined') {
            return DimensionsViewport.screenToCanvas(screenX, screenY);
        }

        // Fallback without viewport
        const rect = canvas.getBoundingClientRect();
        return {
            x: screenX - rect.left,
            y: screenY - rect.top
        };
    }

    // === GET PORT POSITION (in canvas space) ===
    function getPortCanvasPosition(moduleId, portType) {
        const moduleEl = document.getElementById(moduleId);
        if (!moduleEl) return null;

        // Get module position from style (already in canvas space)
        const moduleX = parseFloat(moduleEl.style.left) || 0;
        const moduleY = parseFloat(moduleEl.style.top) || 0;

        // Get module dimensions
        const moduleWidth = moduleEl.offsetWidth;
        const moduleHeight = moduleEl.offsetHeight;

        // Calculate port center based on type
        let x, y;
        switch (portType) {
            case 'top':
                x = moduleX + moduleWidth / 2;
                y = moduleY;
                break;
            case 'bottom':
                x = moduleX + moduleWidth / 2;
                y = moduleY + moduleHeight;
                break;
            case 'left':
                x = moduleX;
                y = moduleY + moduleHeight / 2;
                break;
            case 'right':
                x = moduleX + moduleWidth;
                y = moduleY + moduleHeight / 2;
                break;
            default:
                return null;
        }

        return { x, y };
    }

    // === CREATE BEZIER PATH ===
    function createBezierPath(start, end, fromPort, toPort) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const curvature = Math.min(CONFIG.maxCurve, Math.max(CONFIG.minCurve, distance * CONFIG.curveIntensity));

        let cp1x = start.x, cp1y = start.y;
        let cp2x = end.x, cp2y = end.y;

        // Control point 1 based on start port direction
        switch (fromPort) {
            case 'top':    cp1y = start.y - curvature; break;
            case 'bottom': cp1y = start.y + curvature; break;
            case 'left':   cp1x = start.x - curvature; break;
            case 'right':  cp1x = start.x + curvature; break;
        }

        // Control point 2 based on end port direction
        if (toPort) {
            switch (toPort) {
                case 'top':    cp2y = end.y - curvature; break;
                case 'bottom': cp2y = end.y + curvature; break;
                case 'left':   cp2x = end.x - curvature; break;
                case 'right':  cp2x = end.x + curvature; break;
            }
        } else {
            // No end port specified, make smooth curve towards cursor
            cp2x = end.x - dx * 0.3;
            cp2y = end.y - dy * 0.3;
        }

        return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
    }

    // === SVG HELPERS ===
    function createSVGPath(className) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', className);
        return path;
    }

    // === PORT STATE MANAGEMENT ===
    function markPortConnected(moduleId, portType) {
        const moduleEl = document.getElementById(moduleId);
        if (!moduleEl) return;

        const portEl = moduleEl.querySelector(`[data-port="${portType}"]`);
        if (portEl) portEl.classList.add('connected');
    }

    function updatePortState(moduleId, portType) {
        const moduleEl = document.getElementById(moduleId);
        if (!moduleEl) return;

        const module = DimensionsData.getPlacedModule(moduleId);
        if (!module) return;

        const portEl = moduleEl.querySelector(`[data-port="${portType}"]`);
        if (portEl) {
            const hasConnections = module.ports && module.ports[portType] && module.ports[portType].length > 0;
            portEl.classList.toggle('connected', hasConnections);
        }
    }

    // === PORT HOVER (called from workspace) ===
    function highlightPort(portEl) {
        if (!state.isConnecting) return;

        const moduleId = portEl.dataset.module;
        if (moduleId === state.startModule) return;

        portEl.classList.add('active');
    }

    function unhighlightPort(portEl) {
        if (!state.isConnecting) return;
        portEl.classList.remove('active');
    }

    // === VISUAL EFFECTS ===
    function createSparkEffect(portEl) {
        const rect = portEl.getBoundingClientRect();
        const container = document.createElement('div');
        container.className = 'connection-spark';
        container.style.left = `${rect.left + rect.width / 2}px`;
        container.style.top = `${rect.top + rect.height / 2}px`;

        for (let i = 0; i < 12; i++) {
            const spark = document.createElement('div');
            spark.className = 'spark-particle';
            const angle = (i / 12) * Math.PI * 2;
            const distance = 25 + Math.random() * 35;
            spark.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
            spark.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
            container.appendChild(spark);
        }

        document.body.appendChild(container);
        setTimeout(() => container.remove(), 600);
    }

    // === UPDATE STATS ===
    function updateStats() {
        if (typeof DimensionsWorkspace !== 'undefined') {
            DimensionsWorkspace.updateUI();
        }
    }

    // === EXPORT INFO ===
    function getConnectionsInfo() {
        return DimensionsData.getConnections().map(c => {
            const fromMod = DimensionsData.getPlacedModule(c.fromModule);
            const toMod = DimensionsData.getPlacedModule(c.toModule);
            return {
                from: `${fromMod?.name || 'Unknown'} (${c.fromPort})`,
                to: `${toMod?.name || 'Unknown'} (${c.toPort})`
            };
        });
    }

    // === CHECK IF CONNECTING ===
    function isConnecting() {
        return state.isConnecting;
    }

    // === PUBLIC API ===
    return {
        init,
        startConnection,
        startConnectionDrag,
        handlePortClick,
        cancelConnection,
        highlightPort,
        unhighlightPort,
        redraw,
        redrawImmediate,
        redrawConnections: redraw,
        getConnectionsInfo,
        isConnecting
    };

})();
