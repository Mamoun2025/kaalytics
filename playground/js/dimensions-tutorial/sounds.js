/* ============================================
   TUTORIAL SOUNDS - Web Audio Sound Effects
   ============================================ */

const TutorialSounds = (function() {
    'use strict';

    let audioContext = null;
    let enabled = true;
    let volume = 0.3;

    // Initialize audio context (must be called after user interaction)
    function init() {
        if (audioContext) return;

        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('[TutorialSounds] Audio context initialized');
        } catch (e) {
            console.warn('[TutorialSounds] Web Audio not supported:', e);
            enabled = false;
        }
    }

    // Resume audio context if suspended (browser autoplay policy)
    function resume() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    // Create a simple oscillator sound
    function playTone(frequency, duration, type = 'sine', volumeMod = 1) {
        if (!enabled || !audioContext) return;

        resume();

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        // Envelope
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * volumeMod, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // Play a chord (multiple frequencies)
    function playChord(frequencies, duration, type = 'sine') {
        frequencies.forEach((freq, i) => {
            setTimeout(() => playTone(freq, duration, type, 0.5), i * 30);
        });
    }

    // === SOUND EFFECTS ===

    // Step appear sound - gentle rising chime
    function stepAppear() {
        if (!enabled || !audioContext) return;
        resume();

        // Pleasant rising notes
        setTimeout(() => playTone(523, 0.15, 'sine', 0.6), 0);    // C5
        setTimeout(() => playTone(659, 0.15, 'sine', 0.5), 50);   // E5
        setTimeout(() => playTone(784, 0.2, 'sine', 0.4), 100);   // G5
    }

    // Success sound - triumphant short melody
    function success() {
        if (!enabled || !audioContext) return;
        resume();

        setTimeout(() => playTone(523, 0.1, 'sine', 0.7), 0);     // C5
        setTimeout(() => playTone(659, 0.1, 'sine', 0.7), 80);    // E5
        setTimeout(() => playTone(784, 0.15, 'sine', 0.6), 160);  // G5
        setTimeout(() => playTone(1047, 0.25, 'sine', 0.5), 240); // C6
    }

    // Click/tap sound - subtle pop
    function click() {
        if (!enabled || !audioContext) return;
        resume();

        playTone(880, 0.05, 'sine', 0.4);
    }

    // Navigation sound - subtle swoosh
    function navigate() {
        if (!enabled || !audioContext) return;
        resume();

        setTimeout(() => playTone(440, 0.08, 'sine', 0.4), 0);
        setTimeout(() => playTone(554, 0.1, 'sine', 0.3), 40);
    }

    // Welcome sound - warm introduction
    function welcome() {
        if (!enabled || !audioContext) return;
        resume();

        // Major chord arpeggio
        setTimeout(() => playTone(262, 0.2, 'sine', 0.5), 0);     // C4
        setTimeout(() => playTone(330, 0.2, 'sine', 0.5), 100);   // E4
        setTimeout(() => playTone(392, 0.2, 'sine', 0.5), 200);   // G4
        setTimeout(() => playTone(523, 0.3, 'sine', 0.4), 300);   // C5
    }

    // Completion/celebration sound - triumphant fanfare
    function celebration() {
        if (!enabled || !audioContext) return;
        resume();

        // Victory fanfare
        setTimeout(() => playTone(523, 0.15, 'sine', 0.7), 0);    // C5
        setTimeout(() => playTone(523, 0.15, 'sine', 0.7), 150);  // C5
        setTimeout(() => playTone(523, 0.15, 'sine', 0.7), 300);  // C5
        setTimeout(() => playTone(659, 0.3, 'sine', 0.6), 450);   // E5
        setTimeout(() => playTone(784, 0.2, 'sine', 0.6), 600);   // G5
        setTimeout(() => playTone(659, 0.2, 'sine', 0.5), 750);   // E5
        setTimeout(() => playTone(1047, 0.5, 'sine', 0.5), 900);  // C6
    }

    // Error/warning sound - gentle alert
    function warning() {
        if (!enabled || !audioContext) return;
        resume();

        playTone(330, 0.15, 'triangle', 0.5);
        setTimeout(() => playTone(294, 0.2, 'triangle', 0.4), 150);
    }

    // Highlight appear - subtle attention getter
    function highlight() {
        if (!enabled || !audioContext) return;
        resume();

        playTone(660, 0.08, 'sine', 0.3);
        setTimeout(() => playTone(880, 0.1, 'sine', 0.25), 60);
    }

    // Action required - gentle prompt
    function actionRequired() {
        if (!enabled || !audioContext) return;
        resume();

        setTimeout(() => playTone(587, 0.12, 'sine', 0.4), 0);    // D5
        setTimeout(() => playTone(698, 0.12, 'sine', 0.35), 120); // F5
        setTimeout(() => playTone(880, 0.15, 'sine', 0.3), 240);  // A5
    }

    // Toggle sound on/off
    function toggle() {
        enabled = !enabled;
        console.log('[TutorialSounds] Sounds', enabled ? 'enabled' : 'disabled');
        return enabled;
    }

    // Set volume (0-1)
    function setVolume(v) {
        volume = Math.max(0, Math.min(1, v));
    }

    // Check if sounds are enabled
    function isEnabled() {
        return enabled;
    }

    return {
        init,
        resume,
        toggle,
        setVolume,
        isEnabled,
        // Sound effects
        stepAppear,
        success,
        click,
        navigate,
        welcome,
        celebration,
        warning,
        highlight,
        actionRequired
    };

})();

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TutorialSounds;
}
