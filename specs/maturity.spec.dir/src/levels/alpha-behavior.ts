/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/maturity.spec.dir/levels/alpha.spec.md
 * Generated: 2026-03-20T18:07:00.000Z
 * 
 * Edit the spec, not this file.
 */
import { ALPHA_LEVEL } from './alpha';
import { ParsedSpec } from '../types';

export const ALPHA_AGENT_BEHAVIOR = {
  mode: 'assisted_with_review',
  description: 'Agent assists with human review for major changes',
  
  specWriting: {
    canCreate: true,
    requiresApproval: true,
    approvalType: 'major_changes',
    maxAutonomy: false
  },
  
  codeGeneration: {
    enabled: true,
    requiresReview: true,
    allowedTargets: ['internal', 'staging'],
    reason: 'Alpha can generate code for core and emerging features'
  },
  
  testGeneration: {
    enabled: true,
    requiresReview: true,
    minimumCoverage: 0.5,
    reason: 'Test coverage expected to be growing'
  },
  
  deployment: {
    allowed: true,
    targets: ['internal', 'staging'],
    autoDeploy: false,
    requiresApproval: true,
    reason: 'Internal/staging deployment for testing'
  },
  
  cascade: {
    maxDepth: 3,
    description: 'Three levels - can reference related specs and implementations',
    allowCrossSpecRefs: true,
    requireExplicitDeps: true
  },
  
  validation: {
    strictness: 'standard',
    allowIncomplete: true,
    warnOnMissing: ['layer', 'status', 'description'],
    errorOnMissing: ['id', 'version', 'layer', 'tags', 'short', 'status']
  },
  
  suggestions: [
    'Focus on core feature implementation',
    'Grow test coverage for core features',
    'Improve documentation for internal use',
    'Define layer structure clearly',
    'Prepare for Beta transition',
    'Consider integration tests for multi-layer specs'
  ]
};

class AlphaAgentBehaviorResolver {
  resolve(): AgentBehaviorConfig {
    return {
      mode: ALPHA_AGENT_BEHAVIOR.mode,
      specWriting: ALPHA_AGENT_BEHAVIOR.specWriting,
      codeGeneration: ALPHA_AGENT_BEHAVIOR.codeGeneration,
      testGeneration: ALPHA_AGENT_BEHAVIOR.testGeneration,
      deployment: ALPHA_AGENT_BEHAVIOR.deployment,
      cascade: ALPHA_AGENT_BEHAVIOR.cascade,
      validation: ALPHA_AGENT_BEHAVIOR.validation
    };
  }
  
  shouldAllowAction(action: AgentAction): boolean {
    switch (action.type) {
      case 'create_spec':
        return true;
      case 'edit_spec':
        return action.approval === 'minor' || action.approval === 'major';
      case 'generate_code':
        return true;
      case 'generate_tests':
        return true;
      case 'deploy':
        return action.target === 'internal' || action.target === 'staging';
      case 'cascade':
        return (action.depth ?? 0) <= 3;
      default:
        return false;
    }
  }
  
  requiresApproval(action: AgentAction): boolean {
    switch (action.type) {
      case 'generate_code':
        return true;
      case 'generate_tests':
        return true;
      case 'deploy':
        return true;
      default:
        return false;
    }
  }
  
  getSuggestions(context: AgentContext): string[] {
    return ALPHA_AGENT_BEHAVIOR.suggestions;
  }
}

interface AgentBehaviorConfig {
  mode: string;
  specWriting: typeof ALPHA_AGENT_BEHAVIOR.specWriting;
  codeGeneration: typeof ALPHA_AGENT_BEHAVIOR.codeGeneration;
  testGeneration: typeof ALPHA_AGENT_BEHAVIOR.testGeneration;
  deployment: typeof ALPHA_AGENT_BEHAVIOR.deployment;
  cascade: typeof ALPHA_AGENT_BEHAVIOR.cascade;
  validation: typeof ALPHA_AGENT_BEHAVIOR.validation;
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

export const alphaBehaviorResolver = new AlphaAgentBehaviorResolver();
