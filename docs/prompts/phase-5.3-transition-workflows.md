# Bootstrap Phase 5.3: Transition Workflows

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 5.3 of the bootstrap process.

**Prerequisites**: 
- Phase 0-5.2 complete
- Autonomous validation working
- Project maturity levels defined

## Your Task
Implement the transition workflows that manage moving specs between maturity levels and agent support levels. This includes validation gates, checklists, approval workflows, and rollback procedures.

## Read These Specs First
1. `specs/transition-workflows.spec.md` - Transition workflows specification
2. `specs/autonomous-validation.spec.md` - Autonomous validation
3. `specs/core.spec.dir/agents.spec.md` - Agent behavior matrix

## What to Build

### Files to Create
```
src/transition/
├── index.ts              # Main exports
├── manager.ts            # TransitionManager class
├── checklists.ts         # Upgrade checklists
├── validation.ts         # Transition validation gates
├── approval.ts           # Approval workflow
├── rollback.ts           # Transition rollback
└── types.ts              # TypeScript types

scripts/
└── transition.py         # Transition CLI script

.speclang/
└── transitions/          # Transition history
```

### Requirements

#### 1. Transition Types

```typescript
// src/transition/types.ts

type ProjectLevel = 'POC' | 'MVP' | 'Alpha' | 'Beta' | 'Production' | 'Startup' | 'SMB' | 'MSB' | 'Enterprise';
type AgentSupport = 'human_only' | 'agent_assisted' | 'agent_autonomous';

interface TransitionRequest {
  specId: string;
  from: {
    project_level: ProjectLevel;
    agent_support: AgentSupport;
  };
  to: {
    project_level: ProjectLevel;
    agent_support: AgentSupport;
  };
  initiator: string;
  reason: string;
}

interface TransitionResult {
  request: TransitionRequest;
  status: 'pending' | 'validating' | 'approved' | 'executing' | 'completed' | 'failed' | 'rolled_back';
  validation?: ValidationResult;
  approvals?: ApprovalStatus[];
  execution?: ExecutionResult;
  timestamp: string;
}

const PROJECT_LEVEL_ORDER: ProjectLevel[] = [
  'POC', 'MVP', 'Alpha', 'Beta', 'Production'
];

const AGENT_SUPPORT_ORDER: AgentSupport[] = [
  'human_only', 'agent_assisted', 'agent_autonomous'
];
```

#### 2. Transition Manager

```typescript
// src/transition/manager.ts

export class TransitionManager {
  private validator: TransitionValidator;
  private approvalWorkflow: ApprovalWorkflow;
  private history: TransitionHistory;
  
  async requestTransition(request: TransitionRequest): Promise<TransitionResult> {
    console.log(`[transition] Requesting: ${request.specId}`);
    console.log(`  From: ${request.from.project_level}/${request.from.agent_support}`);
    console.log(`  To: ${request.to.project_level}/${request.to.agent_support}`);
    
    // 1. Validate transition is valid
    const transitionType = this.validateTransitionType(request);
    if (transitionType === 'invalid') {
      return {
        request,
        status: 'failed',
        timestamp: new Date().toISOString()
      };
    }
    
    // 2. Create transition record
    const result: TransitionResult = {
      request,
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    await this.history.record(result);
    
    // 3. Run validation gates
    result.status = 'validating';
    result.validation = await this.validator.validate(request);
    
    if (!result.validation.passed) {
      result.status = 'failed';
      await this.history.update(result);
      return result;
    }
    
    // 4. Gather approvals
    result.status = 'approved';
    result.approvals = await this.approvalWorkflow.gatherApprovals(request);
    
    const allApproved = result.approvals.every(a => a.status === 'approved');
    if (!allApproved) {
      result.status = 'failed';
      await this.history.update(result);
      return result;
    }
    
    // 5. Execute transition
    result.status = 'executing';
    result.execution = await this.executeTransition(request);
    
    // 6. Run post-transition validation
    const postValidation = await this.validator.validatePostTransition(request);
    if (!postValidation.passed) {
      // Rollback
      await this.rollbackTransition(request);
      result.status = 'rolled_back';
    } else {
      result.status = 'completed';
    }
    
    await this.history.update(result);
    return result;
  }
  
  private validateTransitionType(request: TransitionRequest): TransitionType {
    const fromLevel = PROJECT_LEVEL_ORDER.indexOf(request.from.project_level);
    const toLevel = PROJECT_LEVEL_ORDER.indexOf(request.to.project_level);
    const fromAgent = AGENT_SUPPORT_ORDER.indexOf(request.from.agent_support);
    const toAgent = AGENT_SUPPORT_ORDER.indexOf(request.to.agent_support);
    
    // Check valid upgrade paths
    if (toLevel < fromLevel && toAgent < fromAgent) {
      return 'downgrade';
    }
    
    if (toLevel > fromLevel || toAgent > fromAgent) {
      return 'upgrade';
    }
    
    return 'invalid';
  }
  
  private async executeTransition(request: TransitionRequest): Promise<ExecutionResult> {
    const specPath = await this.findSpecPath(request.specId);
    const content = await fs.readFile(specPath, 'utf-8');
    
    // Update metadata in header
    const updatedContent = this.updateHeader(content, request.to);
    await fs.writeFile(specPath, updatedContent);
    
    // Run any migrations
    await this.runMigrations(request);
    
    return {
      metadataUpdated: true,
      artifactsGenerated: true,
      migrationsRun: []
    };
  }
}
```

#### 3. Upgrade Checklists

```typescript
// src/transition/checklists.ts

interface ChecklistItem {
  id: string;
  category: 'spec' | 'validation' | 'test' | 'documentation' | 'approval' | 'safety';
  description: string;
  required: boolean;
  check: () => Promise<CheckResult>;
}

const CHECKLISTS: Record<string, ChecklistItem[]> = {
  'POC->MVP': [
    {
      id: 'core-arch',
      category: 'spec',
      description: 'Core architecture defined',
      required: true,
      check: checkCoreArchitecture
    },
    {
      id: 'key-components',
      category: 'spec',
      description: 'Key components identified',
      required: true,
      check: checkKeyComponents
    },
    {
      id: 'header-valid',
      category: 'validation',
      description: 'Header valid',
      required: true,
      check: checkHeaderValid
    },
    {
      id: 'readme-exists',
      category: 'documentation',
      description: 'README explains project',
      required: true,
      check: checkReadmeExists
    },
    {
      id: 'po-approval',
      category: 'approval',
      description: 'Product owner approval',
      required: true,
      check: checkProductOwnerApproval
    }
  ],
  
  'MVP->Alpha': [
    {
      id: 'feature-specs',
      category: 'spec',
      description: 'All feature specs complete (layer 1)',
      required: true,
      check: checkFeatureSpecsComplete
    },
    {
      id: 'component-specs',
      category: 'spec',
      description: 'Component specs exist for core features (layer 2)',
      required: true,
      check: checkComponentSpecsExist
    },
    {
      id: 'refs-resolve',
      category: 'validation',
      description: 'All references resolve',
      required: true,
      check: checkReferencesResolve
    },
    {
      id: 'step-by-step',
      category: 'spec',
      description: 'Step-by-step descriptions for core operations',
      required: true,
      check: checkStepByStepDescriptions
    },
    {
      id: 'unit-tests',
      category: 'test',
      description: 'Unit tests for core components',
      required: true,
      check: checkUnitTestsExist
    },
    {
      id: 'coverage-50',
      category: 'test',
      description: 'Test coverage > 50%',
      required: true,
      check: () => checkTestCoverage(50)
    },
    {
      id: 'api-docs',
      category: 'documentation',
      description: 'API documentation complete',
      required: true,
      check: checkApiDocumentation
    }
  ],
  
  'Alpha->Beta': [
    {
      id: 'impl-specs',
      category: 'spec',
      description: 'Implementation specs for all components',
      required: true,
      check: checkImplementationSpecs
    },
    {
      id: 'no-ambiguous',
      category: 'validation',
      description: 'No ambiguous language in critical sections',
      required: true,
      check: checkNoAmbiguousLanguage
    },
    {
      id: 'e2e-tests',
      category: 'test',
      description: 'End-to-end tests for major flows',
      required: true,
      check: checkE2ETests
    },
    {
      id: 'coverage-80',
      category: 'test',
      description: 'Test coverage > 80%',
      required: true,
      check: () => checkTestCoverage(80)
    },
    {
      id: 'perf-tests',
      category: 'test',
      description: 'Performance tests for critical paths',
      required: true,
      check: checkPerformanceTests
    },
    {
      id: 'security-review',
      category: 'approval',
      description: 'Security review',
      required: true,
      check: checkSecurityReview
    }
  ],
  
  'Beta->Production': [
    {
      id: 'all-specs-complete',
      category: 'spec',
      description: 'All specs complete and validated',
      required: true,
      check: checkAllSpecsComplete
    },
    {
      id: 'autonomous-validation',
      category: 'validation',
      description: 'Pass autonomous validation for all agent_autonomous specs',
      required: true,
      check: checkAutonomousValidation
    },
    {
      id: 'coverage-90',
      category: 'test',
      description: 'Test coverage > 90%',
      required: true,
      check: () => checkTestCoverage(90)
    },
    {
      id: 'security-tests',
      category: 'test',
      description: 'Security tests',
      required: true,
      check: checkSecurityTests
    },
    {
      id: 'load-tests',
      category: 'test',
      description: 'Load tests',
      required: true,
      check: checkLoadTests
    },
    {
      id: 'dr-tests',
      category: 'test',
      description: 'Disaster recovery tests',
      required: true,
      check: checkDisasterRecoveryTests
    },
    {
      id: 'prod-readiness',
      category: 'approval',
      description: 'Production readiness review board',
      required: true,
      check: checkProductionReadinessReview
    },
    {
      id: 'compliance',
      category: 'approval',
      description: 'Security compliance approval',
      required: true,
      check: checkComplianceApproval
    }
  ],
  
  'human_only->agent_assisted': [
    {
      id: 'clear-requirements',
      category: 'spec',
      description: 'Clear requirements (less ambiguity)',
      required: true,
      check: checkClearRequirements
    },
    {
      id: 'some-steps',
      category: 'spec',
      description: 'Some step-by-step descriptions',
      required: true,
      check: checkSomeStepDescriptions
    },
    {
      id: 'agent-understands',
      category: 'safety',
      description: 'Agent can understand spec intent',
      required: true,
      check: checkAgentUnderstanding
    }
  ],
  
  'agent_assisted->agent_autonomous': [
    {
      id: 'all-steps',
      category: 'spec',
      description: 'Complete step-by-step descriptions for all operations',
      required: true,
      check: checkAllStepDescriptions
    },
    {
      id: 'all-refs',
      category: 'spec',
      description: 'ALL references resolve to existing blocks',
      required: true,
      check: checkAllReferencesResolve
    },
    {
      id: 'no-ambiguous-critical',
      category: 'spec',
      description: 'No ambiguous natural language in critical sections',
      required: true,
      check: checkNoAmbiguousCritical
    },
    {
      id: 'all-metadata',
      category: 'spec',
      description: 'All required metadata fields present',
      required: true,
      check: checkAllMetadataFields
    },
    {
      id: 'autonomous-pass',
      category: 'validation',
      description: 'Pass autonomous validation',
      required: true,
      check: checkAutonomousValidation
    },
    {
      id: 'edge-cases',
      category: 'test',
      description: 'Edge cases covered',
      required: true,
      check: checkEdgeCaseCoverage
    },
    {
      id: 'rollback-proc',
      category: 'safety',
      description: 'Rollback procedure defined',
      required: true,
      check: checkRollbackProcedure
    },
    {
      id: 'monitoring',
      category: 'safety',
      description: 'Monitoring configured',
      required: true,
      check: checkMonitoringConfigured
    },
    {
      id: 'human-override',
      category: 'safety',
      description: 'Human override mechanism in place',
      required: true,
      check: checkHumanOverride
    }
  ]
};

export async function runChecklist(transition: string, specId: string): Promise<ChecklistResult> {
  const checklist = CHECKLISTS[transition];
  if (!checklist) {
    return { error: `Unknown transition: ${transition}` };
  }
  
  const results: ChecklistItemResult[] = [];
  let passed = true;
  
  for (const item of checklist) {
    const result = await item.check(specId);
    results.push({
      id: item.id,
      category: item.category,
      description: item.description,
      passed: result.passed,
      message: result.message,
      required: item.required
    });
    
    if (!result.passed && item.required) {
      passed = false;
    }
  }
  
  return { passed, results };
}
```

#### 4. Validation Gates

```typescript
// src/transition/validation.ts

export class TransitionValidator {
  
  async validate(request: TransitionRequest): Promise<ValidationResult> {
    const transitionKey = `${request.from.project_level}->${request.to.project_level}`;
    const agentKey = `${request.from.agent_support}->${request.to.agent_support}`;
    
    const results: ValidationCheck[] = [];
    
    // Run project level checklist
    if (request.from.project_level !== request.to.project_level) {
      const checklist = await runChecklist(transitionKey, request.specId);
      results.push({
        name: 'project_level_checklist',
        passed: checklist.passed,
        details: checklist.results
      });
    }
    
    // Run agent support checklist
    if (request.from.agent_support !== request.to.agent_support) {
      const checklist = await runChecklist(agentKey, request.specId);
      results.push({
        name: 'agent_support_checklist',
        passed: checklist.passed,
        details: checklist.results
      });
    }
    
    // Check dependencies
    const depsValid = await this.checkDependencies(request);
    results.push(depsValid);
    
    return {
      passed: results.every(r => r.passed),
      checks: results
    };
  }
  
  private async checkDependencies(request: TransitionRequest): Promise<ValidationCheck> {
    const index = await loadIndex();
    const spec = index.specs[request.specId];
    
    if (!spec || !spec.imports) {
      return { name: 'dependencies', passed: true, details: [] };
    }
    
    const issues: string[] = [];
    
    for (const depId of spec.imports) {
      const dep = index.specs[depId];
      if (!dep) {
        issues.push(`Dependency ${depId} not found`);
        continue;
      }
      
      // Check dependency is at same or higher level
      const depLevel = PROJECT_LEVEL_ORDER.indexOf(dep.project_level);
      const targetLevel = PROJECT_LEVEL_ORDER.indexOf(request.to.project_level);
      
      if (depLevel < targetLevel) {
        issues.push(`Dependency ${depId} is at lower level (${dep.project_level})`);
      }
    }
    
    return {
      name: 'dependencies',
      passed: issues.length === 0,
      details: issues
    };
  }
  
  async validatePostTransition(request: TransitionRequest): Promise<ValidationResult> {
    // Run full validation after transition
    const checks: ValidationCheck[] = [];
    
    // Check spec compiles/validates
    checks.push(await this.validateSpecSyntax(request.specId));
    
    // Check all references resolve
    checks.push(await this.validateReferences(request.specId));
    
    // Run tests
    checks.push(await this.validateTests(request.specId));
    
    return {
      passed: checks.every(c => c.passed),
      checks
    };
  }
}
```

#### 5. Approval Workflow

```typescript
// src/transition/approval.ts

interface ApprovalRequirement {
  role: string;
  description: string;
  timeout: number; // milliseconds
}

const APPROVAL_REQUIREMENTS: Record<string, ApprovalRequirement[]> = {
  'POC->MVP': [
    { role: 'product_owner', description: 'Product owner approval', timeout: 86400000 }
  ],
  'MVP->Alpha': [
    { role: 'tech_lead', description: 'Technical lead approval', timeout: 86400000 },
    { role: 'qa_lead', description: 'QA lead approval', timeout: 86400000 }
  ],
  'Alpha->Beta': [
    { role: 'product_owner', description: 'Product owner approval', timeout: 172800000 },
    { role: 'security', description: 'Security review', timeout: 259200000 },
    { role: 'ux', description: 'UX review (if applicable)', timeout: 172800000 }
  ],
  'Beta->Production': [
    { role: 'prod_readiness', description: 'Production readiness review board', timeout: 604800000 },
    { role: 'compliance', description: 'Security compliance approval', timeout: 604800000 }
  ]
};

export class ApprovalWorkflow {
  
  async gatherApprovals(request: TransitionRequest): Promise<ApprovalStatus[]> {
    const transitionKey = `${request.from.project_level}->${request.to.project_level}`;
    const requirements = APPROVAL_REQUIREMENTS[transitionKey] || [];
    
    const statuses: ApprovalStatus[] = [];
    
    for (const req of requirements) {
      // Check if approval already exists
      const existing = await this.checkExistingApproval(request.specId, req.role);
      
      if (existing) {
        statuses.push(existing);
      } else {
        // Request approval
        const status = await this.requestApproval(request, req);
        statuses.push(status);
      }
    }
    
    // Wait for all approvals
    const allApproved = await this.waitForApprovals(statuses);
    
    return statuses;
  }
  
  private async requestApproval(
    request: TransitionRequest, 
    requirement: ApprovalRequirement
  ): Promise<ApprovalStatus> {
    const status: ApprovalStatus = {
      role: requirement.role,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + requirement.timeout).toISOString()
    };
    
    // Save approval request
    await this.saveApprovalRequest(request.specId, status);
    
    // Notify approver
    await this.notifyApprover(request, requirement);
    
    return status;
  }
  
  async approve(specId: string, role: string, approver: string): Promise<void> {
    const status: ApprovalStatus = {
      role,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approver
    };
    
    await this.updateApprovalStatus(specId, status);
  }
  
  async reject(specId: string, role: string, reason: string): Promise<void> {
    const status: ApprovalStatus = {
      role,
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      reason
    };
    
    await this.updateApprovalStatus(specId, status);
  }
}
```

#### 6. Transition Rollback

```typescript
// src/transition/rollback.ts

export class TransitionRollback {
  
  async rollback(request: TransitionRequest): Promise<RollbackResult> {
    console.log(`[rollback] Rolling back transition for ${request.specId}`);
    
    // 1. Get transition history
    const history = await this.getTransitionHistory(request.specId);
    const lastTransition = history[history.length - 1];
    
    // 2. Revert metadata
    const specPath = await this.findSpecPath(request.specId);
    const content = await fs.readFile(specPath, 'utf-8');
    const revertedContent = this.updateHeader(content, request.from);
    await fs.writeFile(specPath, revertedContent);
    
    // 3. Revert any auto-generated artifacts
    await this.revertArtifacts(request.specId, lastTransition.timestamp);
    
    // 4. Notify stakeholders
    await this.notifyRollback(request, lastTransition);
    
    // 5. Conduct post-mortem
    await this.createPostMorten(request, lastTransition);
    
    return {
      success: true,
      revertedTo: request.from,
      timestamp: new Date().toISOString()
    };
  }
  
  async shouldRollback(request: TransitionRequest): Promise<boolean> {
    const triggers = [
      'regression_detected',
      'validation_failures',
      'test_failures',
      'performance_degradation',
      'security_vulnerability'
    ];
    
    for (const trigger of triggers) {
      if (await this.checkTrigger(request, trigger)) {
        return true;
      }
    }
    
    return false;
  }
}
```

### CLI Commands

```bash
# Request transition
speclang transition request @specs/auth --to Beta --agent autonomous

# Check transition status
speclang transition status @specs/auth

# List pending approvals
speclang transition approvals

# Approve transition
speclang transition approve @specs/auth --role tech_lead --approver "John Doe"

# Reject transition
speclang transition reject @specs/auth --role security --reason "Failed security scan"

# Rollback transition
speclang transition rollback @specs/auth

# View transition history
speclang transition history @specs/auth
```

## Test Cases
1. POC→MVP transition with valid checklist passes
2. MVP→Alpha transition with missing tests fails
3. Alpha→Beta transition requires security review
4. Beta→Production transition requires all approvals
5. human_only→agent_assisted transition validates agent understanding
6. agent_assisted→agent_autonomous validates all safety requirements
7. Dependencies at lower level block transition
8. Rollback restores previous state
9. Approval timeout triggers notification
10. Transition history is preserved

## Validation
```bash
# Test transitions
bun test tests/transition.test.ts

# Run transition
speclang transition request @specs/auth --to Alpha

# Check status
speclang transition status @specs/auth

# View checklist
speclang transition checklist POC->MVP @specs/example
```

## Output Format
After completing, output:
1. Transition manager files created
2. Checklists for all transition types
3. Validation gates implemented
4. Approval workflow working
5. Rollback procedures tested
6. Test results
