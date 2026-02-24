/**
 * Ownership Rules - Default and custom ownership rules
 * 
 * Generated from: @speclang/agent-protocol @block:default_rules
 */

import { AgentRole, OwnershipRule, DEFAULT_OWNERSHIP_RULES } from './types';

export const DEFAULT_RULES: OwnershipRule[] = [
  ...DEFAULT_OWNERSHIP_RULES,
];

export const ORCHESTRATOR_RULE: OwnershipRule = {
  agent: 'north-star',
  patterns: ['project.scl'],
  priority: 100,
};

const AGENT_PRIORITIES: Record<AgentRole, number> = {
  'north-star': 100,
  'spec-writer': 50,
  'code-gen': 40,
  'test-writer': 30,
  'back-sync': 20,
  'pipeline': 10,
};

const EXEMPT_ROLES: Set<AgentRole> = new Set(['pipeline']);

export function isExemptFromGuard(role: AgentRole): boolean {
  return EXEMPT_ROLES.has(role);
}

export function getAgentPriority(role: AgentRole): number {
  return AGENT_PRIORITIES[role] || 0;
}

export interface ValidationResult {
  valid: boolean;
  conflicts: string[];
}

export function validateRules(rules: OwnershipRule[]): ValidationResult {
  const conflicts: string[] = [];
  const patternMap = new Map<string, { agent: AgentRole; priority: number }[]>();

  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (!patternMap.has(pattern)) {
        patternMap.set(pattern, []);
      }
      patternMap.get(pattern)!.push({ agent: rule.agent, priority: rule.priority });
    }
  }

  for (const [pattern, agents] of patternMap) {
    if (agents.length > 1) {
      const sorted = [...agents].sort((a, b) => b.priority - a.priority);
      if (sorted[0].priority === sorted[1].priority) {
        conflicts.push(
          `Pattern "${pattern}" has conflicting rules with same priority: ${sorted.map(a => a.agent).join(', ')}`
        );
      }
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}

export function createRule(agent: AgentRole, patterns: string[], priority?: number): OwnershipRule {
  return {
    agent,
    patterns,
    priority: priority ?? getAgentPriority(agent),
  };
}

export function mergeRules(existing: OwnershipRule[], newRules: OwnershipRule[]): OwnershipRule[] {
  const ruleMap = new Map<AgentRole, OwnershipRule>();

  for (const rule of existing) {
    ruleMap.set(rule.agent, rule);
  }

  for (const rule of newRules) {
    const existingRule = ruleMap.get(rule.agent);
    if (existingRule) {
      existingRule.patterns = [...new Set([...existingRule.patterns, ...rule.patterns])];
      existingRule.priority = Math.max(existingRule.priority, rule.priority);
    } else {
      ruleMap.set(rule.agent, rule);
    }
  }

  return Array.from(ruleMap.values()).sort((a, b) => b.priority - a.priority);
}

export function getRulesForAgent(rules: OwnershipRule[], agent: AgentRole): OwnershipRule | undefined {
  return rules.find(r => r.agent === agent);
}
