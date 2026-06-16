# Bootstrap Phase 1.18: Agent-Autonomous Support Level

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.18 of the bootstrap process.

**Prerequisites**: 
- Phase 1.17 (Agent-Assisted Support) complete
- Phase 1.14 (Validation Completeness) complete
- Phase 1.13 (Validation Ambiguity) complete

## Your Task
Implement the agent-autonomous support mode - for specs that allow full autonomous agent operation without human intervention.

## Read These Specs First
1. `specs/agent-support-levels.spec.md` - Agent support modes
2. `specs/validation-rules.spec.md` - Validation requirements
3. `specs/autonomous-operations.spec.md` - Autonomous patterns

## What to Build

### Files to Create
```
src/agent-support/agent-autonomous/
├── index.ts              # Agent-autonomous exports
├── enforcer.ts           # Autonomous enforcement
├── executor.ts           # Full autonomous executor
├── self-validation.ts    # Self-validation during execution
├── error-recovery.ts     # Autonomous error recovery
├── reporting.ts          # Autonomous reporting
└── limits.ts             # Operational limits
```

### Requirements

#### 1. Autonomous Mode (enforcer.ts)
```typescript
type AgentAutonomousLevel = 
  | 'autonomous_execute'
  | 'autonomous_with_rollback'
  | 'autonomous_full_control'
  | 'autonomous_deploy';

interface AgentAutonomousConfig {
  level: AgentAutonomousLevel;
  requireHumanGuidance: boolean;
  confirmationRequired: boolean;
  approvalRequired: boolean;
  autoRollback: boolean;
  selfHealing: boolean;
  maxAutonomyDepth: number;
  deploymentEnabled: boolean;
}

const AGENT_AUTONOMOUS_CONFIGS: Record<AgentAutonomousLevel, AgentAutonomousConfig> = {
  autonomous_execute: {
    level: 'autonomous_execute',
    requireHumanGuidance: false,
    confirmationRequired: false,
    approvalRequired: false,
    autoRollback: false,
    selfHealing: true,
    maxAutonomyDepth: 3,
    deploymentEnabled: false
  },
  autonomous_with_rollback: {
    level: 'autonomous_with_rollback',
    requireHumanGuidance: false,
    confirmationRequired: false,
    approvalRequired: false,
    autoRollback: true,
    selfHealing: true,
    maxAutonomyDepth: 5,
    deploymentEnabled: false
  },
  autonomous_full_control: {
    level: 'autonomous_full_control',
    requireHumanGuidance: false,
    confirmationRequired: false,
    approvalRequired: false,
    autoRollback: true,
    selfHealing: true,
    maxAutonomyDepth: 10,
    deploymentEnabled: true
  },
  autonomous_deploy: {
    level: 'autonomous_deploy',
    requireHumanGuidance: false,
    confirmationRequired: false,
    approvalRequired: false,
    autoRollback: true,
    selfHealing: true,
    maxAutonomyDepth: Infinity,
    deploymentEnabled: true
  }
};

class AgentAutonomousEnforcer {
  private config: AgentAutonomousConfig;
  private executor: AutonomousExecutor;
  private validator: SelfValidator;
  private limits: OperationalLimits;

  constructor(config: AgentAutonomousLevel | Partial<AgentAutonomousConfig>) {
    if (typeof config === 'string') {
      this.config = AGENT_AUTONOMOUS_CONFIGS[config];
    } else {
      this.config = { ...AGENT_AUTONOMOUS_CONFIGS.autonomous_full_control, ...config };
    }
    
    this.executor = new AutonomousExecutor(this.config);
    this.validator = new SelfValidator();
    this.limits = new OperationalLimits(this.config);
  }

  async canExecute(action: AgentAction): Promise<AutonomousResult> {
    // Check operational limits
    const limitsCheck = await this.limits.checkLimits(action);
    if (!limitsCheck.allowed) {
      return {
        allowed: false,
        reason: limitsCheck.reason,
        blockedBy: limitsCheck.blockedBy
      };
    }

    // Validate action is safe for autonomous execution
    const safetyCheck = await this.validateSafety(action);
    if (!safetyCheck.safe) {
      return {
        allowed: false,
        reason: safetyCheck.reason,
        requiresReview: true
      };
    }

    return {
      allowed: true,
      autonomyLevel: this.config.level,
      canRollback: this.config.autoRollback,
      canSelfHeal: this.config.selfHealing,
      maxDepth: this.config.maxAutonomyDepth
    };
  }

  async executeAutonomous(
    action: AgentAction,
    context: ExecutionContext
  ): Promise<AutonomousExecutionResult> {
    const execution: AutonomousExecutionResult = {
      id: generateId(),
      action,
      status: 'running',
      startedAt: new Date(),
      checkpoints: [],
      errors: [],
      recoveryAttempts: 0
    };

    try {
      // Pre-execution validation
      await this.validator.preExecutionValidation(action);

      // Execute with autonomous control
      const result = await this.executor.execute(action, context);
      
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.result = result;

      // Post-execution validation
      await this.validator.postExecutionValidation(action, result);

    } catch (error) {
      execution.status = 'failed';
      execution.errors.push(error.message);

      // Attempt autonomous recovery if enabled
      if (this.config.autoRollback) {
        execution.recoveryAttempts = await this.attemptRecovery(execution);
      }

      if (execution.recoveryAttempts > 0) {
        execution.status = 'recovered';
      }
    }

    // Report execution
    await this.report(execution);

    return execution;
  }
}
```

#### 2. Full Autonomous Executor (executor.ts)
```typescript
interface ExecutionPlan {
  id: string;
  steps: ExecutionStep[];
  estimatedDuration: number;
  riskAssessment: RiskLevel;
}

interface ExecutionStep {
  id: string;
  action: string;
  dependencies: string[];
  estimatedDuration: number;
  canParallelize: boolean;
  rollbackAction?: string;
}

class AutonomousExecutor {
  private config: AgentAutonomousConfig;
  private planner: ExecutionPlanner;
  private runner: StepRunner;

  constructor(config: AgentAutonomousConfig) {
    this.config = config;
    this.planner = new ExecutionPlanner(config.maxAutonomyDepth);
    this.runner = new StepRunner();
  }

  async execute(action: AgentAction, context: ExecutionContext): Promise<ExecutionResult> {
    // Create execution plan
    const plan = await this.planner.createPlan(action);
    
    // Check risk assessment
    if (plan.riskAssessment === 'high' && !this.config.autoRollback) {
      throw new Error('High-risk action requires rollback capability');
    }

    // Execute plan steps
    const results: StepResult[] = [];
    let currentStep = 0;

    while (currentStep < plan.steps.length) {
      const step = plan.steps[currentStep];

      // Execute step
      const stepResult = await this.runner.run(step, context);
      results.push(stepResult);

      if (!stepResult.success) {
        // Attempt recovery
        if (this.config.autoRollback && step.rollbackAction) {
          await this.executeRollback(step, context);
        }
        throw new Error(`Step ${step.id} failed: ${stepResult.error}`);
      }

      currentStep++;
    }

    return this.aggregateResults(results);
  }

  private async executeRollback(step: ExecutionStep, context: ExecutionContext): Promise<void> {
    if (!step.rollbackAction) return;

    const rollbackResult = await this.runner.run(
      { ...step, action: step.rollbackAction },
      context
    );

    if (!rollbackResult.success) {
      // Log critical failure but continue
      console.error(`Rollback failed for step ${step.id}`);
    }
  }
}
```

#### 3. Self-Validation (self-validation.ts)
```typescript
interface ValidationRule {
  id: string;
  name: string;
  check: (action: AgentAction, result?: ExecutionResult) => Promise<boolean>;
  severity: 'error' | 'warning' | 'info';
}

class SelfValidator {
  private rules: ValidationRule[];

  constructor() {
    this.rules = this.initializeRules();
  }

  async preExecutionValidation(action: AgentAction): Promise<ValidationResult> {
    const results: RuleResult[] = [];

    for (const rule of this.rules) {
      try {
        const passed = await rule.check(action);
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          passed,
          severity: rule.severity
        });
      } catch (error) {
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          passed: false,
          severity: rule.severity,
          error: error.message
        });
      }
    }

    const hasErrors = results.some(r => !r.passed && r.severity === 'error');
    
    return {
      valid: !hasErrors,
      results,
      errors: results.filter(r => !r.passed && r.severity === 'error'),
      warnings: results.filter(r => !r.passed && r.severity === 'warning')
    };
  }

  async postExecutionValidation(
    action: AgentAction,
    result: ExecutionResult
  ): Promise<ValidationResult> {
    const postRules = this.rules.filter(r => 
      r.name.includes('output') || r.name.includes('state')
    );

    const results: RuleResult[] = [];
    for (const rule of postRules) {
      const passed = await rule.check(action, result);
      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        passed,
        severity: rule.severity
      });
    }

    return {
      valid: results.every(r => r.passed),
      results
    };
  }

  private initializeRules(): ValidationRule[] {
    return [
      {
        id: 'valid-syntax',
        name: 'code_valid_syntax',
        check: async (action) => {
          return action.type !== 'generate' || action.output?.syntaxValid;
        },
        severity: 'error'
      },
      {
        id: 'no-breaking-changes',
        name: 'no_breaking_changes_unless_intended',
        check: async (action) => {
          if (action.breaking && !action.metadata?.intendedBreaking) {
            return false;
          }
          return true;
        },
        severity: 'warning'
      },
      {
        id: 'tests-pass',
        name: 'tests_pass_after_change',
        check: async (action, result) => {
          return result?.testsPassed ?? true;
        },
        severity: 'error'
      }
    ];
  }
}
```

#### 4. Error Recovery (error-recovery.ts)
```typescript
interface RecoveryStrategy {
  id: string;
  name: string;
  applicableErrors: string[];
  execute: (error: Error, context: ExecutionContext) => Promise<RecoveryResult>;
}

class AutonomousRecovery {
  private strategies: RecoveryStrategy[];
  private maxAttempts: number;

  constructor(maxAttempts: number = 3) {
    this.maxAttempts = maxAttempts;
    this.strategies = this.initializeStrategies();
  }

  async attemptRecovery(
    execution: AutonomousExecutionResult
  ): Promise<number> {
    let attempts = 0;
    let currentError = execution.errors[execution.errors.length - 1];

    while (attempts < this.maxAttempts && currentError) {
      const strategy = this.findStrategy(currentError);
      
      if (!strategy) {
        break;
      }

      attempts++;
      
      const result = await strategy.execute(currentError, execution.context);
      
      if (result.recovered) {
        return attempts;
      }

      currentError = result.newError;
    }

    return attempts;
  }

  private findStrategy(error: Error): RecoveryStrategy | null {
    for (const strategy of this.strategies) {
      if (strategy.applicableErrors.some(e => error.message.includes(e))) {
        return strategy;
      }
    }
    return null;
  }

  private initializeStrategies(): RecoveryStrategy[] {
    return [
      {
        id: 'retry',
        name: 'retry_with_backoff',
        applicableErrors: ['timeout', 'network', 'ECONNREFUSED'],
        execute: async (error, context) => {
          await this.sleep(Math.pow(2, context.retryCount) * 1000);
          return { recovered: true, newError: null };
        }
      },
      {
        id: 'fallback',
        name: 'fallback_implementation',
        applicableErrors: ['not implemented', 'unsupported'],
        execute: async (error, context) => {
          return { recovered: true, newError: null };
        }
      },
      {
        id: 'rollback',
        name: 'rollback_changes',
        applicableErrors: ['validation failed', 'test failed'],
        execute: async (error, context) => {
          return { recovered: true, newError: null };
        }
      }
    ];
  }
}
```

#### 5. Autonomous Reporting (reporting.ts)
```typescript
interface AutonomousReport {
  id: string;
  actionId: string;
  status: ExecutionStatus;
  duration: number;
  changes: Change[];
  tests: TestResult[];
  risks: Risk[];
  recommendations: string[];
  timestamp: Date;
}

class AutonomousReporter {
  private reports: Map<string, AutonomousReport>;
  private notificationChannels: NotificationChannel[];

  constructor() {
    this.reports = new Map();
    this.notificationChannels = [];
  }

  async report(execution: AutonomousExecutionResult): Promise<void> {
    const report: AutonomousReport = {
      id: generateId(),
      actionId: execution.action.id,
      status: execution.status,
      duration: execution.completedAt.getTime() - execution.startedAt.getTime(),
      changes: await this.extractChanges(execution),
      tests: await this.runTests(execution),
      risks: this.assessRisks(execution),
      recommendations: this.generateRecommendations(execution),
      timestamp: new Date()
    };

    this.reports.set(report.id, report);

    // Send notifications based on report content
    await this.notify(report);
  }

  async getReport(reportId: string): Promise<AutonomousReport | null> {
    return this.reports.get(reportId) || null;
  }

  async getReportsByAction(actionId: string): Promise<AutonomousReport[]> {
    return Array.from(this.reports.values()).filter(r => r.actionId === actionId);
  }

  private assessRisks(execution: AutonomousExecutionResult): Risk[] {
    const risks: Risk[] = [];

    if (execution.action.breaking) {
      risks.push({
        level: 'high',
        description: 'Breaking change detected',
        mitigation: 'Auto-rollback enabled'
      });
    }

    if (execution.errors.length > 0) {
      risks.push({
        level: 'medium',
        description: `${execution.errors.length} errors occurred`,
        mitigation: `${execution.recoveryAttempts} recovery attempts made`
      });
    }

    return risks;
  }

  private generateRecommendations(execution: AutonomousExecutionResult): string[] {
    const recommendations: string[] = [];

    if (execution.status === 'recovered') {
      recommendations.push('Consider adding more robust error handling');
    }

    if (execution.action.type === 'generate') {
      recommendations.push('Review generated code for security implications');
    }

    return recommendations;
  }
}
```

#### 6. Operational Limits (limits.ts)
```typescript
interface OperationalLimit {
  type: LimitType;
  current: number;
  max: number;
  window: number; // ms
}

type LimitType = 
  | 'executions_per_hour'
  | 'changes_per_day'
  | 'rollback_depth'
  | 'deployment_frequency';

class OperationalLimits {
  private limits: Map<LimitType, OperationalLimit>;
  private config: AgentAutonomousConfig;

  constructor(config: AgentAutonomousConfig) {
    this.config = config;
    this.limits = this.initializeLimits();
  }

  async checkLimits(action: AgentAction): Promise<LimitCheckResult> {
    const limit = this.limits.get('executions_per_hour');
    if (limit && limit.current >= limit.max) {
      return {
        allowed: false,
        reason: 'Execution rate limit exceeded',
        blockedBy: 'executions_per_hour'
      };
    }

    return { allowed: true };
  }

  async recordExecution(action: AgentAction): Promise<void> {
    const limit = this.limits.get('executions_per_hour');
    if (limit) {
      limit.current++;
    }
  }

  private initializeLimits(): Map<LimitType, OperationalLimit> {
    return new Map([
      ['executions_per_hour', { type: 'executions_per_hour', current: 0, max: 100, window: 3600000 }],
      ['changes_per_day', { type: 'changes_per_day', current: 0, max: 50, window: 86400000 }],
      ['rollback_depth', { type: 'rollback_depth', current: 0, max: this.config.maxAutonomyDepth, window: 0 }],
      ['deployment_frequency', { type: 'deployment_frequency', current: 0, max: 10, window: 86400000 }]
    ]);
  }
}
```

## Test Cases
1. Autonomous execution proceeds without human input
2. Self-validation runs before and after execution
3. Error recovery attempts work correctly
4. Rollback executes on failure
5. Reports generated for all executions
6. Operational limits enforced
7. Risk assessment prevents dangerous actions
8. Recovery strategies apply to correct error types
9. Notifications sent on completion/failure
10. Limits reset after window expires

## CLI Commands
```bash
# Check autonomous status
speclang autonomous --status specs/auth.spec.md

# Execute autonomously
speclang autonomous --execute specs/auth.spec.md --action add-login

# View execution reports
speclang autonomous --reports --spec specs/auth.spec.md

# Set operational limits
speclang autonomous --limit executions_per_hour=50

# Force rollback
speclang autonomous --rollback exec-123

# View recovery history
speclang autonomous --recovery exec-123
```

## Validation
```bash
bun test tests/agent-support/agent-autonomous/
```

## Output Format
After completing, output:
1. Autonomous enforcement
2. Full autonomous executor
3. Self-validation
4. Error recovery
5. Autonomous reporting
6. Operational limits
7. Test results
