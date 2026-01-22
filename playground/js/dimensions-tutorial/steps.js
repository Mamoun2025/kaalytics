/* ============================================
   TUTORIAL STEPS - All step definitions
   ============================================ */

const TutorialSteps = (function() {
    'use strict';

    // All tutorial steps with their configuration
    const steps = [
        // ===== WELCOME =====
        {
            id: 'welcome',
            title: 'Bienvenue dans Dimensions Playground',
            message: `Vous allez construire l'<strong>architecture digitale</strong> de votre entreprise, module par module.
                      <div class="tuto-tip">Ce guide interactif vous accompagne pas à pas.</div>`,
            position: 'center',
            icon: '🎯',
            sound: 'welcome'
        },

        // ===== SIDEBAR - DIMENSIONS =====
        {
            id: 'dimensions-intro',
            title: 'Les 8 Dimensions',
            message: `Votre transformation digitale repose sur <strong>8 dimensions</strong> technologiques :
                      <div class="tuto-list">
                        <span>🏗️ Opérations</span>
                        <span>💰 Intelligence</span>
                        <span>🚀 Croissance</span>
                        <span>✨ Engagement</span>
                        <span>🎨 Marque</span>
                        <span>🔌 Intégration</span>
                        <span>🛡️ Sécurité</span>
                        <span>📦 Entreprise</span>
                      </div>
                      Chaque dimension contient des modules spécialisés.`,
            target: '#sidebar',
            highlightTarget: '.dimensions-list',
            position: 'right',
            icon: '📚',
            sound: 'stepAppear'
        },

        // ===== CLICK DIMENSION =====
        {
            id: 'click-dimension',
            title: 'Explorez une Dimension',
            message: `Cliquez sur <strong>« Opérations Terrain »</strong> pour découvrir ses modules.
                      <div class="tuto-tip">💡 Chaque dimension se déplie pour révéler ses capacités.</div>`,
            target: '.dimension-group:first-child',
            highlightTarget: '.dimension-group:first-child .dimension-header',
            position: 'right',
            waitFor: 'dimensionClick',
            icon: '👆',
            sound: 'actionRequired'
        },

        // ===== MODULES LIST =====
        {
            id: 'modules-list',
            title: 'Les Modules Disponibles',
            message: `Voici les modules de cette dimension. Chaque module apporte une <strong>capacité spécifique</strong> à votre entreprise.
                      <div class="tuto-tip">📦 Nom du module<br>📝 Description de sa fonction</div>`,
            target: '.dimension-group:first-child',
            highlightTarget: '.dimension-group:first-child .modules-list',
            position: 'right',
            icon: '📦',
            sound: 'stepAppear'
        },

        // ===== DRAG MODULE =====
        {
            id: 'drag-module',
            title: 'Glissez un Module',
            message: `<strong>Glissez le premier module</strong> vers l'espace central pour l'ajouter à votre architecture.
                      <div class="tuto-action">🖱️ Maintenez le clic et déplacez</div>`,
            target: null,
            position: 'right',
            waitFor: 'moduleDrop',
            getTarget: () => '.dimension-group:first-child .module-item:first-child',
            icon: '✋',
            sound: 'actionRequired'
        },

        // ===== WORKSPACE =====
        {
            id: 'workspace-intro',
            title: 'Votre Espace de Travail',
            message: `C'est ici que vous construisez votre architecture.
                      <div class="tuto-list">
                        <span>🖱️ <strong>Déplacez</strong> les modules librement</span>
                        <span>🔍 <strong>Zoomez</strong> avec la molette</span>
                        <span>✋ <strong>Naviguez</strong> en maintenant le clic sur le fond</span>
                      </div>`,
            target: '#workspace',
            highlightTarget: '.canvas-container',
            position: 'left',
            icon: '🎨',
            sound: 'stepAppear'
        },

        // ===== SECOND MODULE =====
        {
            id: 'add-second',
            title: 'Ajoutez un Second Module',
            message: `Ajoutez un <strong>deuxième module</strong> pour créer des synergies.
                      <div class="tuto-tip">💡 Les modules connectés génèrent plus de valeur ensemble.</div>`,
            target: null,
            position: 'right',
            waitFor: 'secondModule',
            getTarget: () => '.dimension-group:first-child .module-item:not(.placed):first-of-type',
            icon: '➕',
            sound: 'actionRequired'
        },

        // ===== CONNECTION POINTS =====
        {
            id: 'connection-points',
            title: 'Points de Connexion',
            message: `Survolez un module pour voir ses <strong>points de connexion</strong> (les petits cercles).
                      <div class="tuto-action">
                        1️⃣ Survolez un module<br>
                        2️⃣ Cliquez sur un point<br>
                        3️⃣ Cliquez sur un point d'un autre module
                      </div>
                      Créez maintenant une connexion entre vos deux modules.`,
            target: '#workspace',
            highlightTarget: '.placed-module',
            position: 'left',
            waitFor: 'connection',
            icon: '🔗',
            sound: 'actionRequired'
        },

        // ===== RIGHT PANEL INTRO =====
        {
            id: 'right-panel-intro',
            title: 'Panneau de Transformation',
            message: `Ce panneau à droite est le <strong>cœur de votre stratégie</strong>. Il contient :
                      <div class="tuto-list">
                        <span>💡 <strong>Recommandations</strong> intelligentes</span>
                        <span>📊 <strong>Rapport</strong> de transformation</span>
                      </div>`,
            target: '#rightPanel',
            highlightTarget: '#rightPanel',
            position: 'left',
            icon: '📈',
            sound: 'stepAppear'
        },

        // ===== RECOMMENDATIONS =====
        {
            id: 'recommendations',
            title: 'Recommandations Intelligentes',
            message: `Le système analyse votre architecture et suggère les <strong>modules les plus pertinents</strong> à ajouter.
                      <div class="tuto-tip">💡 Cliquez sur une recommandation pour l'ajouter directement, ou glissez-la vers le canvas.</div>`,
            target: '#recoPanel',
            highlightTarget: '.reco-list',
            position: 'left',
            icon: '💡',
            sound: 'stepAppear'
        },

        // ===== TRANSFORMATION REPORT =====
        {
            id: 'transformation-report',
            title: 'Rapport de Transformation',
            message: `Ce rapport <strong>évolue en temps réel</strong> selon votre architecture :
                      <div class="tuto-list">
                        <span>📝 Narrative de votre transformation</span>
                        <span>📊 Score de maturité digitale</span>
                        <span>🎯 Jalons atteints</span>
                      </div>
                      <div class="tuto-tip">Plus vous ajoutez de modules et connexions, plus le rapport s'enrichit !</div>`,
            target: '#narrativePanel',
            highlightTarget: '.narrative-content',
            position: 'left',
            icon: '📊',
            sound: 'stepAppear'
        },

        // ===== STATS =====
        {
            id: 'stats',
            title: 'Statistiques en Direct',
            message: `Suivez l'évolution de votre architecture :
                      <div class="tuto-list">
                        <span>📦 Nombre de <strong>modules</strong> placés</span>
                        <span>🔗 Nombre de <strong>synergies</strong> (connexions)</span>
                      </div>`,
            target: '#narrativePanel',
            highlightTarget: '.narrative-stats',
            position: 'left',
            icon: '📈',
            sound: 'stepAppear'
        },

        // ===== PRESETS =====
        {
            id: 'presets',
            title: 'Architectures Prêtes à l\'Emploi',
            message: `Besoin d'inspiration ? Choisissez une <strong>architecture prédéfinie</strong> :
                      <div class="tuto-list">
                        <span>🏭 Architecture Industrielle</span>
                        <span>🛒 E-Commerce Complet</span>
                        <span>🏢 PME Moderne</span>
                        <span>... et plus encore</span>
                      </div>`,
            target: '#presetSelector',
            highlightTarget: '#presetSelector',
            position: 'bottom',
            icon: '🎁',
            sound: 'stepAppear'
        },

        // ===== SMART CONNECT =====
        {
            id: 'smart-connect',
            title: 'Optimisation Automatique',
            message: `Ce bouton magique <strong>organise automatiquement</strong> vos modules et suggère les meilleures connexions.
                      <div class="tuto-tip">⚡ Smart Connect analyse les synergies potentielles et optimise le placement.</div>`,
            target: '#smartConnectBtn',
            highlightTarget: '#smartConnectBtn',
            position: 'bottom',
            skipIfMissing: true,
            icon: '⚡',
            sound: 'stepAppear'
        },

        // ===== ZOOM CONTROLS =====
        {
            id: 'zoom-controls',
            title: 'Contrôles de Vue',
            message: `Utilisez ces boutons pour :
                      <div class="tuto-list">
                        <span>🔍 Zoomer / Dézoomer</span>
                        <span>🎯 Recentrer la vue</span>
                      </div>
                      <div class="tuto-tip">Raccourci : utilisez la molette de la souris pour zoomer.</div>`,
            target: '.zoom-controls',
            highlightTarget: '.zoom-controls',
            position: 'top',
            skipIfMissing: true,
            icon: '🔍',
            sound: 'stepAppear'
        },

        // ===== KEYBOARD SHORTCUTS =====
        {
            id: 'shortcuts',
            title: 'Raccourcis Clavier',
            message: `Accélérez votre travail avec les raccourcis :
                      <div class="tuto-shortcuts">
                        <span><kbd>D</kbd> Afficher/Masquer dimensions</span>
                        <span><kbd>P</kbd> Afficher/Masquer panneaux</span>
                        <span><kbd>Espace</kbd> Mode focus</span>
                        <span><kbd>Suppr</kbd> Supprimer sélection</span>
                      </div>`,
            target: '.shortcut-hint',
            highlightTarget: '.shortcut-hint',
            position: 'top',
            skipIfMissing: true,
            icon: '⌨️',
            sound: 'stepAppear'
        },

        // ===== AUDIT BUTTON (dernière étape avant fin) =====
        {
            id: 'audit-button',
            title: 'Scannez Votre Architecture',
            message: `<strong>Dernière étape !</strong> Ce bouton analyse votre architecture et génère un <strong>diagnostic complet</strong> :
                      <div class="tuto-list">
                        <span>✅ Forces de votre architecture</span>
                        <span>⚠️ Points d'amélioration</span>
                        <span>🎯 Actions prioritaires</span>
                        <span>📊 Score de maturité</span>
                      </div>
                      <div class="tuto-tip">💡 Utilisez ce scanner après chaque modification majeure pour suivre votre progression.</div>`,
            target: '#ctaAudit',
            highlightTarget: '#ctaAudit',
            position: 'left',
            icon: '🔬',
            sound: 'actionRequired'
        },

        // ===== FINISH =====
        {
            id: 'done',
            title: 'Félicitations ! 🎉',
            message: `<strong>Vous maîtrisez Dimensions Playground !</strong>
                      <div class="tuto-summary">
                        <span>✅ Glisser des modules depuis les dimensions</span>
                        <span>✅ Créer des connexions entre modules</span>
                        <span>✅ Suivre le rapport de transformation</span>
                        <span>✅ Utiliser les recommandations intelligentes</span>
                        <span>✅ Scanner votre architecture</span>
                      </div>
                      <div class="tuto-cta">🚀 À vous de jouer ! Construisez votre transformation digitale.</div>`,
            position: 'center',
            isFinal: true,
            icon: '🏆',
            sound: 'celebration'
        }
    ];

    // Get all steps
    function getAll() {
        return steps;
    }

    // Get step by index
    function get(index) {
        return steps[index] || null;
    }

    // Get step by ID
    function getById(id) {
        return steps.find(s => s.id === id) || null;
    }

    // Get total count
    function count() {
        return steps.length;
    }

    return {
        getAll,
        get,
        getById,
        count
    };

})();

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TutorialSteps;
}
