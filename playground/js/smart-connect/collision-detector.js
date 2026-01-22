/* ============================================
   SMART CONNECT - Collision Detector
   Detects if connections cross each other or modules
   ============================================ */

const CollisionDetector = (function() {
    'use strict';

    const MODULE_WIDTH = 200;
    const MODULE_HEIGHT = 80;
    const PADDING = 10; // Safety margin around modules

    // === CHECK IF NEW CONNECTION WOULD CAUSE COLLISION ===
    function wouldCollide(fromModule, toModule, fromPort, toPort, existingConnections, allModules) {
        const line = getConnectionLine(fromModule, toModule, fromPort, toPort);

        // Check crossing with existing connections
        for (const conn of existingConnections) {
            const otherFrom = allModules.find(m => m.id === conn.fromModule);
            const otherTo = allModules.find(m => m.id === conn.toModule);
            if (!otherFrom || !otherTo) continue;

            const otherLine = getConnectionLine(otherFrom, otherTo, conn.fromPort, conn.toPort);

            if (linesIntersect(line.start, line.end, otherLine.start, otherLine.end)) {
                return { collision: true, type: 'connection-cross', with: conn };
            }
        }

        // Check if line passes through any module (except source and target)
        for (const mod of allModules) {
            if (mod.id === fromModule.id || mod.id === toModule.id) continue;

            if (lineIntersectsModule(line.start, line.end, mod)) {
                return { collision: true, type: 'module-cross', with: mod };
            }
        }

        return { collision: false };
    }

    // === GET CONNECTION LINE ENDPOINTS ===
    function getConnectionLine(fromModule, toModule, fromPort, toPort) {
        return {
            start: getPortPosition(fromModule, fromPort),
            end: getPortPosition(toModule, toPort)
        };
    }

    // === GET PORT POSITION ===
    function getPortPosition(module, port) {
        const x = module.x || 0;
        const y = module.y || 0;
        const w = MODULE_WIDTH;
        const h = MODULE_HEIGHT;

        switch (port) {
            case 'top':    return { x: x + w/2, y: y };
            case 'bottom': return { x: x + w/2, y: y + h };
            case 'left':   return { x: x, y: y + h/2 };
            case 'right':  return { x: x + w, y: y + h/2 };
            default:       return { x: x + w/2, y: y + h/2 };
        }
    }

    // === CHECK IF TWO LINES INTERSECT ===
    function linesIntersect(p1, p2, p3, p4) {
        const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
        if (Math.abs(denom) < 0.001) return false;

        const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
        const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom;

        // Exclude endpoints (t and u between 0.05 and 0.95)
        return t > 0.05 && t < 0.95 && u > 0.05 && u < 0.95;
    }

    // === CHECK IF LINE INTERSECTS MODULE ===
    function lineIntersectsModule(p1, p2, module) {
        const rect = {
            x: module.x - PADDING,
            y: module.y - PADDING,
            w: MODULE_WIDTH + PADDING * 2,
            h: MODULE_HEIGHT + PADDING * 2
        };

        // Check intersection with all 4 sides of the rectangle
        const sides = [
            { a: { x: rect.x, y: rect.y }, b: { x: rect.x + rect.w, y: rect.y } },                    // top
            { a: { x: rect.x + rect.w, y: rect.y }, b: { x: rect.x + rect.w, y: rect.y + rect.h } }, // right
            { a: { x: rect.x + rect.w, y: rect.y + rect.h }, b: { x: rect.x, y: rect.y + rect.h } }, // bottom
            { a: { x: rect.x, y: rect.y + rect.h }, b: { x: rect.x, y: rect.y } }                    // left
        ];

        for (const side of sides) {
            if (linesIntersectStrict(p1, p2, side.a, side.b)) {
                return true;
            }
        }

        // Also check if line is entirely inside the module
        if (pointInRect(p1, rect) || pointInRect(p2, rect)) {
            return true;
        }

        return false;
    }

    // === STRICT LINE INTERSECTION (includes endpoints) ===
    function linesIntersectStrict(p1, p2, p3, p4) {
        const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
        if (Math.abs(denom) < 0.001) return false;

        const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
        const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom;

        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }

    // === POINT IN RECTANGLE ===
    function pointInRect(p, rect) {
        return p.x >= rect.x && p.x <= rect.x + rect.w &&
               p.y >= rect.y && p.y <= rect.y + rect.h;
    }

    // === FIND BEST PORT COMBINATION ===
    function findBestPorts(fromModule, toModule, existingConnections, allModules) {
        const ports = ['top', 'right', 'bottom', 'left'];
        let bestCombo = { from: 'right', to: 'left' };
        let bestScore = -Infinity;

        for (const fromPort of ports) {
            for (const toPort of ports) {
                // Skip same-side connections (look weird)
                if (fromPort === toPort) continue;

                const collision = wouldCollide(fromModule, toModule, fromPort, toPort, existingConnections, allModules);

                let score = 0;

                // Heavy penalty for collisions
                if (collision.collision) {
                    score -= 1000;
                }

                // Prefer natural direction based on relative position
                const dx = toModule.x - fromModule.x;
                const dy = toModule.y - fromModule.y;

                // Vertical alignment bonus
                if (Math.abs(dy) > Math.abs(dx)) {
                    if (dy > 0 && fromPort === 'bottom' && toPort === 'top') score += 50;
                    if (dy < 0 && fromPort === 'top' && toPort === 'bottom') score += 50;
                } else {
                    if (dx > 0 && fromPort === 'right' && toPort === 'left') score += 50;
                    if (dx < 0 && fromPort === 'left' && toPort === 'right') score += 50;
                }

                // Shorter connection bonus
                const line = getConnectionLine(fromModule, toModule, fromPort, toPort);
                const dist = Math.hypot(line.end.x - line.start.x, line.end.y - line.start.y);
                score -= dist / 10;

                if (score > bestScore) {
                    bestScore = score;
                    bestCombo = { from: fromPort, to: toPort };
                }
            }
        }

        return bestCombo;
    }

    // === COUNT TOTAL CROSSINGS ===
    function countCrossings(connections, modules) {
        let count = 0;

        for (let i = 0; i < connections.length; i++) {
            for (let j = i + 1; j < connections.length; j++) {
                const c1 = connections[i];
                const c2 = connections[j];

                const m1From = modules.find(m => m.id === c1.fromModule);
                const m1To = modules.find(m => m.id === c1.toModule);
                const m2From = modules.find(m => m.id === c2.fromModule);
                const m2To = modules.find(m => m.id === c2.toModule);

                if (!m1From || !m1To || !m2From || !m2To) continue;

                const line1 = getConnectionLine(m1From, m1To, c1.fromPort, c1.toPort);
                const line2 = getConnectionLine(m2From, m2To, c2.fromPort, c2.toPort);

                if (linesIntersect(line1.start, line1.end, line2.start, line2.end)) {
                    count++;
                }
            }
        }

        return count;
    }

    return {
        wouldCollide,
        findBestPorts,
        countCrossings,
        getPortPosition,
        lineIntersectsModule
    };

})();
