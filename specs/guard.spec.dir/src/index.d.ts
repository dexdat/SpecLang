/**
 * Guard System - Main Exports
 *
 * SPECLANG-GENERATED
 * Generated from: @speclang/agent-protocol/ownership
 *
 * The Guard System enforces file ownership rules to prevent agents
 * from writing to files they don't own.
 */
export * from './types';
export * from './rules';
export { OwnershipRegistry, createOwnershipRegistry, createOverride } from './registry';
export { ViolationTracker, createViolationTracker } from './violations';
export { WriteInterceptor, createWriteInterceptor } from './interceptor';
import { ViolationTracker } from './violations';
import { WriteInterceptor } from './interceptor';
import { GuardConfig, OwnershipRule, AgentRole } from './types';
/**
 * Get the default guard instance (singleton)
 */
export declare function getGuard(): WriteInterceptor;
/**
 * Initialize or reset the guard instance
 */
export declare function initGuard(rules?: OwnershipRule[], config?: Partial<GuardConfig>): WriteInterceptor;
/**
 * Reset the guard instance
 */
export declare function resetGuard(): void;
/**
 * Quick ownership check
 */
export declare function checkOwnership(agent: AgentRole, filepath: string): boolean;
/**
 * Quick write interception
 */
export declare function interceptWrite(agent: AgentRole, filepath: string, content?: string): Promise<import("./types").InterceptResult>;
/**
 * Get ownership info for a file
 */
export declare function getFileOwner(filepath: string): AgentRole | null;
/**
 * Get all violations
 */
export declare function getViolations(): ViolationTracker;
/**
 * Export guard stats
 */
export declare function getGuardStats(): import("./types").GuardStats;
//# sourceMappingURL=index.d.ts.map