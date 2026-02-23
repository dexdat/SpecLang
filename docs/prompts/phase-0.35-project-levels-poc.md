# Bootstrap Phase 0.35: Project Level - POC (Proof of Concept)

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.35 of the bootstrap process.

**Prerequisites**: 
- Phase 0.25 (Project Maturity Levels) complete
- Phase 0.33-0.34 (Layer System) complete

## Your Task
Implement the POC (Proof of Concept) project level - the earliest maturity stage. POC represents experimental work with minimal validation where the core idea is being tested.

## Read These Specs First
1. `specs/project-maturity-levels.spec.dir/levels.spec.md` - Level definitions
2. `specs/project-maturity-levels.spec.dir/criteria.spec.md` - Maturity criteria
3. `specs/semantic-definitions.spec.dir/project-levels.spec.md` - Project level semantics

## What to Build

### Files to Create
```
src/maturity/levels/
├── poc.ts                  # POC level definition
├── poc-validator.ts        # POC-specific validation
├── poc-transitions.ts      # POC transition handling
└── poc-behavior.ts         # POC agent behavior

tests/maturity/
├── poc.test.ts
└── poc-validator.test.ts
```

### Requirements

#### 1. POC Level Definition (poc.ts)
```typescript
import { MaturityLevel, LevelDefinition, LevelCriteria, AgentBehavior } from '../types';

export const POC_LEVEL: LevelDefinition = {
  name: 'POC',
  order: 0,
  displayName: 'Proof of Concept',
  description: 'Experimental, minimal validation - Core idea being tested',
  criteria: {
    documentation: 'sparse',
    testing: 'minimal',
    deployment: 'none',
    stability: 'experimental'
  } as LevelCriteria,
  agentBehavior: {
    mode: 'confirm_each_step',
    humanOversight: 'always',
    cascadeDepth: 1,
    autoDeploy: false,
    generationEnabled: false,
    reviewRequired: true
  } as AgentBehavior,
  requiredFields: ['id', 'version'],
  recommendedFields: ['short'],
  optionalFields: ['tags', 'layer', 'description'],
  recommendedTests: [],
  allowedTargets: [],
  constraints: {
    maxSpecs: 10,
    maxLayers: 2,
    allowGenerated: false,
    allowAutoDeploy: false
  }
};

export const POC_CRITERIA = {
  documentation: {
    level: 'sparse',
    description: 'Minimal documentation, focus on core idea',
    requirements: [
      'ID and version required',
      'Short description recommended',
      'Block definitions optional'
    ]
  },
  testing: {
    level: 'minimal',
    description: 'No formal testing required',
    requirements: [
      'No test coverage required',
      'Manual verification acceptable',
      'No test specs needed'
    ]
  },
  deployment: {
    level: 'none',
    description: 'No deployment expected',
    requirements: [
      'No deployment targets',
      'No infrastructure specs',
      'No production considerations'
    ]
  },
  stability: {
    level: 'experimental',
    description: 'Subject to significant change',
    requirements: [
      'Breaking changes expected',
      'No backward compatibility needed',
      'Rapid iteration OK'
    ]
  }
};

export function isPOCLevel(level: string): boolean {
  return level === 'POC';
}

export function createPOCSpecDefaults(): Partial<ParsedSpecMetadata> {
  return {
    project_level: 'POC',
    agent_support: 'human_only',
    layer: 0
  };
}
```

#### 2. POC Validator (poc-validator.ts)
```typescript
import { POC_LEVEL, POC_CRITERIA } from './poc';
import { MaturityLevel } from '../types';

interface POCValidationResult {
  isValid: boolean;
  meetsPOCCriteria: boolean;
  issues: POCValidationIssue[];
  warnings: string[];
  suggestions: string[];
}

interface POCValidationIssue {
  type: 'error' | 'warning';
  field: string;
  message: string;
}

class POCValidator {
  validate(spec: ParsedSpec): POCValidationResult {
    const issues: POCValidationIssue[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Check required fields
    for (const field of POC_LEVEL.requiredFields) {
      if (!spec.metadata[field]) {
        issues.push({
          type: 'error',
          field,
          message: `POC requires field: ${field}`
        });
      }
    }
    
    // Check documentation sparse requirements
    if (!spec.metadata.short && !spec.metadata.description) {
      warnings.push('POC recommends a short description');
    }
    
    // Check that layer is not too high
    const layer = spec.metadata.layer;
    if (layer !== undefined && layer > 2) {
      issues.push({
        type: 'error',
        field: 'layer',
        message: `POC should have layer 0-2, got ${layer}`
      });
    }
    
    // Check no generated artifacts
    const tags = spec.metadata.tags || [];
    if (tags.includes('generated')) {
      issues.push({
        type: 'error',
        field: 'tags',
        message: 'POC level should not have generated artifacts'
      });
    }
    
    // Check no deployment
    if (spec.metadata.deployment || spec.metadata.target) {
      issues.push({
        type: 'error',
        field: 'deployment',
        message: 'POC level does not support deployment targets'
      });
    }
    
    // Suggestions for improvement
    if (!spec.metadata.short) {
      suggestions.push('Add a short description to help with spec discovery');
    }
    
    if (!spec.metadata.layer) {
      suggestions.push('Consider adding layer 0 (North Star) for vision specs');
    }
    
    if (spec.content && spec.content.length > 1000) {
      suggestions.push('POC specs should be concise - consider splitting into multiple specs');
    }
    
    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      meetsPOCCriteria: issues.length === 0,
      issues,
      warnings,
      suggestions
    };
  }
  
  canPromoteFromPOC(spec: ParsedSpec): PromoteResult {
    const validation = this.validate(spec);
    
    const blockers: string[] = [];
    
    // Must have basic required fields
    if (!spec.metadata.id || !spec.metadata.version) {
      blockers.push('Missing required fields (id, version)');
    }
    
    // Should have demonstrated core value
    if (!spec.metadata.short && !spec.metadata.description) {
      blockers.push('No description of core value proposition');
    }
    
    // Should identify what comes next
    const hasNextStep = spec.metadata.next_steps || 
                        spec.metadata.next || 
                        spec.content?.toLowerCase().includes('next');
    
    if (!hasNextStep) {
      blockers.push('No clear next steps defined');
    }
    
    return {
      canPromote: blockers.length === 0,
      blockers,
      readinessScore: this.calculateReadiness(spec)
    };
  }
  
  private calculateReadiness(spec: ParsedSpec): number {
    let score = 0;
    const maxScore = 100;
    
    // Required fields (40 points)
    if (spec.metadata.id) score += 20;
    if (spec.metadata.version) score += 20;
    
    // Recommended fields (30 points)
    if (spec.metadata.short) score += 15;
    if (spec.metadata.layer !== undefined) score += 15;
    
    // Content quality (30 points)
    if (spec.content && spec.content.length > 0) {
      score += 15;
      if (spec.content.length < 500) score += 15; // Concise is good for POC
    }
    
    return Math.min(score, maxScore);
  }
}

interface PromoteResult {
  canPromote: boolean;
  blockers: string[];
  readinessScore: number;
}

export const pocValidator = new POCValidator();
```

#### 3. POC Transitions (poc-transitions.ts)
```typescript
import { POC_LEVEL } from './poc';

interface POCTransitionChecklist {
  to: MaturityLevel;
  checks: TransitionCheck[];
}

interface TransitionCheck {
  id: string;
  description: string;
  required: boolean;
  automated: boolean;
  status?: 'pending' | 'passed' | 'failed';
}

const POC_TO_MVP_CHECKLIST: POCTransitionChecklist = {
  to: 'MVP',
  checks: [
    {
      id: 'core_value_defined',
      description: 'Core value proposition clearly defined',
      required: true,
      automated: true
    },
    {
      id: 'basic_requirements',
      description: 'Basic requirements documented',
      required: true,
      automated: false
    },
    {
      id: 'feasibility_demonstrated',
      description: 'Technical feasibility demonstrated',
      required: true,
      automated: false
    },
    {
      id: 'stakeholder_alignment',
      description: 'Stakeholders aligned on POC outcomes',
      required: true,
      automated: false
    },
    {
      id: 'next_steps_defined',
      description: 'Clear next steps to MVP defined',
      required: true,
      automated: true
    },
    {
      id: 'risks_identified',
      description: 'Key risks and mitigations identified',
      required: false,
      automated: false
    }
  ]
};

class POCTransitionHandler {
  getChecklist(targetLevel: MaturityLevel): POCTransitionChecklist | null {
    switch (targetLevel) {
      case 'MVP':
        return POC_TO_MVP_CHECKLIST;
      default:
        return null;
    }
  }
  
  async runAutomatedChecks(spec: ParsedSpec): Promise<TransitionCheckResult[]> {
    const results: TransitionCheckResult[] = [];
    
    // Core value defined check
    const hasCoreValue = spec.metadata.short || 
                        spec.metadata.description ||
                        spec.content?.toLowerCase().includes('value');
    results.push({
      checkId: 'core_value_defined',
      passed: !!hasCoreValue,
      evidence: hasCoreValue ? 'Core value found in metadata or content' : 'No core value found'
    });
    
    // Next steps defined check
    const hasNextSteps = spec.metadata.next_steps ||
                        spec.metadata.next ||
                        spec.content?.toLowerCase().includes('next');
    results.push({
      checkId: 'next_steps_defined',
      passed: !!hasNextSteps,
      evidence: hasNextSteps ? 'Next steps found' : 'No next steps found'
    });
    
    return results;
  }
  
  prepareTransition(spec: ParsedSpec, targetLevel: MaturityLevel): TransitionPreparation {
    const checklist = this.getChecklist(targetLevel);
    
    if (!checklist) {
      return {
        possible: false,
        reason: `No transition path from POC to ${targetLevel}`
      };
    }
    
    return {
      possible: true,
      targetLevel,
      checklist: checklist.checks,
      estimatedEffort: this.estimateEffort(spec, checklist)
    };
  }
  
  private estimateEffort(spec: ParsedSpec, checklist: POCTransitionChecklist): string {
    const requiredCount = checklist.checks.filter(c => c.required).length;
    
    if (requiredCount <= 2) return 'Low';
    if (requiredCount <= 4) return 'Medium';
    return 'High';
  }
}

interface TransitionCheckResult {
  checkId: string;
  passed: boolean;
  evidence: string;
}

interface TransitionPreparation {
  possible: boolean;
  reason?: string;
  targetLevel?: MaturityLevel;
  checklist?: TransitionCheck[];
  estimatedEffort?: string;
}

export const pocTransitionHandler = new POCTransitionHandler();
```

#### 4. POC Agent Behavior (poc-behavior.ts)
```typescript
import { POC_LEVEL } from './poc';

export const POC_AGENT_BEHAVIOR = {
  mode: 'confirm_each_step',
  description: 'Agent requires human confirmation for every action',
  
  specWriting: {
    canCreate: true,
    requiresApproval: true,
    approvalType: 'all',
    maxAutonomy: false
  },
  
  codeGeneration: {
    enabled: false,
    reason: 'POC level focuses on validation, not production code'
  },
  
  testGeneration: {
    enabled: false,
    reason: 'No formal testing required at POC level'
  },
  
  deployment: {
    allowed: false,
    reason: 'POC should not be deployed'
  },
  
  cascade: {
    maxDepth: 1,
    description: 'Single level - no cascading to other specs',
    allowCrossSpecRefs: false
  },
  
  validation: {
    strictness: 'minimal',
    allowIncomplete: true,
    warnOnMissing: ['short', 'layer'],
    errorOnMissing: ['id', 'version']
  },
  
  suggestions: [
    'Focus on core idea validation',
    'Keep documentation minimal',
    'Identify key risks early',
    'Define clear success criteria',
    'Plan transition to MVP'
  ]
};

class POCAgentBehaviorResolver {
  resolve(): AgentBehaviorConfig {
    return {
      mode: POC_AGENT_BEHAVIOR.mode,
      specWriting: POC_AGENT_BEHAVIOR.specWriting,
      codeGeneration: POC_AGENT_BEHAVIOR.codeGeneration,
      testGeneration: POC_AGENT_BEHAVIOR.testGeneration,
      deployment: POC_AGENT_BEHAVIOR.deployment,
      cascade: POC_AGENT_BEHAVIOR.cascade,
      validation: POC_AGENT_BEHAVIOR.validation
    };
  }
  
  shouldAllowAction(action: AgentAction): boolean {
    switch (action.type) {
      case 'create_spec':
        return true;
      case 'edit_spec':
        return true;
      case 'generate_code':
        return false;
      case 'generate_tests':
        return false;
      case 'deploy':
        return false;
      case 'cascade':
        return action.depth <= 1;
      default:
        return false;
    }
  }
  
  getSuggestions(context: AgentContext): string[] {
    return POC_AGENT_BEHAVIOR.suggestions;
  }
}

interface AgentBehaviorConfig {
  mode: string;
  specWriting: typeof POC_AGENT_BEHAVIOR.specWriting;
  codeGeneration: typeof POC_AGENT_BEHAVIOR.codeGeneration;
  testGeneration: typeof POC_AGENT_BEHAVIOR.testGeneration;
  deployment: typeof POC_AGENT_BEHAVIOR.deployment;
  cascade: typeof POC_AGENT_BEHAVIOR.cascade;
  validation: typeof POC_AGENT_BEHAVIOR.validation;
}

interface AgentAction {
  type: string;
  depth?: number;
}

interface AgentContext {
  spec?: ParsedSpec;
}

export const pocBehaviorResolver = new POCAgentBehaviorResolver();
```

## Test Cases
1. POC level accepts minimal fields (id, version)
2. POC level rejects generated artifacts
3. POC validator detects layer > 2 as error
4. POC validator suggests short description
5. POC can transition to MVP with checklist
6. POC agent behavior blocks code generation
7. POC agent behavior requires approval for all edits
8. Readiness score calculated correctly

## CLI Commands
```bash
# Check if spec is valid POC
speclang level --check-poc specs/idea.spec.md

# Get POC transition checklist to MVP
speclang level --transition-checklist POC specs/idea.spec.md

# Get POC readiness score
speclang level --readiness specs/idea.spec.md

# Get POC agent behavior
speclang level --behavior POC
```

## Validation
```bash
bun test tests/maturity/poc.test.ts
```

## Output Format
After completing, output:
1. POC level definition with criteria
2. POC validator implementation
3. Transition checklist to MVP
4. Agent behavior restrictions
5. Test results
