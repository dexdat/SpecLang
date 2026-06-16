/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/event-routing.spec.md
 * Generated: 2026-03-03T05:35:00.000Z
 *
 * Edit the spec, not this file.
 */
import { FileEvent } from '../types/poc';
import { SimpleAgent } from './simple-agent';
/**
 * Routes file events to appropriate handlers
 * For POC: simple routing - all events go to SimpleAgent
 */
export declare class EventRouter {
    private agent;
    constructor(agent: SimpleAgent);
    /**
     * Route a file event to the appropriate handler
     * For POC: all events go to SimpleAgent
     * @param event - File change event
     */
    route(event: FileEvent): Promise<void>;
    /**
     * Route multiple events (batch)
     * @param events - Array of file events
     */
    routeBatch(events: FileEvent[]): Promise<void>;
}
//# sourceMappingURL=event-router.d.ts.map