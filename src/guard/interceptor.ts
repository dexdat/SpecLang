/**
 * Write Interceptor for Guard System
 * 
 * SPECLANG-GENERATED
 * Generated from: @speclang/agent-protocol/ownership
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { 
  InterceptResult, 
  ValidationResult, 
  GuardConfig,
  GuardStats,
  AgentRole,
  Violation,
  DEFAULT_GUARD_CONFIG
} from './types';
import { OwnershipRegistry } from './registry';
import { ViolationTracker } from './violations';
import { isExemptFromGuard } from './rules';
import { GUARD_AGENT_ROLES } from './types';

/**
 * WriteInterceptor - intercepts file write operations and enforces ownership
 */
export class WriteInterceptor {
  private registry: OwnershipRegistry;
  private violations: ViolationTracker;
  private config: GuardConfig;
  private stats: GuardStats;
  
  constructor(
    registry: OwnershipRegistry,
    violations: ViolationTracker,
    config: Partial<GuardConfig> = {}
  ) {
    this.registry = registry;
    this.violations = violations;
    this.config = { ...DEFAULT_GUARD_CONFIG, ...config };
    this.stats = this.initStats();
  }
  
  /**
   * Initialize stats
   */
  private initStats(): GuardStats {
    const byAgent: Record<AgentRole, { allowed: number; blocked: number }> = {} as Record<AgentRole, { allowed: number; blocked: number }>;
    for (const role of GUARD_AGENT_ROLES) {
      byAgent[role] = { allowed: 0, blocked: 0 };
    }
    return {
      totalChecks: 0,
      allowed: 0,
      blocked: 0,
      violations: 0,
      byAgent,
    };
  }
  
  /**
   * Intercept a write operation
   */
  async interceptWrite(
    agent: AgentRole,
    filepath: string,
    _content?: string
  ): Promise<InterceptResult> {
    // Update stats
    this.stats.totalChecks++;
    
    // Check if guard is enabled
    if (!this.config.enabled) {
      this.stats.allowed++;
      this.updateAgentStats(agent, true);
      return {
        allowed: true,
        reason: 'Guard is disabled',
      };
    }
    
    // Check if orchestrator is exempt
    if (!this.config.enforceOnOrchestrator && isExemptFromGuard(agent)) {
      this.stats.allowed++;
      this.updateAgentStats(agent, true);
      return {
        allowed: true,
        reason: 'Orchestrator is exempt from guard',
      };
    }
    
    // Get ownership info
    const owner = this.registry.getOwner(filepath);
    const rule = owner ? this.registry.getRuleForAgent(owner) : undefined;
    
    // Check ownership
    if (owner !== agent) {
      // Block the write
      this.stats.blocked++;
      this.stats.violations++;
      this.updateAgentStats(agent, false);
      
      // Create violation
      const violationId = this.violations.record({
        agent,
        filepath,
        attemptedAction: 'write',
      });
      
      // Log if enabled
      if (this.config.logViolations) {
        console.error(
          `[Guard] BLOCKED: ${agent} attempted to write to ${filepath} ` +
          `(owned by ${owner || 'none'})`
        );
      }
      
      return {
        allowed: false,
        reason: `File "${filepath}" is owned by ${owner || 'no one'}, not ${agent}`,
        violation: this.violations.get(violationId),
        metadata: {
          owner: owner || undefined,
          patterns: rule?.patterns,
          priority: rule?.priority,
        },
      };
    }
    
    // Allow the write
    this.stats.allowed++;
    this.updateAgentStats(agent, true);
    
    return {
      allowed: true,
      reason: 'Ownership check passed',
      metadata: {
        owner,
        patterns: rule?.patterns,
        priority: rule?.priority,
      },
    };
  }
  
  /**
   * Intercept a delete operation
   */
  async interceptDelete(
    agent: AgentRole,
    filepath: string
  ): Promise<InterceptResult> {
    this.stats.totalChecks++;
    
    if (!this.config.enabled) {
      this.stats.allowed++;
      return { allowed: true, reason: 'Guard is disabled' };
    }
    
    if (!this.config.enforceOnOrchestrator && isExemptFromGuard(agent)) {
      this.stats.allowed++;
      return { allowed: true, reason: 'Orchestrator is exempt' };
    }
    
    const owner = this.registry.getOwner(filepath);
    
    if (owner !== agent) {
      this.stats.blocked++;
      this.stats.violations++;
      this.updateAgentStats(agent, false);
      
      const violationId = this.violations.record({
        agent,
        filepath,
        attemptedAction: 'delete',
      });
      
      if (this.config.logViolations) {
        console.error(
          `[Guard] BLOCKED: ${agent} attempted to delete ${filepath} ` +
          `(owned by ${owner || 'none'})`
        );
      }
      
      return {
        allowed: false,
        reason: `File "${filepath}" is owned by ${owner || 'no one'}, not ${agent}`,
        violation: this.violations.get(violationId),
      };
    }
    
    this.stats.allowed++;
    this.updateAgentStats(agent, true);
    
    return { allowed: true, reason: 'Ownership check passed' };
  }
  
  /**
   * Intercept a rename operation
   */
  async interceptRename(
    agent: AgentRole,
    oldPath: string,
    newPath: string
  ): Promise<InterceptResult> {
    this.stats.totalChecks++;
    
    if (!this.config.enabled) {
      this.stats.allowed++;
      return { allowed: true, reason: 'Guard is disabled' };
    }
    
    if (!this.config.enforceOnOrchestrator && isExemptFromGuard(agent)) {
      this.stats.allowed++;
      return { allowed: true, reason: 'Orchestrator is exempt' };
    }
    
    // Check ownership of both old and new paths
    const oldOwner = this.registry.getOwner(oldPath);
    const newOwner = this.registry.getOwner(newPath);
    
    if (oldOwner !== agent || newOwner !== agent) {
      this.stats.blocked++;
      this.stats.violations++;
      this.updateAgentStats(agent, false);
      
      const violationId = this.violations.record({
        agent,
        filepath: oldPath,
        attemptedAction: 'rename',
        details: `Renaming from ${oldPath} to ${newPath}`,
      });
      
      if (this.config.logViolations) {
        console.error(
          `[Guard] BLOCKED: ${agent} attempted to rename ${oldPath} to ${newPath}`
        );
      }
      
      return {
        allowed: false,
        reason: `Cannot rename: ownership mismatch (old owner: ${oldOwner}, new owner: ${newOwner})`,
        violation: this.violations.get(violationId),
      };
    }
    
    this.stats.allowed++;
    this.updateAgentStats(agent, true);
    
    return { allowed: true, reason: 'Ownership check passed' };
  }
  
  /**
   * Validate file content based on type
   */
  async validateContent(filepath: string, content: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const ext = path.extname(filepath).toLowerCase();
    const basename = path.basename(filepath);
    
    // Validate spec files
    if (ext === '.md' || ext === '.yaml' || ext === '.yml' || ext === '.scl') {
      // Check for speclang header in spec files
      if (filepath.startsWith('specs/') || filepath.includes('.spec.')) {
        if (!content.includes('speclang-header') && !content.includes('# speclang')) {
          warnings.push('Spec file missing speclang header');
        }
      }
    }
    
    // Validate TypeScript files
    if (ext === '.ts') {
      // Check for common issues
      if (content.includes('any') && !content.includes('// eslint')) {
        warnings.push('TypeScript file contains "any" type');
      }
    }
    
    // Check for empty files
    if (!content.trim()) {
      errors.push('File content is empty');
    }
    
    // Check for very large files
    if (content.length > 1_000_000) {
      warnings.push('File is very large (>1MB)');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
  
  /**
   * Check ownership without performing the write
   */
  checkOwnership(agent: AgentRole, filepath: string): InterceptResult {
    const owner = this.registry.getOwner(filepath);
    const rule = owner ? this.registry.getRuleForAgent(owner) : undefined;
    
    if (owner !== agent) {
      return {
        allowed: false,
        reason: `File "${filepath}" is owned by ${owner || 'no one'}, not ${agent}`,
        metadata: {
          owner: owner || undefined,
          patterns: rule?.patterns,
          priority: rule?.priority,
        },
      };
    }
    
    return {
      allowed: true,
      reason: 'Ownership check passed',
      metadata: {
        owner,
        patterns: rule?.patterns,
        priority: rule?.priority,
      },
    };
  }
  
  /**
   * Update stats for an agent
   */
  private updateAgentStats(agent: AgentRole, allowed: boolean): void {
    const stats = this.stats.byAgent[agent];
    if (stats) {
      if (allowed) {
        stats.allowed++;
      } else {
        stats.blocked++;
      }
    }
  }
  
  /**
   * Get current stats
   */
  getStats(): GuardStats {
    return { ...this.stats };
  }
  
  /**
   * Reset stats
   */
  resetStats(): void {
    this.stats = this.initStats();
  }
  
  /**
   * Get the registry
   */
  getRegistry(): OwnershipRegistry {
    return this.registry;
  }
  
  /**
   * Get the violations tracker
   */
  getViolations(): ViolationTracker {
    return this.violations;
  }
  
  /**
   * Get config
   */
  getConfig(): GuardConfig {
    return { ...this.config };
  }
  
  /**
   * Update config
   */
  setConfig(config: Partial<GuardConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Create a write interceptor with default config
 */
export function createWriteInterceptor(
  registry?: OwnershipRegistry,
  violations?: ViolationTracker,
  config?: Partial<GuardConfig>
): WriteInterceptor {
  return new WriteInterceptor(
    registry || new OwnershipRegistry(),
    violations || new ViolationTracker(),
    config
  );
}
