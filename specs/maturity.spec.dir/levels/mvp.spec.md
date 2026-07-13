# speclang-header lines:10
id: "@speclang/maturity/levels/mvp"
version: 0.1.0
layer: 3
tags: [maturity, levels, mvp]
parent: "@ref:specs/project-maturity-levels/levels"
project_level: Alpha
agent_support: agent_autonomous
short: "MVP (Minimum Viable Product) level definition, validation, transitions, and agent behavior"
---
# MVP Level Implementation

Implementation of MVP (Minimum Viable Product) maturity level.

## Files

### @block::mvp-level-definition @kind:code @target:src/maturity/levels/mvp.ts
```typescript
import { MaturityLevel, LevelDefinition, LevelCriteria, AgentBehavior } from '../types';

export const MVP_LEVEL: LevelDefinition = {
  name: 'MVP',
  order: 1,
  displayName: 'Minimum Viable Product',
  description: 'Core functionality validated - Early adopters can use',
  criteria: {
    documentation: 'usable',
    testing: 'basic',
    deployment: 'internal',
    stability: 'changing'
  } as LevelCriteria,
  agentBehavior: {
    mode: 'assisted_with_review',
    humanOversight: 'major_changes',
    cascadeDepth: 2,
    autoDeploy: false,
    generationEnabled: true,
    reviewRequired: true
  } as AgentBehavior,
  requiredFields: ['id', 'version', 'tags', 'short'],
  recommendedFields: ['layer', 'description', 'target'],
  optionalFields: ['status', 'depends_on', 'next_steps'],
  recommendedTests: ['unit'],
  allowedTargets: ['internal', 'staging'],
  constraints: {
    maxSpecs: 50,
    maxLayers: 4,
    allowGenerated: true,
    allowAutoDeploy: false,
    requireMinimalTests: false
  }
};

export const MVP_CRITERIA = {
  documentation: {
    level: 'usable',
    description: 'Documentation sufficient for understanding and use',
    requirements: [
      'ID, version, tags, short required',
      'Description recommended',
      'Block definitions should be present',
      'Enough detail for early adopters'
    ]
  },
  testing: {
    level: 'basic',
    description: 'Basic test coverage for core functionality',
    requirements: [
      'Unit tests recommended for core functions',
      'No comprehensive coverage required',
      'Manual testing acceptable',
      'Test specs optional but encouraged'
    ]
  },
  deployment: {
    level: 'internal',
    description: 'Internal deployment for team testing',
    requirements: [
      'Internal deployment target allowed',
      'Staging deployment allowed',
      'No production deployment',
      'Basic infrastructure acceptable'
    ]
  },
  stability: {
    level: 'changing',
    description: 'APIs and structure may change',
    requirements: [
      'Breaking changes acceptable',
      'Version handling not required',
      'Minimal backward compatibility',
      'Rapid iteration supported'
    ]
  }
};

export function isMVPLevel(level: string): boolean {
  return level === 'MVP';
}

export function createMVPSpecDefaults(): Partial<ParsedSpecMetadata> {
  return {
    project_level: 'MVP',
    agent_support: 'agent_assisted',
    layer: 1
  };
}
```

### @block::mvp-validator @kind:code @target:src/maturity/levels/mvp-validator.ts
```typescript
import { MVP_LEVEL, MVP_CRITERIA } from './mvp';

interface MVPValidationResult {
  isValid: boolean;
  meetsMVPCriteria: boolean;
  issues: MVPValidationIssue[];
  warnings: string[];
  suggestions: string[];
}

interface MVPValidationIssue {
  type: 'error' | 'warning';
  field: string;
  message: string;
}

class MVPValidator {
  validate(spec: ParsedSpec): MVPValidationResult {
    const issues: MVPValidationIssue[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Check required fields
    for (const field of MVP_LEVEL.requiredFields) {
      if (!spec.metadata[field]) {
        issues.push({
          type: 'error',
          field,
          message: `MVP requires field: ${field}`
        });
      }
    }
    
    // Check layer is appropriate (0-4 for MVP)
    const layer = spec.metadata.layer;
    if (layer !== undefined && layer > 4) {
      issues.push({
        type: 'error',
        field: 'layer',
        message: `MVP should have layer 0-4, got ${layer}`
      });
    }
    
    // Check deployment target
    const target = spec.metadata.target;
    if (target === 'production') {
      issues.push({
        type: 'error',
        field: 'target',
        message: 'MVP level does not support production deployment'
      });
    }
    
    // Check documentation completeness
    if (!spec.metadata.description && spec.content?.length < 200) {
      warnings.push('MVP benefits from more detailed description');
    }
    
    // Check for test coverage
    const tags = spec.metadata.tags || [];
    if (!tags.includes('tested') && !tags.includes('testing')) {
      suggestions.push('Consider adding test coverage for core functionality');
    }
    
    // Check depends_on for dependencies
    if (!spec.metadata.depends_on && spec.content?.includes('@ref:')) {
      warnings.push('References found but no depends_on declared');
    }
    
    // Check status field
    if (!spec.metadata.status) {
      suggestions.push('MVP should have status field (e.g., active, deprecated)');
    }
    
    // Suggestions for improvement
    if (!spec.metadata.layer) {
      suggestions.push('Add layer to clarify spec abstraction level');
    }
    
    if (!spec.metadata.target && spec.metadata.layer && spec.metadata.layer >= 4) {
      suggestions.push('Code-level specs should specify target');
    }
    
    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      meetsMVPCriteria: issues.length === 0,
      issues,
      warnings,
      suggestions
    };
  }
  
  canPromoteFromMVP(spec: ParsedSpec): PromoteResult {
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
    
    // Should have demonstrated core functionality
    const hasCoreFunctionality = spec.content && spec.content.length > 100;
    if (!hasCoreFunctionality) {
      blockers.push('Core functionality not documented');
    }
    
    // Should have defined layer
    if (spec.metadata.layer === undefined) {
      blockers.push('Layer not defined');
    }
    
    return {
      canPromote: blockers.length === 0,
      blockers,
      readinessScore: this.calculateReadiness(spec)
    };
  }
  
  canDemoteToPOC(spec: ParsedSpec): boolean {
    // MVP can always go back to POC
    return true;
  }
  
  private calculateReadiness(spec: ParsedSpec): number {
    let score = 0;
    
    // Required fields (40 points)
    if (spec.metadata.id) score += 10;
    if (spec.metadata.version) score += 10;
    if (spec.metadata.tags?.length) score += 10;
    if (spec.metadata.short) score += 10;
    
    // Recommended fields (30 points)
    if (spec.metadata.layer !== undefined) score += 10;
    if (spec.metadata.description) score += 10;
    if (spec.metadata.target) score += 10;
    
    // Content quality (30 points)
    if (spec.content && spec.content.length > 0) score += 10;
    if (spec.content && spec.content.length > 200) score += 10;
    if (spec.content && spec.content.length > 500) score += 10;
    
    return Math.min(score, 100);
  }
}

interface PromoteResult {
  canPromote: boolean;
  blockers: string[];
  readinessScore: number;
}

export const mvpValidator = new MVPValidator();
```

### @block::mvp-transitions @kind:code @target:src/maturity/levels/mvp-transitions.ts
```typescript
import { MVP_LEVEL } from './mvp';

interface MVPTransitionChecklist {
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

const MVP_FROM_POC_CHECKLIST: MVPTransitionChecklist = {
  from: 'POC',
  to: 'MVP',
  checks: [
    {
      id: 'core_value_validated',
      description: 'Core value proposition validated',
      required: true,
      automated: false,
      category: 'review'
    },
    {
      id: 'basic_requirements_documented',
      description: 'Basic requirements documented',
      required: true,
      automated: true,
      category: 'documentation'
    },
    {
      id: 'core_features_defined',
      description: 'Core features clearly defined',
      required: true,
      automated: true,
      category: 'documentation'
    },
    {
      id: 'target_users_identified',
      description: 'Target users/early adopters identified',
      required: true,
      automated: false,
      category: 'review'
    },
    {
      id: 'internal_deployment_ready',
      description: 'Internal deployment capability ready',
      required: true,
      automated: true,
      category: 'deployment'
    },
    {
      id: 'basic_tests_exist',
      description: 'Basic tests exist or planned',
      required: false,
      automated: false,
      category: 'testing'
    },
    {
      id: 'risks_mitigated',
      description: 'Key risks from POC mitigated',
      required: true,
      automated: false,
      category: 'review'
    }
  ]
};

const MVP_TO_ALPHA_CHECKLIST: MVPTransitionChecklist = {
  from: 'MVP',
  to: 'Alpha',
  checks: [
    {
      id: 'core_functionality_working',
      description: 'Core functionality verified working',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'documentation_complete',
      description: 'Documentation complete for early adopters',
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
      id: 'test_coverage_adequate',
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
    }
  ]
};

class MVPTransitionHandler {
  getChecklist(from: MaturityLevel, to: MaturityLevel): MVPTransitionChecklist | null {
    if (from === 'POC' && to === 'MVP') return MVP_FROM_POC_CHECKLIST;
    if (from === 'MVP' && to === 'Alpha') return MVP_TO_ALPHA_CHECKLIST;
    return null;
  }
  
  async runAutomatedChecks(spec: ParsedSpec, checklist: MVPTransitionChecklist): Promise<CheckResult[]> {
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
      case 'basic_requirements_documented':
        return {
          checkId: check.id,
          passed: !!(spec.metadata.short || spec.metadata.description),
          automated: true,
          message: spec.metadata.short ? 'Requirements documented' : 'No requirements found'
        };
        
      case 'core_features_defined':
        return {
          checkId: check.id,
          passed: spec.content && spec.content.length > 100,
          automated: true,
          message: spec.content ? 'Features documented' : 'No content found'
        };
        
      case 'internal_deployment_ready':
        const target = spec.metadata.target;
        return {
          checkId: check.id,
          passed: target === 'internal' || target === 'staging',
          automated: true,
          message: target ? `Target: ${target}` : 'No target specified'
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
    const checklist = this.getChecklist('MVP', targetLevel);
    
    if (!checklist) {
      return {
        possible: false,
        reason: `No transition path from MVP to ${targetLevel}`
      };
    }
    
    return {
      possible: true,
      targetLevel,
      checklist: checklist.checks,
      estimatedEffort: this.estimateEffort(checklist)
    };
  }
  
  private estimateEffort(checklist: MVPTransitionChecklist): string {
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

export const mvpTransitionHandler = new MVPTransitionHandler();
```

### @block::mvp-behavior @kind:code @target:src/maturity/levels/mvp-behavior.ts
```typescript
import { MVP_LEVEL } from './mvp';

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
        return action.depth <= 2;
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
```