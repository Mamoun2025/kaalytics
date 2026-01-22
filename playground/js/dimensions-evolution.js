/* ============================================
   DIMENSIONS EVOLUTION
   Gamification: Achievements, XP, Aura Effects
   ============================================ */

const DimensionsEvolution = (function() {
    'use strict';

    // === STATE ===
    let currentLevel = 0;
    let currentXP = 0;
    let totalXP = 0;
    let achievementsUnlocked = new Set();
    let lastModuleCount = 0;
    let lastConnectionCount = 0;
    let lastDimensionCount = 0;

    // === XP CONFIG ===
    const XP_VALUES = {
        moduleAdded: 10,
        connectionAdded: 15,
        moduleNested: 20,
        newDimension: 25,
        synergy: 30
    };

    // === LEVELS ===
    const LEVELS = [
        { level: 0, name: 'Démarrage', xpRequired: 0, color: '#6b7280' },
        { level: 1, name: 'Fondation', xpRequired: 10, color: '#3b82f6' },
        { level: 2, name: 'Émergent', xpRequired: 35, color: '#10b981' },
        { level: 3, name: 'Consolidé', xpRequired: 80, color: '#f59e0b' },
        { level: 4, name: 'Intégré', xpRequired: 150, color: '#ec4899' },
        { level: 5, name: 'Avancé', xpRequired: 250, color: '#8b5cf6' },
        { level: 6, name: 'Expert', xpRequired: 400, color: '#ef4444' },
        { level: 7, name: 'Enterprise', xpRequired: 600, color: '#eda906' }
    ];

    // === ACHIEVEMENTS ===
    const ACHIEVEMENTS = {
        first_module: {
            id: 'first_module',
            title: 'Premier Pilier',
            desc: 'Posez votre premier module',
            icon: '🎯',
            condition: (stats) => stats.moduleCount >= 1
        },
        first_connection: {
            id: 'first_connection',
            title: 'Première Synergie',
            desc: 'Créez votre première connexion',
            icon: '⚡',
            condition: (stats) => stats.connectionCount >= 1
        },
        three_modules: {
            id: 'three_modules',
            title: 'Trio Gagnant',
            desc: 'Placez 3 modules',
            icon: '🎲',
            condition: (stats) => stats.moduleCount >= 3
        },
        multi_dimension: {
            id: 'multi_dimension',
            title: 'Vision Transversale',
            desc: 'Utilisez 3 dimensions différentes',
            icon: '🔮',
            condition: (stats) => stats.dimensionCount >= 3
        },
        five_connections: {
            id: 'five_connections',
            title: 'Réseau Actif',
            desc: 'Créez 5 connexions',
            icon: '🕸️',
            condition: (stats) => stats.connectionCount >= 5
        },
        ten_modules: {
            id: 'ten_modules',
            title: 'Infrastructure Solide',
            desc: 'Déployez 10 modules',
            icon: '🏗️',
            condition: (stats) => stats.moduleCount >= 10
        },
        full_dimension: {
            id: 'full_dimension',
            title: 'Maîtrise Totale',
            desc: 'Complétez une dimension (6+ modules)',
            icon: '👑',
            condition: (stats) => stats.maxDimensionModules >= 6
        },
        architect: {
            id: 'architect',
            title: 'Architecte Digital',
            desc: 'Atteignez le niveau Expert',
            icon: '🏆',
            condition: (stats, level) => level >= 6
        },
        ecosystem: {
            id: 'ecosystem',
            title: 'Écosystème Complet',
            desc: '5 dimensions + 10 connexions',
            icon: '🌐',
            condition: (stats) => stats.dimensionCount >= 5 && stats.connectionCount >= 10
        }
    };

    // === INIT ===
    function init() {
        createUI();
        bindDataEvents();
        console.log('[Evolution] Gamification system initialized');
    }

    // === CREATE UI ===
    function createUI() {
        // Create container for evolution UI
        const container = document.createElement('div');
        container.id = 'evolutionContainer';
        container.className = 'evolution-container';
        container.innerHTML = `
            <!-- Level & XP Bar -->
            <div class="evolution-level-bar">
                <div class="level-info">
                    <span class="level-badge">Niv. <span id="levelNumber">0</span></span>
                    <span class="level-name" id="levelName">Démarrage</span>
                </div>
                <div class="xp-bar-container">
                    <div class="xp-bar" id="xpBar"></div>
                    <span class="xp-text" id="xpText">0 / 10 XP</span>
                </div>
            </div>

            <!-- Floating XP indicator -->
            <div class="floating-xp-container" id="floatingXpContainer"></div>

            <!-- Achievement toasts -->
            <div class="achievement-container" id="achievementContainer"></div>

            <!-- Level up overlay -->
            <div class="level-up-overlay" id="levelUpOverlay">
                <div class="level-up-content">
                    <div class="level-up-icon">⬆️</div>
                    <div class="level-up-text">NIVEAU SUPÉRIEUR</div>
                    <div class="level-up-level" id="levelUpLevel"></div>
                    <div class="level-up-name" id="levelUpName"></div>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // Create aura element around narrative panel
        const narrativePanel = document.querySelector('.narrative-panel');
        if (narrativePanel) {
            const aura = document.createElement('div');
            aura.className = 'evolution-aura';
            aura.id = 'evolutionAura';
            narrativePanel.style.position = 'relative';
            narrativePanel.appendChild(aura);
        }
    }

    // === BIND DATA EVENTS ===
    function bindDataEvents() {
        DimensionsData.on('moduleAdded', (module) => {
            addXP(XP_VALUES.moduleAdded, '+1 Capacité', module);
            checkNewDimension();
            checkAchievements();
        });

        DimensionsData.on('connectionAdded', (conn) => {
            addXP(XP_VALUES.connectionAdded, '+1 Synergie');
            checkAchievements();
        });

        DimensionsData.on('moduleNested', (data) => {
            addXP(XP_VALUES.moduleNested, 'Fusion !');
            checkAchievements();
        });

        DimensionsData.on('moduleRemoved', () => {
            updateAura();
        });

        DimensionsData.on('cleared', () => {
            resetProgress();
        });
    }

    // === ADD XP ===
    function addXP(amount, label, module = null) {
        totalXP += amount;
        currentXP += amount;

        // Show floating XP
        showFloatingXP(amount, label);

        // Check for level up
        checkLevelUp();

        // Update UI
        updateXPBar();
        updateAura();
    }

    // === CHECK LEVEL UP ===
    function checkLevelUp() {
        const newLevel = LEVELS.filter(l => totalXP >= l.xpRequired).pop();

        if (newLevel && newLevel.level > currentLevel) {
            const oldLevel = currentLevel;
            currentLevel = newLevel.level;

            // Show level up animation
            showLevelUp(newLevel);

            // Play sound if available
            if (typeof DimensionsAudio !== 'undefined') {
                DimensionsAudio.playConnect();
            }
        }
    }

    // === CHECK NEW DIMENSION ===
    function checkNewDimension() {
        const modules = DimensionsData.getPlacedModules();
        const dims = new Set(modules.map(m => m.dimension.id));

        if (dims.size > lastDimensionCount) {
            addXP(XP_VALUES.newDimension, 'Nouvelle dimension !');
            lastDimensionCount = dims.size;
        }
    }

    // === CHECK ACHIEVEMENTS ===
    function checkAchievements() {
        const stats = getStats();

        Object.values(ACHIEVEMENTS).forEach(achievement => {
            if (!achievementsUnlocked.has(achievement.id)) {
                if (achievement.condition(stats, currentLevel)) {
                    unlockAchievement(achievement);
                }
            }
        });
    }

    // === GET STATS ===
    function getStats() {
        const modules = DimensionsData.getPlacedModules();
        const connections = DimensionsData.getConnections();
        const dims = {};

        modules.forEach(m => {
            dims[m.dimension.id] = (dims[m.dimension.id] || 0) + 1;
        });

        return {
            moduleCount: modules.length,
            connectionCount: connections.length,
            dimensionCount: Object.keys(dims).length,
            maxDimensionModules: Math.max(0, ...Object.values(dims))
        };
    }

    // === UNLOCK ACHIEVEMENT ===
    function unlockAchievement(achievement) {
        achievementsUnlocked.add(achievement.id);
        showAchievementToast(achievement);

        // Bonus XP for achievement
        addXP(XP_VALUES.synergy, 'Achievement !');
    }

    // === SHOW FLOATING XP ===
    function showFloatingXP(amount, label) {
        const container = document.getElementById('floatingXpContainer');
        if (!container) return;

        const floater = document.createElement('div');
        floater.className = 'floating-xp';
        floater.innerHTML = `
            <span class="floating-xp-amount">+${amount} XP</span>
            <span class="floating-xp-label">${label}</span>
        `;

        container.appendChild(floater);

        // Animate and remove
        requestAnimationFrame(() => {
            floater.classList.add('animate');
        });

        setTimeout(() => {
            floater.remove();
        }, 2000);
    }

    // === SHOW ACHIEVEMENT TOAST ===
    function showAchievementToast(achievement) {
        const container = document.getElementById('achievementContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-desc">${achievement.desc}</div>
            </div>
        `;

        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Remove after delay
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    // === SHOW LEVEL UP ===
    function showLevelUp(level) {
        const overlay = document.getElementById('levelUpOverlay');
        const levelEl = document.getElementById('levelUpLevel');
        const nameEl = document.getElementById('levelUpName');

        if (!overlay) return;

        levelEl.textContent = `Niveau ${level.level}`;
        nameEl.textContent = level.name;
        nameEl.style.color = level.color;

        overlay.classList.add('show');

        // Create particles
        createLevelUpParticles();

        setTimeout(() => {
            overlay.classList.remove('show');
        }, 2500);

        // Update level display
        updateLevelDisplay(level);
    }

    // === CREATE LEVEL UP PARTICLES ===
    function createLevelUpParticles() {
        const overlay = document.getElementById('levelUpOverlay');
        if (!overlay) return;

        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'level-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 0.5}s`;
            particle.style.setProperty('--tx', `${(Math.random() - 0.5) * 200}px`);
            overlay.appendChild(particle);

            setTimeout(() => particle.remove(), 2000);
        }
    }

    // === UPDATE XP BAR ===
    function updateXPBar() {
        const bar = document.getElementById('xpBar');
        const text = document.getElementById('xpText');

        if (!bar || !text) return;

        const currentLevelData = LEVELS[currentLevel];
        const nextLevel = LEVELS[currentLevel + 1];

        if (!nextLevel) {
            // Max level
            bar.style.width = '100%';
            text.textContent = 'MAX';
            return;
        }

        const xpInLevel = totalXP - currentLevelData.xpRequired;
        const xpNeeded = nextLevel.xpRequired - currentLevelData.xpRequired;
        const percent = Math.min(100, (xpInLevel / xpNeeded) * 100);

        bar.style.width = `${percent}%`;
        bar.style.background = `linear-gradient(90deg, ${currentLevelData.color}, ${nextLevel.color})`;
        text.textContent = `${xpInLevel} / ${xpNeeded} XP`;
    }

    // === UPDATE LEVEL DISPLAY ===
    function updateLevelDisplay(level) {
        const numberEl = document.getElementById('levelNumber');
        const nameEl = document.getElementById('levelName');
        const badge = document.querySelector('.level-badge');

        if (numberEl) numberEl.textContent = level.level;
        if (nameEl) {
            nameEl.textContent = level.name;
            nameEl.style.color = level.color;
        }
        if (badge) badge.style.borderColor = level.color;
    }

    // === UPDATE AURA ===
    function updateAura() {
        const aura = document.getElementById('evolutionAura');
        if (!aura) return;

        const stats = getStats();
        const intensity = Math.min(1, (stats.moduleCount * 0.1) + (stats.connectionCount * 0.05));

        // Update aura intensity
        aura.style.opacity = intensity;

        // Add pulse class based on level
        aura.className = 'evolution-aura';
        if (currentLevel >= 5) {
            aura.classList.add('aura-intense');
        } else if (currentLevel >= 3) {
            aura.classList.add('aura-medium');
        } else if (currentLevel >= 1) {
            aura.classList.add('aura-light');
        }

        // Particle effect for high levels
        if (currentLevel >= 4 && Math.random() > 0.7) {
            createAuraParticle();
        }
    }

    // === CREATE AURA PARTICLE ===
    function createAuraParticle() {
        const aura = document.getElementById('evolutionAura');
        if (!aura) return;

        const particle = document.createElement('div');
        particle.className = 'aura-particle';
        particle.style.left = `${Math.random() * 100}%`;
        aura.appendChild(particle);

        setTimeout(() => particle.remove(), 2000);
    }

    // === RESET PROGRESS ===
    function resetProgress() {
        currentLevel = 0;
        currentXP = 0;
        totalXP = 0;
        lastDimensionCount = 0;
        achievementsUnlocked.clear();

        updateXPBar();
        updateLevelDisplay(LEVELS[0]);
        updateAura();
    }

    // === PUBLIC API ===
    return {
        init,
        getLevel: () => currentLevel,
        getXP: () => totalXP,
        getAchievements: () => [...achievementsUnlocked]
    };

})();
