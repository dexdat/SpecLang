/**
 * Write Interceptor - Guard system for agent file writes
 * 
 * Generated from: @speclang/agent-protocol @block:writeinterceptor
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { AgentRole, OwnershipCheck } from './types';
import { OwnershipRegistry } from './ownership';
import { ViolationTracker } from './violations';

export interface InterceptorConfig {
  enabled: boolean;
  allowUserWrites: boolean;
  whitelistRoles: Set<AgentRole>;
  projectRoot: string;
}

export interface WriteAttempt {
  agentId: string;
  agentRole: AgentRole;
  filepath: string;
  timestamp: number;
  allowed: boolean;
  reason?: string;
}

const DEFAULT_CONFIG: InterceptorConfig = {
  enabled: true,
  allowUserWrites: true,
  whitelistRoles: new Set<AgentRole>(['pipeline']),
  projectRoot: process.cwd(),
};

let globalInterceptor: WriteInterceptor | null = null;
let globalOwnership: OwnershipRegistry | null = null;
let globalViolations: ViolationTracker | null = null;
let globalConfig: InterceptorConfig = { ...DEFAULT_CONFIG };

export class WriteInterceptor {
  private ownership: OwnershipRegistry;
  private violations: ViolationTracker;
  private config: InterceptorConfig;

  constructor(ownership: OwnershipRegistry, violations: ViolationTracker, config?: Partial<InterceptorConfig>) {
    this.ownership = ownership;
    this.violations = violations;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if a write is allowed
   */
  checkWrite(agentId: string, agentRole: AgentRole, filepath: string): OwnershipCheck {
    if (!this.config.enabled) {
      return { allowed: true };
    }

    if (this.config.allowUserWrites && this.isUserSession(agentRole)) {
      return { allowed: true, owner: agentRole };
    }

    const check = this.ownership.canWrite(agentId, agentRole, filepath);

    if (!check.allowed) {
      this.violations.record({
        agentId,
        agentRole,
        filepath,
        action: 'write_attempt_denied',
        reason: check.reason || 'Ownership check failed',
        timestamp: Date.now(),
      });
    }

    return check;
  }

  /**
   * Intercept a write operation
   */
  async interceptWrite(
    agentId: string,
    agentRole: AgentRole,
    filepath: string,
    content: string
  ): Promise<{ success: boolean; filepath: string; error?: string }> {
    const check = this.checkWrite(agentId, agentRole, filepath);

    if (!check.allowed) {
      return {
        success: false,
        filepath,
        error: check.reason,
      };
    }

    try {
      await fs.ensureDir(path.dirname(filepath));
      await fs.writeFile(filepath, content, 'utf-8');
      return { success: true, filepath };
    } catch (error: any) {
      return {
        success: false,
        filepath,
        error: error.message,
      };
    }
  }

  /**
   * Check if role is whitelisted (user sessions)
   */
  private isUserSession(role: AgentRole): boolean {
    return !this.config.whitelistRoles.has(role);
  }

  /**
   * Get current config
   */
  getConfig(): InterceptorConfig {
    return { ...this.config };
  }

  /**
   * Update config
   */
  setConfig(config: Partial<InterceptorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get stats
   */
  getStats(): { totalAttempts: number; denied: number; allowed: number } {
    const stats = this.violations.getStats();
    return {
      totalAttempts: stats.total,
      denied: stats.unresolved,
      allowed: stats.total - stats.unresolved,
    };
  }
}

export function createWriteInterceptor(
  ownership: OwnershipRegistry,
  violations: ViolationTracker,
  config?: Partial<InterceptorConfig>
): WriteInterceptor {
  return new WriteInterceptor(ownership, violations, config);
}

export function initGuard(
  ownership?: OwnershipRegistry,
  violations?: ViolationTracker,
  config?: Partial<InterceptorConfig>
): void {
  globalOwnership = ownership || new OwnershipRegistry();
  globalViolations = violations || new ViolationTracker();
  globalInterceptor = new WriteInterceptor(globalOwnership, globalViolations, config);
}

export function getGuard(): WriteInterceptor {
  if (!globalInterceptor) {
    initGuard();
  }
  return globalInterceptor!;
}

export function resetGuard(): void {
  globalInterceptor = null;
  globalOwnership = null;
  globalViolations = null;
  globalConfig = { ...DEFAULT_CONFIG };
}

export function checkOwnership(agent: AgentRole, filepath: string): boolean {
  const guard = getGuard();
  const check = guard.checkWrite('', agent, filepath);
  return check.allowed;
}

export async function interceptWrite(
  agentId: string,
  agentRole: AgentRole,
  filepath: string,
  content: string
): Promise<{ success: boolean; filepath: string; error?: string }> {
  const guard = getGuard();
  return guard.interceptWrite(agentId, agentRole, filepath, content);
}

export function getFileOwner(filepath: string): AgentRole | null {
  const ownership = globalOwnership || new OwnershipRegistry();
  return ownership.getOwner(filepath);
}

export function getViolations() {
  return globalViolations?.getViolations() || [];
}

export function getGuardStats() {
  return globalInterceptor?.getStats() || { totalAttempts: 0, denied: 0, allowed: 0 };
}
