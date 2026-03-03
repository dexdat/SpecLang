"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/event-routing.spec.md
 * Generated: 2026-03-03T05:35:00.000Z
 *
 * Edit the spec, not this file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRouter = void 0;
/**
 * Routes file events to appropriate handlers
 * For POC: simple routing - all events go to SimpleAgent
 */
class EventRouter {
    agent;
    constructor(agent) {
        this.agent = agent;
    }
    /**
     * Route a file event to the appropriate handler
     * For POC: all events go to SimpleAgent
     * @param event - File change event
     */
    async route(event) {
        // POC: All events go to the single agent
        console.log(`[Router] Routing ${event.path} to SimpleAgent`);
        try {
            await this.agent.onFileChanged(event);
        }
        catch (error) {
            console.error(`[Router] Failed to process ${event.path}:`, error);
            // POC: Just log and continue
            // MVP: Retry logic, error reporting, etc.
            throw error; // Re-throw so caller knows it failed
        }
    }
    /**
     * Route multiple events (batch)
     * @param events - Array of file events
     */
    async routeBatch(events) {
        for (const event of events) {
            await this.route(event);
        }
    }
}
exports.EventRouter = EventRouter;
//# sourceMappingURL=event-router.js.map