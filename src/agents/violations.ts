/**
 * Violation Tracker - Records and reports ownership violations
 * 
 * Generated from: @speclang/agent-protocol @block:violationtracker
 */

import { AgentRole } from './types';

export interface Violation {
  id: string;
  agentId: string;
  agentRole: AgentRole;
  filepath: string;
  action: 'write_attempt_denied' | 'ownership_conflict' | 'rule_violation';
  reason: string;
  timestamp: number;
  resolved: boolean;
}

export interface ViolationStats {
  total: number;
  resolved: number;
  unresolved: number;
  byAgent: Record<AgentRole, number>;
  byAction: Record<string, number>;
}

const DEFAULT_MAX_VIOLATIONS = 1000;

export class ViolationTracker {
  private violations: Map<string, Violation>;
  private maxViolations: number;

  constructor(maxViolations: number = DEFAULT_MAX_VIOLATIONS) {
    this.violations = new Map();
    this.maxViolations = maxViolations;
  }

  /**
   * Generate unique violation ID
   */
  private generateId(): string {
    return `violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Record a new violation
   */
  record(violation: Omit<Violation, 'id' | 'resolved'>): Violation {
    const id = this.generateId();
    const fullViolation: Violation = {
      ...violation,
      id,
      resolved: false,
    };

    this.violations.set(id, fullViolation);

    if (this.violations.size > this.maxViolations) {
      this.prune();
    }

    console.log(`[ViolationTracker] Recorded violation: ${violation.action} - ${violation.reason}`);

    return fullViolation;
  }

  /**
   * Get violation by ID
   */
  get(id: string): Violation | undefined {
    return this.violations.get(id);
  }

  /**
   * Get all violations
   */
  getViolations(): Violation[] {
    return Array.from(this.violations.values());
  }

  /**
   * Get unresolved violations
   */
  getUnresolved(): Violation[] {
    return Array.from(this.violations.values()).filter(v => !v.resolved);
  }

  /**
   * Get violations for a specific agent
   */
  getByAgent(agentId: string): Violation[] {
    return Array.from(this.violations.values()).filter(v => v.agentId === agentId);
  }

  /**
   * Get violations for a specific file
   */
  getByFile(filepath: string): Violation[] {
    return Array.from(this.violations.values()).filter(v => v.filepath === filepath);
  }

  /**
   * Mark a violation as resolved
   */
  resolve(id: string): boolean {
    const violation = this.violations.get(id);
    if (violation) {
      violation.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Get statistics
   */
  getStats(): ViolationStats {
    const violations = Array.from(this.violations.values());
    
    const byAgent: Record<AgentRole, number> = {} as Record<AgentRole, number>;
    const byAction: Record<string, number> = {};

    for (const v of violations) {
      byAgent[v.agentRole] = (byAgent[v.agentRole] || 0) + 1;
      byAction[v.action] = (byAction[v.action] || 0) + 1;
    }

    return {
      total: violations.length,
      resolved: violations.filter(v => v.resolved).length,
      unresolved: violations.filter(v => !v.resolved).length,
      byAgent,
      byAction,
    };
  }

  /**
   * Clear all violations
   */
  clear(): void {
    this.violations.clear();
    console.log('[ViolationTracker] Cleared all violations');
  }

  /**
   * Prune old violations when limit is reached
   */
  private prune(): void {
    const sorted = Array.from(this.violations.values())
      .sort((a, b) => a.timestamp - b.timestamp);
    
    const toRemove = sorted.slice(0, Math.floor(this.maxViolations * 0.2));
    for (const v of toRemove) {
      this.violations.delete(v.id);
    }
  }

  /**
   * Get count
   */
  count(): number {
    return this.violations.size;
  }

  /**
   * Export violations as JSON
   */
  export(): string {
    return JSON.stringify(Array.from(this.violations.values()), null, 2);
  }

  /**
   * Import violations from JSON
   */
  import(json: string): void {
    const violations = JSON.parse(json) as Violation[];
    for (const v of violations) {
      this.violations.set(v.id, v);
    }
  }
}

export function createViolationTracker(maxViolations?: number): ViolationTracker {
  return new ViolationTracker(maxViolations);
}
