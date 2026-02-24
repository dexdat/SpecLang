/**
 * Violation Tracking for Guard System
 * 
 * SPECLANG-GENERATED
 * Generated from: @speclang/agent-protocol/ownership
 */

import { 
  Violation, 
  ViolationReport, 
  AgentRole 
} from './types';
import { GUARD_AGENT_ROLES } from './types';

/**
 * Generates a unique violation ID
 */
function generateViolationId(): string {
  return `viol-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * ViolationTracker - tracks all violations in the system
 */
export class ViolationTracker {
  private violations: Map<string, Violation> = new Map();
  private maxViolations: number;
  
  constructor(maxViolations: number = 1000) {
    this.maxViolations = maxViolations;
  }
  
  /**
   * Record a new violation
   * @returns The violation ID
   */
  record(violation: Omit<Violation, 'id' | 'timestamp' | 'resolved'>): string {
    const id = generateViolationId();
    
    const fullViolation: Violation = {
      ...violation,
      id,
      timestamp: new Date(),
      resolved: false,
    };
    
    this.violations.set(id, fullViolation);
    
    // Clean up old violations if we exceed max
    if (this.violations.size > this.maxViolations) {
      const oldestKey = this.violations.keys().next().value;
      if (oldestKey) {
        this.violations.delete(oldestKey);
      }
    }
    
    return id;
  }
  
  /**
   * Resolve a violation
   */
  resolve(
    violationId: string, 
    resolution: Violation['resolution'], 
    by: AgentRole
  ): boolean {
    const violation = this.violations.get(violationId);
    
    if (!violation) {
      return false;
    }
    
    violation.resolved = true;
    violation.resolution = resolution;
    violation.resolutionBy = by;
    violation.resolutionAt = new Date();
    
    return true;
  }
  
  /**
   * Get all unresolved violations
   */
  getUnresolved(): Violation[] {
    return Array.from(this.violations.values())
      .filter(v => !v.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Get violations by agent
   */
  getByAgent(agent: AgentRole): Violation[] {
    return Array.from(this.violations.values())
      .filter(v => v.agent === agent)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Get violations by file path
   */
  getByFilepath(filepath: string): Violation[] {
    return Array.from(this.violations.values())
      .filter(v => v.filepath === filepath)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Get all violations
   */
  getAll(): Violation[] {
    return Array.from(this.violations.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Get a specific violation by ID
   */
  get(violationId: string): Violation | undefined {
    return this.violations.get(violationId);
  }
  
  /**
   * Export violation report for analytics
   */
  export(): ViolationReport {
    const all = Array.from(this.violations.values());
    const unresolved = all.filter(v => !v.resolved);
    const resolved = all.filter(v => v.resolved);
    
    // Count by agent
    const byAgent: Record<AgentRole, number> = {} as Record<AgentRole, number>;
    for (const role of GUARD_AGENT_ROLES) {
      byAgent[role] = 0;
    }
    for (const v of unresolved) {
      byAgent[v.agent] = (byAgent[v.agent] || 0) + 1;
    }
    
    return {
      total: all.length,
      unresolved: unresolved.length,
      resolved: resolved.length,
      byAgent,
      recent: unresolved.slice(0, 10),
    };
  }
  
  /**
   * Clear all violations
   */
  clear(): void {
    this.violations.clear();
  }
  
  /**
   * Get violation count
   */
  count(): number {
    return this.violations.size;
  }
  
  /**
   * Get unresolved count
   */
  unresolvedCount(): number {
    return Array.from(this.violations.values()).filter(v => !v.resolved).length;
  }
  
  /**
   * Check if there are any unresolved violations
   */
  hasUnresolved(): boolean {
    return this.unresolvedCount() > 0;
  }
  
  /**
   * Get recent violations
   */
  getRecent(limit: number = 10): Violation[] {
    return Array.from(this.violations.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

/**
 * Create a new violation tracker
 */
export function createViolationTracker(maxViolations?: number): ViolationTracker {
  return new ViolationTracker(maxViolations);
}
