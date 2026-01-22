/* ============================================
   DIMENSIONS AUDIO
   Subtle Sound Effects - Ultra-soft & Pleasant
   ============================================ */

const DimensionsAudio = (function() {
    'use strict';

    // === STATE ===
    let audioContext = null;
    let enabled = true;
    let volume = 0.15; // Very soft by default
    let welcomePlayed = false;

    // === INIT ===
    function init() {
        // Listen for ANY user interaction to init context
        const initEvents = ['click', 'touchstart', 'mousedown', 'dragstart', 'keydown', 'pointerdown'];

        const handler = () => {
            initContext();
            // Keep trying to init on each interaction until context is running
            if (!audioContext || audioContext.state !== 'running') {
                return; // Keep listener active
            }

            // Play welcome sound on first successful interaction
            if (!welcomePlayed) {
                welcomePlayed = true;
                setTimeout(() => playWelcome(), 100);
            }

            // Remove all listeners once context is running
            initEvents.forEach(event => {
                document.removeEventListener(event, handler);
            });
        };

        initEvents.forEach(event => {
            document.addEventListener(event, handler, { passive: true });
        });

        bindDataEvents();
        console.log('[Audio] Initialized (waiting for user interaction)');
    }

    function initContext() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('[Audio] Context created');
            } catch (e) {
                console.warn('[Audio] Web Audio not supported');
                enabled = false;
                return;
            }
        }

        // Always try to resume if suspended
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('[Audio] Context resumed and running');
            }).catch(() => {
                // Will retry on next interaction
            });
        }
    }

    // Ensure context is ready before playing
    function ensureContext() {
        initContext();
    }

    // === DATA EVENTS ===
    function bindDataEvents() {
        DimensionsData.on('moduleAdded', () => playDrop());
        DimensionsData.on('connectionAdded', () => playConnect());
        DimensionsData.on('moduleNested', () => playNest());
        DimensionsData.on('moduleRemoved', () => playRemove());
    }

    // === SOUND: Module Drop ===
    function playDrop() {
        if (!tryPlay()) {
            // Retry once after a small delay (context might be resuming)
            setTimeout(() => {
                if (tryPlay()) playDropSound();
            }, 50);
            return;
        }
        playDropSound();
    }

    function playDropSound() {
        // Soft bell-like tone
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.05); // A6

        gain.gain.setValueAtTime(volume * 0.8, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.15);
    }

    // === SOUND: Connection Made ===
    function playConnect() {
        if (!tryPlay()) {
            setTimeout(() => {
                if (tryPlay()) playConnectSound();
            }, 50);
            return;
        }
        playConnectSound();
    }

    function playConnectSound() {
        // Soft chime - two notes harmony
        const now = audioContext.currentTime;

        // Note 1
        playNote(523.25, now, 0.2, volume * 0.6); // C5
        // Note 2 (harmony)
        playNote(659.25, now + 0.05, 0.2, volume * 0.5); // E5
        // Note 3 (resolve)
        playNote(783.99, now + 0.1, 0.25, volume * 0.4); // G5
    }

    // === SOUND: Module Nested ===
    function playNest() {
        if (!tryPlay()) {
            setTimeout(() => {
                if (tryPlay()) playNestSound();
            }, 50);
            return;
        }
        playNestSound();
    }

    function playNestSound() {
        // Soft whoosh + confirmation tone
        const now = audioContext.currentTime;

        // Whoosh (filtered noise)
        playWhoosh(now, 0.15);

        // Confirmation bell
        playNote(1046.50, now + 0.08, 0.2, volume * 0.5); // C6
    }

    // === SOUND: Module Removed ===
    function playRemove() {
        if (!tryPlay()) {
            setTimeout(() => {
                if (tryPlay()) playRemoveSound();
            }, 50);
            return;
        }
        playRemoveSound();
    }

    function playRemoveSound() {
        // Soft descending tone
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioContext.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.1); // A3

        gain.gain.setValueAtTime(volume * 0.5, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.1);
    }

    // === SOUND: Hover (call manually) ===
    function playHover() {
        if (!tryPlay()) return;

        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(2093, audioContext.currentTime); // C7 (very high, subtle)

        gain.gain.setValueAtTime(volume * 0.2, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.05);
    }

    // === SOUND: Click (call manually) ===
    function playClick() {
        if (!tryPlay()) return;

        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1000, audioContext.currentTime);

        gain.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.03);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.03);
    }

    // === SOUND: Welcome (ultra-light ping) ===
    function playWelcome() {
        if (!tryPlay()) return;

        const now = audioContext.currentTime;
        const welcomeVolume = volume * 0.4; // Very soft

        // Simple two-note chime - quick and subtle
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioContext.destination);

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);      // A5
        osc2.frequency.setValueAtTime(1318.5, now + 0.06); // E6

        gain.gain.setValueAtTime(welcomeVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc1.start(now);
        osc2.start(now + 0.06);
        osc1.stop(now + 0.2);
        osc2.stop(now + 0.25);

        console.log('[Audio] Welcome sound played');
    }

    // === HELPER: Play single note ===
    function playNote(freq, startTime, duration, noteVolume) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(noteVolume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    // === HELPER: Play whoosh (filtered noise) ===
    function playWhoosh(startTime, duration) {
        const bufferSize = audioContext.sampleRate * duration;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        // Fill with noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audioContext.createBufferSource();
        noise.buffer = buffer;

        // Bandpass filter for swoosh
        const filter = audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, startTime);
        filter.frequency.exponentialRampToValueAtTime(500, startTime + duration);
        filter.Q.value = 5;

        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(volume * 0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);

        noise.start(startTime);
        noise.stop(startTime + duration);
    }

    // === HELPERS ===
    function canPlay() {
        if (!enabled) return false;

        // Try to ensure context is ready
        ensureContext();

        // Check if context is available and not closed
        return audioContext && audioContext.state !== 'closed';
    }

    function tryPlay() {
        if (!enabled) return false;
        ensureContext();
        return audioContext && audioContext.state === 'running';
    }

    function setEnabled(state) {
        enabled = state;
    }

    function setVolume(vol) {
        volume = Math.max(0, Math.min(1, vol));
    }

    // === SOUND: Clear (soft whoosh down) ===
    function playClear() {
        if (!tryPlay()) return;

        const now = audioContext.currentTime;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

        gain.gain.setValueAtTime(volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // === PUBLIC API ===
    return {
        init,
        playWelcome,
        playDrop,
        playConnect,
        playNest,
        playRemove,
        playHover,
        playClick,
        playClear,
        setEnabled,
        setVolume
    };

})();
