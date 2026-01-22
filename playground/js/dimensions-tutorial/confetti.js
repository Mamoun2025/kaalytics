/* ============================================
   TUTORIAL CONFETTI - Celebration Effects
   ============================================ */

const TutorialConfetti = (function() {
    'use strict';

    // Default colors (brand)
    const defaultColors = ['#eda906', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b'];

    // Create a single confetti piece
    function createPiece(container, colors, index) {
        const piece = document.createElement('div');
        piece.className = 'tuto-confetti-piece';

        const color = colors[Math.floor(Math.random() * colors.length)];
        const startX = Math.random() * 100;
        const startDelay = Math.random() * 0.5;
        const duration = 2.5 + Math.random() * 2;
        const rotation = Math.random() * 720 - 360;
        const size = 8 + Math.random() * 8;

        // Random shape
        const shapes = ['square', 'circle', 'ribbon'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        Object.assign(piece.style, {
            left: startX + '%',
            width: size + 'px',
            height: shape === 'ribbon' ? size * 3 + 'px' : size + 'px',
            backgroundColor: color,
            borderRadius: shape === 'circle' ? '50%' : shape === 'ribbon' ? '2px' : '2px',
            animationDelay: startDelay + 's',
            animationDuration: duration + 's',
            '--rotation': rotation + 'deg',
            '--drift': (Math.random() * 200 - 100) + 'px'
        });

        container.appendChild(piece);
        return piece;
    }

    // Show confetti celebration
    function show(options = {}) {
        const {
            count = 60,
            colors = defaultColors,
            duration = 4000,
            origin = 'top'
        } = options;

        const container = document.createElement('div');
        container.className = 'tuto-confetti-container';

        if (origin === 'center') {
            container.classList.add('tuto-confetti-center');
        }

        document.body.appendChild(container);

        // Create confetti pieces
        for (let i = 0; i < count; i++) {
            createPiece(container, colors, i);
        }

        // Play celebration sound
        if (typeof TutorialSounds !== 'undefined') {
            TutorialSounds.celebration();
        }

        // Cleanup after animation
        setTimeout(() => {
            container.classList.add('fading');
            setTimeout(() => container.remove(), 500);
        }, duration);

        return container;
    }

    // Burst effect from a specific element
    function burst(element, options = {}) {
        const {
            count = 30,
            colors = defaultColors,
            spread = 150
        } = options;

        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const container = document.createElement('div');
        container.className = 'tuto-confetti-burst';
        container.style.left = centerX + 'px';
        container.style.top = centerY + 'px';
        document.body.appendChild(container);

        for (let i = 0; i < count; i++) {
            const piece = document.createElement('div');
            piece.className = 'tuto-confetti-burst-piece';

            const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.5 - 0.25);
            const velocity = spread * (0.5 + Math.random() * 0.5);
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 6 + Math.random() * 6;

            Object.assign(piece.style, {
                width: size + 'px',
                height: size + 'px',
                backgroundColor: color,
                '--tx': Math.cos(angle) * velocity + 'px',
                '--ty': Math.sin(angle) * velocity + 'px',
                animationDelay: (Math.random() * 0.1) + 's'
            });

            container.appendChild(piece);
        }

        // Cleanup
        setTimeout(() => container.remove(), 1500);

        return container;
    }

    // Sparkle effect (smaller, quicker)
    function sparkle(element, options = {}) {
        const {
            count = 12,
            color = '#eda906'
        } = options;

        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < count; i++) {
            const spark = document.createElement('div');
            spark.className = 'tuto-sparkle';

            const angle = (Math.PI * 2 * i) / count;
            const distance = 30 + Math.random() * 20;

            Object.assign(spark.style, {
                left: centerX + 'px',
                top: centerY + 'px',
                backgroundColor: color,
                '--tx': Math.cos(angle) * distance + 'px',
                '--ty': Math.sin(angle) * distance + 'px',
                animationDelay: (i * 0.02) + 's'
            });

            document.body.appendChild(spark);

            // Cleanup
            setTimeout(() => spark.remove(), 800);
        }
    }

    // Stars shower
    function stars(options = {}) {
        const { count = 20, duration = 3000 } = options;

        const container = document.createElement('div');
        container.className = 'tuto-stars-container';
        document.body.appendChild(container);

        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'tuto-star';
            star.innerHTML = '⭐';

            Object.assign(star.style, {
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 1 + 's',
                animationDuration: (2 + Math.random() * 2) + 's',
                fontSize: (16 + Math.random() * 16) + 'px'
            });

            container.appendChild(star);
        }

        setTimeout(() => container.remove(), duration);

        return container;
    }

    // Combined celebration (confetti + stars)
    function celebrate(options = {}) {
        show(options);
        setTimeout(() => stars({ count: 15 }), 500);
    }

    return {
        show,
        burst,
        sparkle,
        stars,
        celebrate
    };

})();

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TutorialConfetti;
}
