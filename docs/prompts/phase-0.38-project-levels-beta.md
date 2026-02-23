# Bootstrap Phase 0.38: Beta Maturity Level

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.38 of the bootstrap process.

**Prerequisites**: 
- Phase 0.25 (Project Maturity Levels) complete
- Phase 0.24 (Validation Rules) complete

## Your Task
Implement the Beta maturity level specifics - the transition point where specs become feature-complete and ready for external testing.

## Read These Specs First
1. `specs/project-maturity-levels.spec.md` - Maturity overview
2. `specs/validation-rules.spec.md` - Validation requirements
3. `specs/beta-level.spec.md` - Beta-specific criteria

## What to Build

### Files to Create
```
src/maturity/beta/
├── index.ts              # Beta level exports
├── criteria.ts           # Beta-specific criteria
├── requirements.ts       # Beta requirements checker
├── checklist.ts          # Beta transition checklist
└── behaviors.ts          # Beta agent behaviors
```

### Requirements

#### 1. Beta Criteria (criteria.ts)
```typescript
interface BetaCriteria {
  featureComplete: boolean;
  documentationComplete: boolean;
  testCoverage: number;        // Minimum 70%
  e2eTests: boolean;
  stagingDeployment: boolean;
  stabilityScore: number;      // Minimum 0.8
  externalUsers: number;       // Min 5 external testers
}

const BETA_CRITERIA: BetaCriteria = {
  featureComplete: true,
  documentationComplete: true,
  testCoverage: 70,
  e2eTests: true,
  stagingDeployment: true,
  stabilityScore: 0.8,
  externalUsers: 5
};
```

#### 2. Beta Requirements Checker (requirements.ts)
```typescript
class BetaRequirementsChecker {
  private thresholds = {
    minTestCoverage: 70,
    minStabilityScore: 0.8,
    minExternalTesters: 5,
    maxCriticalBugs: 0,
    maxHighBugs: 3,
    maxMediumBugs: 10
  };

  checkRequirements(spec: ParsedSpec): BetaValidationResult {
    const result: BetaValidationResult = {
      meetsRequirements: true,
      coverage: this.calculateCoverage(spec),
      stability: this.calculateStability(spec),
      bugs: this.countBugs(spec),
      blockers: []
    };

    if (result.coverage < this.thresholds.minTestCoverage) {
      result.meetsRequirements = false;
      result.blockers.push(`Test coverage ${result.coverage}% below minimum ${this.thresholds.minTestCoverage}%`);
    }

    if (result.stability < this.thresholds.minStabilityScore) {
      result.meetsRequirements = false;
      result.blockers.push(`Stability score ${result.stability} below minimum ${this.thresholds.minStabilityScore}`);
    }

    return result;
  }

  calculateCoverage(spec: ParsedSpec): number {
    const blocksWithTests = spec.blocks.filter(b => b.tests?.length > 0).length;
    const totalBlocks = spec.blocks.length;
    return totalBlocks > 0 ? (blocksWithTests / totalBlocks) * 100 : 0;
  }

  calculateStability(spec: ParsedSpec): number {
    const recentChanges = spec.history?.slice(-10) || [];
    const unstable = recentChanges.filter(c => c.breaking).length;
    return 1 - (unstable / Math.max(recentChanges.length, 1));
  }
}
```

#### 3. Beta Transition Checklist (checklist.ts)
```typescript
interface BetaChecklistItem {
  category: 'documentation' | 'testing' | 'deployment' | 'stability' | 'process';
  requirement: string;
  required: boolean;
  automatedCheck: boolean;
  verificationMethod: string;
}

const ALPHA_TO_BETA_CHECKLIST: BetaChecklistItem[] = [
  // Documentation
  { category: 'documentation', requirement: 'All blocks have @ref: links', required: true, automatedCheck: true, verificationMethod: 'Parse all blocks for @ref: presence' },
  { category: 'documentation', requirement: 'README complete with setup instructions', required: true, automatedCheck: false, verificationMethod: 'Human review' },
  { category: 'documentation', requirement: 'API documentation complete', required: true, automatedCheck: true, verificationMethod: 'Check API spec coverage' },
  
  // Testing
  { category: 'testing', requirement: 'Unit test coverage > 70%', required: true, automatedCheck: true, verificationMethod: 'Coverage tool report' },
  { category: 'testing', requirement: 'Integration tests passing', required: true, automatedCheck: true, verificationMethod: 'CI pipeline' },
  { category: 'testing', requirement: 'E2E tests for critical paths', required: true, automatedCheck: true, verificationMethod: 'E2E test results' },
  { category: 'testing', requirement: 'Performance baseline established', required: false, automatedCheck: true, verificationMethod: 'Benchmark results' },
  
  // Deployment
  { category: 'deployment', requirement: 'Staging environment deployed', required: true, automatedCheck: true, verificationMethod: 'Deployment status' },
  { category: 'deployment', requirement: 'CI/CD pipeline configured', required: true, automatedCheck: true, verificationMethod: 'Pipeline validation' },
  { category: 'deployment', requirement: 'Rollback procedure documented', required: true, automatedCheck: false, verificationMethod: 'Human review' },
  
  // Stability
  { category: 'stability', requirement: 'No critical bugs open', required: true, automatedCheck: true, verificationMethod: 'Bug tracker query' },
  { category: 'stability', requirement: '< 3 high priority bugs', required: true, automatedCheck: true, verificationMethod: 'Bug tracker query' },
  { category: 'stability', requirement: 'Stability score > 0.8', required: true, automatedCheck: true, verificationMethod: 'Stability calculation' },
  
  // Process
  { category: 'process', requirement: 'External tester list prepared', required: true, automatedCheck: false, verificationMethod: 'Human review' },
  { category: 'process', requirement: 'Feedback mechanism in place', required: true, automatedCheck: true, verificationMethod: 'Check feedback system' },
  { category: 'process', requirement: 'Beta launch communication drafted', required: false, automatedCheck: false, verificationMethod: 'Human review' }
];

class BetaChecklistRunner {
  async runChecklist(spec: ParsedSpec): Promise<ChecklistResult> {
    const results: ChecklistItemResult[] = [];
    
    for (const item of ALPHA_TO_BETA_CHECKLIST) {
      const passed = await this.verifyItem(spec, item);
      results.push({
        requirement: item.requirement,
        category: item.category,
        passed,
        automated: item.automatedCheck,
        method: item.verificationMethod
      });
    }
    
    const required = results.filter(r => r.passed || !ALPHA_TO_BETA_CHECKLIST.find(i => i.requirement === r.requirement)?.required);
    const allRequired = results.filter(r => ALPHA_TO_BETA_CHECKLIST.find(i => i.requirement === r.requirement && i.required));
    
    return {
      canPromote: allRequired.every(r => r.passed),
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      items: results
    };
  }
}
```

#### 4. Beta Agent Behaviors (behaviors.ts)
```typescript
const BETA_AGENT_BEHAVIOR: AgentBehaviorConfig = {
  mode: 'autonomous_non_critical',
  humanOversight: 'critical_only',
  cascadeDepth: 5,
  autoDeploy: false,
  
  // Beta-specific behaviors
  allowFeatureBranches: true,
  allowRefactoring: true,
  allowBugFixes: true,
  requireFeatureApproval: true,
  requireBreakingApproval: true,
  notifyOnDeploy: true,
  slackNotifications: true,
  
  // Testing behaviors
  autoRunTests: true,
  autoRunE2E: true,
  blockOnTestFailure: true,
  blockOnE2EFailure: true,
  
  // Monitoring
  collectMetrics: true,
  trackUsage: true,
  errorReporting: true,
  performanceMonitoring: true
};

class BetaAgentBehaviorResolver {
  resolveForBlock(block: Block, action: AgentAction): BehaviorDecision {
    const decision: BehaviorDecision = {
      allowed: true,
      requiresApproval: false,
      approvalType: null,
      notifications: []
    };

    // Features require approval in Beta
    if (action.type === 'feature') {
      decision.requiresApproval = true;
      decision.approvalType = 'feature';
      decision.notifications = ['lead', 'product'];
    }

    // Breaking changes require approval
    if (action.breaking) {
      decision.requiresApproval = true;
      decision.approvalType = 'breaking';
      decision.notifications = ['lead', 'architect'];
    }

    // Non-critical changes allowed autonomously
    if (action.type === 'refactor' || action.type === 'bugfix') {
      decision.allowed = true;
      decision.requiresApproval = false;
    }

    return decision;
  }
}
```

## Test Cases
1. Spec with 70%+ coverage passes Beta requirements
2. Spec below 70% coverage fails with blocker message
3. All required checklist items must pass for promotion
4. Non-required checklist items are warnings only
5. Feature changes require approval in Beta
6. Bug fixes can proceed autonomously
7. Stability score calculated correctly
8. External tester count validated

## CLI Commands
```bash
# Check Beta readiness
speclang beta --check specs/auth.spec.md

# Run Beta checklist
speclang beta --checklist specs/auth.spec.md

# Validate coverage
speclang beta --coverage specs/auth.spec.md
```

## Validation
```bash
bun test tests/maturity/beta/
```

## Output Format
After completing, output:
1. Beta criteria defined
2. Checklist items
3. Agent behaviors for Beta
4. Test results
