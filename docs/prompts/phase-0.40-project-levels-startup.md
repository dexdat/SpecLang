# Bootstrap Phase 0.40: Startup Maturity Level

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.40 of the bootstrap process.

**Prerequisites**: 
- Phase 0.25 (Project Maturity Levels) complete
- Phase 0.39 (Production Level) complete or in progress

## Your Task
Implement the Startup maturity level - optimized for small teams with rapid iteration, balancing autonomy with minimal process overhead.

## Read These Specs First
1. `specs/project-maturity-levels.spec.md` - Maturity overview
2. `specs/startup-level.spec.md` - Startup-specific criteria
3. `specs/team-structure.spec.md` - Small team patterns

## What to Build

### Files to Create
```
src/maturity/startup/
├── index.ts              # Startup level exports
├── criteria.ts           # Startup-specific criteria
├── requirements.ts       # Startup requirements checker
├── rapid-release.ts      # Rapid release configuration
├── minimal-process.ts    # Minimal overhead processes
├── team-config.ts        # Team configuration
└── behaviors.ts          # Startup agent behaviors
```

### Requirements

#### 1. Startup Criteria (criteria.ts)
```typescript
interface StartupCriteria {
  smallTeam: boolean;           // <= 10 people
  rapidIteration: boolean;     // Weekly releases
  mvpComplete: boolean;
  documentation: 'minimal' | 'essential' | 'complete';
  testCoverage: number;        // Minimum 50%
  deployment: 'manual' | 'automated' | 'continuous';
  process: 'minimal' | 'lightweight' | 'formal';
}

const STARTUP_CRITERIA: StartupCriteria = {
  smallTeam: true,
  rapidIteration: true,
  mvpComplete: true,
  documentation: 'essential',
  testCoverage: 50,
  deployment: 'automated',
  process: 'minimal'
};

interface TeamConfig {
  maxTeamSize: number;
  roles: string[];
  decisionMaking: 'consensus' | 'leads' | 'single';
  meetingFrequency: string;
  docRequired: string[];
}

const STARTUP_TEAM_CONFIG: TeamConfig = {
  maxTeamSize: 10,
  roles: ['developer', 'lead', 'founder'],
  decisionMaking: 'leads',
  meetingFrequency: 'weekly',
  docRequired: ['README', 'API']
};
```

#### 2. Startup Requirements (requirements.ts)
```typescript
class StartupRequirementsChecker {
  private thresholds = {
    minTestCoverage: 50,
    maxTeamSize: 10,
    minDocs: 2,
    automatedDeploy: true
  };

  checkRequirements(spec: ParsedSpec, teamSize?: number): StartupValidationResult {
    const result: StartupValidationResult = {
      meetsRequirements: true,
      coverage: this.calculateCoverage(spec),
      docs: this.checkDocs(spec),
      teamSizeValid: teamSize ? teamSize <= this.thresholds.maxTeamSize : true,
      blockers: [],
      warnings: []
    };

    // Lighten requirements for startup pace
    if (result.coverage < this.thresholds.minTestCoverage) {
      result.warnings.push(`Test coverage ${result.coverage}% below recommended ${this.thresholds.minTestCoverage}%`);
      // Not a blocker - startups move fast
    }

    if (result.docs.length < this.thresholds.minDocs) {
      result.warnings.push('Consider adding more documentation');
    }

    return result;
  }

  calculateCoverage(spec: ParsedSpec): number {
    const blocksWithTests = spec.blocks.filter(b => b.tests && b.tests.length > 0).length;
    return spec.blocks.length > 0 ? (blocksWithTests / spec.blocks.length) * 100 : 0;
  }

  checkDocs(spec: ParsedSpec): string[] {
    const docs: string[] = [];
    if (spec.metadata.short) docs.push('short');
    if (spec.readme) docs.push('readme');
    if (spec.apiDoc) docs.push('api');
    return docs;
  }
}
```

#### 3. Rapid Release Configuration (rapid-release.ts)
```typescript
interface RapidReleaseConfig {
  releaseFrequency: 'daily' | 'weekly' | 'biweekly';
  deploymentType: 'direct' | 'staged' | 'canary';
  rollbackTime: number;        // minutes
  featureFlags: boolean;
  abTesting: boolean;
  metricsRequired: boolean;
}

const RAPID_RELEASE_CONFIG: RapidReleaseConfig = {
  releaseFrequency: 'weekly',
  deploymentType: 'direct',
  rollbackTime: 5,
  featureFlags: true,
  abTesting: true,
  metricsRequired: true
};

class RapidReleaseManager {
  private config: RapidReleaseConfig;

  constructor(config: Partial<RapidReleaseConfig> = {}) {
    this.config = { ...RAPID_RELEASE_CONFIG, ...config };
  }

  async release(spec: ParsedSpec, version: string): Promise<ReleaseResult> {
    const release: Release = {
      id: generateId(),
      spec: spec.metadata.id,
      version,
      timestamp: new Date(),
      type: this.determineReleaseType(version),
      deployment: await this.deploy(spec),
      verified: false
    };

    // Quick smoke test
    release.verified = await this.quickVerify(release.deployment);

    if (!release.verified) {
      await this.rollback(release);
    }

    return release;
  }

  private determineReleaseType(version: string): ReleaseType {
    const [major, minor, patch] = version.split('.').map(Number);
    if (major > 0) return 'major';
    if (minor > 0) return 'minor';
    return 'patch';
  }

  private async quickVerify(deployment: Deployment): Promise<boolean> {
    // Quick health check - not full test suite
    const health = await fetch(`${deployment.url}/health`);
    return health.ok;
  }

  async rollback(release: Release): Promise<void> {
    console.log(`Rolling back ${release.id} within ${this.config.rollbackTime} minutes`);
    // Fast rollback logic
  }
}
```

#### 4. Minimal Process (minimal-process.ts)
```typescript
interface ProcessConfig {
  codeReview: 'required' | 'optional' | 'none';
  testing: 'full' | 'smoke' | 'none';
  documentation: 'minimal' | 'essential' | 'full';
  approvalRequired: string[];
}

const STARTUP_PROCESS: ProcessConfig = {
  codeReview: 'optional',
  testing: 'smoke',
  documentation: 'essential',
  approvalRequired: ['breaking', 'security']
};

class MinimalProcessRunner {
  private config: ProcessConfig;

  constructor(config: Partial<ProcessConfig> = {}) {
    this.config = { ...STARTUP_PROCESS, ...config };
  }

  async preReleaseCheck(spec: ParsedSpec): Promise<ProcessResult> {
    const checks: ProcessCheck[] = [];

    // Code review - optional in startup
    if (this.config.codeReview !== 'none') {
      const hasReview = spec.metadata.approvedBy?.length > 0;
      checks.push({
        name: 'code_review',
        required: this.config.codeReview === 'required',
        passed: this.config.codeReview === 'optional' || hasReview
      });
    }

    // Testing - smoke only
    if (this.config.testing !== 'none') {
      const hasTests = spec.blocks.some(b => b.tests && b.tests.length > 0);
      checks.push({
        name: 'smoke_tests',
        required: true,
        passed: hasTests || this.config.testing === 'none'
      });
    }

    // Documentation - essential only
    if (this.config.documentation !== 'none') {
      const hasBasicDocs = !!spec.metadata.short;
      checks.push({
        name: 'basic_docs',
        required: this.config.documentation !== 'none',
        passed: hasBasicDocs || this.config.documentation === 'minimal'
      });
    }

    return {
      passed: checks.filter(c => c.required && !c.passed).length === 0,
      checks
    };
  }
}
```

#### 5. Startup Agent Behaviors (behaviors.ts)
```typescript
const STARTUP_AGENT_BEHAVIOR: AgentBehaviorConfig = {
  mode: 'fully_autonomous',
  humanOversight: 'critical_only',
  cascadeDepth: 7,
  autoDeploy: true,
  
  // Startup-specific - high autonomy
  allowFeatureBranches: true,
  allowRefactoring: true,
  allowBugFixes: true,
  requireFeatureApproval: false,
  requireBreakingApproval: false,
  notifyOnDeploy: false,
  slackNotifications: false,
  
  // Testing - minimal overhead
  autoRunTests: true,
  autoRunE2E: false,  // Skip for speed
  blockOnTestFailure: true,
  blockOnE2EFailure: false,
  smokeTestsOnly: true,
  
  // Rapid iteration
  fastTrack: true,
  skipStaging: true,
  directToProduction: true,
  featureFlags: true,
  
  // Keep it simple
  blueGreenDeploy: false,
  rollbackOnError: true,
  circuitBreaker: false
};

class StartupAgentBehaviorResolver {
  resolveForBlock(block: Block, action: AgentAction): BehaviorDecision {
    const decision: BehaviorDecision = {
      allowed: true,
      requiresApproval: false,
      approvalType: null,
      notifications: []
    };

    // Almost everything allowed in startup mode
    if (action.breaking) {
      decision.requiresApproval = true;
      decision.approvalType = 'breaking';
      decision.notifications = ['lead'];
      decision.allowed = true; // Allowed but notify
    }

    if (action.security) {
      decision.requiresApproval = true;
      decision.approvalType = 'security';
    }

    return decision;
  }

  shouldSkipStaging(): boolean {
    return this.config.directToProduction;
  }

  getTestStrategy(): TestStrategy {
    return {
      unit: true,
      integration: false,
      e2e: false,
      smoke: true,
      performance: false
    };
  }
}
```

## Test Cases
1. 50% coverage passes with warning
2. Team size validation works
3. Rapid release cycles function
4. Smoke tests run instead of full suite
5. Features approved automatically
6. Breaking changes require minimal approval
7. Fast deployment works
8. Rollback functions correctly
9. Process overhead minimal
10. Metrics collection works

## CLI Commands
```bash
# Check Startup readiness
speclang startup --check specs/auth.spec.md

# Configure rapid release
speclang startup --release weekly specs/auth.spec.md

# Team size validation
speclang startup --team-size 8 specs/auth.spec.md
```

## Validation
```bash
bun test tests/maturity/startup/
```

## Output Format
After completing, output:
1. Startup criteria defined
2. Rapid release configuration
3. Minimal process configuration
4. Team config
5. Agent behaviors for Startup
6. Test results
