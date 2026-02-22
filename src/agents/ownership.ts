/**
 * File ownership tracking
 * 
 * Generated from: @speclang/agent-protocol/ownership
 */

import * as path from 'path';
import { minimatch } from 'minimatch';
import { 
  AgentRole, 
  OwnershipRule, 
  OwnershipCheck,
  DEFAULT_OWNERSHIP_RULES 
} from './types';

/**
 * Ownership Registry - tracks which agent owns which files
 */
export class OwnershipRegistry {
  private rules: OwnershipRule[];
  private ownershipCache: Map<string, AgentRole | null>;

  constructor(rules: OwnershipRule[] = DEFAULT_OWNERSHIP_RULES) {
    this.rules = [...rules].sort((a, b) => b.priority - a.priority); // Sort by priority desc
    this.ownershipCache = new Map<string, AgentRole | null>();
  }

  /**
   * Get the owner of a file
   */
  getOwner(filepath: string): AgentRole | null {
    // Check cache first
    const cached = this.ownershipCache.get(filepath);
    if (cached !== undefined) {
      return cached;
    }

    // Find matching rule with highest priority
    let owner: AgentRole | null = null;
    let highestPriority = -1;

    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (this.matchPattern(filepath, pattern)) {
          if (rule.priority > highestPriority) {
            owner = rule.agent;
            highestPriority = rule.priority;
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
  canWrite(agentId: string, agentRole: AgentRole, filepath: string): OwnershipCheck {
    const owner = this.getOwner(filepath);

    if (!owner) {
      return {
        allowed: false,
        reason: 'No ownership rule matches this file',
      };
    }

    if (owner !== agentRole) {
      return {
        allowed: false,
        owner,
        reason: `File is owned by ${owner}, not ${agentRole}`,
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
  canRead(_agentId: string, _filepath: string): OwnershipCheck {
    return {
      allowed: true,
    };
  }

  /**
   * Register a new ownership rule
   */
  register(rule: OwnershipRule): void {
    this.rules.push(rule);
    // Re-sort by priority
    this.rules.sort((a, b) => b.priority - a.priority);
    // Clear cache
    this.ownershipCache.clear();
  }

  /**
   * Remove an ownership rule
   */
  unregister(agent: AgentRole): void {
    this.rules = this.rules.filter(r => r.agent !== agent);
    // Clear cache
    this.ownershipCache.clear();
  }

  /**
   * Get all files owned by a specific agent
   */
  getOwnedFiles(agentRole: AgentRole): string[] {
    const rule = this.rules.find(r => r.agent === agentRole);
    return rule?.patterns || [];
  }

  /**
   * Get all ownership rules
   */
  getRules(): OwnershipRule[] {
    return [...this.rules];
  }

  /**
   * Match a filepath against a glob pattern
   */
  private matchPattern(filepath: string, pattern: string): boolean {
    // Normalize path separators
    const normalizedPath = filepath.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');

    // Use minimatch for all patterns (handles **, *, ?, braces)
    return minimatch(normalizedPath, normalizedPattern, {
      dot: true,
      noext: true,
    });
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
}

/**
 * Create a new ownership registry with default rules
 */
export function createOwnershipRegistry(rules?: OwnershipRule[]): OwnershipRegistry {
  return new OwnershipRegistry(rules);
}
