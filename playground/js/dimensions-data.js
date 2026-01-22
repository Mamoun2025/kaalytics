/* ============================================
   DIMENSIONS DATA - State Management
   ============================================ */

const DimensionsData = (function() {
    'use strict';

    // Dimensions data (loaded from JSON or inline)
    let dimensions = [];

    // Application state
    const state = {
        placedModules: [],
        connections: [],
        selectedModule: null,
        moduleIdCounter: 0,
        isConnecting: false,
        connectionStart: null
    };

    // Event subscribers
    const subscribers = {
        moduleAdded: [],
        moduleRemoved: [],
        moduleMoved: [],
        moduleNested: [],
        moduleUnnested: [],
        connectionAdded: [],
        connectionRemoved: [],
        selectionChanged: [],
        stateChanged: [],
        cleared: []
    };

    // Initialize with data
    async function init() {
        try {
            const response = await fetch('data/dimensions.json');
            const data = await response.json();
            dimensions = data.dimensions;
            emit('stateChanged', { type: 'init', dimensions });
            return dimensions;
        } catch (error) {
            console.error('Failed to load dimensions:', error);
            // Fallback to inline data
            dimensions = getDefaultDimensions();
            emit('stateChanged', { type: 'init', dimensions });
            return dimensions;
        }
    }

    // Get all dimensions
    function getDimensions() {
        return dimensions;
    }

    // Get dimension by id
    function getDimension(id) {
        return dimensions.find(d => d.id === id);
    }

    // Get module by id from dimensions
    function getModuleTemplate(moduleId) {
        for (const dim of dimensions) {
            const module = dim.modules.find(m => m.id === moduleId);
            if (module) {
                return { ...module, dimension: dim };
            }
        }
        return null;
    }

    // Add placed module
    function addPlacedModule(moduleId, x, y) {
        const template = getModuleTemplate(moduleId);
        if (!template) return null;

        const placed = {
            id: `placed-${state.moduleIdCounter++}`,
            templateId: moduleId,
            name: template.name,
            desc: template.desc,
            dimension: {
                id: template.dimension.id,
                title: template.dimension.title,
                emoji: template.dimension.emoji,
                color: template.dimension.color
            },
            x,
            y,
            ports: {
                top: [],
                bottom: [],
                left: [],
                right: []
            }
        };

        state.placedModules.push(placed);

        emit('moduleAdded', placed);
        emit('stateChanged', { type: 'moduleAdded', module: placed });
        return placed;
    }

    // Remove placed module
    function removePlacedModule(id) {
        const index = state.placedModules.findIndex(m => m.id === id);
        if (index === -1) return false;

        const module = state.placedModules[index];

        // Remove all connections involving this module
        const connectionsToRemove = state.connections.filter(
            c => c.fromModule === id || c.toModule === id
        );
        connectionsToRemove.forEach(c => removeConnection(c.id));

        state.placedModules.splice(index, 1);

        if (state.selectedModule === id) {
            state.selectedModule = null;
            emit('selectionChanged', null);
        }

        emit('moduleRemoved', module);
        emit('stateChanged', { type: 'moduleRemoved', module });
        return true;
    }

    // Update module position
    function updateModulePosition(id, x, y) {
        const module = state.placedModules.find(m => m.id === id);
        if (!module) return false;

        module.x = x;
        module.y = y;
        emit('moduleMoved', module);
        return true;
    }

    // Get placed module
    function getPlacedModule(id) {
        return state.placedModules.find(m => m.id === id);
    }

    // Get all placed modules
    function getPlacedModules() {
        return [...state.placedModules];
    }

    // Select module
    function selectModule(id) {
        state.selectedModule = id;
        emit('selectionChanged', id);
    }

    // Get selected module
    function getSelectedModule() {
        return state.selectedModule;
    }

    // Add connection
    function addConnection(fromModule, fromPort, toModule, toPort) {
        // Check if ANY connection between these two modules already exists
        // (prevents connecting same modules twice via different ports)
        const exists = state.connections.some(c =>
            (c.fromModule === fromModule && c.toModule === toModule) ||
            (c.fromModule === toModule && c.toModule === fromModule)
        );

        if (exists) {
            console.log(`[Data] Connection between ${fromModule} and ${toModule} already exists`);
            return null;
        }

        const connection = {
            id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fromModule,
            fromPort,
            toModule,
            toPort
        };

        state.connections.push(connection);

        // Update port connections on modules
        const fromMod = getPlacedModule(fromModule);
        const toMod = getPlacedModule(toModule);
        if (fromMod) fromMod.ports[fromPort].push(connection.id);
        if (toMod) toMod.ports[toPort].push(connection.id);

        emit('connectionAdded', connection);
        emit('stateChanged', { type: 'connectionAdded', connection });
        return connection;
    }

    // Remove connection
    function removeConnection(id) {
        const index = state.connections.findIndex(c => c.id === id);
        if (index === -1) return false;

        const connection = state.connections[index];

        // Remove from module ports
        const fromMod = getPlacedModule(connection.fromModule);
        const toMod = getPlacedModule(connection.toModule);

        if (fromMod) {
            const portIndex = fromMod.ports[connection.fromPort].indexOf(id);
            if (portIndex > -1) fromMod.ports[connection.fromPort].splice(portIndex, 1);
        }
        if (toMod) {
            const portIndex = toMod.ports[connection.toPort].indexOf(id);
            if (portIndex > -1) toMod.ports[connection.toPort].splice(portIndex, 1);
        }

        state.connections.splice(index, 1);
        emit('connectionRemoved', connection);
        emit('stateChanged', { type: 'connectionRemoved', connection });
        return true;
    }

    // Get all connections
    function getConnections() {
        return [...state.connections];
    }

    // Get connections for a module
    function getModuleConnections(moduleId) {
        return state.connections.filter(
            c => c.fromModule === moduleId || c.toModule === moduleId
        );
    }

    // Clear all
    function clearAll() {
        state.placedModules = [];
        state.connections = [];
        state.selectedModule = null;
        state.moduleIdCounter = 0;
        emit('cleared');
        emit('stateChanged', { type: 'clear' });
    }

    // Get stats
    function getStats() {
        return {
            moduleCount: state.placedModules.length,
            connectionCount: state.connections.length,
            dimensionsUsed: [...new Set(state.placedModules.map(m => m.dimension.id))].length
        };
    }

    // Export configuration
    function exportConfig() {
        return {
            modules: state.placedModules.map(m => ({
                templateId: m.templateId,
                x: m.x,
                y: m.y
            })),
            connections: state.connections.map(c => ({
                fromModule: c.fromModule,
                fromPort: c.fromPort,
                toModule: c.toModule,
                toPort: c.toPort
            }))
        };
    }

    // Event system
    function on(event, callback) {
        if (subscribers[event]) {
            subscribers[event].push(callback);
        }
    }

    function off(event, callback) {
        if (subscribers[event]) {
            const index = subscribers[event].indexOf(callback);
            if (index > -1) subscribers[event].splice(index, 1);
        }
    }

    function emit(event, data) {
        if (subscribers[event]) {
            subscribers[event].forEach(callback => callback(data));
        }
    }

    // Default dimensions (fallback)
    function getDefaultDimensions() {
        return [
            {
                id: "operations",
                title: "Operations Excellence",
                emoji: "🏗️",
                color: "#3b82f6",
                modules: [
                    { id: "ops-fleet", name: "Smart Fleet", desc: "Real-time GPS tracking" },
                    { id: "ops-planning", name: "AI Planning", desc: "Resource allocation" },
                    { id: "ops-maintenance", name: "Predictive Maintenance", desc: "Anticipate failures" },
                    { id: "ops-inventory", name: "Smart Inventory", desc: "Stock optimization" }
                ]
            },
            {
                id: "intelligence",
                title: "Business Intelligence",
                emoji: "💰",
                color: "#10b981",
                modules: [
                    { id: "intel-banking", name: "Multi-bank Connect", desc: "All banks in one view" },
                    { id: "intel-forecast", name: "ML Forecasts", desc: "Cash predictions" },
                    { id: "intel-reports", name: "Auto Reports", desc: "Self-writing reports" },
                    { id: "intel-dashboards", name: "Smart Dashboards", desc: "Real-time KPIs" }
                ]
            }
        ];
    }

    // Public API
    return {
        init,
        getDimensions,
        getDimension,
        getModuleTemplate,
        addPlacedModule,
        removePlacedModule,
        updateModulePosition,
        getPlacedModule,
        getPlacedModules,
        selectModule,
        getSelectedModule,
        addConnection,
        removeConnection,
        getConnections,
        getModuleConnections,
        clearAll,
        getStats,
        exportConfig,
        on,
        off
    };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DimensionsData;
}
