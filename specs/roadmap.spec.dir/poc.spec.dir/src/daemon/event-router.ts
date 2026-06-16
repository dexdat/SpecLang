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
export class EventRouter {
  private agent: SimpleAgent;
  
  constructor(agent: SimpleAgent) {
    this.agent = agent;
  }
  
  /**
   * Route a file event to the appropriate handler
   * For POC: all events go to SimpleAgent
   * @param event - File change event
   */
  async route(event: FileEvent): Promise<void> {
    // POC: All events go to the single agent
    console.log(`[Router] Routing ${event.path} to SimpleAgent`);
    try {
      await this.agent.onFileChanged(event);
    } catch (error) {
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
  async routeBatch(events: FileEvent[]): Promise<void> {
    for (const event of events) {
      await this.route(event);
    }
  }
}
