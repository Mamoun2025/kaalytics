/* ============================================
   TUTORIAL OVERLAY - Spotlight & Highlight Effects
   ============================================ */

const TutorialOverlay = (function() {
    'use strict';

    let spotlightEl = null;
    let highlightEl = null;
    let pulseEl = null;

    // Create the spotlight overlay (darkens everything except target)
    function createSpotlight() {
        if (spotlightEl) return spotlightEl;

        spotlightEl = document.createElement('div');
        spotlightEl.className = 'tuto-spotlight-overlay';
        spotlightEl.innerHTML = `
            <svg class="tuto-spotlight-svg" width="100%" height="100%">
                <defs>
                    <mask id="tuto-spotlight-mask">
                        <rect width="100%" height="100%" fill="white"/>
                        <rect class="tuto-spotlight-hole" fill="black" rx="8" ry="8"/>
                    </mask>
                </defs>
                <rect class="tuto-spotlight-bg" width="100%" height="100%" mask="url(#tuto-spotlight-mask)"/>
            </svg>
        `;
        document.body.appendChild(spotlightEl);

        return spotlightEl;
    }

    // Create the highlight border element
    function createHighlight() {
        if (highlightEl) return highlightEl;

        highlightEl = document.createElement('div');
        highlightEl.className = 'tuto-highlight';
        document.body.appendChild(highlightEl);

        return highlightEl;
    }

    // Create pulse ring effect
    function createPulse() {
        if (pulseEl) return pulseEl;

        pulseEl = document.createElement('div');
        pulseEl.className = 'tuto-pulse-ring';
        document.body.appendChild(pulseEl);

        return pulseEl;
    }

    // Show spotlight on a specific element
    function showSpotlight(selector, options = {}) {
        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!el) {
            hideSpotlight();
            return null;
        }

        createSpotlight();

        const rect = el.getBoundingClientRect();
        const pad = options.padding || 10;
        const hole = spotlightEl.querySelector('.tuto-spotlight-hole');

        if (hole) {
            hole.setAttribute('x', rect.left - pad);
            hole.setAttribute('y', rect.top - pad);
            hole.setAttribute('width', rect.width + pad * 2);
            hole.setAttribute('height', rect.height + pad * 2);
        }

        spotlightEl.classList.add('visible');

        return rect;
    }

    // Hide spotlight
    function hideSpotlight() {
        spotlightEl?.classList.remove('visible');
    }

    // Show highlight border around element
    function showHighlight(selector, options = {}) {
        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!el) {
            hideHighlight();
            return null;
        }

        createHighlight();

        const rect = el.getBoundingClientRect();
        const pad = options.padding || 6;

        Object.assign(highlightEl.style, {
            left: (rect.left - pad) + 'px',
            top: (rect.top - pad) + 'px',
            width: (rect.width + pad * 2) + 'px',
            height: (rect.height + pad * 2) + 'px'
        });

        highlightEl.classList.add('visible');

        // Add pulse effect if requested
        if (options.pulse !== false) {
            showPulse(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }

        return rect;
    }

    // Hide highlight
    function hideHighlight() {
        highlightEl?.classList.remove('visible');
        hidePulse();
    }

    // Show pulse effect at coordinates
    function showPulse(x, y) {
        createPulse();

        Object.assign(pulseEl.style, {
            left: x + 'px',
            top: y + 'px'
        });

        pulseEl.classList.add('visible');
    }

    // Hide pulse
    function hidePulse() {
        pulseEl?.classList.remove('visible');
    }

    // Show both spotlight and highlight
    function show(selector, options = {}) {
        showSpotlight(selector, options);
        return showHighlight(selector, options);
    }

    // Hide all overlays
    function hideAll() {
        hideSpotlight();
        hideHighlight();
        hidePulse();
    }

    // Update position (for resize)
    function updatePosition(selector, options = {}) {
        if (!highlightEl?.classList.contains('visible')) return;

        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!el) {
            hideAll();
            return;
        }

        const rect = el.getBoundingClientRect();
        const pad = options.padding || 6;

        // Update highlight
        Object.assign(highlightEl.style, {
            left: (rect.left - pad) + 'px',
            top: (rect.top - pad) + 'px',
            width: (rect.width + pad * 2) + 'px',
            height: (rect.height + pad * 2) + 'px'
        });

        // Update spotlight
        if (spotlightEl?.classList.contains('visible')) {
            const spotPad = options.spotlightPadding || 10;
            const hole = spotlightEl.querySelector('.tuto-spotlight-hole');
            if (hole) {
                hole.setAttribute('x', rect.left - spotPad);
                hole.setAttribute('y', rect.top - spotPad);
                hole.setAttribute('width', rect.width + spotPad * 2);
                hole.setAttribute('height', rect.height + spotPad * 2);
            }
        }

        // Update pulse
        if (pulseEl?.classList.contains('visible')) {
            Object.assign(pulseEl.style, {
                left: (rect.left + rect.width / 2) + 'px',
                top: (rect.top + rect.height / 2) + 'px'
            });
        }
    }

    // Animate attention to element (without blocking)
    function drawAttention(selector) {
        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!el) return;

        el.classList.add('tuto-attention');
        setTimeout(() => el.classList.remove('tuto-attention'), 2000);
    }

    // Create pointer/arrow element
    function createPointer(direction = 'down') {
        const pointer = document.createElement('div');
        pointer.className = `tuto-pointer tuto-pointer-${direction}`;
        pointer.innerHTML = direction === 'down' ? '👇' :
                           direction === 'up' ? '👆' :
                           direction === 'left' ? '👈' : '👉';
        document.body.appendChild(pointer);
        return pointer;
    }

    // Show arrow pointing at element
    function showPointer(selector, direction = 'down', offset = 40) {
        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!el) return null;

        // Remove existing pointers
        document.querySelectorAll('.tuto-pointer').forEach(p => p.remove());

        const rect = el.getBoundingClientRect();
        const pointer = createPointer(direction);

        let x, y;
        switch (direction) {
            case 'down':
                x = rect.left + rect.width / 2;
                y = rect.top - offset;
                break;
            case 'up':
                x = rect.left + rect.width / 2;
                y = rect.bottom + offset;
                break;
            case 'left':
                x = rect.right + offset;
                y = rect.top + rect.height / 2;
                break;
            case 'right':
                x = rect.left - offset;
                y = rect.top + rect.height / 2;
                break;
        }

        Object.assign(pointer.style, {
            left: x + 'px',
            top: y + 'px'
        });

        requestAnimationFrame(() => pointer.classList.add('visible'));

        return pointer;
    }

    // Hide all pointers
    function hidePointers() {
        document.querySelectorAll('.tuto-pointer').forEach(p => {
            p.classList.remove('visible');
            setTimeout(() => p.remove(), 300);
        });
    }

    // Cleanup all overlay elements
    function destroy() {
        spotlightEl?.remove();
        highlightEl?.remove();
        pulseEl?.remove();
        document.querySelectorAll('.tuto-pointer').forEach(p => p.remove());

        spotlightEl = null;
        highlightEl = null;
        pulseEl = null;
    }

    return {
        showSpotlight,
        hideSpotlight,
        showHighlight,
        hideHighlight,
        showPulse,
        hidePulse,
        show,
        hideAll,
        updatePosition,
        drawAttention,
        showPointer,
        hidePointers,
        destroy
    };

})();

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TutorialOverlay;
}
