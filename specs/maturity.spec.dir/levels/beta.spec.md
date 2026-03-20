# speclang-header lines:11
id: "@speclang/maturity/levels/beta"
version: 0.1.0
layer: 3
tags: [maturity, levels, beta]
parent: "@ref:specs/project-maturity-levels/levels"
project_level: Alpha
agent_support: agent_autonomous
short: Beta level definition, validation, transitions, and agent behavior
---
# Beta Level Implementation

Implementation of Beta maturity level for external testing with feature complete, stability focus.

## Files

### @block:beta-level-definition @kind:code @target:src/maturity/levels/beta.ts
```typescript
import { MaturityLevel, LevelDefinition, LevelCriteria, AgentBehavior } from '../types';

export const BETA_LEVEL: LevelDefinition = {
  name: 'Beta',
  order: 3,
  displayName: 'Beta',
  description: 'External Testing - Feature complete, stability focus',
  criteria: {
    documentation: 'complete',
    testing: 'comprehensive',
    deployment: 'beta',
    stability: 'stable'
  } as LevelCriteria,
  agentBehavior: {
    mode: 'autonomous_non_critical',
    humanOversight: 'critical_only',
    cascadeDepth: 4,
    autoDeploy: false,
    generationEnabled: true,
    reviewRequired: false
  } as AgentBehavior,
  requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status'],
  recommendedFields: ['description', 'target', 'depends_on'],
  optionalFields: ['project_level', 'agent_support', 'next_steps'],
  recommendedTests: ['unit', 'integration', 'e2e'],
  allowedTargets: ['beta', 'staging', 'production'],
  constraints: {
    maxSpecs: 200,
    maxLayers: 6,
    allowGenerated: true,
    allowAutoDeploy: false,
    requireMinimalTests: true
  }
};

export const BETA_CRITERIA = {
  documentation: {
    level: 'complete',
    description: 'Documentation complete for external testers',
    requirements: [
      'ID, version, layer, tags, short required',
      'Status field required (active, deprecated, etc.)',
      'Description required',
      'Block definitions must be present',
      'Architecture overview required',
      'API documentation required',
      'User documentation available'
    ]
  },
  testing: {
    level: 'comprehensive',
    description: 'Comprehensive test coverage for all features',
    requirements: [
      'Unit tests for all functions',
      'Integration tests for component interactions',
      'End-to-end tests for critical flows',
      'Test coverage > 80%',
      'Test specs for all major features',
      'Performance tests for critical paths'
    ]
  },
  deployment: {
    level: 'beta',
    description: 'Beta deployment for external testing',
    requirements: [
      'Beta deployment target configured',
      'Staging deployment available',
      'Production deployment possible but not required',
      'Infrastructure automated',
      'Deployment pipeline mature',
      'Rollback capability verified'
    ]
  },
  stability: {
    level: 'stable',
    description: 'APIs and structure stable for external testing',
    requirements: [
      'Breaking changes rare and documented',
      'Version handling required',
      'Backward compatibility expected',
      'Change documentation required',
      'Deprecation notices provided',
      'Performance expectations defined'
    ]
  }
};

export function isBetaLevel(level: string): boolean {
  return level === 'Beta';
}

export function createBetaSpecDefaults(): Partial<ParsedSpecMetadata> {
  return {
    project_level: 'Beta',
    agent_support: 'agent_autonomous',
    status: 'active',
    layer: 3
  };
}
```

### @block:beta-validator @kind:code @target:src/maturity/levels/beta-validator.ts
```typescript
import { BETA_LEVEL, BETA_CRITERIA } from './beta';

interface BetaValidationResult {
  isValid: boolean;
  meetsBetaCriteria: boolean;
  issues: BetaValidationIssue[];
  warnings: string[];
  suggestions: string[];
}

interface BetaValidationIssue {
  type: 'error' | 'warning';
  field: string;
  message: string;
}

class BetaValidator {
  validate(spec: ParsedSpec): BetaValidationResult {
    const issues: BetaValidationIssue[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Check required fields (more strict than Alpha)
    for (const field of BETA_LEVEL.requiredFields) {
      if (!spec.metadata[field]) {
        issues.push({
          type: 'error',
          field,
          message: `Beta requires field: ${field}`
        });
      }
    }
    
    // Check layer is appropriate (0-6 for Beta)
    const layer = spec.metadata.layer;
    if (layer !== undefined && layer > 6) {
      issues.push({
        type: 'error',
        field: 'layer',
        message: `Beta should have layer 0-6, got ${layer}`
      });
    }
    
    // Check deployment target - Beta allows beta, staging, production
    const target = spec.metadata.target;
    if (target && !['beta', 'staging', 'production'].includes(target)) {
      issues.push({
        type: 'error',
        field: 'target',
        message: 'Beta level only supports beta, staging, or production deployment'
      });
    }
    
    // Check documentation completeness
    if (!spec.metadata.description && spec.content && spec.content.length < 500) {
      warnings.push('Beta benefits from detailed description (500+ chars)');
    }
    
    // Beta should have architecture documentation
    if (!spec.content?.toLowerCase().includes('architecture') && 
        !spec.content?.toLowerCase().includes('overview')) {
      issues.push({
        type: 'error',
        field: 'content',
        message: 'Beta requires architecture overview'
      });
    }
    
    // Check for test coverage - Beta expects comprehensive
    const tags = spec.metadata.tags || [];
    if (!tags.includes('tested') && !tags.includes('testing')) {
      warnings.push('Beta expects comprehensive test coverage');
    }
    
    // Check depends_on for dependencies
    if (!spec.metadata.depends_on && spec.content?.includes('@ref:')) {
      warnings.push('References found but no depends_on declared');
    }
    
    // Status field required for Beta
    if (!spec.metadata.status) {
      issues.push({
        type: 'error',
        field: 'status',
        message: 'Beta requires status field (e.g., active, deprecated)'
      });
    }
    
    // Description field required for Beta
    if (!spec.metadata.description) {
      issues.push({
        type: 'error',
        field: 'description',
        message: 'Beta requires description field'
      });
    }
    
    // Suggestions for improvement
    if (!spec.metadata.layer) {
      suggestions.push('Add layer to clarify spec abstraction level');
    }
    
    if (!spec.metadata.target && spec.metadata.layer && spec.metadata.layer >= 4) {
      suggestions.push('Code-level specs should specify target');
    }
    
    // Check for integration test recommendations
    if (spec.metadata.layer && spec.metadata.layer >= 3) {
      suggestions.push('Consider adding integration tests for this layer');
    }
    
    // Check for e2e test recommendations for layer >= 5
    if (spec.metadata.layer && spec.metadata.layer >= 5) {
      suggestions.push('Consider adding end-to-end tests for this layer');
    }
    
    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      meetsBetaCriteria: issues.length === 0,
      issues,
      warnings,
      suggestions
    };
  }
  
  canPromoteFromBeta(spec: ParsedSpec): PromoteResult {
    const blockers: string[] = [];
    
    // Required fields must exist
    if (!spec.metadata.id || !spec.metadata.version) {
      blockers.push('Missing required fields');
    }
    if (!spec.metadata.tags || spec.metadata.tags.length === 0) {
      blockers.push('Missing tags');
    }
    if (!spec.metadata.short) {
      blockers.push('Missing short description');
    }
    if (!spec.metadata.status) {
      blockers.push('Missing status field');
    }
    if (spec.metadata.layer === undefined) {
      blockers.push('Layer not defined');
    }
    if (!spec.metadata.description) {
      blockers.push('Missing description field');
    }
    
    // Should have comprehensive documentation
    const hasComprehensiveDoc = spec.content && spec.content.length > 500;
    if (!hasComprehensiveDoc) {
      blockers.push('Documentation not comprehensive enough for Beta');
    }
    
    // Should have test coverage indicators
    const tags = spec.metadata.tags || [];
    const hasTests = tags.includes('tested') || tags.includes('testing');
    if (!hasTests) {
      blockers.push('Test coverage expected for Beta');
    }
    
    // Should have architecture overview
    const hasArchitecture = spec.content?.toLowerCase().includes('architecture') || 
                            spec.content?.toLowerCase().includes('overview');
    if (!hasArchitecture) {
      blockers.push('Architecture overview required for Beta');
    }
    
    return {
      canPromote: blockers.length === 0,
      blockers,
      readinessScore: this.calculateReadiness(spec)
    };
  }
  
  canDemoteToAlpha(spec: ParsedSpec): boolean {
    // Beta can always go back to Alpha
    return true;
  }
  
  private calculateReadiness(spec: ParsedSpec): number {
    let score = 0;
    
    // Required fields (50 points)
    if (spec.metadata.id) score += 8;
    if (spec.metadata.version) score += 8;
    if (spec.metadata.tags?.length) score += 8;
    if (spec.metadata.short) score += 8;
    if (spec.metadata.status) score += 8;
    if (spec.metadata.layer !== undefined) score += 10;
    
    // Recommended fields (25 points)
    if (spec.metadata.description) score += 8;
    if (spec.metadata.target) score += 8;
    if (spec.metadata.depends_on?.length) score += 9;
    
    // Content quality (25 points)
    if (spec.content && spec.content.length > 0) score += 8;
    if (spec.content && spec.content.length > 500) score += 8;
    if (spec.content && spec.content.length > 1000) score += 9;
    
    return Math.min(score, 100);
  }
}

interface PromoteResult {
  canPromote: boolean;
  blockers: string[];
  readinessScore: number;
}

export const betaValidator = new BetaValidator();
```

### @block:beta-transitions @kind:code @target:src/maturity/levels/beta-transitions.ts
```typescript
import { BETA_LEVEL } from './beta';

interface BetaTransitionChecklist {
  from: MaturityLevel;
  to: MaturityLevel;
  checks: TransitionCheck[];
}

interface TransitionCheck {
  id: string;
  description: string;
  required: boolean;
  automated: boolean;
  category: 'documentation' | 'testing' | 'review' | 'deployment';
}

const BETA_FROM_ALPHA_CHECKLIST: BetaTransitionChecklist = {
  from: 'Alpha',
  to: 'Beta',
  checks: [
    {
      id: 'all_features_implemented',
      description: 'All features implemented',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'documentation_complete',
      description: 'Documentation complete for external testers',
      required: true,
      automated: true,
      category: 'documentation'
    },
    {
      id: 'test_coverage_comprehensive',
      description: 'Comprehensive test coverage',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'beta_deployment_ready',
      description: 'Beta deployment configured',
      required: true,
      automated: true,
      category: 'deployment'
    },
    {
      id: 'beta_testers_identified',
      description: 'Beta testers identified',
      required: true,
      automated: false,
      category: 'review'
    },
    {
      id: 'stability_verified',
      description: 'Stability verified through internal testing',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'feedback_mechanism_ready',
      description: 'Feedback mechanism ready for external testers',
      required: true,
      automated: true,
      category: 'documentation'
    }
  ]
};

const BETA_TO_PRODUCTION_CHECKLIST: BetaTransitionChecklist = {
  from: 'Beta',
  to: 'Production',
  checks: [
    {
      id: 'production_deployment_ready',
      description: 'Production deployment configured and tested',
      required: true,
      automated: true,
      category: 'deployment'
    },
    {
      id: 'security_audit_complete',
      description: 'Security audit completed',
      required: true,
      automated: false,
      category: 'review'
    },
    {
      id: 'performance_tests_passed',
      description: 'Performance tests meet requirements',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'monitoring_alerting_configured',
      description: 'Monitoring and alerting configured',
      required: true,
      automated: true,
      category: 'deployment'
    },
    {
      id: 'disaster_recovery_tested',
      description: 'Disaster recovery procedures tested',
      required: true,
      automated: false,
      category: 'deployment'
    },
    {
      id: 'sla_defined',
      description: 'Service Level Agreements defined',
      required: true,
      automated: true,
      category: 'documentation'
    },
    {
      id: 'support_processes_defined',
      description: 'Support processes defined',
      required: true,
      automated: true,
      category: 'documentation'
    },
    {
      id: 'compliance_verified',
      description: 'Compliance requirements verified',
      required: true,
      automated: false,
      category: 'review'
    }
  ]
};

class BetaTransitionHandler {
  getChecklist(from: MaturityLevel, to: MaturityLevel): BetaTransitionChecklist | null {
    if (from === 'Alpha' && to === 'Beta') return BETA_FROM_ALPHA_CHECKLIST;
    if (from === 'Beta' && to === 'Production') return BETA_TO_PRODUCTION_CHECKLIST;
    return null;
  }
  
  async runAutomatedChecks(spec: ParsedSpec, checklist: BetaTransitionChecklist): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    
    for (const check of checklist.checks) {
      if (!check.automated) {
        results.push({
          checkId: check.id,
          passed: false,
          automated: false,
          message: 'Manual review required'
        });
        continue;
      }
      
      const result = await this.runCheck(spec, check);
      results.push(result);
    }
    
    return results;
  }
  
  private async runCheck(spec: ParsedSpec, check: TransitionCheck): Promise<CheckResult> {
    switch (check.id) {
      case 'all_features_implemented':
        return {
          checkId: check.id,
          passed: spec.content && spec.content.length > 500,
          automated: true,
          message: spec.content ? 'Features documented' : 'No content found'
        };
        
      case 'documentation_complete':
        return {
          checkId: check.id,
          passed: !!(spec.metadata.description && spec.metadata.short),
          automated: true,
          message: spec.metadata.description ? 'Documentation present' : 'No description found'
        };
        
      case 'test_coverage_comprehensive':
        const tags = spec.metadata.tags || [];
        const hasTests = tags.includes('tested') || tags.includes('testing');
        return {
          checkId: check.id,
          passed: hasTests,
          automated: true,
          message: hasTests ? 'Test coverage indicated' : 'No test coverage indicated'
        };
        
      case 'beta_deployment_ready':
        const target = spec.metadata.target;
        return {
          checkId: check.id,
          passed: target === 'beta' || target === 'staging' || target === 'production',
          automated: true,
          message: target ? `Target: ${target}` : 'No target specified'
        };
        
      case 'stability_verified':
        return {
          checkId: check.id,
          passed: spec.metadata.status === 'stable' || spec.metadata.status === 'active',
          automated: true,
          message: spec.metadata.status ? `Status: ${spec.metadata.status}` : 'No status defined'
        };
        
      case 'feedback_mechanism_ready':
        return {
          checkId: check.id,
          passed: spec.content?.toLowerCase().includes('feedback') || 
                 spec.content?.toLowerCase().includes('contact'),
          automated: true,
          message: spec.content ? 'Feedback mechanism mentioned' : 'No feedback mechanism'
        };
        
      case 'production_deployment_ready':
        return {
          checkId: check.id,
          passed: spec.metadata.target === 'production',
          automated: true,
          message: spec.metadata.target === 'production' ? 'Production target set' : 'Not production target'
        };
        
      case 'performance_tests_passed':
        return {
          checkId: check.id,
          passed: tags.includes('performance') || tags.includes('tested'),
          automated: true,
          message: tags.includes('performance') ? 'Performance tests indicated' : 'No performance tests'
        };
        
      case 'monitoring_alerting_configured':
        return {
          checkId: check.id,
          passed: spec.content?.toLowerCase().includes('monitoring') || 
                 spec.content?.toLowerCase().includes('alerting'),
          automated: true,
          message: spec.content ? 'Monitoring mentioned' : 'No monitoring mentioned'
        };
        
      case 'sla_defined':
        return {
          checkId: check.id,
          passed: spec.content?.toLowerCase().includes('sla') || 
                 spec.content?.toLowerCase().includes('service level'),
          automated: true,
          message: spec.content ? 'SLA mentioned' : 'No SLA mentioned'
        };
        
      case 'support_processes_defined':
        return {
          checkId: check.id,
          passed: spec.content?.toLowerCase().includes('support') || 
                 spec.content?.toLowerCase().includes('process'),
          automated: true,
          message: spec.content ? 'Support processes mentioned' : 'No support processes'
        };
        
      default:
        return {
          checkId: check.id,
          passed: false,
          automated: false,
          message: 'Manual check required'
        };
    }
  }
  
  prepareTransition(spec: ParsedSpec, targetLevel: MaturityLevel): TransitionPreparation {
    const checklist = this.getChecklist('Beta', targetLevel);
    
    if (!checklist) {
      return {
        possible: false,
        reason: `No transition path from Beta to ${targetLevel}`
      };
    }
    
    return {
      possible: true,
      targetLevel,
      checklist: checklist.checks,
      estimatedEffort: this.estimateEffort(checklist)
    };
  }
  
  private estimateEffort(checklist: BetaTransitionChecklist): string {
    const requiredCount = checklist.checks.filter(c => c.required).length;
    const automatedCount = checklist.checks.filter(c => c.automated).length;
    
    const manualCount = requiredCount - automatedCount;
    
    if (manualCount <= 1) return 'Low';
    if (manualCount <= 3) return 'Medium';
    return 'High';
  }
}

interface CheckResult {
  checkId: string;
  passed: boolean;
  automated: boolean;
  message: string;
}

interface TransitionPreparation {
  possible: boolean;
  reason?: string;
  targetLevel?: MaturityLevel;
  checklist?: TransitionCheck[];
  estimatedEffort?: string;
}

export const betaTransitionHandler = new BetaTransitionHandler();
```

### @block:beta-behavior @kind:code @target:src/maturity/levels/beta-behavior.ts
```typescript
import { BETA_LEVEL } from './beta';

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
    maxDepth: 4,
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
        return action.depth <= 4;
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
```

## References

- @ref:specs/project-maturity-levels/levels - Level definitions
- @ref:specs/maturity/levels/alpha - Alpha level (previous level)
- @ref:specs/maturity/levels/production - Production level (next level)