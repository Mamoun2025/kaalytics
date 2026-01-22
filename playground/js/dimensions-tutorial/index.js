/* ============================================
   DIMENSIONS TUTORIAL - Main Controller
   Version 3.0 - Modular Architecture with Sounds
   ============================================

   Modules:
   - sounds.js     : Web Audio sound effects
   - steps.js      : Tutorial step definitions
   - ui.js         : Bubble, modals, success messages
   - overlay.js    : Spotlight, highlight, pointers
   - wait-handlers.js : User interaction listeners
   - confetti.js   : Celebration effects

   ============================================ */

const DimensionsTutorial = (function() {
    'use strict';

    // === STATE ===
    let isActive = false;
    let isInitialized = false;
    let currentStep = 0;
    let resizeHandler = null;

    // === STORAGE KEY ===
    const STORAGE_KEY = 'dimensions-tutorial-completed';

    // === INIT ===
    function init() {
        if (isInitialized) {
            console.log('[Tutorial] Already initialized');
            return;
        }
        isInitialized = true;

        console.log('[Tutorial] Initializing v3.0...');

        // Initialize sounds (prepares audio context)
        if (typeof TutorialSounds !== 'undefined') {
            TutorialSounds.init();
        }

        // Check if tutorial was already completed
        if (localStorage.getItem(STORAGE_KEY)) {
            console.log('[Tutorial] Already completed, showing restart button');
            showRestartButton();
            return;
        }

        // Auto-start with welcome modal after page loads
        if (document.readyState === 'complete') {
            setTimeout(showWelcome, 800);
        } else {
            window.addEventListener('load', () => setTimeout(showWelcome, 800));
        }
    }

    // === SHOW WELCOME MODAL ===
    function showWelcome() {
        console.log('[Tutorial] Showing welcome modal');

        // Play attention sound
        if (typeof TutorialSounds !== 'undefined') {
            TutorialSounds.welcome();
        }

        // Show welcome modal
        if (typeof TutorialUI !== 'undefined') {
            TutorialUI.showWelcomeModal(
                // On start
                () => {
                    if (typeof TutorialSounds !== 'undefined') {
                        TutorialSounds.click();
                    }
                    start();
                },
                // On skip
                () => {
                    console.log('[Tutorial] User skipped tutorial');
                    localStorage.setItem(STORAGE_KEY, 'true');
                    showRestartButton();
                }
            );
        } else {
            // Fallback: start directly
            start();
        }
    }

    // === START TUTORIAL ===
    function start() {
        if (isActive) return;
        isActive = true;
        currentStep = 0;

        console.log('[Tutorial] Starting tutorial');

        // Setup UI callbacks
        if (typeof TutorialUI !== 'undefined') {
            TutorialUI.createBubble();
            TutorialUI.setCallbacks({
                onSkip: complete,
                onPrev: prev,
                onNext: next
            });
        }

        // Setup resize handler
        resizeHandler = () => {
            if (isActive && typeof TutorialSteps !== 'undefined') {
                const step = TutorialSteps.get(currentStep);
                if (step) {
                    let target = step.target;
                    if (step.getTarget) target = step.getTarget();
                    updatePosition(target, step);
                }
            }
        };
        window.addEventListener('resize', resizeHandler);

        // Show first step
        showStep(0);
    }

    // === SHOW STEP ===
    function showStep(idx) {
        // Cleanup previous
        if (typeof TutorialWaitHandlers !== 'undefined') {
            TutorialWaitHandlers.cleanup();
        }

        if (typeof TutorialSteps === 'undefined') {
            console.error('[Tutorial] TutorialSteps not loaded');
            return;
        }

        const steps = TutorialSteps.getAll();

        // Skip steps with missing targets
        while (idx < steps.length) {
            const step = steps[idx];
            if (step.skipIfMissing) {
                let target = step.target;
                if (step.getTarget) target = step.getTarget();
                const el = target ? document.querySelector(target) : null;
                if (!el) {
                    console.log('[Tutorial] Skipping step', idx, step.id, '- target not found');
                    idx++;
                    continue;
                }
            }
            break;
        }

        if (idx >= steps.length) {
            complete();
            return;
        }

        currentStep = idx;
        const step = steps[idx];

        console.log('[Tutorial] Showing step', idx, step.id);

        // Get dynamic target if needed
        let target = step.target;
        if (step.getTarget) {
            target = step.getTarget();
        }

        // Play sound for this step
        playStepSound(step);

        // Update UI
        if (typeof TutorialUI !== 'undefined') {
            TutorialUI.updateBubble(step, idx, steps.length);
            TutorialUI.positionBubble(target, step.position);
            TutorialUI.show();
        }

        // Show highlight/overlay
        const highlightTarget = step.highlightTarget || target;
        if (highlightTarget && typeof TutorialOverlay !== 'undefined') {
            TutorialOverlay.showHighlight(highlightTarget, { pulse: true });

            // Play highlight sound
            if (typeof TutorialSounds !== 'undefined') {
                setTimeout(() => TutorialSounds.highlight(), 200);
            }
        } else if (typeof TutorialOverlay !== 'undefined') {
            TutorialOverlay.hideAll();
        }

        // Setup wait handlers if needed
        if (step.waitFor && typeof TutorialWaitHandlers !== 'undefined') {
            TutorialWaitHandlers.setup(step.waitFor, target, next);
        }
    }

    // === PLAY STEP SOUND ===
    function playStepSound(step) {
        if (typeof TutorialSounds === 'undefined') return;

        const soundName = step.sound || 'stepAppear';
        const soundFn = TutorialSounds[soundName];

        if (typeof soundFn === 'function') {
            soundFn();
        } else {
            TutorialSounds.stepAppear();
        }
    }

    // === UPDATE POSITION (for resize) ===
    function updatePosition(target, step) {
        if (typeof TutorialUI !== 'undefined') {
            TutorialUI.positionBubble(target, step.position);
        }

        const highlightTarget = step.highlightTarget || target;
        if (highlightTarget && typeof TutorialOverlay !== 'undefined') {
            TutorialOverlay.updatePosition(highlightTarget);
        }
    }

    // === NAVIGATION ===
    function next() {
        if (typeof TutorialSounds !== 'undefined') {
            TutorialSounds.navigate();
        }
        showStep(currentStep + 1);
    }

    function prev() {
        if (currentStep > 0) {
            if (typeof TutorialSounds !== 'undefined') {
                TutorialSounds.navigate();
            }
            showStep(currentStep - 1);
        }
    }

    // === COMPLETE ===
    function complete() {
        console.log('[Tutorial] Completing tutorial');
        isActive = false;

        // Cleanup
        if (typeof TutorialWaitHandlers !== 'undefined') {
            TutorialWaitHandlers.cleanup();
        }

        // Remove resize handler
        if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler);
            resizeHandler = null;
        }

        // Save completion
        localStorage.setItem(STORAGE_KEY, 'true');

        // Hide UI elements
        if (typeof TutorialUI !== 'undefined') {
            TutorialUI.hide();
            setTimeout(() => TutorialUI.destroy(), 300);
        }

        if (typeof TutorialOverlay !== 'undefined') {
            TutorialOverlay.hideAll();
            setTimeout(() => TutorialOverlay.destroy(), 300);
        }

        // Show celebration!
        if (typeof TutorialConfetti !== 'undefined') {
            TutorialConfetti.celebrate();
        }

        if (typeof TutorialUI !== 'undefined') {
            TutorialUI.showSuccess('Tutoriel terminé !');
        }

        // Add restart button
        setTimeout(showRestartButton, 1000);
    }

    // === RESTART BUTTON ===
    function showRestartButton() {
        if (typeof TutorialUI !== 'undefined') {
            TutorialUI.addRestartButton(restart);
        } else {
            // Fallback: create simple button
            if (document.querySelector('.tuto-restart')) return;

            const btn = document.createElement('button');
            btn.className = 'tuto-restart visible';
            btn.innerHTML = '?';
            btn.title = 'Revoir le guide interactif';
            btn.onclick = () => {
                btn.remove();
                restart();
            };
            document.body.appendChild(btn);
        }
    }

    // === RESTART ===
    function restart() {
        console.log('[Tutorial] Restarting tutorial');

        // Remove restart button
        if (typeof TutorialUI !== 'undefined') {
            TutorialUI.removeRestartButton();
        } else {
            document.querySelector('.tuto-restart')?.remove();
        }

        // Cleanup
        if (typeof TutorialUI !== 'undefined') {
            TutorialUI.destroy();
        }
        if (typeof TutorialOverlay !== 'undefined') {
            TutorialOverlay.destroy();
        }

        isActive = false;

        // Clear storage
        localStorage.removeItem(STORAGE_KEY);

        // Start fresh
        start();
    }

    // === SKIP TO STEP ===
    function goToStep(stepId) {
        if (typeof TutorialSteps === 'undefined') return;

        const steps = TutorialSteps.getAll();
        const idx = steps.findIndex(s => s.id === stepId);

        if (idx >= 0) {
            showStep(idx);
        }
    }

    // === PUBLIC API ===
    return {
        init,
        start,
        restart,
        next,
        prev,
        complete,
        goToStep,
        isActive: () => isActive
    };

})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DimensionsTutorial.init());
} else {
    // DOM already loaded
    DimensionsTutorial.init();
}
