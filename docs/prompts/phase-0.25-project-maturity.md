# Bootstrap Phase 0.25: Project Maturity Levels

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.25 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1-0.24 complete

## Your Task
Implement the project maturity level system that defines spec completeness requirements and agent behavior.

## Read These Specs First
1. `specs/project-maturity-levels.spec.dir/levels.spec.md` - Level definitions
2. `specs/project-maturity-levels.spec.md` - Overview
3. `specs/headers.spec.md` - Header fields

## What to Build

### Files to Create
```
src/maturity/
├── index.ts              # Maturity system entry point
├── levels.ts             # Level definitions
├── criteria.ts           # Level criteria checks
├── transitions.ts        # Level transition workflows
├── agent-behavior.ts     # Agent behavior matrix
└── types.ts              # Maturity types

tests/maturity/
├── levels.test.ts
├── criteria.test.ts
└── transitions.test.ts
```

### Requirements

#### 1. Maturity Types (types.ts)
```typescript
type MaturityLevel = 
  | 'POC'
  | 'MVP'
  | 'Alpha'
  | 'Beta'
  | 'Production'
  | 'Startup'
  | 'SMB'
  | 'MSB'
  | 'Enterprise';

type AgentSupport = 
  | 'human_only'
  | 'agent_assisted'
  | 'agent_autonomous';

interface LevelDefinition {
  name: MaturityLevel;
  order: number;          // 0 = least mature
  description: string;
  criteria: LevelCriteria;
  agentBehavior: AgentBehavior;
  requiredFields: string[];
  recommendedTests: string[];
}

interface LevelCriteria {
  documentation: 'sparse' | 'usable' | 'improving' | 'complete';
  testing: 'minimal' | 'basic' | 'growing' | 'comprehensive' | 'full';
  deployment: 'none' | 'internal' | 'beta' | 'production';
  stability: 'experimental' | 'changing' | 'stable' | 'hardened';
}

interface AgentBehavior {
  mode: 'confirm_each_step' | 'assisted_with_review' | 'autonomous_non_critical' | 'fully_autonomous';
  humanOversight: 'always' | 'major_changes' | 'critical_only' | 'emergencies';
  cascadeDepth: number;
  autoDeploy: boolean;
}
```

#### 2. Level Definitions (levels.ts)
```typescript
const MATURITY_LEVELS: LevelDefinition[] = [
  {
    name: 'POC',
    order: 0,
    description: 'Experimental, minimal validation',
    criteria: {
      documentation: 'sparse',
      testing: 'minimal',
      deployment: 'none',
      stability: 'experimental'
    },
    agentBehavior: {
      mode: 'confirm_each_step',
      humanOversight: 'always',
      cascadeDepth: 1,
      autoDeploy: false
    },
    requiredFields: ['id', 'version'],
    recommendedTests: []
  },
  
  {
    name: 'MVP',
    order: 1,
    description: 'Core functionality validated',
    criteria: {
      documentation: 'usable',
      testing: 'basic',
      deployment: 'internal',
      stability: 'changing'
    },
    agentBehavior: {
      mode: 'assisted_with_review',
      humanOversight: 'major_changes',
      cascadeDepth: 2,
      autoDeploy: false
    },
    requiredFields: ['id', 'version', 'tags', 'short'],
    recommendedTests: ['unit']
  },
  
  {
    name: 'Alpha',
    order: 2,
    description: 'Internal testing, incomplete features',
    criteria: {
      documentation: 'improving',
      testing: 'growing',
      deployment: 'internal',
      stability: 'changing'
    },
    agentBehavior: {
      mode: 'assisted_with_review',
      humanOversight: 'major_changes',
      cascadeDepth: 3,
      autoDeploy: false
    },
    requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status'],
    recommendedTests: ['unit', 'integration']
  },
  
  {
    name: 'Beta',
    order: 3,
    description: 'External testing, feature complete',
    criteria: {
      documentation: 'complete',
      testing: 'comprehensive',
      deployment: 'beta',
      stability: 'stable'
    },
    agentBehavior: {
      mode: 'autonomous_non_critical',
      humanOversight: 'critical_only',
      cascadeDepth: 5,
      autoDeploy: false
    },
    requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level'],
    recommendedTests: ['unit', 'integration', 'e2e']
  },
  
  {
    name: 'Production',
    order: 4,
    description: 'Production-ready, supported',
    criteria: {
      documentation: 'complete',
      testing: 'full',
      deployment: 'production',
      stability: 'hardened'
    },
    agentBehavior: {
      mode: 'fully_autonomous',
      humanOversight: 'emergencies',
      cascadeDepth: 10,
      autoDeploy: true
    },
    requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level', 'agent_support'],
    recommendedTests: ['unit', 'integration', 'e2e', 'performance']
  },
  
  // Scale tiers
  {
    name: 'Startup',
    order: 5,
    description: 'Small team, rapid iteration',
    criteria: {
      documentation: 'complete',
      testing: 'comprehensive',
      deployment: 'production',
      stability: 'stable'
    },
    agentBehavior: {
      mode: 'fully_autonomous',
      humanOversight: 'critical_only',
      cascadeDepth: 7,
      autoDeploy: true
    },
    requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level'],
    recommendedTests: ['unit', 'integration']
  },
  
  {
    name: 'SMB',
    order: 6,
    description: 'Established processes, moderate scale',
    criteria: {
      documentation: 'complete',
      testing: 'full',
      deployment: 'production',
      stability: 'hardened'
    },
    agentBehavior: {
      mode: 'fully_autonomous',
      humanOversight: 'critical_only',
      cascadeDepth: 8,
      autoDeploy: true
    },
    requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level', 'compliance'],
    recommendedTests: ['unit', 'integration', 'e2e', 'security']
  },
  
  {
    name: 'MSB',
    order: 7,
    description: 'Complex integration, compliance focus',
    criteria: {
      documentation: 'complete',
      testing: 'full',
      deployment: 'production',
      stability: 'hardened'
    },
    agentBehavior: {
      mode: 'fully_autonomous',
      humanOversight: 'critical_only',
      cascadeDepth: 10,
      autoDeploy: true
    },
    requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level', 'compliance', 'audit'],
    recommendedTests: ['unit', 'integration', 'e2e', 'security', 'compliance']
  },
  
  {
    name: 'Enterprise',
    order: 8,
    description: 'Maximum scale, strict governance',
    criteria: {
      documentation: 'complete',
      testing: 'full',
      deployment: 'production',
      stability: 'hardened'
    },
    agentBehavior: {
      mode: 'fully_autonomous',
      humanOversight: 'emergencies',
      cascadeDepth: 10,
      autoDeploy: true
    },
    requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level', 'compliance', 'audit', 'governance'],
    recommendedTests: ['unit', 'integration', 'e2e', 'security', 'compliance', 'performance', 'chaos']
  }
];
```

#### 3. Criteria Checker (criteria.ts)
```typescript
class CriteriaChecker {
  checkLevel(spec: ParsedSpec, level: MaturityLevel): CriteriaResult {
    const definition = getLevelDefinition(level);
    const results: CriteriaResult = {
      meetsCriteria: true,
      missing: [],
      warnings: []
    };
    
    // Check required fields
    for (const field of definition.requiredFields) {
      if (!spec.metadata[field]) {
        results.missing.push(`Missing required field: ${field}`);
        results.meetsCriteria = false;
      }
    }
    
    // Check test coverage
    if (definition.recommendedTests.length > 0) {
      const coverage = this.getTestCoverage(spec);
      for (const testType of definition.recommendedTests) {
        if (!coverage[testType]) {
          results.warnings.push(`Missing recommended test: ${testType}`);
        }
      }
    }
    
    // Check documentation completeness
    const docScore = this.scoreDocumentation(spec);
    if (docScore < this.getMinDocScore(definition.criteria.documentation)) {
      results.warnings.push(`Documentation below level threshold`);
    }
    
    return results;
  }
  
  suggestLevel(spec: ParsedSpec): MaturityLevel {
    // Find highest level this spec qualifies for
    for (let i = MATURITY_LEVELS.length - 1; i >= 0; i--) {
      const result = this.checkLevel(spec, MATURITY_LEVELS[i].name);
      if (result.meetsCriteria) {
        return MATURITY_LEVELS[i].name;
      }
    }
    return 'POC';
  }
}
```

#### 4. Level Transitions (transitions.ts)
```typescript
interface TransitionChecklist {
  from: MaturityLevel;
  to: MaturityLevel;
  checks: TransitionCheck[];
}

interface TransitionCheck {
  category: 'documentation' | 'testing' | 'review' | 'deployment';
  description: string;
  required: boolean;
  automated: boolean;
}

class TransitionManager {
  private transitionChecklists: Map<string, TransitionChecklist> = new Map();
  
  canTransition(spec: ParsedSpec, targetLevel: MaturityLevel): TransitionResult {
    const currentLevel = spec.metadata.project_level as MaturityLevel || 'POC';
    const checklist = this.getChecklist(currentLevel, targetLevel);
    
    if (!checklist) {
      return { canTransition: false, reason: 'Invalid transition path' };
    }
    
    const results: CheckResult[] = [];
    
    for (const check of checklist.checks) {
      const result = this.runCheck(spec, check);
      results.push(result);
    }
    
    const failedRequired = results.filter(r => !r.passed && r.required);
    
    return {
      canTransition: failedRequired.length === 0,
      results,
      blockingChecks: failedRequired
    };
  }
  
  getChecklist(from: MaturityLevel, to: MaturityLevel): TransitionChecklist | null {
    // Only allow adjacent level transitions
    const fromOrder = getLevelOrder(from);
    const toOrder = getLevelOrder(to);
    
    if (Math.abs(toOrder - fromOrder) !== 1) {
      return null; // Must go step by step
    }
    
    return this.transitionChecklists.get(`${from}->${to}`) || null;
  }
}

// Example transition: Alpha -> Beta
const ALPHA_TO_BETA: TransitionChecklist = {
  from: 'Alpha',
  to: 'Beta',
  checks: [
    { category: 'documentation', description: 'All blocks documented', required: true, automated: true },
    { category: 'documentation', description: 'README complete', required: true, automated: false },
    { category: 'testing', description: 'Test coverage > 70%', required: true, automated: true },
    { category: 'testing', description: 'E2E tests passing', required: true, automated: true },
    { category: 'review', description: 'Peer review completed', required: true, automated: false },
    { category: 'review', description: 'Security review done', required: false, automated: false },
    { category: 'deployment', description: 'Staging deployment verified', required: true, automated: true }
  ]
};
```

#### 5. Agent Behavior Matrix (agent-behavior.ts)
```typescript
class AgentBehaviorResolver {
  resolve(level: MaturityLevel, support: AgentSupport): ResolvedBehavior {
    const levelDef = getLevelDefinition(level);
    
    // Agent support can override level defaults
    const behavior = this.mergeBehavior(levelDef.agentBehavior, support);
    
    return {
      confirmSteps: behavior.mode === 'confirm_each_step',
      requireReview: ['major_changes', 'critical_only'].includes(behavior.humanOversight),
      maxCascadeDepth: behavior.cascadeDepth,
      allowAutoDeploy: behavior.autoDeploy && support === 'agent_autonomous',
      
      // Derived behaviors
      allowDirectCascade: behavior.cascadeDepth > 3 && support === 'agent_autonomous',
      requireHumanApproval: behavior.humanOversight !== 'emergencies',
      notifyOnChanges: levelDef.order < 4 // POC through Beta
    };
  }
  
  private mergeBehavior(base: AgentBehavior, support: AgentSupport): AgentBehavior {
    // agent_autonomous can reduce oversight
    if (support === 'agent_autonomous') {
      return {
        ...base,
        humanOversight: this.reduceOversight(base.humanOversight)
      };
    }
    
    // human_only increases oversight
    if (support === 'human_only') {
      return {
        ...base,
        mode: 'confirm_each_step',
        humanOversight: 'always',
        autoDeploy: false
      };
    }
    
    return base;
  }
}
```

## Test Cases
1. POC level accepts minimal specs
2. Production level requires all fields
3. Transition Alpha->Beta requires checklist
4. Invalid transition (skip levels) blocked
5. Agent behavior adjusts per level
6. Agent support overrides level defaults
7. Suggest correct level for spec
8. Enterprise requires compliance fields

## CLI Commands
```bash
# Check spec level
speclang level specs/auth.spec.md

# Suggest appropriate level
speclang level --suggest specs/auth.spec.md

# Transition checklist
speclang level --transition Beta specs/auth.spec.md

# Validate level requirements
speclang level --validate specs/auth.spec.md
```

## Validation
```bash
bun test tests/maturity/
```

## Output Format
After completing, output:
1. Levels defined
2. Transition paths available
3. Agent behavior matrix
4. Test results
