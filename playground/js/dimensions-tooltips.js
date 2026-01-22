/* ============================================
   DIMENSIONS TOOLTIPS v1.1
   Tooltips enrichis au survol modules/connexions
   Uses SemanticLoader for content access
   ============================================ */

const DimensionsTooltips = (function() {
    'use strict';

    // === STATE ===
    let tooltipElement = null;
    let currentTarget = null;
    let hideTimeout = null;
    let showTimeout = null;

    // === INIT ===
    async function init() {
        createTooltipElement();
        bindEvents();
        console.log('[Tooltips] Initialized with SemanticLoader');
    }

    // === CREATE TOOLTIP ELEMENT ===
    function createTooltipElement() {
        tooltipElement = document.createElement('div');
        tooltipElement.className = 'rich-tooltip';
        tooltipElement.innerHTML = `
            <div class="rich-tooltip-header">
                <span class="rich-tooltip-icon"></span>
                <span class="rich-tooltip-title"></span>
            </div>
            <div class="rich-tooltip-tagline"></div>
            <div class="rich-tooltip-description"></div>
            <div class="rich-tooltip-impacts"></div>
            <div class="rich-tooltip-hint"></div>
        `;
        document.body.appendChild(tooltipElement);
    }

    // === BIND EVENTS ===
    function bindEvents() {
        const workspace = document.getElementById('workspace');
        if (!workspace) return;

        // Module hover
        workspace.addEventListener('mouseover', handleMouseOver);
        workspace.addEventListener('mouseout', handleMouseOut);

        // Hide on scroll/zoom
        workspace.addEventListener('wheel', hideTooltip);

        // Hide immediately on any mousedown (ergonomic improvement)
        workspace.addEventListener('mousedown', hideTooltip, true);

        // Hide when connection starts
        document.body.addEventListener('classChange', () => {
            if (document.body.classList.contains('connecting')) {
                hideTooltip();
            }
        });
    }

    // === MOUSE HANDLERS ===
    function handleMouseOver(e) {
        // Check with TooltipManager if tooltips should be suppressed
        if (typeof TooltipManager !== 'undefined' && !TooltipManager.canShow()) {
            return;
        }

        // Fallback checks if TooltipManager not loaded
        if (typeof TooltipStateDetector !== 'undefined' && TooltipStateDetector.isBlocked()) {
            return;
        }

        // Check for placed module
        const placedModule = e.target.closest('.placed-module');
        if (placedModule && !placedModule.classList.contains('dragging')) {
            const moduleId = placedModule.dataset.moduleId || placedModule.id;
            if (moduleId) {
                scheduleShow(placedModule, 'module', moduleId);
            }
            return;
        }

        // Check for connection line (SVG group)
        const connectionGroup = e.target.closest('.connection-group');
        if (connectionGroup) {
            const connectionId = connectionGroup.getAttribute('data-connection-group');
            if (connectionId) {
                scheduleShow(connectionGroup, 'connection', connectionId);
            }
            return;
        }
    }

    function handleMouseOut(e) {
        const placedModule = e.target.closest('.placed-module');
        const connectionGroup = e.target.closest('.connection-group');

        if (!placedModule && !connectionGroup) {
            scheduleHide();
        }
    }

    // === SCHEDULE SHOW/HIDE ===
    function scheduleShow(target, type, id) {
        clearTimeout(hideTimeout);
        clearTimeout(showTimeout);

        showTimeout = setTimeout(() => {
            // Re-check state before showing
            if (typeof TooltipManager !== 'undefined' && !TooltipManager.canShow()) {
                return;
            }
            if (typeof TooltipStateDetector !== 'undefined' && TooltipStateDetector.isBlocked()) {
                return;
            }
            showTooltip(target, type, id);
        }, 400);
    }

    function scheduleHide() {
        clearTimeout(showTimeout);
        hideTimeout = setTimeout(() => {
            hideTooltip();
        }, 200);
    }

    // === SHOW TOOLTIP ===
    function showTooltip(target, type, id) {
        if (!SemanticLoader.isLoaded()) return;

        currentTarget = target;

        if (type === 'module') {
            showModuleTooltip(target, id);
        } else if (type === 'connection') {
            showConnectionTooltip(target, id);
        }
    }

    // === SHOW MODULE TOOLTIP ===
    function showModuleTooltip(target, moduleId) {
        // Get placed module info
        const placedModule = DimensionsData.getPlacedModules().find(m => m.id === moduleId);
        if (!placedModule) return;

        const templateId = placedModule.templateId;
        const richData = SemanticLoader.getModule(templateId);
        const dimension = placedModule.dimension;

        // Header
        const iconEl = tooltipElement.querySelector('.rich-tooltip-icon');
        const titleEl = tooltipElement.querySelector('.rich-tooltip-title');
        iconEl.textContent = dimension?.emoji || '';
        titleEl.textContent = richData?.name || placedModule.name;

        // Tagline
        const taglineEl = tooltipElement.querySelector('.rich-tooltip-tagline');
        taglineEl.textContent = richData?.tagline || '';
        taglineEl.style.display = richData?.tagline ? 'block' : 'none';

        // Description
        const descEl = tooltipElement.querySelector('.rich-tooltip-description');
        const desc = richData?.description_short || placedModule.description || '';
        descEl.textContent = desc;
        descEl.style.display = desc ? 'block' : 'none';

        // Impacts
        const impactsEl = tooltipElement.querySelector('.rich-tooltip-impacts');
        if (richData?.transformation_story?.business_impact) {
            const impact = richData.transformation_story.business_impact.split('.')[0];
            impactsEl.innerHTML = `<span class="impact-icon">📊</span> ${impact}`;
            impactsEl.style.display = 'block';
        } else {
            impactsEl.style.display = 'none';
        }

        // Hint
        const hintEl = tooltipElement.querySelector('.rich-tooltip-hint');
        hintEl.textContent = 'Glissez vers un autre module pour créer une synergie';
        hintEl.style.display = 'block';

        // Position and show
        positionTooltip(target);
        tooltipElement.classList.add('visible', 'tooltip-module');
        tooltipElement.classList.remove('tooltip-connection');
    }

    // === SHOW CONNECTION TOOLTIP ===
    function showConnectionTooltip(target, connectionId) {
        const connection = DimensionsData.getConnections().find(c => c.id === connectionId);
        if (!connection) return;

        const fromModule = DimensionsData.getPlacedModules().find(m => m.id === connection.fromModule);
        const toModule = DimensionsData.getPlacedModules().find(m => m.id === connection.toModule);
        if (!fromModule || !toModule) return;

        // Find synergy data
        const synergy = SemanticLoader.getSynergy(fromModule.templateId, toModule.templateId);

        // Header
        const iconEl = tooltipElement.querySelector('.rich-tooltip-icon');
        const titleEl = tooltipElement.querySelector('.rich-tooltip-title');
        iconEl.textContent = '🔗';
        titleEl.textContent = synergy?.name || `${fromModule.name} ↔ ${toModule.name}`;

        // Tagline
        const taglineEl = tooltipElement.querySelector('.rich-tooltip-tagline');
        taglineEl.textContent = synergy?.tagline || '';
        taglineEl.style.display = synergy?.tagline ? 'block' : 'none';

        // Description
        const descEl = tooltipElement.querySelector('.rich-tooltip-description');
        if (synergy?.story_paragraph) {
            const firstSentence = synergy.story_paragraph.split('.')[0] + '.';
            descEl.textContent = firstSentence;
            descEl.style.display = 'block';
        } else {
            descEl.textContent = 'Synergie entre ces deux modules';
            descEl.style.display = 'block';
        }

        // Impacts
        const impactsEl = tooltipElement.querySelector('.rich-tooltip-impacts');
        if (synergy?.impact_narrative) {
            const impact = synergy.impact_narrative.split('.')[0];
            impactsEl.innerHTML = `<span class="impact-icon">📈</span> ${impact}`;
            impactsEl.style.display = 'block';
        } else {
            impactsEl.style.display = 'none';
        }

        // Hint
        const hintEl = tooltipElement.querySelector('.rich-tooltip-hint');
        const isCrossDim = fromModule.dimension?.id !== toModule.dimension?.id;
        hintEl.textContent = isCrossDim
            ? '✨ Synergie cross-dimension'
            : 'Cliquez pour plus de détails';
        hintEl.style.display = 'block';

        // Position and show
        positionTooltip(target);
        tooltipElement.classList.add('visible', 'tooltip-connection');
        tooltipElement.classList.remove('tooltip-module');
    }

    // === POSITION TOOLTIP ===
    function positionTooltip(target) {
        const rect = target.getBoundingClientRect();
        const tooltipRect = tooltipElement.getBoundingClientRect();

        let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        let top = rect.top - tooltipRect.height - 12;

        // Keep within viewport
        const padding = 10;
        if (left < padding) left = padding;
        if (left + tooltipRect.width > window.innerWidth - padding) {
            left = window.innerWidth - tooltipRect.width - padding;
        }

        // If no room above, show below
        if (top < padding) {
            top = rect.bottom + 12;
            tooltipElement.classList.add('below');
        } else {
            tooltipElement.classList.remove('below');
        }

        tooltipElement.style.left = `${left}px`;
        tooltipElement.style.top = `${top}px`;
    }

    // === HIDE TOOLTIP ===
    function hideTooltip() {
        clearTimeout(showTimeout);
        tooltipElement.classList.remove('visible');
        currentTarget = null;
    }

    // === PUBLIC API ===
    return {
        init,
        hideTooltip
    };

})();

// Auto-initialize after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Delay to ensure SemanticLoader is ready
    setTimeout(() => {
        DimensionsTooltips.init();
    }, 500);
});
