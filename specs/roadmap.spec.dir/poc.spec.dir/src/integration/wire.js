"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/integration.spec.md
 * Generated: 2026-03-03T10:54:00.000Z
 *
 * Edit the spec, not this file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.wireComponents = wireComponents;
exports.createDaemon = createDaemon;
const poc_file_watcher_1 = require("../daemon/poc-file-watcher");
const event_router_1 = require("../daemon/event-router");
const simple_agent_1 = require("../daemon/simple-agent");
const poc_convergence_1 = require("../daemon/poc-convergence");
/**
 * Wire all POC components together.
 * Returns the connected components for integration testing.
 */
function wireComponents() {
    // Create components
    const agent = new simple_agent_1.SimpleAgent();
    const router = new event_router_1.EventRouter(agent);
    const watcher = new poc_file_watcher_1.FileWatcher({
        watchDir: './specs',
        ignorePatterns: ['*.tmp', '*~', '.git/**', 'node_modules/**']
    });
    const convergence = new poc_convergence_1.ConvergenceDetector({
        quietPeriodMs: 5000
    });
    // Wire events
    watcher.on('change', (event) => {
        router.route(event).catch((error) => {
            console.error('[Wire] Failed to route event:', error);
        });
    });
    watcher.on('change', (event) => {
        convergence.onFileChange(event.path);
    });
    convergence.on('converged', (event) => {
        console.log(`✅ Cascade converged (${event.duration}ms)`);
        console.log(`   Files changed: ${event.filesChanged.length}`);
    });
    watcher.on('error', (error) => {
        console.error('[Watcher Error]', error);
    });
    return { watcher, router, agent, convergence };
}
/**
 * Create a configured daemon instance.
 * For integration tests that need a full daemon.
 */
function createDaemon() {
    const { watcher, router, agent, convergence } = wireComponents();
    return { watcher, router, agent, convergence };
}
//# sourceMappingURL=wire.js.map