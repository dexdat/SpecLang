/**
 * Violation Tracker - Records and reports ownership violations
 *
 * Generated from: @speclang/agent-protocol @block:violationtracker
 */
import { AgentRole } from './types';
export interface Violation {
    id: string;
    agentId: string;
    agentRole: AgentRole;
    filepath: string;
    action: 'write_attempt_denied' | 'ownership_conflict' | 'rule_violation';
    reason: string;
    timestamp: number;
    resolved: boolean;
}
export interface ViolationStats {
    total: number;
    resolved: number;
    unresolved: number;
    byAgent: Record<AgentRole, number>;
    byAction: Record<string, number>;
}
export declare class ViolationTracker {
    private violations;
    private maxViolations;
    constructor(maxViolations?: number);
    /**
     * Generate unique violation ID
     */
    private generateId;
    /**
     * Record a new violation
     */
    record(violation: Omit<Violation, 'id' | 'resolved'>): Violation;
    /**
     * Get violation by ID
     */
    get(id: string): Violation | undefined;
    /**
     * Get all violations
     */
    getViolations(): Violation[];
    /**
     * Get unresolved violations
     */
    getUnresolved(): Violation[];
    /**
     * Get violations for a specific agent
     */
    getByAgent(agentId: string): Violation[];
    /**
     * Get violations for a specific file
     */
    getByFile(filepath: string): Violation[];
    /**
     * Mark a violation as resolved
     */
    resolve(id: string): boolean;
    /**
     * Get statistics
     */
    getStats(): ViolationStats;
    /**
     * Clear all violations
     */
    clear(): void;
    /**
     * Prune old violations when limit is reached
     */
    private prune;
    /**
     * Get count
     */
    count(): number;
    /**
     * Export violations as JSON
     */
    export(): string;
    /**
     * Import violations from JSON
     */
    import(json: string): void;
}
export declare function createViolationTracker(maxViolations?: number): ViolationTracker;
//# sourceMappingURL=violations.d.ts.map