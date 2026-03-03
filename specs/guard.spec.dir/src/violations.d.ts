/**
 * Violation Tracking for Guard System
 *
 * SPECLANG-GENERATED
 * Generated from: @speclang/agent-protocol/ownership
 */
import { Violation, ViolationReport, AgentRole } from './types';
/**
 * ViolationTracker - tracks all violations in the system
 */
export declare class ViolationTracker {
    private violations;
    private maxViolations;
    constructor(maxViolations?: number);
    /**
     * Record a new violation
     * @returns The violation ID
     */
    record(violation: Omit<Violation, 'id' | 'timestamp' | 'resolved'>): string;
    /**
     * Resolve a violation
     */
    resolve(violationId: string, resolution: Violation['resolution'], by: AgentRole): boolean;
    /**
     * Get all unresolved violations
     */
    getUnresolved(): Violation[];
    /**
     * Get violations by agent
     */
    getByAgent(agent: AgentRole): Violation[];
    /**
     * Get violations by file path
     */
    getByFilepath(filepath: string): Violation[];
    /**
     * Get all violations
     */
    getAll(): Violation[];
    /**
     * Get a specific violation by ID
     */
    get(violationId: string): Violation | undefined;
    /**
     * Export violation report for analytics
     */
    export(): ViolationReport;
    /**
     * Clear all violations
     */
    clear(): void;
    /**
     * Get violation count
     */
    count(): number;
    /**
     * Get unresolved count
     */
    unresolvedCount(): number;
    /**
     * Check if there are any unresolved violations
     */
    hasUnresolved(): boolean;
    /**
     * Get recent violations
     */
    getRecent(limit?: number): Violation[];
}
/**
 * Create a new violation tracker
 */
export declare function createViolationTracker(maxViolations?: number): ViolationTracker;
//# sourceMappingURL=violations.d.ts.map