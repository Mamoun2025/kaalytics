/* ============================================
   SEMANTIC TESTS v1.0
   Unit tests for SemanticLoader & StoryBuilder
   Run in browser console or via SemanticTests.run()
   ============================================ */

const SemanticTests = (function() {
    'use strict';

    // === TEST STATE ===
    let passed = 0;
    let failed = 0;
    let results = [];

    // === ASSERTIONS ===

    function assert(condition, testName) {
        if (condition) {
            passed++;
            results.push({ test: testName, status: 'PASS' });
            return true;
        } else {
            failed++;
            results.push({ test: testName, status: 'FAIL' });
            console.error(`❌ FAIL: ${testName}`);
            return false;
        }
    }

    function assertEqual(actual, expected, testName) {
        const pass = actual === expected;
        if (!pass) {
            console.error(`   Expected: ${expected}, Got: ${actual}`);
        }
        return assert(pass, testName);
    }

    function assertNotNull(value, testName) {
        return assert(value !== null && value !== undefined, testName);
    }

    function assertNull(value, testName) {
        return assert(value === null, testName);
    }

    function assertType(value, type, testName) {
        return assert(typeof value === type, testName);
    }

    function assertArray(value, testName) {
        return assert(Array.isArray(value), testName);
    }

    // === TEST SUITES ===

    function testSemanticLoaderState() {
        console.group('📦 SemanticLoader State');

        assert(typeof SemanticLoader !== 'undefined', 'SemanticLoader exists');
        assert(SemanticLoader.isLoaded(), 'SemanticLoader is loaded');

        const stats = SemanticLoader.getStats();
        assertType(stats, 'object', 'getStats returns object');
        assert(stats.modules > 0, 'Has loaded modules');
        assert(stats.synergies > 0, 'Has loaded synergies');

        console.groupEnd();
    }

    function testModuleAccess() {
        console.group('📦 Module Access');

        // Valid module
        const opsMap = SemanticLoader.getModule('ops-map');
        assertNotNull(opsMap, 'getModule("ops-map") returns data');
        assertType(opsMap?.name, 'string', 'Module has name');
        assertType(opsMap?.tagline, 'string', 'Module has tagline');

        // Another valid module
        const opsFleet = SemanticLoader.getModule('ops-fleet');
        assertNotNull(opsFleet, 'getModule("ops-fleet") returns data');

        // Invalid module
        const invalid = SemanticLoader.getModule('invalid-module-xyz');
        assertNull(invalid, 'getModule with invalid ID returns null');

        // Edge cases
        assertNull(SemanticLoader.getModule(null), 'getModule(null) returns null');
        assertNull(SemanticLoader.getModule(undefined), 'getModule(undefined) returns null');
        assertNull(SemanticLoader.getModule(''), 'getModule("") returns null');
        assertNull(SemanticLoader.getModule(123), 'getModule(number) returns null');

        console.groupEnd();
    }

    function testSynergyAccess() {
        console.group('🔗 Synergy Access');

        // Valid synergy (order 1)
        const synergy1 = SemanticLoader.getSynergy('ops-fleet', 'ops-map');
        assertNotNull(synergy1, 'getSynergy("ops-fleet", "ops-map") returns data');

        // Same synergy (order 2) - bidirectional
        const synergy2 = SemanticLoader.getSynergy('ops-map', 'ops-fleet');
        assertNotNull(synergy2, 'getSynergy is bidirectional');
        assertEqual(synergy1?.name, synergy2?.name, 'Both orders return same synergy');

        // Synergy structure
        if (synergy1) {
            assertType(synergy1.name, 'string', 'Synergy has name');
            assertType(synergy1.tagline, 'string', 'Synergy has tagline');
        }

        // Invalid synergy
        const invalid = SemanticLoader.getSynergy('invalid-1', 'invalid-2');
        assertNull(invalid, 'getSynergy with invalid IDs returns null');

        // Edge cases
        assertNull(SemanticLoader.getSynergy(null, 'ops-map'), 'getSynergy(null, x) returns null');
        assertNull(SemanticLoader.getSynergy('ops-map', null), 'getSynergy(x, null) returns null');

        console.groupEnd();
    }

    function testThreadAccess() {
        console.group('🧵 Thread Access');

        // Get module threads
        const threads = SemanticLoader.getModuleThreads('ops-map');
        assertType(threads, 'object', 'getModuleThreads returns object');
        assertType(threads.primary, 'string', 'Has primary thread');
        assertArray(threads.secondary, 'secondary is array');

        // Get thread definition
        const visibilityThread = SemanticLoader.getThread('visibility');
        assertNotNull(visibilityThread, 'getThread("visibility") returns data');
        assertType(visibilityThread?.name, 'string', 'Thread has name');

        // Get all threads
        const allThreads = SemanticLoader.getAllThreads();
        assertType(allThreads, 'object', 'getAllThreads returns object');
        assert(Object.keys(allThreads).length > 0, 'Has multiple threads');

        // Invalid thread
        assertNull(SemanticLoader.getThread('invalid-thread'), 'Invalid thread returns null');

        // Edge cases for getModuleThreads
        const emptyThreads = SemanticLoader.getModuleThreads('invalid-module');
        assertNull(emptyThreads.primary, 'Invalid module has null primary');
        assertArray(emptyThreads.secondary, 'Invalid module has empty secondary array');

        console.groupEnd();
    }

    function testStoryBuilder() {
        console.group('📖 StoryBuilder');

        assert(typeof StoryBuilder !== 'undefined', 'StoryBuilder exists');
        assert(StoryBuilder.isLoaded(), 'StoryBuilder is loaded');

        // Test proxy methods
        const module = StoryBuilder.getRichModule('ops-map');
        assertNotNull(module, 'getRichModule works through proxy');

        const synergy = StoryBuilder.getRichSynergy('ops-fleet', 'ops-map');
        assertNotNull(synergy, 'getRichSynergy works through proxy');

        console.groupEnd();
    }

    function testStoryMemory() {
        console.group('🧠 StoryMemory');

        assert(typeof StoryMemory !== 'undefined', 'StoryMemory exists');

        // Test context
        const context = StoryMemory.getStoryContext();
        assertType(context, 'object', 'getStoryContext returns object');
        assertType(context.currentChapter, 'object', 'Has currentChapter');
        assertType(context.transformation, 'object', 'Has transformation');

        // Test chapter
        const chapter = StoryMemory.getCurrentChapter();
        assertType(chapter.title, 'string', 'Chapter has title');
        assertType(chapter.style, 'string', 'Chapter has style');

        console.groupEnd();
    }

    function testErrorHandling() {
        console.group('⚠️ Error Handling');

        // Load errors should be an array
        const errors = SemanticLoader.getLoadErrors();
        assertArray(errors, 'getLoadErrors returns array');

        // Stats should include error count
        const stats = SemanticLoader.getStats();
        assertType(stats.errors, 'number', 'Stats includes error count');

        console.groupEnd();
    }

    // === MAIN RUN ===

    function run() {
        // Reset state
        passed = 0;
        failed = 0;
        results = [];

        console.log('%c🧪 SEMANTIC TESTS', 'font-size: 16px; font-weight: bold; color: #10b981;');
        console.log('─'.repeat(50));

        // Run all test suites
        testSemanticLoaderState();
        testModuleAccess();
        testSynergyAccess();
        testThreadAccess();
        testStoryBuilder();
        testStoryMemory();
        testErrorHandling();

        // Summary
        console.log('─'.repeat(50));
        const total = passed + failed;
        const percentage = Math.round((passed / total) * 100);

        if (failed === 0) {
            console.log(`%c✅ ALL TESTS PASSED: ${passed}/${total} (100%)`, 'color: #10b981; font-weight: bold;');
        } else {
            console.log(`%c⚠️ TESTS: ${passed}/${total} passed (${percentage}%)`, 'color: #10b981; font-weight: bold;');
            console.log(`%c❌ ${failed} test(s) failed`, 'color: #065f46;');
        }

        return {
            passed,
            failed,
            total,
            percentage,
            results
        };
    }

    // === PUBLIC API ===
    return {
        run,
        getResults: () => ({ passed, failed, results })
    };

})();

// Auto-run option (uncomment to run on load)
// document.addEventListener('DOMContentLoaded', () => {
//     setTimeout(() => SemanticTests.run(), 1000);
// });
