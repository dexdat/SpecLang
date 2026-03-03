/**
 * Ownership Registry for Guard System
 *
 * SPECLANG-GENERATED
 * Generated from: @speclang/agent-protocol/ownership
 */
import { OwnershipRule, OwnershipCheck, Conflict, OverrideRule, AgentRole } from './types';
/**
 * OwnershipRegistry - manages ownership rules and checks
 */
export declare class OwnershipRegistry {
    private rules;
    private overrides;
    private ownershipCache;
    constructor(rules?: OwnershipRule[]);
    /**
     * Add a new rule to the registry
     */
    addRule(rule: OwnershipRule): void;
    /**
     * Remove a rule by agent role
     */
    removeRule(agent: AgentRole): void;
    /**
     * Get the owner of a file path
     */
    getOwner(filepath: string): AgentRole | null;
    /**
     * Check if an agent can write to a file
     */
    canWrite(agent: AgentRole, filepath: string): OwnershipCheck;
    /**
     * Check if an agent can read a file (always allowed)
     */
    canRead(_agent: AgentRole, _filepath: string): OwnershipCheck;
    /**
     * Get all files owned by a specific agent
     */
    getOwnedFiles(agent: AgentRole): string[];
    /**
     * Get all rules
     */
    getRules(): OwnershipRule[];
    /**
     * Add an override for a specific file
     */
    addOverride(override: OverrideRule): void;
    /**
     * Remove an override
     */
    removeOverride(filepath: string): boolean;
    /**
     * Get override for a file
     */
    getOverride(filepath: string): OverrideRule | undefined;
    /**
     * Get all overrides
     */
    getOverrides(): OverrideRule[];
    /**
     * Resolve conflicts between agents claiming same files
     */
    resolveConflicts(): Conflict[];
    /**
     * Match a filepath against a glob pattern
     */
    private matchPattern;
    /**
     * Get files matching a pattern (simplified)
     * In production, this would use glob expansion
     */
    private getFilesMatchingPattern;
    /**
     * Invalidate cache for a specific file
     */
    invalidate(filepath: string): void;
    /**
     * Clear entire cache
     */
    clearCache(): void;
    /**
     * Get ownership info for multiple files
     */
    getOwnershipBatch(files: string[]): Map<string, AgentRole | null>;
    /**
     * Check if a filepath matches any rule
     */
    hasMatchingRule(filepath: string): boolean;
    /**
     * Get rule for an agent
     */
    getRuleForAgent(agent: AgentRole): OwnershipRule | undefined;
}
/**
 * Create a new ownership registry with default rules
 */
export declare function createOwnershipRegistry(rules?: OwnershipRule[]): OwnershipRegistry;
/**
 * Create an override rule
 */
export declare function createOverride(filepath: string, assignedAgent: AgentRole, reason: string, createdBy: AgentRole, expiresInMs?: number): OverrideRule;
//# sourceMappingURL=registry.d.ts.map