/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/maturity.spec.dir/levels/beta.spec.md
 * Generated: 2026-03-20T18:30:00.000Z
 * 
 * Edit the spec, not this file.
 */
import { BETA_LEVEL } from './beta';
import { ParsedSpec } from '../types';

export const BETA_AGENT_BEHAVIOR = {
  mode: 'autonomous_non_critical',
  description: 'Agent autonomous for non-critical changes, human oversight for critical changes',
  
  specWriting: {
    canCreate: true,
    requiresApproval: false,
    approvalType: 'critical_only',
    maxAutonomy: true
  },
  
  codeGeneration: {
    enabled: true,
    requiresReview: false,
    allowedTargets: ['beta', 'staging', 'production'],
    reason: 'Beta can generate code for all features'
  },
  
  testGeneration: {
    enabled: true,
    requiresReview: false,
    minimumCoverage: 0.8,
    reason: 'Test coverage expected to be comprehensive'
  },
  
  deployment: {
    allowed: true,
    targets: ['beta', 'staging'],
    autoDeploy: false,
    requiresApproval: true,
    reason: 'Beta/staging deployment for external testing'
  },
  
  cascade: {
    maxDepth: 5,
    description: 'Four levels - can reference related specs and implementations',
    allowCrossSpecRefs: true,
    requireExplicitDeps: true
  },
  
  validation: {
    strictness: 'strict',
    allowIncomplete: false,
    warnOnMissing: ['layer', 'status', 'description'],
    errorOnMissing: ['id', 'version', 'layer', 'tags', 'short', 'status', 'description']
  },
  
  suggestions: [
    'Focus on stability and performance',
    'Ensure comprehensive test coverage',
    'Prepare documentation for external testers',
    'Define clear deployment targets',
    'Establish feedback mechanisms',
    'Prepare for production transition',
    'Consider security and compliance requirements'
  ]
};

class BetaAgentBehaviorResolver {
  resolve(): AgentBehaviorConfig {
    return {
      mode: BETA_AGENT_BEHAVIOR.mode,
      specWriting: BETA_AGENT_BEHAVIOR.specWriting,
      codeGeneration: BETA_AGENT_BEHAVIOR.codeGeneration,
      testGeneration: BETA_AGENT_BEHAVIOR.testGeneration,
      deployment: BETA_AGENT_BEHAVIOR.deployment,
      cascade: BETA_AGENT_BEHAVIOR.cascade,
      validation: BETA_AGENT_BEHAVIOR.validation
    };
  }
  
  shouldAllowAction(action: AgentAction): boolean {
    switch (action.type) {
      case 'create_spec':
        return true;
      case 'edit_spec':
        return true;
      case 'generate_code':
        return true;
      case 'generate_tests':
        return true;
      case 'deploy':
        return action.target === 'beta' || action.target === 'staging';
      case 'cascade':
        return action.depth !== undefined && action.depth <= 5;
      default:
        return false;
    }
  }
  
  requiresApproval(action: AgentAction): boolean {
    switch (action.type) {
      case 'generate_code':
        return false;
      case 'generate_tests':
        return false;
      case 'deploy':
        return true;
      default:
        return false;
    }
  }
  
  getSuggestions(context: AgentContext): string[] {
    return BETA_AGENT_BEHAVIOR.suggestions;
  }
}

interface AgentBehaviorConfig {
  mode: string;
  specWriting: typeof BETA_AGENT_BEHAVIOR.specWriting;
  codeGeneration: typeof BETA_AGENT_BEHAVIOR.codeGeneration;
  testGeneration: typeof BETA_AGENT_BEHAVIOR.testGeneration;
  deployment: typeof BETA_AGENT_BEHAVIOR.deployment;
  cascade: typeof BETA_AGENT_BEHAVIOR.cascade;
  validation: typeof BETA_AGENT_BEHAVIOR.validation;
}

interface AgentAction {
  type: string;
  approval?: 'minor' | 'major';
  target?: string;
  depth?: number;
}

interface AgentContext {
  spec?: ParsedSpec;
}

export const betaBehaviorResolver = new BetaAgentBehaviorResolver();