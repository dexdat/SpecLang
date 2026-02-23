# Bootstrap Phase 0.37: Project Level - Alpha

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.37 of the bootstrap process.

**Prerequisites**: 
- Phase 0.36 (MVP Level) complete

## Your Task
Implement the Alpha project level - the third maturity stage. Alpha represents internal testing with incomplete features but progressing toward feature completion.

## Read These Specs First
1. `specs/project-maturity-levels.spec.dir/levels.spec.md` - Level definitions
2. `specs/project-maturity-levels.spec.dir/criteria.spec.md` - Maturity criteria
3. `docs/prompts/phase-0.36-project-levels-mvp.md` - MVP implementation

## What to Build

### Files to Create
```
src/maturity/levels/
├── alpha.ts                  # Alpha level definition
├── alpha-validator.ts        # Alpha-specific validation
├── alpha-transitions.ts      # Alpha transition handling
└── alpha-behavior.ts        # Alpha agent behavior

tests/maturity/
├── alpha.test.ts
└── alpha-validator.test.ts
```

### Requirements

#### 1. Alpha Level Definition (alpha.ts)
```typescript
import { MaturityLevel, LevelDefinition, LevelCriteria, AgentBehavior } from '../types';

export const ALPHA_LEVEL: LevelDefinition = {
  name: 'Alpha',
  order: 2,
  displayName: 'Alpha',
  description: 'Internal testing, incomplete features - Feature completion in progress',
  criteria: {
    documentation: 'improving',
    testing: 'growing',
    deployment: 'internal',
    stability: 'changing'
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
  recommendedFields: ['description', 'target', 'depends_on', 'test_status'],
  optionalFields: ['next_steps', 'milestone', 'feature_complete'],
  recommendedTests: ['unit', 'integration'],
  allowedTargets: ['internal', 'staging'],
  constraints: {
    maxSpecs: 100,
    maxLayers: 6,
    allowGenerated: true,
    allowAutoDeploy: false,
    requireMinimalTests: true,
    minTestCoverage: 0.4
  }
};

export const ALPHA_CRITERIA = {
  documentation: {
    level: 'improving',
    description: 'Documentation actively being improved',
    requirements: [
      'All required fields present',
      'Block definitions should be complete',
      'API documentation in progress',
      'Usage examples encouraged'
    ]
  },
  testing: {
    level: 'growing',
    description: 'Test coverage growing toward comprehensive',
    requirements: [
      'Unit tests for core features',
      'Integration tests beginning',
      'Test coverage > 40%',
      'Test specs encouraged'
    ]
  },
  deployment: {
    level: 'internal',
    description: 'Internal and staging deployment',
    requirements: [
      'Internal deployment stable',
      'Staging deployment configured',
      'No production deployment',
      'Basic CI/CD in place'
    ]
  },
  stability: {
    level: 'changing',
    description: 'Still evolving, breaking changes possible',
    requirements: [
      'Breaking changes tracked',
      'Version deprecation planned',
      'Change log maintained',
      'Breaking changes announced'
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
    status: 'active'
  };
}
```

#### 2. Alpha Validator (alpha-validator.ts)
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
    
    // Check required fields
    for (const field of ALPHA_LEVEL.requiredFields) {
      if (!spec.metadata[field]) {
        issues.push({
          type: 'error',
          field,
          message: `Alpha requires field: ${field}`
        });
      }
    }
    
    // Check layer is appropriate (0-6 for Alpha)
    const layer = spec.metadata.layer;
    if (layer !== undefined && layer > 6) {
      issues.push({
        type: 'error',
        field: 'layer',
        message: `Alpha should have layer 0-6, got ${layer}`
      });
    }
    
    // Check status field
    const validStatuses = ['active', 'feature_complete', 'in_progress', 'on_hold', 'deprecated'];
    if (spec.metadata.status && !validStatuses.includes(spec.metadata.status)) {
      issues.push({
        type: 'error',
        field: 'status',
        message: `Invalid status: ${spec.metadata.status}`
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
    
    // Check test coverage
    const testStatus = spec.metadata.test_status;
    if (testStatus === undefined) {
      warnings.push('Alpha should have test_status field');
    } else if (testStatus === 'none' || testStatus === 'minimal') {
      warnings.push('Alpha should have growing test coverage');
    }
    
    // Check depends_on for references
    if (spec.content?.includes('@ref:') && !spec.metadata.depends_on) {
      warnings.push('References found but depends_on not declared');
    }
    
    // Check documentation completeness
    if (!spec.metadata.description) {
      suggestions.push('Alpha benefits from detailed description');
    }
    
    // Check for feature_complete flag
    if (spec.metadata.status === 'active' && !spec.metadata.feature_complete) {
      suggestions.push('Active Alpha specs should track feature_complete');
    }
    
    // Check milestone
    if (!spec.metadata.milestone) {
      suggestions.push('Alpha should have milestone for tracking');
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
    for (const field of ALPHA_LEVEL.requiredFields) {
      if (!spec.metadata[field]) {
        blockers.push(`Missing required field: ${field}`);
      }
    }
    
    // Layer must be set
    if (spec.metadata.layer === undefined) {
      blockers.push('Layer not defined');
    }
    
    // Should have adequate test coverage
    const testStatus = spec.metadata.test_status;
    if (!testStatus || testStatus === 'none' || testStatus === 'minimal') {
      blockers.push('Insufficient test coverage for Beta');
    }
    
    // Status should indicate readiness
    const validForBeta = ['feature_complete', 'stable'];
    if (!validForBeta.includes(spec.metadata.status)) {
      blockers.push(`Status must be feature_complete or stable for Beta, got: ${spec.metadata.status}`);
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
    
    // Required fields (60 points - 10 each for 6 required fields)
    const requiredFields = ['id', 'version', 'layer', 'tags', 'short', 'status'];
    for (const field of requiredFields) {
      if (spec.metadata[field]) score += 10;
    }
    
    // Recommended fields (20 points)
    if (spec.metadata.description) score += 5;
    if (spec.metadata.target) score += 5;
    if (spec.metadata.test_status) score += 5;
    if (spec.metadata.depends_on) score += 5;
    
    // Status (10 points)
    if (spec.metadata.status === 'feature_complete' || spec.metadata.status === 'stable') {
      score += 10;
    } else if (spec.metadata.status === 'active') {
      score += 5;
    }
    
    // Test coverage (10 points)
    const testStatus = spec.metadata.test_status;
    if (testStatus === 'comprehensive') score += 10;
    else if (testStatus === 'growing') score += 7;
    else if (testStatus === 'adequate') score += 5;
    
    return Math.min(score, 100);
  }
  
  validateTestCoverage(spec: ParsedSpec): TestCoverageResult {
    const testStatus = spec.metadata.test_status;
    const coverage = spec.metadata.test_coverage;
    
    let level: 'none' | 'minimal' | 'adequate' | 'growing' | 'comprehensive' = 'none';
    let meetsRequirement = false;
    const messages: string[] = [];
    
    if (testStatus) {
      level = testStatus as typeof level;
    }
    
    if (testStatus === 'none' || testStatus === undefined) {
      messages.push('No test coverage - required for Alpha');
    } else if (testStatus === 'minimal') {
      messages.push('Minimal test coverage - should grow');
    } else if (testStatus === 'adequate') {
      meetsRequirement = true;
      messages.push('Adequate test coverage');
    } else if (testStatus === 'growing') {
      meetsRequirement = true;
      messages.push('Growing test coverage - good progress');
    } else if (testStatus === 'comprehensive') {
      meetsRequirement = true;
      messages.push('Comprehensive test coverage');
    }
    
    if (coverage !== undefined && coverage < 0.4) {
      messages.push(`Coverage ${(coverage * 100).toFixed(0)}% below Alpha minimum (40%)`);
    }
    
    return {
      level,
      meetsRequirement,
      messages
    };
  }
}

interface PromoteResult {
  canPromote: boolean;
  blockers: string[];
  readinessScore: number;
}

interface TestCoverageResult {
  level: string;
  meetsRequirement: boolean;
  messages: string[];
}

export const alphaValidator = new AlphaValidator();
```

#### 3. Alpha Transitions (alpha-transitions.ts)
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
  category: 'documentation' | 'testing' | 'review' | 'deployment' | 'stability';
}

const ALPHA_FROM_MVP_CHECKLIST: AlphaTransitionChecklist = {
  from: 'MVP',
  to: 'Alpha',
  checks: [
    {
      id: 'core_features_working',
      description: 'Core features verified working',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'documentation_improving',
      description: 'Documentation actively being improved',
      required: true,
      automated: true,
      category: 'documentation'
    },
    {
      id: 'internal_testing_complete',
      description: 'Internal testing cycle completed',
      required: true,
      automated: false,
      category: 'review'
    },
    {
      id: 'test_coverage_growing',
      description: 'Test coverage growing (40%+ goal)',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'staging_deployment_verified',
      description: 'Staging deployment verified',
      required: true,
      automated: true,
      category: 'deployment'
    },
    {
      id: 'status_tracked',
      description: 'Status field properly set',
      required: true,
      automated: true,
      category: 'documentation'
    },
    {
      id: 'change_log_maintained',
      description: 'Change log being maintained',
      required: false,
      automated: false,
      category: 'stability'
    },
    {
      id: 'feature_complete_tracked',
      description: 'Feature completion being tracked',
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
      category: 'documentation'
    },
    {
      id: 'test_coverage_adequate',
      description: 'Test coverage adequate (60%+)',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'integration_tests_passing',
      description: 'Integration tests passing',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'documentation_complete',
      description: 'Documentation complete',
      required: true,
      automated: true,
      category: 'documentation'
    },
    {
      id: 'beta_criteria_met',
      description: 'Beta release criteria met',
      required: true,
      automated: false,
      category: 'review'
    },
    {
      id: 'staging_production_ready',
      description: 'Staging ready for external testing',
      required: true,
      automated: true,
      category: 'deployment'
    },
    {
      id: 'breaking_changes_tracked',
      description: 'Breaking changes documented',
      required: true,
      automated: true,
      category: 'stability'
    },
    {
      id: 'feedback_mechanism_ready',
      description: 'Feedback mechanism ready',
      required: true,
      automated: false,
      category: 'review'
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
      case 'core_features_working':
        return {
          checkId: check.id,
          passed: spec.content && spec.content.length > 100,
          automated: true,
          message: spec.content ? 'Content documented' : 'No content'
        };
        
      case 'test_coverage_growing':
      case 'test_coverage_adequate':
        const testStatus = spec.metadata.test_status;
        const coverage = spec.metadata.test_coverage;
        const passed = testStatus === 'growing' || testStatus === 'adequate' || 
                      testStatus === 'comprehensive' || (coverage !== undefined && coverage >= 0.4);
        return {
          checkId: check.id,
          passed,
          automated: true,
          message: testStatus ? `Test status: ${testStatus}` : 'No test status'
        };
        
      case 'status_tracked':
        const status = spec.metadata.status;
        return {
          checkId: check.id,
          passed: !!status,
          automated: true,
          message: status ? `Status: ${status}` : 'No status set'
        };
        
      case 'all_features_implemented':
        return {
          checkId: check.id,
          passed: spec.metadata.status === 'feature_complete' || spec.metadata.status === 'stable',
          automated: true,
          message: spec.metadata.status ? `Status: ${spec.metadata.status}` : 'No status'
        };
        
      case 'breaking_changes_tracked':
        const hasChangelog = spec.metadata.changelog || spec.content?.toLowerCase().includes('breaking');
        return {
          checkId: check.id,
          passed: !!hasChangelog,
          automated: true,
          message: hasChangelog ? 'Breaking changes tracked' : 'No breaking changes info'
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

#### 4. Alpha Agent Behavior (alpha-behavior.ts)
```typescript
import { ALPHA_LEVEL } from './alpha';

export const ALPHA_AGENT_BEHAVIOR = {
  mode: 'assisted_with_review',
  description: 'Agent assists with human review for major changes',
  
  specWriting: {
    canCreate: true,
    requiresApproval: true,
    approvalType: 'major_changes',
    maxAutonomy: true
  },
  
  codeGeneration: {
    enabled: true,
    requiresReview: true,
    allowedTargets: ['internal', 'staging'],
    minTestCoverage: 0.4,
    reason: 'Alpha can generate code with review'
  },
  
  testGeneration: {
    enabled: true,
    requiresReview: true,
    minimumCoverage: 0.4,
    requireIntegration: true,
    reason: 'Alpha requires growing test coverage'
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
    description: 'Three levels - can reference related specs with explicit deps',
    allowCrossSpecRefs: true,
    requireExplicitDeps: true,
    allowGenerated: true
  },
  
  validation: {
    strictness: 'standard',
    allowIncomplete: false,
    warnOnMissing: ['description', 'status', 'test_status', 'milestone'],
    errorOnMissing: ['id', 'version', 'layer', 'tags', 'short', 'status']
  },
  
  suggestions: [
    'Focus on completing feature implementation',
    'Grow test coverage toward 60%',
    'Complete API documentation',
    'Track feature completion status',
    'Prepare for Beta transition'
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
        return true;
      case 'generate_code':
        return true;
      case 'generate_tests':
        return action.minCoverage ? action.minCoverage >= 0.4 : true;
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
      case 'edit_spec':
        return action.approval === 'major';
      default:
        return false;
    }
  }
  
  getSuggestions(context: AgentContext): string[] {
    return ALPHA_AGENT_BEHAVIOR.suggestions;
  }
  
  getMinTestCoverage(): number {
    return ALPHA_LEVEL.constraints.minTestCoverage || 0.4;
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
  minCoverage?: number;
}

interface AgentContext {
  spec?: ParsedSpec;
}

export const alphaBehaviorResolver = new AlphaAgentBehaviorResolver();
```

## Test Cases
1. Alpha level requires all 6 required fields (id, version, layer, tags, short, status)
2. Alpha validator detects invalid status values
3. Alpha validator detects layer > 6 as error
4. Alpha can transition from MVP with checklist
5. Alpha can transition to Beta with checklist
6. Alpha agent behavior requires 40% minimum test coverage
7. Alpha agent behavior allows integration tests
8. Alpha validator calculates readiness score
9. Alpha suggestions provided to agents

## CLI Commands
```bash
# Check if spec is valid Alpha
speclang level --check-alpha specs/auth.spec.md

# Get Alpha transition checklist from MVP
speclang level --transition-checklist MVP->Alpha specs/auth.spec.md

# Get Alpha transition checklist to Beta
speclang level --transition-checklist Alpha->Beta specs/auth.spec.md

# Get Alpha readiness score
speclang level --readiness specs/auth.spec.md

# Get Alpha agent behavior
speclang level --behavior Alpha

# Validate test coverage
speclang level --test-coverage specs/auth.spec.md
```

## Validation
```bash
bun test tests/maturity/alpha.test.ts
```

## Output Format
After completing, output:
1. Alpha level definition with criteria
2. Alpha validator implementation
3. Transition checklists (MVP->Alpha, Alpha->Beta)
4. Agent behavior configuration
5. Test results
