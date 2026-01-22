/* ============================================
   SMART CONNECT - UI Components
   Toasts, Progress, Preview Panel, Undo Button
   ============================================ */

const SmartConnectUI = (function() {
    'use strict';

    // === STATE ===
    let buttonEl = null;
    let progressEl = null;
    let toastEl = null;
    let undoButtonEl = null;
    let previewPanelEl = null;
    let previewOverlayEl = null;

    // === CREATE MAIN BUTTON ===
    function createButton() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return null;

        buttonEl = document.createElement('button');
        buttonEl.id = 'smartConnectBtn';
        buttonEl.className = 'btn btn-smart-connect';
        buttonEl.innerHTML = `
            <span class="smart-connect-icon">🧠</span>
            <span class="smart-connect-text">Optimiser</span>
            <div class="smart-connect-spinner"></div>
        `;

        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            headerActions.insertBefore(buttonEl, clearBtn);
        } else {
            headerActions.appendChild(buttonEl);
        }

        return buttonEl;
    }

    // === BUTTON STATE ===
    function setButtonProcessing(processing) {
        if (!buttonEl) return;

        if (processing) {
            buttonEl.classList.add('processing');
        } else {
            buttonEl.classList.remove('processing');
        }
    }

    // === PROGRESS BAR ===
    function createProgress() {
        if (progressEl) return progressEl;

        progressEl = document.createElement('div');
        progressEl.className = 'sc-progress';
        progressEl.innerHTML = '<div class="sc-progress-bar"></div>';
        document.body.appendChild(progressEl);

        return progressEl;
    }

    function showProgress() {
        createProgress();
        progressEl.classList.add('visible');
        setProgress(0);
    }

    function hideProgress() {
        if (progressEl) {
            progressEl.classList.remove('visible');
        }
    }

    function setProgress(percent) {
        if (!progressEl) return;
        const bar = progressEl.querySelector('.sc-progress-bar');
        if (bar) {
            bar.style.width = percent + '%';
        }
    }

    // === TOAST NOTIFICATIONS ===
    function showToast(message, options = {}) {
        const {
            icon = '✨',
            type = 'default',   // default, success, warning, error
            duration = 4000,
            showUndo = false,
            onUndo = null
        } = options;

        // Remove existing toast
        hideToast();

        toastEl = document.createElement('div');
        toastEl.className = `sc-toast ${type}`;
        toastEl.innerHTML = `
            <span class="sc-toast-icon">${icon}</span>
            <span class="sc-toast-message">${message}</span>
            ${showUndo ? '<button class="sc-toast-undo">Annuler</button>' : ''}
        `;
        document.body.appendChild(toastEl);

        // Undo handler
        if (showUndo && onUndo) {
            toastEl.querySelector('.sc-toast-undo')?.addEventListener('click', () => {
                onUndo();
                hideToast();
            });
        }

        // Animate in
        requestAnimationFrame(() => {
            toastEl.classList.add('visible');
        });

        // Auto hide
        if (duration > 0) {
            setTimeout(() => hideToast(), duration);
        }

        return toastEl;
    }

    function hideToast() {
        if (!toastEl) return;

        toastEl.classList.remove('visible');
        toastEl.classList.add('hiding');

        setTimeout(() => {
            toastEl?.remove();
            toastEl = null;
        }, 300);
    }

    // === UNDO BUTTON ===
    function showUndoButton(onUndo, timeout = 15) {
        hideUndoButton();

        undoButtonEl = document.createElement('button');
        undoButtonEl.className = 'sc-undo-btn';
        undoButtonEl.innerHTML = `
            <span class="sc-undo-icon">↩️</span>
            <span>Annuler</span>
            <span class="sc-undo-timer">${timeout}</span>
        `;
        document.body.appendChild(undoButtonEl);

        // Animate in
        requestAnimationFrame(() => {
            undoButtonEl.classList.add('visible');
        });

        // Click handler
        undoButtonEl.addEventListener('click', () => {
            onUndo?.();
            hideUndoButton();
        });

        // Start countdown
        let remaining = timeout;
        const timer = setInterval(() => {
            remaining--;
            const timerEl = undoButtonEl?.querySelector('.sc-undo-timer');
            if (timerEl) {
                timerEl.textContent = remaining;
            }

            if (remaining <= 0) {
                clearInterval(timer);
                hideUndoButton();
            }
        }, 1000);

        return undoButtonEl;
    }

    function hideUndoButton() {
        if (!undoButtonEl) return;

        undoButtonEl.classList.remove('visible');
        setTimeout(() => {
            undoButtonEl?.remove();
            undoButtonEl = null;
        }, 300);
    }

    // === PREVIEW PANEL ===
    function showPreview(stats, onApply, onCancel) {
        hidePreview();

        // Create overlay
        previewOverlayEl = document.createElement('div');
        previewOverlayEl.className = 'sc-preview-overlay';
        document.body.appendChild(previewOverlayEl);

        // Create panel
        previewPanelEl = document.createElement('div');
        previewPanelEl.className = 'sc-preview-panel';
        previewPanelEl.innerHTML = `
            <div class="sc-preview-header">
                <div class="sc-preview-title">
                    <span class="sc-preview-title-icon">🔮</span>
                    <span>Aperçu de l'optimisation</span>
                </div>
                <button class="sc-preview-close">✕</button>
            </div>
            <div class="sc-preview-stats">
                <div class="sc-preview-stat ${stats.movedModules > 0 ? 'improved' : ''}">
                    <span class="sc-preview-stat-icon">📦</span>
                    <span class="sc-preview-stat-value">${stats.movedModules}</span>
                    <span class="sc-preview-stat-label">modules repositionnés</span>
                </div>
                <div class="sc-preview-stat ${stats.addedConnections > 0 ? 'improved' : ''}">
                    <span class="sc-preview-stat-icon">🔗</span>
                    <span class="sc-preview-stat-value">+${stats.addedConnections}</span>
                    <span class="sc-preview-stat-label">nouvelles connexions</span>
                </div>
                <div class="sc-preview-stat ${stats.crossingsReduced > 0 ? 'improved' : stats.crossingsReduced < 0 ? 'worse' : ''}">
                    <span class="sc-preview-stat-icon">✂️</span>
                    <span class="sc-preview-stat-value">${stats.crossingsReduced >= 0 ? '-' : '+'}${Math.abs(stats.crossingsReduced)}</span>
                    <span class="sc-preview-stat-label">croisements</span>
                </div>
            </div>
            <div class="sc-preview-actions">
                <button class="sc-preview-btn sc-preview-btn-cancel">
                    <span>✕</span>
                    <span>Annuler</span>
                </button>
                <button class="sc-preview-btn sc-preview-btn-apply">
                    <span>✓</span>
                    <span>Appliquer</span>
                </button>
            </div>
        `;
        document.body.appendChild(previewPanelEl);

        // Event handlers
        previewPanelEl.querySelector('.sc-preview-close').addEventListener('click', () => {
            onCancel?.();
            hidePreview();
        });

        previewPanelEl.querySelector('.sc-preview-btn-cancel').addEventListener('click', () => {
            onCancel?.();
            hidePreview();
        });

        previewPanelEl.querySelector('.sc-preview-btn-apply').addEventListener('click', () => {
            onApply?.();
            hidePreview();
        });

        previewOverlayEl.addEventListener('click', () => {
            onCancel?.();
            hidePreview();
        });

        // Animate in
        requestAnimationFrame(() => {
            previewOverlayEl.classList.add('visible');
            previewPanelEl.classList.add('visible');
        });

        // Sound
        SmartConnectSounds?.previewShow?.();

        return previewPanelEl;
    }

    function hidePreview() {
        if (previewOverlayEl) {
            previewOverlayEl.classList.remove('visible');
            setTimeout(() => {
                previewOverlayEl?.remove();
                previewOverlayEl = null;
            }, 300);
        }

        if (previewPanelEl) {
            previewPanelEl.classList.remove('visible');
            setTimeout(() => {
                previewPanelEl?.remove();
                previewPanelEl = null;
            }, 400);
        }
    }

    // === MODULE HIGHLIGHTS ===
    function highlightModulesWillMove(moduleIds) {
        moduleIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('sc-will-move');
            }
        });
    }

    function clearModuleHighlights() {
        document.querySelectorAll('.sc-will-move, .sc-ghost').forEach(el => {
            el.classList.remove('sc-will-move', 'sc-ghost');
        });
        document.querySelectorAll('.sc-ghost-module').forEach(el => el.remove());
    }

    // === SHOW GHOST PREVIEW ===
    function showGhostPreview(positions) {
        clearGhostPreviews();

        positions.forEach(pos => {
            const originalEl = document.getElementById(pos.moduleId);
            if (!originalEl) return;

            // Make original semi-transparent
            originalEl.classList.add('sc-ghost');

            // Create ghost at new position
            const ghost = document.createElement('div');
            ghost.className = 'sc-ghost-module';
            ghost.style.left = pos.x + 'px';
            ghost.style.top = pos.y + 'px';
            ghost.style.width = originalEl.offsetWidth + 'px';
            ghost.style.height = originalEl.offsetHeight + 'px';

            const canvas = document.querySelector('.canvas-container');
            canvas?.appendChild(ghost);
        });
    }

    function clearGhostPreviews() {
        document.querySelectorAll('.sc-ghost').forEach(el => {
            el.classList.remove('sc-ghost');
        });
        document.querySelectorAll('.sc-ghost-module').forEach(el => el.remove());
    }

    // === GET BUTTON ===
    function getButton() {
        return buttonEl;
    }

    // === DESTROY ===
    function destroy() {
        buttonEl?.remove();
        progressEl?.remove();
        toastEl?.remove();
        undoButtonEl?.remove();
        previewPanelEl?.remove();
        previewOverlayEl?.remove();

        buttonEl = null;
        progressEl = null;
        toastEl = null;
        undoButtonEl = null;
        previewPanelEl = null;
        previewOverlayEl = null;
    }

    return {
        createButton,
        getButton,
        setButtonProcessing,
        showProgress,
        hideProgress,
        setProgress,
        showToast,
        hideToast,
        showUndoButton,
        hideUndoButton,
        showPreview,
        hidePreview,
        highlightModulesWillMove,
        clearModuleHighlights,
        showGhostPreview,
        clearGhostPreviews,
        destroy
    };

})();
