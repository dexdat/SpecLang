import { MVP_LEVEL } from './mvp';
import { ParsedSpec } from '../types';

export const MVP_AGENT_BEHAVIOR = {
  mode: 'assisted_with_review',
  description: 'Agent assists with human review for changes',
  
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
    reason: 'MVP can generate code for core features'
  },
  
  testGeneration: {
    enabled: true,
    requiresReview: true,
    minimumCoverage: 0.3,
    reason: 'Basic test coverage expected'
  },
  
  deployment: {
    allowed: true,
    targets: ['internal', 'staging'],
    autoDeploy: false,
    requiresApproval: true,
    reason: 'Internal deployment for testing'
  },
  
  cascade: {
    maxDepth: 2,
    description: 'Two levels - can reference related specs',
    allowCrossSpecRefs: true,
    requireExplicitDeps: true
  },
  
  validation: {
    strictness: 'standard',
    allowIncomplete: false,
    warnOnMissing: ['tags', 'layer', 'short'],
    errorOnMissing: ['id', 'version', 'tags', 'short']
  },
  
  suggestions: [
    'Focus on core feature implementation',
    'Add basic test coverage',
    'Document for early adopters',
    'Identify and track dependencies',
    'Prepare for Alpha transition'
  ]
};

class MVPAgentBehaviorResolver {
  resolve(): AgentBehaviorConfig {
    return {
      mode: MVP_AGENT_BEHAVIOR.mode,
      specWriting: MVP_AGENT_BEHAVIOR.specWriting,
      codeGeneration: MVP_AGENT_BEHAVIOR.codeGeneration,
      testGeneration: MVP_AGENT_BEHAVIOR.testGeneration,
      deployment: MVP_AGENT_BEHAVIOR.deployment,
      cascade: MVP_AGENT_BEHAVIOR.cascade,
      validation: MVP_AGENT_BEHAVIOR.validation
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
        return action.depth !== undefined && action.depth <= 2;
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
    return MVP_AGENT_BEHAVIOR.suggestions;
  }
}

interface AgentBehaviorConfig {
  mode: string;
  specWriting: typeof MVP_AGENT_BEHAVIOR.specWriting;
  codeGeneration: typeof MVP_AGENT_BEHAVIOR.codeGeneration;
  testGeneration: typeof MVP_AGENT_BEHAVIOR.testGeneration;
  deployment: typeof MVP_AGENT_BEHAVIOR.deployment;
  cascade: typeof MVP_AGENT_BEHAVIOR.cascade;
  validation: typeof MVP_AGENT_BEHAVIOR.validation;
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

export const mvpBehaviorResolver = new MVPAgentBehaviorResolver();