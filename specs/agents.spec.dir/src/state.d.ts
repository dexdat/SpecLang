/**
 * State persistence for agents
 *
 * Generated from: @speclang/agent-protocol
 */
import { AgentState, AgentRole, Task } from './types';
/**
 * State Manager - persists agent state to disk
 */
export declare class StateManager {
    private stateDir;
    constructor(stateDir?: string);
    /**
     * Ensure state directory exists
     */
    private ensureDir;
    /**
     * Get path for session state file
     */
    private getStatePath;
    /**
     * Save agent state
     */
    save(sessionId: string, state: AgentState): Promise<void>;
    /**
     * Load agent state
     */
    load(sessionId: string): Promise<AgentState | null>;
    /**
     * List all persisted session IDs
     */
    list(): Promise<string[]>;
    /**
     * Delete persisted state
     */
    delete(sessionId: string): Promise<void>;
    /**
     * Garbage collect old sessions
     */
    gc(maxAgeMs: number): Promise<number>;
    /**
     * Check if session state exists
     */
    exists(sessionId: string): Promise<boolean>;
    /**
     * Get state file info
     */
    getInfo(sessionId: string): Promise<{
        created: Date;
        modified: Date;
        size: number;
    } | null>;
}
/**
 * Convert session to persistable state
 */
export declare function sessionToState(sessionId: string, agentRole: AgentRole, workingOn: string | null, pendingTasks: Task[], completedTasks: Task[], errors: Error[]): AgentState;
/**
 * Create a new state manager
 */
export declare function createStateManager(stateDir?: string): StateManager;
//# sourceMappingURL=state.d.ts.map