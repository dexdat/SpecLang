/**
 * File ownership tracking
 *
 * Generated from: @speclang/agent-protocol/ownership
 */
import { AgentRole, OwnershipRule, OwnershipCheck } from './types';
/**
 * Ownership Registry - tracks which agent owns which files
 */
export declare class OwnershipRegistry {
    private rules;
    private ownershipCache;
    constructor(rules?: OwnershipRule[]);
    /**
     * Get the owner of a file
     */
    getOwner(filepath: string): AgentRole | null;
    /**
     * Check if an agent can write to a file
     */
    canWrite(agentId: string, agentRole: AgentRole, filepath: string): OwnershipCheck;
    /**
     * Check if an agent can read a file (always allowed)
     */
    canRead(_agentId: string, _filepath: string): OwnershipCheck;
    /**
     * Register a new ownership rule
     */
    register(rule: OwnershipRule): void;
    /**
     * Remove an ownership rule
     */
    unregister(agent: AgentRole): void;
    /**
     * Get all files owned by a specific agent
     */
    getOwnedFiles(agentRole: AgentRole): string[];
    /**
     * Get all ownership rules
     */
    getRules(): OwnershipRule[];
    /**
     * Match a filepath against a glob pattern
     */
    private matchPattern;
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
}
/**
 * Create a new ownership registry with default rules
 */
export declare function createOwnershipRegistry(rules?: OwnershipRule[]): OwnershipRegistry;
//# sourceMappingURL=ownership.d.ts.map