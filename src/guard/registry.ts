/**
 * Ownership Registry for Guard System
 * 
 * SPECLANG-GENERATED
 * Generated from: @speclang/agent-protocol/ownership
 */

import { minimatch } from 'minimatch';
import { 
  OwnershipRule, 
  OwnershipCheck, 
  Conflict,
  OverrideRule,
  AgentRole 
} from './types';
import { DEFAULT_RULES, ORCHESTRATOR_RULE, isExemptFromGuard } from './rules';

/**
 * OwnershipRegistry - manages ownership rules and checks
 */
export class OwnershipRegistry {
  private rules: OwnershipRule[];
  private overrides: OverrideRule[] = [];
  private ownershipCache: Map<string, AgentRole | null>;
  
  constructor(rules: OwnershipRule[] = DEFAULT_RULES) {
    // Sort by priority descending
    this.rules = [...rules].sort((a, b) => b.priority - a.priority);
    this.ownershipCache = new Map();
  }
  
  /**
   * Add a new rule to the registry
   */
  addRule(rule: OwnershipRule): void {
    this.rules.push(rule);
    // Re-sort by priority descending
    this.rules.sort((a, b) => b.priority - a.priority);
    // Clear cache
    this.clearCache();
  }
  
  /**
   * Remove a rule by agent role
   */
  removeRule(agent: AgentRole): void {
    this.rules = this.rules.filter(r => r.agent !== agent);
    this.clearCache();
  }
  
  /**
   * Get the owner of a file path
   */
  getOwner(filepath: string): AgentRole | null {
    // Check for override first
    const override = this.getOverride(filepath);
    if (override) {
      return override.assignedAgent;
    }
    
    // Check cache
    const cached = this.ownershipCache.get(filepath);
    if (cached !== undefined) {
      return cached;
    }
    
    // Find matching rule with highest priority
    let owner: AgentRole | null = null;
    let highestPriority = -1;
    let matchedPatterns: string[] = [];
    
    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (this.matchPattern(filepath, pattern)) {
          if (rule.priority > highestPriority) {
            owner = rule.agent;
            highestPriority = rule.priority;
            matchedPatterns = [pattern];
          } else if (rule.priority === highestPriority) {
            matchedPatterns.push(pattern);
          }
        }
      }
    }
    
    // Cache the result
    this.ownershipCache.set(filepath, owner);
    
    return owner;
  }
  
  /**
   * Check if an agent can write to a file
   */
  canWrite(agent: AgentRole, filepath: string): OwnershipCheck {
    // Orchestrator is always allowed (unless strict mode)
    if (isExemptFromGuard(agent)) {
      return {
        allowed: true,
        owner: this.getOwner(filepath) || undefined,
      };
    }
    
    const owner = this.getOwner(filepath);
    
    if (!owner) {
      return {
        allowed: false,
        reason: 'No ownership rule matches this file',
      };
    }
    
    if (owner !== agent) {
      return {
        allowed: false,
        owner,
        reason: `File "${filepath}" is owned by ${owner}, not ${agent}`,
      };
    }
    
    return {
      allowed: true,
      owner,
    };
  }
  
  /**
   * Check if an agent can read a file (always allowed)
   */
  canRead(_agent: AgentRole, _filepath: string): OwnershipCheck {
    return {
      allowed: true,
    };
  }
  
  /**
   * Get all files owned by a specific agent
   */
  getOwnedFiles(agent: AgentRole): string[] {
    const rule = this.rules.find(r => r.agent === agent);
    return rule?.patterns || [];
  }
  
  /**
   * Get all rules
   */
  getRules(): OwnershipRule[] {
    return [...this.rules];
  }
  
  /**
   * Add an override for a specific file
   */
  addOverride(override: OverrideRule): void {
    // Remove existing override for same file
    this.overrides = this.overrides.filter(o => o.filepath !== override.filepath);
    this.overrides.push(override);
    this.clearCache();
  }
  
  /**
   * Remove an override
   */
  removeOverride(filepath: string): boolean {
    const initialLength = this.overrides.length;
    this.overrides = this.overrides.filter(o => o.filepath !== filepath);
    this.clearCache();
    return this.overrides.length < initialLength;
  }
  
  /**
   * Get override for a file
   */
  getOverride(filepath: string): OverrideRule | undefined {
    return this.overrides.find(o => o.filepath === filepath);
  }
  
  /**
   * Get all overrides
   */
  getOverrides(): OverrideRule[] {
    return [...this.overrides];
  }
  
  /**
   * Resolve conflicts between agents claiming same files
   */
  resolveConflicts(): Conflict[] {
    const conflicts: Conflict[] = [];
    const fileClaims = new Map<string, AgentRole[]>();
    
    // Collect all claims
    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        // Simple conflict detection for exact patterns
        // In production, this would use glob expansion
        const exactFiles = this.getFilesMatchingPattern(pattern);
        for (const file of exactFiles) {
          const claims = fileClaims.get(file) || [];
          claims.push(rule.agent);
          fileClaims.set(file, claims);
        }
      }
    }
    
    // Find conflicts (files claimed by multiple agents with same priority)
    const claimed = Array.from(fileClaims.entries());
    for (const [file, agents] of claimed) {
      if (agents.length > 1) {
        // Find winner by highest priority
        let winner = agents[0];
        let highestPriority = -1;
        
        for (const agent of agents) {
          const rule = this.rules.find(r => r.agent === agent);
          if (rule && rule.priority > highestPriority) {
            highestPriority = rule.priority;
            winner = agent;
          }
        }
        
        conflicts.push({
          file,
          claimingAgents: agents,
          winner,
          reason: `Winner determined by highest priority (${highestPriority})`,
        });
      }
    }
    
    return conflicts;
  }
  
  /**
   * Match a filepath against a glob pattern
   */
  private matchPattern(filepath: string, pattern: string): boolean {
    const normalizedPath = filepath.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');
    
    return minimatch(normalizedPath, normalizedPattern, {
      dot: true,
      noext: true,
    });
  }
  
  /**
   * Get files matching a pattern (simplified)
   * In production, this would use glob expansion
   */
  private getFilesMatchingPattern(pattern: string): string[] {
    // This is a simplified version
    // In production, you'd use fs.glob or similar
    if (pattern.includes('*')) {
      return [pattern]; // Return pattern as-is for glob patterns
    }
    return [pattern];
  }
  
  /**
   * Invalidate cache for a specific file
   */
  invalidate(filepath: string): void {
    this.ownershipCache.delete(filepath);
  }
  
  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.ownershipCache.clear();
  }
  
  /**
   * Get ownership info for multiple files
   */
  getOwnershipBatch(files: string[]): Map<string, AgentRole | null> {
    const results = new Map<string, AgentRole | null>();
    for (const file of files) {
      results.set(file, this.getOwner(file));
    }
    return results;
  }
  
  /**
   * Check if a filepath matches any rule
   */
  hasMatchingRule(filepath: string): boolean {
    return this.getOwner(filepath) !== null;
  }
  
  /**
   * Get rule for an agent
   */
  getRuleForAgent(agent: AgentRole): OwnershipRule | undefined {
    return this.rules.find(r => r.agent === agent);
  }
}

/**
 * Create a new ownership registry with default rules
 */
export function createOwnershipRegistry(rules?: OwnershipRule[]): OwnershipRegistry {
  return new OwnershipRegistry(rules);
}

/**
 * Create an override rule
 */
export function createOverride(
  filepath: string,
  assignedAgent: AgentRole,
  reason: string,
  createdBy: AgentRole,
  expiresInMs?: number
): OverrideRule {
  return {
    filepath,
    assignedAgent,
    reason,
    createdBy,
    createdAt: new Date(),
    expiresAt: expiresInMs ? new Date(Date.now() + expiresInMs) : undefined,
  };
}
