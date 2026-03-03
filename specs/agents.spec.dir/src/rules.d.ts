/**
 * Ownership Rules - Default and custom ownership rules
 *
 * Generated from: @speclang/agent-protocol @block:default_rules
 */
import { AgentRole, OwnershipRule } from './types';
export declare const DEFAULT_RULES: OwnershipRule[];
export declare const ORCHESTRATOR_RULE: OwnershipRule;
export declare function isExemptFromGuard(role: AgentRole): boolean;
export declare function getAgentPriority(role: AgentRole): number;
export interface ValidationResult {
    valid: boolean;
    conflicts: string[];
}
export declare function validateRules(rules: OwnershipRule[]): ValidationResult;
export declare function createRule(agent: AgentRole, patterns: string[], priority?: number): OwnershipRule;
export declare function mergeRules(existing: OwnershipRule[], newRules: OwnershipRule[]): OwnershipRule[];
export declare function getRulesForAgent(rules: OwnershipRule[], agent: AgentRole): OwnershipRule | undefined;
//# sourceMappingURL=rules.d.ts.map