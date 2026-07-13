# speclang-header lines:10
id: "@speclang/maturity/levels/alpha"
version: 0.1.0
layer: 3
tags: [maturity, levels, alpha]
parent: "@ref:specs/project-maturity-levels/levels
project_level: Alpha
agent_support: agent_autonomous
short: Alpha level definition, validation, transitions, and agent behavior
---
# Alpha Level Implementation

Implementation of Alpha maturity level for internal testing with incomplete features.

## Files

### @block::alpha-level-definition @kind:code @target:src/maturity/levels/alpha.ts
```typescript
import { MaturityLevel, LevelDefinition, LevelCriteria, AgentBehavior } from '../types';

export const ALPHA_LEVEL: LevelDefinition = {
  name: 'Alpha',
  order: 2,
  displayName: 'Alpha',
  description: 'Internal Testing - Incomplete features, internal use',
  criteria: {
    documentation: 'improving',
    testing: 'growing',
    deployment: 'internal',
    stability: 'evolving'
  } as LevelCriteria,
  agentBehavior: {
    mode: 'assisted_with_review',
    humanOversight: 'major_changes',
    cascadeDepth: 3,
    autoDeploy: false,
    generationEnabled: true,
    reviewRequired: true
  } as AgentBehavior,
  requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status'],
  recommendedFields: ['description', 'target', 'depends_on'],
  optionalFields: ['project_level', 'agent_support', 'next_steps'],
  recommendedTests: ['unit', 'integration'],
  allowedTargets: ['internal', 'staging'],
  constraints: {
    maxSpecs: 100,
    maxLayers: 5,
    allowGenerated: true,
    allowAutoDeploy: false,
    requireMinimalTests: true
  }
};

export const ALPHA_CRITERIA = {
  documentation: {
    level: 'improving',
    description: 'Documentation being improved for internal use',
    requirements: [
      'ID, version, layer, tags, short required',
      'Status field required (active, deprecated, etc.)',
      'Description recommended',
      'Block definitions should be present',
      'Architecture overview recommended',
      'API documentation encouraged'
    ]
  },
  testing: {
    level: 'growing',
    description: 'Test coverage growing for core features',
    requirements: [
      'Unit tests for core functions',
      'Integration tests recommended',
      'Test coverage increasing',
      'Test specs encouraged',
      'Manual testing still acceptable for edge cases'
    ]
  },
  deployment: {
    level: 'internal',
    description: 'Internal deployment for team testing',
    requirements: [
      'Internal deployment target allowed',
      'Staging deployment allowed',
      'No production deployment',
      'Basic infrastructure in place',
      'Deployment automation starting'
    ]
  },
  stability: {
    level: 'evolving',
    description: 'APIs and structure evolving with feedback',
    requirements: [
      'Breaking changes less common',
      'Version handling recommended',
      'Some backward compatibility preferred',
      'Change documentation encouraged',
      'Rapid iteration continuing'
    ]
  }
};

export function isAlphaLevel(level: string): boolean {
  return level === 'Alpha';
}

export function createAlphaSpecDefaults(): Partial<ParsedSpecMetadata> {
  return {
    project_level: 'Alpha',
    agent_support: 'agent_assisted',
    status: 'active',
    layer: 2
  };
}
```

### @block::alpha-validator @kind:code @target:src/maturity/levels/alpha-validator.ts
```typescript
import { ALPHA_LEVEL, ALPHA_CRITERIA } from './alpha';

interface AlphaValidationResult {
  isValid: boolean;
  meetsAlphaCriteria: boolean;
  issues: AlphaValidationIssue[];
  warnings: string[];
  suggestions: string[];
}

interface AlphaValidationIssue {
  type: 'error' | 'warning';
  field: string;
  message: string;
}

class AlphaValidator {
  validate(spec: ParsedSpec): AlphaValidationResult {
    const issues: AlphaValidationIssue[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Check required fields (more strict than MVP)
    for (const field of ALPHA_LEVEL.requiredFields) {
      if (!spec.metadata[field]) {
        issues.push({
          type: 'error',
          field,
          message: `Alpha requires field: ${field}`
        });
      }
    }
    
    // Check layer is appropriate (0-5 for Alpha)
    const layer = spec.metadata.layer;
    if (layer !== undefined && layer > 5) {
      issues.push({
        type: 'error',
        field: 'layer',
        message: `Alpha should have layer 0-5, got ${layer}`
      });
    }
    
    // Check deployment target
    const target = spec.metadata.target;
    if (target === 'production') {
      issues.push({
        type: 'error',
        field: 'target',
        message: 'Alpha level does not support production deployment'
      });
    }
    
    // Check documentation completeness
    if (!spec.metadata.description && spec.content && spec.content.length < 300) {
      warnings.push('Alpha benefits from more detailed description');
    }
    
    // Alpha should have architecture documentation
    if (!spec.content?.toLowerCase().includes('architecture') && 
        !spec.content?.toLowerCase().includes('overview')) {
      suggestions.push('Consider adding architecture overview');
    }
    
    // Check for test coverage - Alpha expects more
    const tags = spec.metadata.tags || [];
    if (!tags.includes('tested') && !tags.includes('testing')) {
      suggestions.push('Alpha expects test coverage for core features');
    }
    
    // Check depends_on for dependencies
    if (!spec.metadata.depends_on && spec.content?.includes('@ref:')) {
      warnings.push('References found but no depends_on declared');
    }
    
    // Status field required for Alpha
    if (!spec.metadata.status) {
      issues.push({
        type: 'error',
        field: 'status',
        message: 'Alpha requires status field (e.g., active, deprecated)'
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
    
    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      meetsAlphaCriteria: issues.length === 0,
      issues,
      warnings,
      suggestions
    };
  }
  
  canPromoteFromAlpha(spec: ParsedSpec): PromoteResult {
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
    
    // Should have demonstrated core functionality
    const hasCoreFunctionality = spec.content && spec.content.length > 200;
    if (!hasCoreFunctionality) {
      blockers.push('Core functionality not documented enough');
    }
    
    // Should have some test coverage
    const tags = spec.metadata.tags || [];
    const hasTests = tags.includes('tested') || tags.includes('testing');
    if (!hasTests) {
      blockers.push('Test coverage expected for Alpha');
    }
    
    return {
      canPromote: blockers.length === 0,
      blockers,
      readinessScore: this.calculateReadiness(spec)
    };
  }
  
  canDemoteToMVP(spec: ParsedSpec): boolean {
    // Alpha can always go back to MVP
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
    if (spec.content && spec.content.length > 300) score += 8;
    if (spec.content && spec.content.length > 500) score += 9;
    
    return Math.min(score, 100);
  }
}

interface PromoteResult {
  canPromote: boolean;
  blockers: string[];
  readinessScore: number;
}

export const alphaValidator = new AlphaValidator();
```

### @block::alpha-transitions @kind:code @target:src/maturity/levels/alpha-transitions.ts
```typescript
import { ALPHA_LEVEL } from './alpha';

interface AlphaTransitionChecklist {
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

const ALPHA_FROM_MVP_CHECKLIST: AlphaTransitionChecklist = {
  from: 'MVP',
  to: 'Alpha',
  checks: [
    {
      id: 'core_functionality_verified',
      description: 'Core functionality verified working',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'documentation_improving',
      description: 'Documentation improved for internal use',
      required: true,
      automated: true,
      category: 'documentation'
    },
    {
      id: 'internal_feedback_incorporated',
      description: 'Feedback from internal testing incorporated',
      required: true,
      automated: false,
      category: 'review'
    },
    {
      id: 'staging_deployment_ready',
      description: 'Staging deployment configured',
      required: true,
      automated: true,
      category: 'deployment'
    },
    {
      id: 'test_coverage_growing',
      description: 'Test coverage adequate for core features',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'alpha_criteria_defined',
      description: 'Alpha release criteria defined',
      required: true,
      automated: true,
      category: 'documentation'
    },
    {
      id: 'layer_structure_defined',
      description: 'Layer structure defined (0-5)',
      required: true,
      automated: true,
      category: 'documentation'
    }
  ]
};

const ALPHA_TO_BETA_CHECKLIST: AlphaTransitionChecklist = {
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

class AlphaTransitionHandler {
  getChecklist(from: MaturityLevel, to: MaturityLevel): AlphaTransitionChecklist | null {
    if (from === 'MVP' && to === 'Alpha') return ALPHA_FROM_MVP_CHECKLIST;
    if (from === 'Alpha' && to === 'Beta') return ALPHA_TO_BETA_CHECKLIST;
    return null;
  }
  
  async runAutomatedChecks(spec: ParsedSpec, checklist: AlphaTransitionChecklist): Promise<CheckResult[]> {
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
      case 'core_functionality_verified':
        return {
          checkId: check.id,
          passed: spec.content && spec.content.length > 200,
          automated: true,
          message: spec.content ? 'Core functionality documented' : 'No content found'
        };
        
      case 'documentation_improving':
        return {
          checkId: check.id,
          passed: !!(spec.metadata.description || spec.metadata.short),
          automated: true,
          message: spec.metadata.description ? 'Documentation present' : 'No description found'
        };
        
      case 'staging_deployment_ready':
        const target = spec.metadata.target;
        return {
          checkId: check.id,
          passed: target === 'internal' || target === 'staging',
          automated: true,
          message: target ? `Target: ${target}` : 'No target specified'
        };
        
      case 'test_coverage_growing':
        const tags = spec.metadata.tags || [];
        const hasTests = tags.includes('tested') || tags.includes('testing');
        return {
          checkId: check.id,
          passed: hasTests,
          automated: true,
          message: hasTests ? 'Test coverage indicated' : 'No test coverage indicated'
        };
        
      case 'layer_structure_defined':
        return {
          checkId: check.id,
          passed: spec.metadata.layer !== undefined && spec.metadata.layer <= 5,
          automated: true,
          message: spec.metadata.layer !== undefined ? `Layer: ${spec.metadata.layer}` : 'No layer defined'
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
    const checklist = this.getChecklist('Alpha', targetLevel);
    
    if (!checklist) {
      return {
        possible: false,
        reason: `No transition path from Alpha to ${targetLevel}`
      };
    }
    
    return {
      possible: true,
      targetLevel,
      checklist: checklist.checks,
      estimatedEffort: this.estimateEffort(checklist)
    };
  }
  
  private estimateEffort(checklist: AlphaTransitionChecklist): string {
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

export const alphaTransitionHandler = new AlphaTransitionHandler();
```

### @block::alpha-behavior @kind:code @target:src/maturity/levels/alpha-behavior.ts
```typescript
import { ALPHA_LEVEL } from './alpha';

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
        return action.depth <= 3;
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
```

## References

- "@ref:specs/project-maturity-levels/levels - Level definitions
- @ref:specs/maturity/levels/mvp - MVP level (previous level)
- @ref:specs/maturity/levels/poc - POC level (earlier level)
