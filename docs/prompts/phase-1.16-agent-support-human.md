# Bootstrap Phase 1.16: Human-Only Agent Support

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.16 of the bootstrap process.

**Prerequisites**: 
- Phase 0.25 (Project Maturity Levels) complete
- Phase 1.14 (Validation Completeness) complete

## Your Task
Implement the human-only agent support mode - for specs requiring full human control with no autonomous agent operation.

## Read These Specs First
1. `specs/agent-support-levels.spec.md` - Agent support modes
2. `specs/validation-rules.spec.md` - Validation requirements
3. `specs/human-oversight.spec.md` - Oversight patterns

## What to Build

### Files to Create
```
src/agent-support/human-only/
├── index.ts              # Human-only exports
├── enforcer.ts           # Human-only enforcement
├── confirmation.ts        # Confirmation workflows
├── approval.ts           # Approval tracking
├── oversight.ts           # Human oversight mechanisms
└── restrictions.ts        # Agent restrictions
```

### Requirements

#### 1. Human-Only Mode (enforcer.ts)
```typescript
type HumanOnlyLevel = 
  | 'confirm_every_step'
  | 'confirm_major_changes'
  | 'confirm_production'
  | 'confirm_breaking';

interface HumanOnlyConfig {
  level: HumanOnlyLevel;
  requireHuman: boolean;
  confirmationRequired: boolean;
  approvalRequired: boolean;
  loggingLevel: 'minimal' | 'detailed' | 'full';
}

const HUMAN_ONLY_CONFIGS: Record<HumanOnlyLevel, HumanOnlyConfig> = {
  confirm_every_step: {
    level: 'confirm_every_step',
    requireHuman: true,
    confirmationRequired: true,
    approvalRequired: true,
    loggingLevel: 'full'
  },
  confirm_major_changes: {
    level: 'confirm_major_changes',
    requireHuman: true,
    confirmationRequired: true,
    approvalRequired: true,
    loggingLevel: 'detailed'
  },
  confirm_production: {
    level: 'confirm_production',
    requireHuman: true,
    confirmationRequired: true,
    approvalRequired: true,
    loggingLevel: 'detailed'
  },
  confirm_breaking: {
    level: 'confirm_breaking',
    requireHuman: true,
    confirmationRequired: true,
    approvalRequired: true,
    loggingLevel: 'minimal'
  }
};

class HumanOnlyEnforcer {
  private config: HumanOnlyConfig;

  constructor(config: HumanOnlyLevel | Partial<HumanOnlyConfig>) {
    if (typeof config === 'string') {
      this.config = HUMAN_ONLY_CONFIGS[config];
    } else {
      this.config = { ...HUMAN_ONLY_CONFIGS.confirm_every_step, ...config };
    }
  }

  async canProceed(action: AgentAction): Promise<HumanOnlyResult> {
    const result: HumanOnlyResult = {
      allowed: false,
      requiresConfirmation: this.config.confirmationRequired,
      requiresApproval: this.config.approvalRequired,
      reason: 'Human-only mode: human confirmation required'
    };

    // Check if action requires human confirmation
    if (this.requiresConfirmation(action)) {
      result.pendingConfirmation = true;
      result.confirmationPrompt = this.generatePrompt(action);
    }

    return result;
  }

  private requiresConfirmation(action: AgentAction): boolean {
    switch (this.config.level) {
      case 'confirm_every_step':
        return true;
      case 'confirm_major_changes':
        return action.type === 'feature' || action.breaking;
      case 'confirm_production':
        return action.environment === 'production';
      case 'confirm_breaking':
        return action.breaking;
      default:
        return true;
    }
  }

  private generatePrompt(action: AgentAction): string {
    return `Human confirmation required for: ${action.type} on ${action.resource}
    
    Description: ${action.description}
    Impact: ${action.impact || 'unknown'}
    Breaking: ${action.breaking ? 'Yes' : 'No'}
    
    Please confirm to proceed.`;
  }
}
```

#### 2. Confirmation Workflows (confirmation.ts)
```typescript
interface ConfirmationRequest {
  id: string;
  action: AgentAction;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestedAt: Date;
  respondedAt?: Date;
  requestedBy: string;
  approvedBy?: string;
  comments?: string;
}

class ConfirmationWorkflow {
  private pendingRequests: Map<string, ConfirmationRequest> = new Map();

  async requestConfirmation(action: AgentAction, requester: string): Promise<ConfirmationRequest> {
    const request: ConfirmationRequest = {
      id: generateId(),
      action,
      status: 'pending',
      requestedAt: new Date(),
      requestedBy: requester
    };

    this.pendingRequests.set(request.id, request);

    // Send notification to approvers
    await this.notifyApprovers(request);

    // Set expiration
    this.setExpiration(request.id);

    return request;
  }

  async approve(requestId: string, approver: string, comments?: string): Promise<boolean> {
    const request = this.pendingRequests.get(requestId);
    if (!request || request.status !== 'pending') {
      throw new Error('Invalid request or already processed');
    }

    request.status = 'approved';
    request.respondedAt = new Date();
    request.approvedBy = approver;
    request.comments = comments;

    // Log approval
    await this.logApproval(request);

    return true;
  }

  async reject(requestId: string, rejecter: string, reason: string): Promise<boolean> {
    const request = this.pendingRequests.get(requestId);
    if (!request || request.status !== 'pending') {
      throw new Error('Invalid request or already processed');
    }

    request.status = 'rejected';
    request.respondedAt = new Date();
    request.approvedBy = rejecter;
    request.comments = reason;

    // Log rejection
    await this.logRejection(request);

    return true;
  }

  private async notifyApprovers(request: ConfirmationRequest): Promise<void> {
    // Notify via configured channels
    const message = this.formatMessage(request);
    
    // Slack notification
    await this.sendSlack(request.action.approvers || ['#general'], message);
    
    // Email notification
    await this.sendEmail(request.action.approverEmails || [], message);
  }

  private setExpiration(requestId: string): void {
    setTimeout(async () => {
      const request = this.pendingRequests.get(requestId);
      if (request && request.status === 'pending') {
        request.status = 'expired';
        await this.handleExpired(request);
      }
    }, 24 * 60 * 60 * 1000); // 24 hour expiration
  }
}
```

#### 3. Approval Tracking (approval.ts)
```typescript
interface Approval {
  id: string;
  resource: string;
  action: string;
  approvers: ApprovedBy[];
  status: ApprovalStatus;
  expiresAt: Date;
  metadata: Record<string, any>;
}

interface ApprovedBy {
  user: string;
  role: string;
  approvedAt: Date;
  comment?: string;
}

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'superseded';

class ApprovalTracker {
  private approvals: Map<string, Approval> = new Map();

  async createApproval(action: AgentAction, requiredApprovers: string[]): Promise<Approval> {
    const approval: Approval = {
      id: generateId(),
      resource: action.resource,
      action: action.type,
      approvers: [],
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      metadata: {
        description: action.description,
        impact: action.impact,
        breaking: action.breaking
      }
    };

    this.approvals.set(approval.id, approval);
    
    // Require specific number of approvers based on change type
    const required = this.getRequiredApproverCount(action);
    approval.metadata.requiredCount = required;
    approval.metadata.requiredRoles = requiredApprovers;

    return approval;
  }

  async addApproval(approvalId: string, approver: string, role: string, comment?: string): Promise<Approval> {
    const approval = this.approvals.get(approvalId);
    if (!approval) throw new Error('Approval not found');

    if (approval.status !== 'pending') {
      throw new Error('Approval already processed');
    }

    // Check if already approved by this user
    if (approval.approvers.find(a => a.user === approver)) {
      throw new Error('Already approved');
    }

    approval.approvers.push({
      user: approver,
      role,
      approvedAt: new Date(),
      comment
    });

    // Check if we have enough approvals
    const required = approval.metadata.requiredCount || 1;
    if (approval.approvers.length >= required) {
      approval.status = 'approved';
    }

    return approval;
  }

  async getApprovalStatus(approvalId: string): Promise<Approval | null> {
    return this.approvals.get(approvalId) || null;
  }

  async listPending(resource?: string): Promise<Approval[]> {
    let approvals = Array.from(this.approvals.values()).filter(a => a.status === 'pending');
    
    if (resource) {
      approvals = approvals.filter(a => a.resource === resource);
    }

    return approvals;
  }

  private getRequiredApproverCount(action: AgentAction): number {
    if (action.breaking) return 2;
    if (action.impact === 'high') return 2;
    if (action.environment === 'production') return 2;
    return 1;
  }
}
```

#### 4. Human Oversight (oversight.ts)
```typescript
interface OversightConfig {
  enabled: boolean;
  level: HumanOnlyLevel;
  channels: NotificationChannel[];
  approvers: string[];
  fallbackApprovers: string[];
  timeout: number; // hours
}

interface NotificationChannel {
  type: 'slack' | 'email' | 'pagerduty' | 'webhook';
  target: string;
  enabled: boolean;
}

class HumanOversight {
  private config: OversightConfig;
  private confirmations: ConfirmationWorkflow;
  private approvals: ApprovalTracker;

  constructor(config: Partial<OversightConfig>) {
    this.config = {
      enabled: true,
      level: 'confirm_every_step',
      channels: [
        { type: 'slack', target: '#approvals', enabled: true },
        { type: 'email', target: 'approvals@company.com', enabled: true }
      ],
      approvers: [],
      fallbackApprovers: [],
      timeout: 24,
      ...config
    };
    
    this.confirmations = new ConfirmationWorkflow();
    this.approvals = new ApprovalTracker();
  }

  async check(action: AgentAction): Promise<OversightResult> {
    if (!this.config.enabled) {
      return { allowed: true, oversightRequired: false };
    }

    const enforcer = new HumanOnlyEnforcer(this.config.level);
    const humanResult = await enforcer.canProceed(action);

    if (!humanResult.requiresConfirmation) {
      return { allowed: true, oversightRequired: false };
    }

    // Create confirmation request
    const confirmation = await this.confirmations.requestConfirmation(
      action,
      action.initiatedBy
    );

    return {
      allowed: false,
      oversightRequired: true,
      confirmationId: confirmation.id,
      status: 'pending',
      message: humanResult.confirmationPrompt
    };
  }

  async confirm(confirmationId: string, user: string, approved: boolean, comment?: string): Promise<void> {
    if (approved) {
      await this.confirmations.approve(confirmationId, user, comment);
    } else {
      await this.confirmations.reject(confirmationId, user, comment || 'Rejected');
    }
  }

  async addApprover(approvalId: string, user: string, role: string, comment?: string): Promise<void> {
    await this.approvals.addApproval(approvalId, user, role, comment);
  }

  async getOversightReport(): Promise<OversightReport> {
    const pending = await this.confirmations.getPending();
    const approvals = await this.approvals.listPending();

    return {
      pendingConfirmations: pending.length,
      pendingApprovals: approvals.length,
      channels: this.config.channels.filter(c => c.enabled),
      config: this.config
    };
  }
}
```

#### 5. Agent Restrictions (restrictions.ts)
```typescript
interface AgentRestrictions {
  readonly allowAutonomous: boolean = false;
  readonly allowAutoDeploy: boolean = false;
  readonly allowDirectCascade: boolean = false;
  readonly maxCascadeDepth: number = 0;
  readonly requireHumanForEveryAction: boolean = true;
  readonly blockAutonomousGeneration: boolean = true;
  readonly requireApprovalBeforeExecution: boolean = true;
}

class HumanOnlyRestrictions implements AgentRestrictions {
  readonly allowAutonomous = false;
  readonly allowAutoDeploy = false;
  readonly allowDirectCascade = false;
  readonly maxCascadeDepth = 0;
  readonly requireHumanForEveryAction = true;
  readonly blockAutonomousGeneration = true;
  readonly requireApprovalBeforeExecution = true;

  validateAction(action: AgentAction): RestrictionResult {
    const violations: string[] = [];

    if (action.autonomous) {
      violations.push('Autonomous execution not allowed in human-only mode');
    }

    if (action.autoGenerated) {
      violations.push('Auto-generated content requires human review');
    }

    if (action.proposedChanges && action.proposedChanges.length > 0) {
      // All proposed changes require review
      for (const change of action.proposedChanges) {
        if (!change.humanApproved) {
          violations.push(`Change '${change.description}' not approved`);
        }
      }
    }

    return {
      allowed: violations.length === 0,
      violations,
      blocked: violations.length > 0
    };
  }

  restrictCascade(spec: ParsedSpec): ParsedSpec {
    // Override any cascade settings for human-only
    return {
      ...spec,
      metadata: {
        ...spec.metadata,
        agent_support: 'human_only',
        cascade_depth: 0,
        auto_deploy: false
      }
    };
  }
}

const HUMAN_ONLY_DEFAULTS: AgentRestrictions = {
  allowAutonomous: false,
  allowAutoDeploy: false,
  allowDirectCascade: false,
  maxCascadeDepth: 0,
  requireHumanForEveryAction: true,
  blockAutonomousGeneration: true,
  requireApprovalBeforeExecution: true
};
```

## Test Cases
1. Every action requires confirmation
2. Confirmation requests expire after timeout
3. Approval tracking records all approvals
4. Multiple approvers required for breaking changes
5. Notifications sent to configured channels
6. Restrictions prevent autonomous execution
7. Cascade disabled in human-only mode
8. Audit log captures all human decisions
9. Fallback approvers work when primary unavailable
10. Oversite report shows all pending items

## CLI Commands
```bash
# Check human-only status
speclang human-only --status specs/auth.spec.md

# List pending confirmations
speclang human-only --pending

# Approve request
speclang human-only --approve req-123 --user john

# Reject request
speclang human-only --reject req-123 --user john --reason "needs review"

# Generate oversight report
speclang human-only --report specs/auth.spec.md
```

## Validation
```bash
bun test tests/agent-support/human-only/
```

## Output Format
After completing, output:
1. Human-only enforcement
2. Confirmation workflows
3. Approval tracking
4. Oversight mechanisms
5. Agent restrictions
6. Test results
