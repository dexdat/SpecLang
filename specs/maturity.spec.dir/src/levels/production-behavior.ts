/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/maturity.spec.dir/levels/production.spec.md
 * Generated: 2026-03-20T19:00:00.000Z
 * 
 * Edit the spec, not this file.
 */
import { PRODUCTION_LEVEL } from './production';
import { ParsedSpec } from '../types';

export const PRODUCTION_AGENT_BEHAVIOR = {
  mode: 'fully_autonomous',
  description: 'Agent fully autonomous, human oversight only for emergencies',
  
  specWriting: {
    canCreate: true,
    requiresApproval: false,
    approvalType: 'emergencies',
    maxAutonomy: true
  },
  
  codeGeneration: {
    enabled: true,
    requiresReview: false,
    allowedTargets: ['production'],
    reason: 'Production can generate code for all features'
  },
  
  testGeneration: {
    enabled: true,
    requiresReview: false,
    minimumCoverage: 0.9,
    reason: 'Test coverage expected to be full'
  },
  
  deployment: {
    allowed: true,
    targets: ['production'],
    autoDeploy: true,
    requiresApproval: false,
    reason: 'Production deployment automated'
  },
  
  cascade: {
    maxDepth: 10,
    description: 'Ten levels - full dependency tree expansion',
    allowCrossSpecRefs: true,
    requireExplicitDeps: true
  },
  
  validation: {
    strictness: 'strictest',
    allowIncomplete: false,
    warnOnMissing: ['layer', 'status', 'description', 'agent_support'],
    errorOnMissing: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level', 'agent_support']
  },
  
  suggestions: [
    'Focus on stability, security, and performance',
    'Ensure full test coverage',
    'Maintain comprehensive documentation',
    'Monitor production metrics',
    'Establish incident response procedures',
    'Regular security audits',
    'Performance optimization'
  ]
};

class ProductionAgentBehaviorResolver {
  resolve(): AgentBehaviorConfig {
    return {
      mode: PRODUCTION_AGENT_BEHAVIOR.mode,
      specWriting: PRODUCTION_AGENT_BEHAVIOR.specWriting,
      codeGeneration: PRODUCTION_AGENT_BEHAVIOR.codeGeneration,
      testGeneration: PRODUCTION_AGENT_BEHAVIOR.testGeneration,
      deployment: PRODUCTION_AGENT_BEHAVIOR.deployment,
      cascade: PRODUCTION_AGENT_BEHAVIOR.cascade,
      validation: PRODUCTION_AGENT_BEHAVIOR.validation
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
        return action.target === 'production';
      case 'cascade':
        return action.depth !== undefined && action.depth <= 10;
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
        return false;
      default:
        return false;
    }
  }
  
  getSuggestions(context: AgentContext): string[] {
    return PRODUCTION_AGENT_BEHAVIOR.suggestions;
  }
}

interface AgentBehaviorConfig {
  mode: string;
  specWriting: typeof PRODUCTION_AGENT_BEHAVIOR.specWriting;
  codeGeneration: typeof PRODUCTION_AGENT_BEHAVIOR.codeGeneration;
  testGeneration: typeof PRODUCTION_AGENT_BEHAVIOR.testGeneration;
  deployment: typeof PRODUCTION_AGENT_BEHAVIOR.deployment;
  cascade: typeof PRODUCTION_AGENT_BEHAVIOR.cascade;
  validation: typeof PRODUCTION_AGENT_BEHAVIOR.validation;
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

export const productionBehaviorResolver = new ProductionAgentBehaviorResolver();