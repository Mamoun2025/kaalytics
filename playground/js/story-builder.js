/* ============================================
   STORY BUILDER v1.1
   Builds narrative paragraphs from rich semantic content
   Uses SemanticLoader for content access
   ============================================ */

const StoryBuilder = (function() {
    'use strict';

    // === LOADED STATE ===
    let isLoaded = false;

    // === INITIALIZATION ===
    async function init() {
        try {
            // Wait for SemanticLoader
            await SemanticLoader.init();

            // Initialize threads in StoryMemory
            initializeThreads();

            isLoaded = true;
            console.log('[StoryBuilder] Initialized with SemanticLoader');
        } catch (error) {
            console.error('[StoryBuilder] Failed to initialize:', error);
        }
    }

    // === INITIALIZE THREADS IN STORYMEMORY ===
    function initializeThreads() {
        const threads = SemanticLoader.getAllThreads();
        Object.entries(threads).forEach(([threadId, threadDef]) => {
            StoryMemory.initThread(threadId, threadDef);
        });
    }

    // === PROXY METHODS TO SEMANTIC LOADER ===
    function getRichModule(templateId) {
        return SemanticLoader.getModule(templateId);
    }

    function getRichSynergy(templateId1, templateId2) {
        return SemanticLoader.getSynergy(templateId1, templateId2);
    }

    function getMultiSynergy(templateIds) {
        return SemanticLoader.getMultiSynergy(templateIds);
    }

    function getModuleThreads(templateId) {
        return SemanticLoader.getModuleThreads(templateId);
    }

    // === BUILD MODULE PARAGRAPH ===
    function buildModuleParagraph(module, context) {
        const richModule = getRichModule(module.templateId);
        const threads = getModuleThreads(module.templateId);
        const storyContext = StoryMemory.getStoryContext();

        let paragraph = '';

        // === 1. TRANSITION (if not first module) ===
        if (!StoryMemory.isFirstModule()) {
            paragraph += buildTransition(module, threads, storyContext);
        }

        // === 2. MODULE INTRODUCTION ===
        if (richModule) {
            const story = richModule.transformation_story;
            const isFirstOfDimension = context.isFirstOfDimension;

            if (StoryMemory.isFirstModule()) {
                paragraph += story?.intro || richModule.description_full || richModule.description_short;
            } else if (isFirstOfDimension) {
                paragraph += buildDimensionIntro(module, richModule);
            } else {
                paragraph += story?.deep_narrative || richModule.description_full || richModule.description_short;
            }

            // === 3. THREAD CONNECTION (for 3+ modules) ===
            if (storyContext.paragraphCount >= 2 && threads.primary) {
                paragraph += ' ' + buildThreadConnection(threads, storyContext);
            }
        } else {
            paragraph += `Le module ${module.name} renforce votre architecture.`;
        }

        // === 4. UPDATE THREADS ===
        updateThreadContributions(module, threads, paragraph);

        // === 5. STORE IN MEMORY ===
        StoryMemory.addModuleEvent(module, paragraph);
        StoryMemory.addParagraphToChapter(paragraph, {
            type: 'module',
            moduleId: module.id,
            templateId: module.templateId,
            threads: threads
        });

        return paragraph;
    }

    // === BUILD CONNECTION PARAGRAPH ===
    function buildConnectionParagraph(connection, fromModule, toModule) {
        const synergy = getRichSynergy(fromModule.templateId, toModule.templateId);
        const isCrossDimension = fromModule.dimension?.id !== toModule.dimension?.id;
        const storyContext = StoryMemory.getStoryContext();

        let paragraph = '';

        // === 1. CONNECTION HOOK ===
        paragraph += buildConnectionHook(fromModule, toModule, isCrossDimension, storyContext);

        // === 2. SYNERGY CONTENT ===
        if (synergy) {
            paragraph += `<strong>${synergy.name}</strong>`;
            if (synergy.tagline) {
                paragraph += ` — ${synergy.tagline}`;
            }
            paragraph += '. ';

            if (synergy.story_paragraph) {
                paragraph += synergy.story_paragraph + ' ';
            }

            if (synergy.impact_narrative && storyContext.paragraphCount >= 3) {
                paragraph += synergy.impact_narrative;
            }
        } else {
            paragraph += buildGenericSynergy(fromModule, toModule, isCrossDimension);
        }

        // === 3. BOOST INTEGRATION THREAD ===
        if (isCrossDimension) {
            StoryMemory.contributeToThread('integration', {
                type: 'connection',
                connectionId: connection.id,
                paragraph: paragraph
            });
        }

        // === 4. STORE IN MEMORY ===
        StoryMemory.addConnectionEvent(connection, fromModule, toModule, synergy, paragraph);
        StoryMemory.addParagraphToChapter(paragraph, {
            type: 'connection',
            connectionId: connection.id,
            synergyName: synergy?.name,
            isCrossDimension: isCrossDimension
        });

        return paragraph;
    }

    // === BUILD TRANSITION ===
    function buildTransition(module, threads, storyContext) {
        const lastEvent = storyContext.lastEvent;
        const dominantThread = storyContext.dominantThread;
        const primaryThread = threads.primary;

        if (lastEvent?.type === 'connection_added') {
            return pickRandom([
                "Fort de cette synergie, ",
                "Sur ces bases connectées, ",
                "Cette intégration ouvre la voie : "
            ]);
        }

        if (primaryThread && dominantThread && primaryThread === dominantThread.id) {
            const threadDef = SemanticLoader.getThread(primaryThread);
            if (threadDef?.transitions) {
                return pickRandom(threadDef.transitions);
            }
            return pickRandom([
                "Dans cette même dynamique, ",
                "Renforçant cette orientation, ",
                "Cette logique se poursuit : "
            ]);
        }

        if (primaryThread) {
            const threadDef = SemanticLoader.getThread(primaryThread);
            if (threadDef) {
                return pickRandom([
                    `Un nouvel axe s'ouvre — ${threadDef.name.toLowerCase()} : `,
                    `L'architecture s'enrichit. `,
                    "Une nouvelle dimension émerge : "
                ]);
            }
        }

        return pickRandom([
            "L'édifice grandit. ",
            "La transformation se poursuit : ",
            "Votre système s'enrichit. "
        ]);
    }

    // === BUILD DIMENSION INTRO ===
    function buildDimensionIntro(module, richModule) {
        const dimEmoji = module.dimension?.emoji || '';
        const dimTitle = module.dimension?.title || '';
        const story = richModule.transformation_story;

        let intro = `${dimEmoji} <strong>${dimTitle}</strong> entre dans votre architecture. `;
        intro += story?.intro || richModule.description_short;

        return intro;
    }

    // === BUILD THREAD CONNECTION ===
    function buildThreadConnection(threads, storyContext) {
        const primaryThread = threads.primary;
        if (!primaryThread) return '';

        const threadStrength = StoryMemory.getThreadStrength(primaryThread);
        const threadDef = SemanticLoader.getThread(primaryThread);

        if (threadStrength >= 2 && threadDef?.strengthDescriptions) {
            const level = Math.min(threadStrength, 5);
            const desc = threadDef.strengthDescriptions[level.toString()];
            if (desc) {
                return desc;
            }
        }

        return '';
    }

    // === BUILD CONNECTION HOOK ===
    function buildConnectionHook(fromModule, toModule, isCrossDimension, storyContext) {
        if (StoryMemory.isFirstConnection()) {
            return "La première synergie émerge. ";
        }

        if (isCrossDimension) {
            return pickRandom([
                `${fromModule.dimension?.emoji} et ${toModule.dimension?.emoji} fusionnent. `,
                "Un pont stratégique se construit. ",
                "Les dimensions se rejoignent. "
            ]);
        }

        return pickRandom([
            "La cohérence interne se renforce. ",
            "Une synergie naturelle apparaît. ",
            "Les capacités s'entrelacent. "
        ]);
    }

    // === BUILD GENERIC SYNERGY ===
    function buildGenericSynergy(fromModule, toModule, isCrossDimension) {
        if (isCrossDimension) {
            return `${fromModule.name} et ${toModule.name} créent un pont entre ${fromModule.dimension?.title} et ${toModule.dimension?.title}. Cette connexion cross-dimension amplifie les capacités des deux domaines.`;
        }

        return `${fromModule.name} et ${toModule.name} fonctionnent ensemble, créant une synergie au sein de ${fromModule.dimension?.title}. L'efficacité combinée dépasse la somme des parties.`;
    }

    // === UPDATE THREAD CONTRIBUTIONS ===
    function updateThreadContributions(module, threads, paragraph) {
        if (threads.primary) {
            StoryMemory.contributeToThread(threads.primary, {
                type: 'module',
                moduleId: module.id,
                paragraph: paragraph
            });
        }
    }

    // === BUILD CHAPTER TRANSITION ===
    function buildChapterTransition(fromChapter, toChapter) {
        const fromDef = StoryMemory.CHAPTERS[fromChapter];
        const toDef = StoryMemory.CHAPTERS[toChapter];

        let paragraph = '';

        if (fromDef?.closingLine) {
            paragraph += fromDef.closingLine + ' ';
        }

        paragraph += `<strong class="chapter-title">${toDef.title}</strong>. `;
        if (toDef?.openingLine) {
            paragraph += toDef.openingLine;
        }

        StoryMemory.addParagraphToChapter(paragraph, {
            type: 'chapter_transition',
            fromChapter: fromChapter,
            toChapter: toChapter
        });

        return paragraph;
    }

    // === BUILD MULTI-CONNECTION PARAGRAPH ===
    function buildMultiConnectionParagraph(moduleIds, templateIds) {
        const multiSynergy = getMultiSynergy(templateIds);

        if (!multiSynergy) return null;

        let paragraph = `<strong>${multiSynergy.name}</strong>`;
        if (multiSynergy.tagline) {
            paragraph += ` — ${multiSynergy.tagline}`;
        }
        paragraph += '. ';

        if (multiSynergy.story_paragraph) {
            paragraph += multiSynergy.story_paragraph + ' ';
        }

        if (multiSynergy.cumulative_impact) {
            paragraph += multiSynergy.cumulative_impact;
        }

        return paragraph;
    }

    // === GET STORY SUMMARY ===
    function getStorySummary() {
        const context = StoryMemory.getStoryContext();
        const chapter = context.currentChapter;
        const threads = context.activeThreads;

        return {
            chapterTitle: chapter.title,
            chapterStyle: chapter.style,
            paragraphs: StoryMemory.getAllParagraphs(),
            activeThreads: threads.slice(0, 3),
            score: context.transformation.score,
            totalEvents: context.timeline.length
        };
    }

    // === RENDER SUCCINCT STORY HTML ===
    function renderStoryHtml() {
        const currentModules = typeof DimensionsData !== 'undefined'
            ? DimensionsData.getPlacedModules()
            : [];
        const currentConnections = typeof DimensionsData !== 'undefined'
            ? DimensionsData.getConnections()
            : [];

        const moduleCount = currentModules.length;
        const connectionCount = currentConnections.length;
        const context = StoryMemory.getStoryContext();
        const score = context.transformation.score;

        if (moduleCount === 0) {
            return '';
        }

        const summary = buildSemanticSummary(currentModules, currentConnections);

        let html = '';

        html += `<div class="story-summary">`;
        html += `<p class="story-summary-text">${summary}</p>`;
        html += `</div>`;

        if (score > 10) {
            html += `
                <div class="story-score-compact">
                    <div class="story-score-bar-mini">
                        <div class="story-score-fill-mini" style="width: ${score}%"></div>
                    </div>
                    <span class="story-score-label-mini">${score}%</span>
                </div>
            `;
        }

        return html;
    }

    // === BUILD SEMANTIC SUMMARY ===
    function buildSemanticSummary(modules, connections) {
        const moduleCount = modules.length;
        const connectionCount = connections.length;

        const getConnectionInfo = (conn) => {
            const fromMod = modules.find(m => m.id === conn.fromModule);
            const toMod = modules.find(m => m.id === conn.toModule);
            if (!fromMod || !toMod) return null;
            return {
                fromTemplateId: fromMod.templateId,
                toTemplateId: toMod.templateId,
                fromName: fromMod.name,
                toName: toMod.name,
                isCrossDimension: fromMod.dimension?.id !== toMod.dimension?.id
            };
        };

        // === 1 MODULE ===
        if (moduleCount === 1) {
            const mod = modules[0];
            const rich = getRichModule(mod.templateId);
            if (rich) {
                const shortDesc = rich.description_short?.split('.')[0] || '';
                return `<strong>${rich.tagline || mod.name}</strong>. ${shortDesc}.`;
            }
            return `<strong>${mod.name}</strong> pose la première pierre de votre transformation.`;
        }

        // === 2 MODULES ===
        if (moduleCount === 2) {
            const mod1 = modules[0];
            const mod2 = modules[1];

            let text = `<strong>${mod1.name}</strong> et <strong>${mod2.name}</strong> constituent vos fondations.`;

            if (connectionCount > 0) {
                const connInfo = getConnectionInfo(connections[0]);
                if (connInfo) {
                    const synergy = getRichSynergy(connInfo.fromTemplateId, connInfo.toTemplateId);
                    if (synergy) {
                        const storyFirst = synergy.story_paragraph?.split('.')[0] || synergy.tagline;
                        text = `<strong>${synergy.name}</strong> — ${storyFirst}.`;
                    } else {
                        text += ` Le premier flux de données circule entre eux.`;
                    }
                }
            } else {
                text += ` Connectez-les pour révéler leur synergie.`;
            }
            return text;
        }

        // === 3-4 MODULES ===
        if (moduleCount <= 4) {
            const parts = [];

            const dimensionNames = [...new Set(modules.map(m => m.dimension?.title).filter(Boolean))];
            if (dimensionNames.length > 1) {
                parts.push(`${moduleCount} capacités couvrant ${dimensionNames.length} dimensions.`);
            } else {
                parts.push(`${moduleCount} capacités ${dimensionNames[0] || ''} en place.`);
            }

            if (connectionCount > 0) {
                const lastConnInfo = getConnectionInfo(connections[connectionCount - 1]);
                if (lastConnInfo) {
                    const synergy = getRichSynergy(lastConnInfo.fromTemplateId, lastConnInfo.toTemplateId);
                    if (synergy?.tagline) {
                        parts.push(synergy.tagline);
                    } else if (lastConnInfo.isCrossDimension) {
                        parts.push(`Pont établi entre ${lastConnInfo.fromName} et ${lastConnInfo.toName}.`);
                    }
                }
            } else {
                const lastMod = modules[moduleCount - 1];
                const lastRich = getRichModule(lastMod.templateId);
                if (lastRich?.tagline) {
                    parts.push(lastRich.tagline);
                }
            }

            return parts.join(' ');
        }

        // === 5+ MODULES ===
        const parts = [];
        const dimensionNames = [...new Set(modules.map(m => m.dimension?.title).filter(Boolean))];

        let crossDimCount = 0;
        connections.forEach(conn => {
            const info = getConnectionInfo(conn);
            if (info?.isCrossDimension) crossDimCount++;
        });

        if (crossDimCount >= 2) {
            parts.push(`Écosystème de ${moduleCount} capacités sur ${dimensionNames.length} dimensions.`);
        } else {
            parts.push(`${moduleCount} modules actifs, ${connectionCount} synergies établies.`);
        }

        if (connectionCount > 0) {
            const lastConnInfo = getConnectionInfo(connections[connectionCount - 1]);
            if (lastConnInfo) {
                const synergy = getRichSynergy(lastConnInfo.fromTemplateId, lastConnInfo.toTemplateId);
                if (synergy) {
                    const storyFirst = synergy.story_paragraph?.split('.')[0];
                    if (storyFirst && storyFirst.length < 100) {
                        parts.push(storyFirst + '.');
                    } else if (synergy.tagline) {
                        parts.push(synergy.tagline);
                    }
                }
            }
        }

        if (moduleCount >= 7 && crossDimCount >= 3) {
            parts.push(`L'intégration cross-dimension génère de la valeur.`);
        }

        return parts.join(' ');
    }

    // === UTILITIES ===
    function pickRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // === PUBLIC API ===
    return {
        init,

        // Content access (proxied to SemanticLoader)
        getRichModule,
        getRichSynergy,
        getMultiSynergy,
        getModuleThreads,

        // Paragraph building
        buildModuleParagraph,
        buildConnectionParagraph,
        buildChapterTransition,
        buildMultiConnectionParagraph,

        // Story output
        getStorySummary,
        renderStoryHtml,

        // State
        isLoaded: () => isLoaded
    };

})();
