/**
 * Guard System - Main Exports
 * 
 * SPECLANG-GENERATED
 * Generated from: @speclang/agent-protocol/ownership
 * 
 * The Guard System enforces file ownership rules to prevent agents
 * from writing to files they don't own.
 */

// Types
export * from './types';

// Rules
export * from './rules';

// Registry
export { 
  OwnershipRegistry, 
  createOwnershipRegistry,
  createOverride 
} from './registry';

// Violations
export { 
  ViolationTracker, 
  createViolationTracker 
} from './violations';

// Interceptor
export { 
  WriteInterceptor, 
  createWriteInterceptor 
} from './interceptor';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

import { OwnershipRegistry } from './registry';
import { ViolationTracker } from './violations';
import { WriteInterceptor } from './interceptor';
import { DEFAULT_RULES, ORCHESTRATOR_RULE } from './rules';
import { GuardConfig, OwnershipRule, OverrideRule, AgentRole } from './types';

/**
 * Default singleton guard instance
 */
let _guardInstance: WriteInterceptor | null = null;

/**
 * Get the default guard instance (singleton)
 */
export function getGuard(): WriteInterceptor {
  if (!_guardInstance) {
    const registry = new OwnershipRegistry(DEFAULT_RULES);
    const violations = new ViolationTracker();
    _guardInstance = new WriteInterceptor(registry, violations);
  }
  return _guardInstance;
}

/**
 * Initialize or reset the guard instance
 */
export function initGuard(
  rules?: OwnershipRule[],
  config?: Partial<GuardConfig>
): WriteInterceptor {
  const registry = new OwnershipRegistry(rules || DEFAULT_RULES);
  const violations = new ViolationTracker();
  _guardInstance = new WriteInterceptor(registry, violations, config);
  return _guardInstance;
}

/**
 * Reset the guard instance
 */
export function resetGuard(): void {
  _guardInstance = null;
}

/**
 * Quick ownership check
 */
export function checkOwnership(agent: AgentRole, filepath: string): boolean {
  return getGuard().checkOwnership(agent, filepath).allowed;
}

/**
 * Quick write interception
 */
export async function interceptWrite(
  agent: AgentRole,
  filepath: string,
  content?: string
) {
  return getGuard().interceptWrite(agent, filepath, content);
}

/**
 * Get ownership info for a file
 */
export function getFileOwner(filepath: string): AgentRole | null {
  return getGuard().getRegistry().getOwner(filepath);
}

/**
 * Get all violations
 */
export function getViolations() {
  return getGuard().getViolations();
}

/**
 * Export guard stats
 */
export function getGuardStats() {
  return getGuard().getStats();
}
