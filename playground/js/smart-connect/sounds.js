/* ============================================
   SMART CONNECT - Sound Effects
   Web Audio API for feedback sounds
   ============================================ */

const SmartConnectSounds = (function() {
    'use strict';

    let audioContext = null;
    let enabled = true;
    let volume = 0.25;

    // Initialize audio context
    function init() {
        if (audioContext) return true;

        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('[SmartConnect:Sounds] Initialized');
            return true;
        } catch (e) {
            console.warn('[SmartConnect:Sounds] Web Audio not supported');
            enabled = false;
            return false;
        }
    }

    // Resume if suspended
    function resume() {
        if (audioContext?.state === 'suspended') {
            audioContext.resume();
        }
    }

    // Play a tone
    function playTone(frequency, duration, type = 'sine', volumeMod = 1) {
        if (!enabled || !audioContext) return;
        resume();

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * volumeMod, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // === SOUND EFFECTS ===

    // Start optimization - anticipation sound
    function start() {
        if (!enabled) return;
        resume();

        setTimeout(() => playTone(440, 0.08, 'sine', 0.5), 0);
        setTimeout(() => playTone(554, 0.08, 'sine', 0.5), 60);
        setTimeout(() => playTone(659, 0.1, 'sine', 0.4), 120);
    }

    // Processing tick - subtle feedback
    function tick() {
        if (!enabled) return;
        resume();

        playTone(800, 0.04, 'sine', 0.2);
    }

    // Layout step complete
    function layoutComplete() {
        if (!enabled) return;
        resume();

        setTimeout(() => playTone(523, 0.1, 'sine', 0.5), 0);
        setTimeout(() => playTone(659, 0.12, 'sine', 0.4), 80);
    }

    // Connection created
    function connectionCreated() {
        if (!enabled) return;
        resume();

        playTone(880, 0.08, 'triangle', 0.4);
        setTimeout(() => playTone(1047, 0.1, 'triangle', 0.3), 60);
    }

    // All done - success fanfare
    function success() {
        if (!enabled) return;
        resume();

        setTimeout(() => playTone(523, 0.12, 'sine', 0.6), 0);
        setTimeout(() => playTone(659, 0.12, 'sine', 0.5), 100);
        setTimeout(() => playTone(784, 0.15, 'sine', 0.5), 200);
        setTimeout(() => playTone(1047, 0.25, 'sine', 0.4), 300);
    }

    // Warning sound
    function warning() {
        if (!enabled) return;
        resume();

        playTone(440, 0.15, 'triangle', 0.4);
        setTimeout(() => playTone(349, 0.2, 'triangle', 0.3), 150);
    }

    // Error sound
    function error() {
        if (!enabled) return;
        resume();

        playTone(220, 0.2, 'sawtooth', 0.3);
        setTimeout(() => playTone(196, 0.25, 'sawtooth', 0.25), 200);
    }

    // Undo sound
    function undo() {
        if (!enabled) return;
        resume();

        setTimeout(() => playTone(659, 0.08, 'sine', 0.4), 0);
        setTimeout(() => playTone(523, 0.08, 'sine', 0.4), 60);
        setTimeout(() => playTone(440, 0.1, 'sine', 0.35), 120);
    }

    // Preview show
    function previewShow() {
        if (!enabled) return;
        resume();

        playTone(660, 0.06, 'sine', 0.3);
        setTimeout(() => playTone(880, 0.08, 'sine', 0.25), 50);
    }

    // Preview apply
    function previewApply() {
        if (!enabled) return;
        resume();

        setTimeout(() => playTone(523, 0.08, 'sine', 0.5), 0);
        setTimeout(() => playTone(784, 0.1, 'sine', 0.4), 70);
        setTimeout(() => playTone(1047, 0.15, 'sine', 0.35), 140);
    }

    // Preview cancel
    function previewCancel() {
        if (!enabled) return;
        resume();

        playTone(392, 0.1, 'sine', 0.3);
    }

    // Toggle sounds
    function toggle() {
        enabled = !enabled;
        return enabled;
    }

    // Set volume
    function setVolume(v) {
        volume = Math.max(0, Math.min(1, v));
    }

    return {
        init,
        toggle,
        setVolume,
        isEnabled: () => enabled,
        // Effects
        start,
        tick,
        layoutComplete,
        connectionCreated,
        success,
        warning,
        error,
        undo,
        previewShow,
        previewApply,
        previewCancel
    };

})();
