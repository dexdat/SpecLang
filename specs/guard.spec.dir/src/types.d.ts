/**
 * Guard System Types
 *
 * SPECLANG-GENERATED
 * Generated from: @speclang/agent-protocol/ownership
 */
import type { AgentRole } from '../agents/types';
export type { AgentRole } from '../agents/types';
/**
 * Ownership rule defining what files an agent can write to
 */
export interface OwnershipRule {
    agent: AgentRole;
    patterns: string[];
    priority: number;
    description: string;
}
/**
 * Result of an ownership check
 */
export interface OwnershipCheck {
    allowed: boolean;
    owner?: AgentRole;
    reason?: string;
}
/**
 * Result of intercepting a write operation
 */
export interface InterceptResult {
    allowed: boolean;
    reason: string;
    violation?: Violation;
    metadata?: {
        owner?: AgentRole;
        patterns?: string[];
        priority?: number;
    };
}
/**
 * Violation recorded when an agent attempts unauthorized action
 */
export interface Violation {
    id: string;
    agent: AgentRole;
    filepath: string;
    attemptedAction: 'write' | 'delete' | 'rename';
    timestamp: Date;
    resolved: boolean;
    resolution?: 'allowed' | 'blocked' | 'overridden';
    resolutionBy?: AgentRole;
    resolutionAt?: Date;
    validationErrors?: string[];
    details?: string;
}
/**
 * Conflict when multiple agents claim the same file
 */
export interface Conflict {
    file: string;
    claimingAgents: AgentRole[];
    winner: AgentRole;
    reason: string;
}
/**
 * Violation report for analytics
 */
export interface ViolationReport {
    total: number;
    unresolved: number;
    resolved: number;
    byAgent: Record<AgentRole, number>;
    recent: Violation[];
}
/**
 * Validation result for file content
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Override rule for temporarily assigning ownership
 */
export interface OverrideRule {
    filepath: string;
    assignedAgent: AgentRole;
    reason: string;
    createdBy: AgentRole;
    createdAt: Date;
    expiresAt?: Date;
}
/**
 * Guard configuration
 */
export interface GuardConfig {
    enabled: boolean;
    enforceOnOrchestrator: boolean;
    logViolations: boolean;
    strictMode: boolean;
}
/**
 * Default guard configuration
 */
export declare const DEFAULT_GUARD_CONFIG: GuardConfig;
/**
 * Agent roles that can be owners
 */
export declare const GUARD_AGENT_ROLES: AgentRole[];
/**
 * Action types that can be guarded
 */
export type GuardedAction = 'write' | 'delete' | 'rename';
/**
 * Guard statistics
 */
export interface GuardStats {
    totalChecks: number;
    allowed: number;
    blocked: number;
    violations: number;
    byAgent: Record<AgentRole, {
        allowed: number;
        blocked: number;
    }>;
}
//# sourceMappingURL=types.d.ts.map