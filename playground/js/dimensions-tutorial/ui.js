/* ============================================
   TUTORIAL UI - Bubble & Messages
   ============================================ */

const TutorialUI = (function() {
    'use strict';

    let bubbleEl = null;
    let callbacks = {
        onSkip: null,
        onPrev: null,
        onNext: null
    };

    // Create the tutorial bubble
    function createBubble() {
        if (bubbleEl) bubbleEl.remove();

        bubbleEl = document.createElement('div');
        bubbleEl.className = 'tuto-bubble';
        bubbleEl.innerHTML = `
            <div class="tuto-progress">
                <div class="tuto-progress-bar"></div>
            </div>
            <div class="tuto-header">
                <span class="tuto-icon"></span>
                <span class="tuto-title"></span>
                <span class="tuto-step-counter"></span>
            </div>
            <div class="tuto-message"></div>
            <div class="tuto-footer">
                <button class="tuto-skip">Passer le guide</button>
                <div class="tuto-nav">
                    <button class="tuto-prev">← Précédent</button>
                    <button class="tuto-next">Suivant →</button>
                </div>
            </div>
            <div class="tuto-sound-toggle" title="Activer/désactiver les sons">
                <span class="sound-on">🔊</span>
                <span class="sound-off">🔇</span>
            </div>
        `;
        document.body.appendChild(bubbleEl);

        // Event listeners
        bubbleEl.querySelector('.tuto-skip').onclick = () => callbacks.onSkip?.();
        bubbleEl.querySelector('.tuto-prev').onclick = () => callbacks.onPrev?.();
        bubbleEl.querySelector('.tuto-next').onclick = () => callbacks.onNext?.();

        // Sound toggle
        const soundToggle = bubbleEl.querySelector('.tuto-sound-toggle');
        soundToggle.onclick = () => {
            if (typeof TutorialSounds !== 'undefined') {
                const enabled = TutorialSounds.toggle();
                soundToggle.classList.toggle('muted', !enabled);
                TutorialSounds.click();
            }
        };

        return bubbleEl;
    }

    // Set callbacks for navigation
    function setCallbacks(cbs) {
        callbacks = { ...callbacks, ...cbs };
    }

    // Update bubble content for a step
    function updateBubble(step, currentIndex, totalSteps) {
        if (!bubbleEl) createBubble();

        // Update icon
        const iconEl = bubbleEl.querySelector('.tuto-icon');
        iconEl.textContent = step.icon || '📌';
        iconEl.classList.add('bounce');
        setTimeout(() => iconEl.classList.remove('bounce'), 600);

        // Update title
        bubbleEl.querySelector('.tuto-title').textContent = step.title || '';

        // Update counter
        bubbleEl.querySelector('.tuto-step-counter').textContent = `${currentIndex + 1}/${totalSteps}`;

        // Update progress bar
        const progressBar = bubbleEl.querySelector('.tuto-progress-bar');
        const progress = ((currentIndex + 1) / totalSteps) * 100;
        progressBar.style.width = `${progress}%`;

        // Update message with animation
        const messageEl = bubbleEl.querySelector('.tuto-message');
        messageEl.classList.add('updating');
        setTimeout(() => {
            messageEl.innerHTML = step.message;
            messageEl.classList.remove('updating');
        }, 150);

        // Update buttons
        const prevBtn = bubbleEl.querySelector('.tuto-prev');
        const nextBtn = bubbleEl.querySelector('.tuto-next');

        prevBtn.style.display = currentIndex > 0 ? 'inline-flex' : 'none';

        if (step.waitFor) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'inline-flex';
            nextBtn.textContent = step.isFinal ? 'Terminer ✓' : 'Suivant →';

            if (step.isFinal) {
                nextBtn.classList.add('tuto-final-btn');
            } else {
                nextBtn.classList.remove('tuto-final-btn');
            }
        }

        return bubbleEl;
    }

    // Position bubble relative to target
    function positionBubble(targetSel, position) {
        if (!bubbleEl) return;

        // Reset classes
        bubbleEl.classList.remove('tuto-center', 'tuto-right', 'tuto-left', 'tuto-top', 'tuto-bottom');
        bubbleEl.classList.add('visible');

        // Center position
        if (position === 'center' || !targetSel) {
            bubbleEl.classList.add('tuto-center');
            Object.assign(bubbleEl.style, {
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
            });
            return;
        }

        const el = document.querySelector(targetSel);
        if (!el) {
            bubbleEl.classList.add('tuto-center');
            Object.assign(bubbleEl.style, {
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
            });
            return;
        }

        const rect = el.getBoundingClientRect();
        const bubbleWidth = 380;
        const bubbleHeight = bubbleEl.offsetHeight || 220;
        const gap = 24;
        let left, top;

        switch (position) {
            case 'right':
                left = rect.right + gap;
                top = Math.max(100, rect.top + rect.height / 2);
                bubbleEl.classList.add('tuto-right');
                bubbleEl.style.transform = 'translateY(-50%)';
                break;
            case 'left':
                left = rect.left - bubbleWidth - gap;
                top = rect.top + rect.height / 2;
                bubbleEl.classList.add('tuto-left');
                bubbleEl.style.transform = 'translateY(-50%)';
                break;
            case 'bottom':
                left = rect.left + rect.width / 2;
                top = rect.bottom + gap;
                bubbleEl.classList.add('tuto-bottom');
                bubbleEl.style.transform = 'translateX(-50%)';
                break;
            case 'top':
                left = rect.left + rect.width / 2;
                top = rect.top - bubbleHeight - gap;
                bubbleEl.classList.add('tuto-top');
                bubbleEl.style.transform = 'translateX(-50%)';
                break;
        }

        // Clamp to screen
        left = Math.max(20, Math.min(left, window.innerWidth - bubbleWidth - 20));
        top = Math.max(20, Math.min(top, window.innerHeight - bubbleHeight - 20));

        bubbleEl.style.left = left + 'px';
        bubbleEl.style.top = top + 'px';
    }

    // Show bubble
    function show() {
        bubbleEl?.classList.add('visible');
    }

    // Hide bubble
    function hide() {
        bubbleEl?.classList.remove('visible');
    }

    // Show success toast
    function showSuccess(text = 'Bravo !') {
        const el = document.createElement('div');
        el.className = 'tuto-success';
        el.innerHTML = `
            <span class="tuto-success-icon">✓</span>
            <span class="tuto-success-text">${text}</span>
        `;
        document.body.appendChild(el);

        requestAnimationFrame(() => el.classList.add('visible'));

        setTimeout(() => {
            el.classList.remove('visible');
            setTimeout(() => el.remove(), 300);
        }, 1800);

        return el;
    }

    // Show welcome modal (before starting tutorial)
    function showWelcomeModal(onStart, onSkip) {
        const modal = document.createElement('div');
        modal.className = 'tuto-welcome-modal';
        modal.innerHTML = `
            <div class="tuto-welcome-backdrop"></div>
            <div class="tuto-welcome-content">
                <div class="tuto-welcome-icon">🎯</div>
                <h2 class="tuto-welcome-title">Découvrez Dimensions Playground</h2>
                <p class="tuto-welcome-text">
                    Un guide interactif vous accompagne pour maîtriser
                    la construction de votre architecture digitale.
                </p>
                <div class="tuto-welcome-features">
                    <div class="tuto-welcome-feature">
                        <span>📦</span>
                        <span>Modules par dimension</span>
                    </div>
                    <div class="tuto-welcome-feature">
                        <span>🔗</span>
                        <span>Connexions & synergies</span>
                    </div>
                    <div class="tuto-welcome-feature">
                        <span>📊</span>
                        <span>Rapport temps réel</span>
                    </div>
                </div>
                <div class="tuto-welcome-buttons">
                    <button class="tuto-welcome-start">
                        <span>🚀</span>
                        Commencer le guide
                    </button>
                    <button class="tuto-welcome-skip">Je connais déjà</button>
                </div>
                <div class="tuto-welcome-hint">
                    <span>💡</span> Durée estimée : 2-3 minutes
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('visible');
        });

        // Event handlers
        const startBtn = modal.querySelector('.tuto-welcome-start');
        const skipBtn = modal.querySelector('.tuto-welcome-skip');
        const backdrop = modal.querySelector('.tuto-welcome-backdrop');

        const close = (callback) => {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
                callback?.();
            }, 300);
        };

        startBtn.onclick = () => close(onStart);
        skipBtn.onclick = () => close(onSkip);
        backdrop.onclick = () => close(onSkip);

        return modal;
    }

    // Add restart button
    function addRestartButton(onClick) {
        if (document.querySelector('.tuto-restart')) return;

        const btn = document.createElement('button');
        btn.className = 'tuto-restart';
        btn.innerHTML = '?';
        btn.title = 'Revoir le guide interactif';
        btn.onclick = () => {
            btn.remove();
            onClick?.();
        };
        document.body.appendChild(btn);

        // Animate entrance
        requestAnimationFrame(() => btn.classList.add('visible'));

        return btn;
    }

    // Remove restart button
    function removeRestartButton() {
        const btn = document.querySelector('.tuto-restart');
        if (btn) {
            btn.classList.remove('visible');
            setTimeout(() => btn.remove(), 300);
        }
    }

    // Get bubble element
    function getBubble() {
        return bubbleEl;
    }

    // Destroy bubble
    function destroy() {
        bubbleEl?.remove();
        bubbleEl = null;
    }

    return {
        createBubble,
        setCallbacks,
        updateBubble,
        positionBubble,
        show,
        hide,
        showSuccess,
        showWelcomeModal,
        addRestartButton,
        removeRestartButton,
        getBubble,
        destroy
    };

})();

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TutorialUI;
}
