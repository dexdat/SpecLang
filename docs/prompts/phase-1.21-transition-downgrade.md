# Bootstrap Phase 1.21: Transition - Downgrade Workflows

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.21 of the bootstrap process.

**Prerequisites**: 
- Phase 1.20 (Transition - Upgrade Workflows) complete

## Your Task
Implement downgrade workflows - procedures for moving specs to lower maturity levels (e.g., agent_autonomous to agent_assisted) due to failures, safety concerns, or manual intervention.

## Read These Specs First
1. `specs/agent-support-levels.spec.md` - Agent support modes
2. `specs/project-maturity.spec.md` - Maturity levels
3. `specs/transition-protocols.spec.md` - Transition specifications
4. `specs/emergency-protocols.spec.md` - Emergency procedures

## What to Build

### Files to Create
```
src/transition/
├── downgrade/
│   ├── index.ts              # Downgrade exports
│   ├── triggers.ts           # Downgrade triggers
│   ├── planner.ts            # Downgrade planning
│   ├── executor.ts           # Downgrade execution
│   ├── notification.ts       # Downgrade notifications
│   └── audit.ts              # Downgrade audit trail
```

### Requirements

#### 1. Downgrade Triggers (triggers.ts)
```typescript
type DowngradeTrigger = 
  | 'automatic_failure'
  | 'safety_concern'
  | 'human_initiated'
  | 'scheduled'
  | 'cascade_effect';

interface DowngradeEvent {
  id: string;
  trigger: DowngradeTrigger;
  specId: string;
  fromLevel: AgentSupportLevel;
  toLevel: AgentSupportLevel;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
  timestamp: Date;
}

class DowngradeTriggerManager {
  private triggers: Map<DowngradeTrigger, TriggerHandler>;
  private eventLog: DowngradeEvent[];

  constructor() {
    this.triggers = new Map();
    this.eventLog = [];
    this.initializeTriggers();
  }

  async checkAndTrigger(spec: ParsedSpec, context: TriggerContext): Promise<DowngradeEvent | null> {
    // Check each trigger type
    for (const [triggerType, handler] of this.triggers) {
      const shouldTrigger = await handler.check(spec, context);
      
      if (shouldTrigger) {
        const event = await this.triggerDowngrade(
          triggerType,
          spec,
          context.targetLevel || this.determineTargetLevel(spec),
          shouldTrigger.reason,
          shouldTrigger.severity
        );
        
        return event;
      }
    }

    return null;
  }

  private async triggerDowngrade(
    trigger: DowngradeTrigger,
    spec: ParsedSpec,
    toLevel: AgentSupportLevel,
    reason: string,
    severity: DowngradeEvent['severity']
  ): Promise<DowngradeEvent> {
    const event: DowngradeEvent = {
      id: generateId(),
      trigger,
      specId: spec.metadata.id,
      fromLevel: spec.metadata.agent_support as AgentSupportLevel,
      toLevel,
      reason,
      severity,
      metadata: {},
      timestamp: new Date()
    };

    this.eventLog.push(event);
    
    // Execute downgrade
    await this.executeDowngrade(event, spec);

    return event;
  }

  private determineTargetLevel(spec: ParsedSpec): AgentSupportLevel {
    const currentLevel = spec.metadata.agent_support as AgentSupportLevel;
    
    switch (currentLevel) {
      case 'agent_autonomous':
        return 'agent_assisted';
      case 'agent_assisted':
        return 'human_only';
      default:
        return 'human_only';
    }
  }

  private initializeTriggers(): void {
    this.triggers.set('automatic_failure', {
      check: async (spec, context) => {
        if (context.failureCount && context.failureCount >= 3) {
          return {
            shouldTrigger: true,
            reason: `Multiple failures detected (${context.failureCount})`,
            severity: 'high'
          };
        }
        return { shouldTrigger: false };
      }
    });

    this.triggers.set('safety_concern', {
      check: async (spec, context) => {
        if (context.securityViolation || context.safetyIssue) {
          return {
            shouldTrigger: true,
            reason: context.securityViolation || 'Safety concern detected',
            severity: 'critical'
          };
        }
        return { shouldTrigger: false };
      }
    });

    this.triggers.set('cascade_effect', {
      check: async (spec, context) => {
        if (context.cascadeFromSpec) {
          return {
            shouldTrigger: true,
            reason: `Cascade from ${context.cascadeFromSpec}`,
            severity: 'medium'
          };
        }
        return { shouldTrigger: false };
      }
    });
  }

  getEventLog(specId?: string): DowngradeEvent[] {
    if (specId) {
      return this.eventLog.filter(e => e.specId === specId);
    }
    return this.eventLog;
  }
}
```

#### 2. Downgrade Planning (planner.ts)
```typescript
interface DowngradePlan {
  id: string;
  specId: string;
  fromLevel: AgentSupportLevel;
  toLevel: AgentSupportLevel;
  trigger: DowngradeTrigger;
  reason: string;
  steps: DowngradeStep[];
  risks: DowngradeRisk[];
  notifications: Notification[];
}

interface DowngradeStep {
  id: string;
  name: string;
  action: string;
  required: boolean;
}

interface DowngradeRisk {
  level: 'low' | 'medium' | 'high';
  description: string;
}

interface Notification {
  channel: 'slack' | 'email' | 'webhook';
  recipients: string[];
  message: string;
}

class DowngradePlanner {
  private templates: Map<AgentSupportLevel, DowngradePlan>;

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  async planDowngrade(event: DowngradeEvent): Promise<DowngradePlan> {
    const template = this.templates.get(event.toLevel);
    
    const plan: DowngradePlan = {
      id: generateId(),
      specId: event.specId,
      fromLevel: event.fromLevel,
      toLevel: event.toLevel,
      trigger: event.trigger,
      reason: event.reason,
      steps: this.generateSteps(template, event),
      risks: this.assessRisks(event),
      notifications: this.generateNotifications(event)
    };

    return plan;
  }

  private generateSteps(template: DowngradePlan | undefined, event: DowngradeEvent): DowngradeStep[] {
    const steps: DowngradeStep[] = [
      {
        id: 'step-1',
        name: 'Pause autonomous execution',
        action: 'pause_autonomous',
        required: true
      },
      {
        id: 'step-2',
        name: 'Notify stakeholders',
        action: 'notify',
        required: true
      },
      {
        id: 'step-3',
        name: 'Log downgrade event',
        action: 'audit_log',
        required: true
      },
      {
        id: 'step-4',
        name: 'Update spec metadata',
        action: 'update_metadata',
        required: true
      },
      {
        id: 'step-5',
        name: 'Verify downgrade',
        action: 'verify',
        required: true
      }
    ];

    if (event.trigger === 'automatic_failure' || event.trigger === 'safety_concern') {
      steps.push({
        id: 'step-6',
        name: 'Review failures',
        action: 'review_failures',
        required: true
      });
    }

    return steps;
  }

  private assessRisks(event: DowngradeEvent): DowngradeRisk[] {
    const risks: DowngradeRisk[] = [];

    if (event.fromLevel === 'agent_autonomous' && event.toLevel === 'human_only') {
      risks.push({
        level: 'high',
        description: 'Complete loss of automation'
      });
    }

    if (event.trigger === 'cascade_effect') {
      risks.push({
        level: 'medium',
        description: 'May trigger further downgrades'
      });
    }

    return risks;
  }

  private generateNotifications(event: DowngradeEvent): Notification[] {
    return [
      {
        channel: 'slack',
        recipients: ['#specs-alerts'],
        message: `Spec ${event.specId} downgraded from ${event.fromLevel} to ${event.toLevel}: ${event.reason}`
      },
      {
        channel: 'email',
        recipients: ['specs-team@company.com'],
        message: `Downgrade Alert: ${event.specId}`
      }
    ];
  }

  private initializeTemplates(): void {
    this.templates.set('agent_assisted', {
      id: 'template-assisted',
      specId: '',
      fromLevel: 'agent_autonomous',
      toLevel: 'agent_assisted',
      trigger: 'automatic_failure',
      reason: '',
      steps: [],
      risks: [],
      notifications: []
    });

    this.templates.set('human_only', {
      id: 'template-human',
      specId: '',
      fromLevel: 'agent_assisted',
      toLevel: 'human_only',
      trigger: 'automatic_failure',
      reason: '',
      steps: [],
      risks: [],
      notifications: []
    });
  }
}
```

#### 3. Downgrade Execution (executor.ts)
```typescript
class DowngradeExecutor {
  private planner: DowngradePlanner;
  private notifier: DowngradeNotifier;
  private audit: DowngradeAudit;
  private validator: SpecValidator;

  constructor() {
    this.planner = new DowngradePlanner();
    this.notifier = new DowngradeNotifier();
    this.audit = new DowngradeAudit();
    this.validator = new SpecValidator();
  }

  async execute(event: DowngradeEvent, spec: ParsedSpec): Promise<DowngradeResult> {
    const plan = await this.planner.planDowngrade(event);

    const execution: DowngradeExecution = {
      id: generateId(),
      planId: plan.id,
      specId: spec.metadata.id,
      status: 'in_progress',
      startedAt: new Date(),
      completedSteps: [],
      errors: []
    };

    try {
      // Execute each step
      for (const step of plan.steps) {
        execution.currentStep = step.id;
        
        await this.executeStep(step, spec, event);
        execution.completedSteps.push(step.id);
        
        // Log progress
        await this.audit.logStep(execution, step);
      }

      // Apply downgrade to spec
      const downgradedSpec = await this.applyDowngrade(spec, plan);

      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.resultSpec = downgradedSpec;

      // Send notifications
      await this.notifier.sendNotifications(plan.notifications, execution);

      // Final audit
      await this.audit.logCompletion(execution);

      return {
        success: true,
        execution,
        spec: downgradedSpec,
        warnings: plan.risks.map(r => r.description)
      };

    } catch (error) {
      execution.status = 'failed';
      execution.errors.push(error.message);
      execution.completedAt = new Date();

      // Attempt recovery
      await this.handleFailure(execution, spec, error);

      return {
        success: false,
        execution,
        errors: execution.errors
      };
    }
  }

  private async executeStep(
    step: DowngradeStep,
    spec: ParsedSpec,
    event: DowngradeEvent
  ): Promise<void> {
    switch (step.action) {
      case 'pause_autonomous':
        await this.pauseAutonomous(spec);
        break;
      case 'update_metadata':
        await this.updateMetadata(spec, event);
        break;
      case 'verify':
        await this.verifyDowngrade(spec, event);
        break;
      case 'review_failures':
        await this.reviewFailures(spec);
        break;
      default:
        // Generic step
        break;
    }
  }

  private async pauseAutonomous(spec: ParsedSpec): Promise<void> {
    // Stop any running autonomous tasks
    console.log(`Pausing autonomous execution for ${spec.metadata.id}`);
  }

  private async applyDowngrade(
    spec: ParsedSpec,
    plan: DowngradePlan
  ): Promise<ParsedSpec> {
    return {
      ...spec,
      metadata: {
        ...spec.metadata,
        agent_support: plan.toLevel,
        previous_agent_support: plan.fromLevel,
        downgraded_at: new Date().toISOString(),
        downgrade_reason: plan.reason,
        downgrade_trigger: plan.trigger
      }
    };
  }

  private async verifyDowngrade(spec: ParsedSpec, event: DowngradeEvent): Promise<void> {
    const newLevel = spec.metadata.agent_support;
    if (newLevel !== event.toLevel) {
      throw new Error(`Downgrade verification failed: expected ${event.toLevel}, got ${newLevel}`);
    }
  }

  private async handleFailure(
    execution: DowngradeExecution,
    spec: ParsedSpec,
    error: Error
  ): Promise<void> {
    // Log failure
    await this.audit.logFailure(execution, error);

    // Notify critical failure
    await this.notifier.notifyFailure(spec, error);
  }
}
```

#### 4. Downgrade Notifications (notification.ts)
```typescript
class DowngradeNotifier {
  private channels: Map<string, NotificationChannel>;

  constructor() {
    this.channels = new Map();
    this.initializeChannels();
  }

  async sendNotifications(
    notifications: Notification[],
    execution: DowngradeExecution
  ): Promise<void> {
    for (const notification of notifications) {
      const channel = this.channels.get(notification.channel);
      if (channel) {
        await channel.send(notification.recipients, {
          title: 'Spec Downgrade Executed',
          message: notification.message,
          execution
        });
      }
    }
  }

  async notifyFailure(spec: ParsedSpec, error: Error): Promise<void> {
    const channel = this.channels.get('slack');
    if (channel) {
      await channel.send(['#specs-critical'], {
        title: 'CRITICAL: Downgrade Failed',
        message: `Failed to downgrade ${spec.metadata.id}: ${error.message}`,
        severity: 'critical'
      });
    }
  }

  async requestManualIntervention(
    spec: ParsedSpec,
    reason: string
  ): Promise<void> {
    const channel = this.channels.get('email');
    if (channel) {
      await channel.send(['specs-team@company.com'], {
        title: 'Manual Intervention Required',
        message: `Manual intervention needed for ${spec.metadata.id}: ${reason}`
      });
    }
  }

  private initializeChannels(): void {
    this.channels.set('slack', {
      send: async (recipients, message) => {
        // Slack integration
        console.log(`Slack to ${recipients}: ${message.title}`);
      }
    });

    this.channels.set('email', {
      send: async (recipients, message) => {
        // Email integration
        console.log(`Email to ${recipients}: ${message.title}`);
      }
    });
  }
}
```

#### 5. Downgrade Audit Trail (audit.ts)
```typescript
interface AuditEntry {
  id: string;
  type: 'step' | 'completion' | 'failure' | 'rollback';
  executionId: string;
  specId: string;
  timestamp: Date;
  details: Record<string, any>;
}

class DowngradeAudit {
  private entries: Map<string, AuditEntry[]>;

  constructor() {
    this.entries = new Map();
  }

  async logStep(execution: DowngradeExecution, step: DowngradeStep): Promise<void> {
    const entry: AuditEntry = {
      id: generateId(),
      type: 'step',
      executionId: execution.id,
      specId: execution.specId,
      timestamp: new Date(),
      details: {
        stepId: step.id,
        stepName: step.name,
        action: step.action
      }
    };

    this.addEntry(execution.executionId, entry);
  }

  async logCompletion(execution: DowngradeExecution): Promise<void> {
    const entry: AuditEntry = {
      id: generateId(),
      type: 'completion',
      executionId: execution.id,
      specId: execution.specId,
      timestamp: new Date(),
      details: {
        completedSteps: execution.completedSteps,
        duration: execution.completedAt?.getTime() - execution.startedAt.getTime()
      }
    };

    this.addEntry(execution.executionId, entry);
  }

  async logFailure(execution: DowngradeExecution, error: Error): Promise<void> {
    const entry: AuditEntry = {
      id: generateId(),
      type: 'failure',
      executionId: execution.id,
      specId: execution.specId,
      timestamp: new Date(),
      details: {
        error: error.message,
        failedAtStep: execution.currentStep,
        completedSteps: execution.com }
    };

    this.addEntry(execution.executionId, entry);
  }

  async logpletedSteps
     Rollback(
    executionId: string,
    specId: string,
    rolledBackBy: string
  ): Promise<void> {
    const entry: AuditEntry = {
      id: generateId(),
      type: 'rollback',
      executionId,
      specId,
      timestamp: new Date(),
      details: {
        rolledBackBy,
        reason: 'Manual rollback'
      }
    };

    this.addEntry(executionId, entry);
  }

  async getAuditTrail(executionId: string): Promise<AuditEntry[]> {
    return this.entries.get(executionId) || [];
  }

  async getSpecHistory(specId: string): Promise<AuditEntry[]> {
    const allEntries = Array.from(this.entries.values()).flat();
    return allEntries.filter(e => e.specId === specId);
  }

  private addEntry(executionId: string, entry: AuditEntry): void {
    const executionEntries = this.entries.get(executionId) || [];
    executionEntries.push(entry);
    this.entries.set(executionId, executionEntries);
  }
}
```

## Test Cases
1. Automatic triggers detect failures
2. Safety concerns trigger immediate downgrade
3. Manual downgrade can be initiated
4. Cascade effects handled correctly
5. Downgrade plan generated with steps
6. Notifications sent to correct channels
7. Audit trail records all events
8. Rollback available after downgrade
9. Spec metadata updated correctly
10. Verification confirms downgrade

## CLI Commands
```bash
# Check downgrade triggers
speclang downgrade --check specs/auth.spec.md

# Trigger manual downgrade
speclang downgrade --trigger specs/auth.spec.md --to human_only --reason "Security concern"

# View downgrade history
speclang downgrade --history specs/auth.spec.md

# View audit trail
speclang downgrade --audit exec-123

# Rollback downgrade
speclang downgrade --rollback exec-123
```

## Validation
```bash
bun test tests/transition/downgrade/
```

## Output Format
After completing, output:
1. Downgrade triggers
2. Downgrade planning
3. Downgrade execution
4. Downgrade notifications
5. Downgrade audit trail
6. Test results
