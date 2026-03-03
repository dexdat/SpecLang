/**
 * Ownership Rules for Guard System
 *
 * SPECLANG-GENERATED
 * Generated from: @speclang/agent-protocol/ownership
 */
import { OwnershipRule } from './types';
import { AgentRole } from '../agents/types';
/**
 * Default ownership rules - defines which agent owns which files
 * Higher priority wins when there are conflicts
 */
export declare const DEFAULT_RULES: OwnershipRule[];
/**
 * Orchestrator rule - allows orchestrator to override any rule
 * This is a catch-all rule with highest priority
 */
export declare const ORCHESTRATOR_RULE: OwnershipRule;
/**
 * Check if an agent role is exempt from guard enforcement
 */
export declare function isExemptFromGuard(role: AgentRole): boolean;
/**
 * Get the priority for an agent role
 */
export declare function getAgentPriority(role: AgentRole): number;
/**
 * Validate ownership rules for conflicts
 */
export declare function validateRules(rules: OwnershipRule[]): {
    valid: boolean;
    conflicts: string[];
};
//# sourceMappingURL=rules.d.ts.map