/**
 * State persistence for speclangd
 *
 * Generated from: @speclang/daemon/architecture
 *
 * Persists daemon state to .speclang/daemon-state.json
 */
import { DaemonStatus, DaemonStatusKind, AgentId } from './types';
export interface DaemonState {
    cascadeDepth: number;
    filesChanged: string[];
    activeAgents: AgentId[];
    startedAt: number;
    lastEventAt?: number;
    quietSince?: number;
    status: DaemonStatusKind;
}
export declare class State {
    private state;
    private statePath;
    constructor(statePath?: string);
    /**
     * Create initial state
     */
    private createInitialState;
    /**
     * Load state from disk
     */
    load(): Promise<DaemonState>;
    /**
     * Save state to disk
     */
    save(): Promise<void>;
    /**
     * Get current state
     */
    get(): DaemonState;
    /**
     * Update status
     */
    setStatus(status: DaemonStatusKind): void;
    /**
     * Update cascade depth
     */
    setCascadeDepth(depth: number): void;
    /**
     * Add a changed file
     */
    addChangedFile(file: string): void;
    /**
     * Add an active agent
     */
    addActiveAgent(agentId: AgentId): void;
    /**
     * Remove an active agent
     */
    removeActiveAgent(agentId: AgentId): void;
    /**
     * Set quiet since timestamp
     */
    setQuietSince(timestamp: number): void;
    /**
     * Clear quiet since
     */
    clearQuietSince(): void;
    /**
     * Get status for API
     */
    getStatus(): DaemonStatus;
    /**
     * Reset state
     */
    reset(): Promise<void>;
    /**
     * Clear changed files
     */
    clearChangedFiles(): void;
}
//# sourceMappingURL=state.d.ts.map