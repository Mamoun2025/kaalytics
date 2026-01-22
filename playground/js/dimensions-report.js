/* ============================================
   DIMENSIONS REPORT GENERATOR v1.1
   Generates detailed architecture report
   Uses SemanticLoader for content access
   ============================================ */

const DimensionsReport = (function() {
    'use strict';

    // === INIT ===
    async function init() {
        setupButton();
        console.log('[Report] Generator initialized with SemanticLoader');
    }

    // === SETUP BUTTON ===
    function setupButton() {
        // Find existing CTA button and add report button next to it
        const ctaSection = document.querySelector('.cta-audit');
        if (ctaSection) {
            const reportBtn = document.createElement('button');
            reportBtn.className = 'btn-report';
            reportBtn.innerHTML = `
                <span class="btn-report-icon">📄</span>
                <span class="btn-report-text">Rapport détaillé</span>
            `;
            reportBtn.addEventListener('click', generateReport);

            // Insert after CTA
            ctaSection.parentNode.insertBefore(reportBtn, ctaSection.nextSibling);
        }
    }

    // === GENERATE REPORT ===
    function generateReport() {
        if (!SemanticLoader.isLoaded()) {
            alert('Chargement en cours...');
            return;
        }

        const modules = DimensionsData.getPlacedModules();
        const connections = DimensionsData.getConnections();

        if (modules.length === 0) {
            alert('Ajoutez des modules pour générer un rapport.');
            return;
        }

        const reportHtml = buildReportHtml(modules, connections);
        openReportWindow(reportHtml);
    }

    // === BUILD REPORT HTML ===
    function buildReportHtml(modules, connections) {
        const stats = DimensionsData.getStats();
        const dimensions = [...new Set(modules.map(m => m.dimension?.title).filter(Boolean))];
        const score = StoryMemory?.getTransformation()?.score || 0;

        let html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Transformation Digitale</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --brand-yellow: #EDA906;
            --bg-dark: #0f0f1a;
            --bg-card: #1a1a2e;
            --text-primary: #ffffff;
            --text-secondary: #a0a0b0;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-dark);
            color: var(--text-primary);
            line-height: 1.6;
            padding: 40px;
        }
        .report-container {
            max-width: 900px;
            margin: 0 auto;
        }
        .report-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid var(--brand-yellow);
        }
        .report-logo {
            font-size: 32px;
            font-weight: 700;
            color: var(--brand-yellow);
            margin-bottom: 10px;
        }
        .report-title {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .report-subtitle {
            color: var(--text-secondary);
            font-size: 14px;
        }
        .report-summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }
        .summary-card {
            background: var(--bg-card);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
        }
        .summary-value {
            font-size: 32px;
            font-weight: 700;
            color: var(--brand-yellow);
        }
        .summary-label {
            font-size: 12px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .module-card {
            background: var(--bg-card);
            padding: 24px;
            border-radius: 12px;
            margin-bottom: 16px;
            border-left: 4px solid var(--brand-yellow);
        }
        .module-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }
        .module-emoji {
            font-size: 24px;
        }
        .module-name {
            font-size: 18px;
            font-weight: 600;
        }
        .module-tagline {
            color: var(--brand-yellow);
            font-style: italic;
            margin-bottom: 12px;
        }
        .module-description {
            color: var(--text-secondary);
            margin-bottom: 16px;
        }
        .module-story {
            background: rgba(237, 169, 6, 0.1);
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 12px;
        }
        .module-story-title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: var(--brand-yellow);
            margin-bottom: 8px;
        }
        .module-impact {
            background: rgba(16, 185, 129, 0.1);
            padding: 16px;
            border-radius: 8px;
            border-left: 3px solid #10b981;
        }
        .module-impact-title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: #10b981;
            margin-bottom: 8px;
        }
        .synergy-card {
            background: var(--bg-card);
            padding: 24px;
            border-radius: 12px;
            margin-bottom: 16px;
            border-left: 4px solid #10b981;
        }
        .synergy-modules {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 8px;
        }
        .synergy-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .synergy-tagline {
            color: #10b981;
            font-style: italic;
            margin-bottom: 12px;
        }
        .report-footer {
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid rgba(255,255,255,0.1);
            color: var(--text-secondary);
            font-size: 12px;
        }
        @media print {
            body { background: white; color: #333; padding: 20px; }
            .module-card, .synergy-card, .summary-card { border: 1px solid #ddd; }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <header class="report-header">
            <div class="report-logo">Digital</div>
            <h1 class="report-title">Rapport de Transformation Digitale</h1>
            <p class="report-subtitle">Généré le ${new Date().toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
        </header>

        <div class="report-summary">
            <div class="summary-card">
                <div class="summary-value">${stats.moduleCount}</div>
                <div class="summary-label">Modules</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${stats.connectionCount}</div>
                <div class="summary-label">Synergies</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${dimensions.length}</div>
                <div class="summary-label">Dimensions</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${score}%</div>
                <div class="summary-label">Score</div>
            </div>
        </div>

        <section class="section">
            <h2 class="section-title">📦 Modules Déployés</h2>
            ${modules.map(m => buildModuleSection(m)).join('')}
        </section>

        ${connections.length > 0 ? `
        <section class="section">
            <h2 class="section-title">🔗 Synergies Actives</h2>
            ${connections.map(c => buildSynergySection(c, modules)).join('')}
        </section>
        ` : ''}

        <footer class="report-footer">
            <p>Rapport généré par Dimensions Playground</p>
            <p>© ${new Date().getFullYear()} - Transformation Digitale</p>
        </footer>
    </div>
</body>
</html>`;

        return html;
    }

    // === BUILD MODULE SECTION ===
    function buildModuleSection(module) {
        const rich = SemanticLoader.getModule(module.templateId) || {};
        const dimension = module.dimension || {};

        return `
            <div class="module-card">
                <div class="module-header">
                    <span class="module-emoji">${dimension.emoji || '📦'}</span>
                    <span class="module-name">${rich.name || module.name}</span>
                </div>
                ${rich.tagline ? `<p class="module-tagline">${rich.tagline}</p>` : ''}
                ${rich.description_short ? `<p class="module-description">${rich.description_short}</p>` : ''}
                ${rich.transformation_story?.deep_narrative ? `
                    <div class="module-story">
                        <div class="module-story-title">Transformation</div>
                        <p>${rich.transformation_story.deep_narrative}</p>
                    </div>
                ` : ''}
                ${rich.transformation_story?.business_impact ? `
                    <div class="module-impact">
                        <div class="module-impact-title">Impact Business</div>
                        <p>${rich.transformation_story.business_impact}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // === BUILD SYNERGY SECTION ===
    function buildSynergySection(connection, modules) {
        const fromModule = modules.find(m => m.id === connection.fromModule);
        const toModule = modules.find(m => m.id === connection.toModule);
        if (!fromModule || !toModule) return '';

        const synergy = SemanticLoader.getSynergy(fromModule.templateId, toModule.templateId) || {};

        return `
            <div class="synergy-card">
                <div class="synergy-modules">${fromModule.name} ↔ ${toModule.name}</div>
                <div class="synergy-name">${synergy.name || 'Synergie'}</div>
                ${synergy.tagline ? `<p class="synergy-tagline">${synergy.tagline}</p>` : ''}
                ${synergy.story_paragraph ? `<p class="module-description">${synergy.story_paragraph}</p>` : ''}
                ${synergy.impact_narrative ? `
                    <div class="module-impact">
                        <div class="module-impact-title">Impact</div>
                        <p>${synergy.impact_narrative}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // === OPEN REPORT WINDOW ===
    function openReportWindow(html) {
        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(html);
        reportWindow.document.close();
    }

    // === PUBLIC API ===
    return {
        init,
        generateReport
    };

})();

// Auto-initialize after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        DimensionsReport.init();
    }, 600);
});
