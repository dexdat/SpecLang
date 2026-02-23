# Bootstrap Phase 1.17: Agent-Assisted Support Level

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.17 of the bootstrap process.

**Prerequisites**: 
- Phase 1.16 (Human-Only Support) complete
- Phase 0.25 (Project Maturity Levels) complete

## Your Task
Implement the agent-assisted support mode - for specs requiring human guidance with agent execution assistance.

## Read These Specs First
1. `specs/agent-support-levels.spec.md` - Agent support modes
2. `specs/validation-rules.spec.md` - Validation requirements
3. `specs/human-oversight.spec.md` - Oversight patterns

## What to Build

### Files to Create
```
src/agent-support/agent-assisted/
├── index.ts              # Agent-assisted exports
├── enforcer.ts           # Agent-assisted enforcement
├── guidance.ts           # Human guidance integration
├── suggestions.ts        # Agent suggestions
├── checkpoints.ts        # Checkpoint-based execution
└── handover.ts           # Human-agent handover
```

### Requirements

#### 1. Agent-Assisted Mode (enforcer.ts)
```typescript
type AgentAssistedLevel = 
  | 'suggest_only'
  | 'execute_with_approval'
  | 'execute_with_guidance'
  | 'full_assistance';

interface AgentAssistedConfig {
  level: AgentAssistedLevel;
  requireHumanGuidance: boolean;
  confirmationRequired: boolean;
  approvalRequired: boolean;
  suggestionsEnabled: boolean;
  checkpointFrequency: number;
}

const AGENT_ASSISTED_CONFIGS: Record<AgentAssistedLevel, AgentAssistedConfig> = {
  suggest_only: {
    level: 'suggest_only',
    requireHumanGuidance: true,
    confirmationRequired: true,
    approvalRequired: true,
    suggestionsEnabled: true,
    checkpointFrequency: 1
  },
  execute_with_approval: {
    level: 'execute_with_approval',
    requireHumanGuidance: true,
    confirmationRequired: true,
    approvalRequired: true,
    suggestionsEnabled: true,
    checkpointFrequency: 5
  },
  execute_with_guidance: {
    level: 'execute_with_guidance',
    requireHumanGuidance: true,
    confirmationRequired: true,
    approvalRequired: false,
    suggestionsEnabled: true,
    checkpointFrequency: 3
  },
  full_assistance: {
    level: 'full_assistance',
    requireHumanGuidance: true,
    confirmationRequired: false,
    approvalRequired: false,
    suggestionsEnabled: true,
    checkpointFrequency: 10
  }
};

class AgentAssistedEnforcer {
  private config: AgentAssistedConfig;
  private guidance: GuidanceEngine;
  private checkpoints: CheckpointManager;

  constructor(config: AgentAssistedLevel | Partial<AgentAssistedConfig>) {
    if (typeof config === 'string') {
      this.config = AGENT_ASSISTED_CONFIGS[config];
    } else {
      this.config = { ...AGENT_ASSISTED_CONFIGS.execute_with_approval, ...config };
    }
    
    this.guidance = new GuidanceEngine(this.config.level);
    this.checkpoints = new CheckpointManager(this.config.checkpointFrequency);
  }

  async canProceed(action: AgentAction): Promise<AgentAssistedResult> {
    const result: AgentAssistedResult = {
      allowed: true,
      requiresGuidance: this.config.requireHumanGuidance,
      requiresConfirmation: this.config.confirmationRequired,
      requiresApproval: this.config.approvalRequired,
      suggestions: await this.guidance.getSuggestions(action),
      checkpoints: this.checkpoints.getCheckpoints(action)
    };

    if (this.config.confirmationRequired) {
      result.pendingConfirmation = true;
      result.confirmationPrompt = this.generatePrompt(action);
    }

    return result;
  }

  async executeWithGuidance(
    action: AgentAction,
    humanGuidance: HumanGuidance
  ): Promise<ExecutionResult> {
    const checkpoints = this.checkpoints.createCheckpoints(action);
    let currentStep = 0;
    let result: ExecutionResult;

    for (const checkpoint of checkpoints) {
      // Get human guidance at each checkpoint
      const guidance = await this.guidance.getCheckpointGuidance(
        checkpoint,
        humanGuidance
      );

      // Execute checkpoint with guidance
      result = await this.executeCheckpoint(checkpoint, guidance);
      
      if (!result.success) {
        // Allow human intervention on failure
        await this.handleCheckpointFailure(checkpoint, result);
        throw new Error(`Checkpoint ${checkpoint.id} failed: ${result.error}`);
      }

      currentStep++;
      
      // Request human confirmation between checkpoints if needed
      if (this.config.confirmationRequired && currentStep < checkpoints.length) {
        await this.requestIntermediateConfirmation(checkpoint);
      }
    }

    return result;
  }

  private generatePrompt(action: AgentAction): string {
    return `Agent-assisted execution for: ${action.type} on ${action.resource}
    
    Description: ${action.description}
    Agent will execute with human guidance.
    Checkpoints: ${this.config.checkpointFrequency}
    
    Please confirm to begin.`;
  }
}
```

#### 2. Human Guidance Integration (guidance.ts)
```typescript
interface HumanGuidance {
  id: string;
  providedBy: string;
  providedAt: Date;
  type: GuidanceType;
  content: string;
  appliesTo: string[];
}

type GuidanceType = 
  | 'direction'
  | 'constraint'
  | 'preference'
  | 'correction'
  | 'approval';

class GuidanceEngine {
  private level: AgentAssistedLevel;
  private guidanceHistory: Map<string, HumanGuidance[]>;

  constructor(level: AgentAssistedLevel) {
    this.level = level;
    this.guidanceHistory = new Map();
  }

  async getSuggestions(action: AgentAction): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // Generate context-aware suggestions based on action type
    switch (action.type) {
      case 'feature':
        suggestions.push(...this.suggestFeatureImplementation(action));
        break;
      case 'refactor':
        suggestions.push(...this.suggestRefactoring(action));
        break;
      case 'fix':
        suggestions.push(...this.suggestFixes(action));
        break;
    }

    // Apply learned guidance from history
    const historicalGuidance = this.getHistoricalGuidance(action.resource);
    for (const guidance of historicalGuidance) {
      suggestions.push({
        id: generateId(),
        type: 'learned_preference',
        content: guidance.content,
        source: guidance.providedBy,
        confidence: 0.8
      });
    }

    return suggestions;
  }

  async getCheckpointGuidance(
    checkpoint: Checkpoint,
    humanGuidance: HumanGuidance
  ): Promise<CheckpointGuidance> {
    const applicableGuidance = humanGuidance.appliesTo.includes(checkpoint.id)
      ? humanGuidance
      : null;

    return {
      checkpointId: checkpoint.id,
      guidance: applicableGuidance,
      suggestions: await this.getSuggestionsForCheckpoint(checkpoint),
      warnings: this.getWarningsForCheckpoint(checkpoint)
    };
  }

  async processHumanGuidance(guidance: HumanGuidance): Promise<void> {
    // Store guidance for future learning
    const resourceGuidance = this.guidanceHistory.get(guidance.appliesTo[0]) || [];
    resourceGuidance.push(guidance);
    this.guidanceHistory.set(guidance.appliesTo[0], resourceGuidance);

    // Apply immediate guidance if applicable
    if (guidance.type === 'correction') {
      await this.applyCorrection(guidance);
    }
  }

  private getHistoricalGuidance(resource: string): HumanGuidance[] {
    return this.guidanceHistory.get(resource) || [];
  }
}
```

#### 3. Agent Suggestions (suggestions.ts)
```typescript
interface Suggestion {
  id: string;
  type: SuggestionType;
  content: string;
  confidence: number;
  source?: string;
  priority: 'high' | 'medium' | 'low';
}

type SuggestionType = 
  | 'implementation_approach'
  | 'code_pattern'
  | 'test_strategy'
  | 'optimization'
  | 'learned_preference';

class SuggestionEngine {
  private suggestionTemplates: Map<string, SuggestionTemplate[]>;

  constructor() {
    this.suggestionTemplates = new Map();
    this.initializeTemplates();
  }

  async generateSuggestions(action: AgentAction): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // Get action-specific suggestions
    const templates = this.suggestionTemplates.get(action.type) || [];
    for (const template of templates) {
      const suggestion = await this.applyTemplate(template, action);
      suggestions.push(suggestion);
    }

    // Add contextual suggestions based on project patterns
    suggestions.push(...await this.getContextualSuggestions(action));

    // Sort by confidence and priority
    return suggestions.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return b.confidence - a.confidence;
    });
  }

  async presentSuggestions(
    suggestions: Suggestion[],
    format: 'list' | 'interactive'
  ): Promise<SelectedSuggestions> {
    if (format === 'list') {
      return this.formatAsList(suggestions);
    }
    return this.formatAsInteractive(suggestions);
  }

  private async applyTemplate(
    template: SuggestionTemplate,
    action: AgentAction
  ): Promise<Suggestion> {
    return {
      id: generateId(),
      type: template.type,
      content: this.interpolate(template.content, action),
      confidence: template.confidence,
      priority: template.priority
    };
  }
}
```

#### 4. Checkpoint-Based Execution (checkpoints.ts)
```typescript
interface Checkpoint {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  requiresHumanCheck: boolean;
  results?: CheckpointResult;
}

interface CheckpointResult {
  success: boolean;
  output?: any;
  errors?: string[];
  duration: number;
}

class CheckpointManager {
  private frequency: number;
  private checkpoints: Map<string, Checkpoint[]>;

  constructor(frequency: number) {
    this.frequency = frequency;
    this.checkpoints = new Map();
  }

  getCheckpoints(action: AgentAction): Checkpoint[] {
    const stored = this.checkpoints.get(action.id);
    if (stored) return stored;

    return this.createCheckpoints(action);
  }

  createCheckpoints(action: AgentAction): Checkpoint[] {
    const steps = this.estimateSteps(action);
    const checkpointCount = Math.ceil(steps / this.frequency);
    
    const checkpoints: Checkpoint[] = [];
    for (let i = 0; i < checkpointCount; i++) {
      checkpoints.push({
        id: `${action.id}-checkpoint-${i}`,
        name: `Checkpoint ${i + 1}`,
        description: `Execution step ${i + 1} of ${checkpointCount}`,
        completed: false,
        requiresHumanCheck: i % this.frequency === 0
      });
    }

    this.checkpoints.set(action.id, checkpoints);
    return checkpoints;
  }

  async verifyCheckpoint(checkpointId: string): Promise<boolean> {
    const checkpoints = Array.from(this.checkpoints.values()).flat();
    const checkpoint = checkpoints.find(c => c.id === checkpointId);
    
    if (!checkpoint) return false;

    // Verify checkpoint results
    return checkpoint.results?.success ?? false;
  }

  private estimateSteps(action: AgentAction): number {
    // Estimate based on action complexity
    const baseSteps = 5;
    const complexityMultiplier = action.breaking ? 2 : 1;
    return baseSteps * complexityMultiplier;
  }
}
```

#### 5. Human-Agent Handover (handover.ts)
```typescript
interface HandoverEvent {
  id: string;
  from: 'human' | 'agent';
  to: 'human' | 'agent';
  reason: string;
  context: Record<string, any>;
  timestamp: Date;
}

class HandoverManager {
  private handovers: Map<string, HandoverEvent[]>;
  private pendingHandoffs: Map<string, HandoverRequest>;

  constructor() {
    this.handovers = new Map();
    this.pendingHandoffs = new Map();
  }

  async requestHandover(
    actionId: string,
    from: 'human' | 'agent',
    to: 'human' | 'agent',
    reason: string,
    context: Record<string, any>
  ): Promise<HandoverRequest> {
    const request: HandoverRequest = {
      id: generateId(),
      actionId,
      from,
      to,
      reason,
      context,
      status: 'pending',
      requestedAt: new Date()
    };

    this.pendingHandoffs.set(request.id, request);

    // Notify appropriate party
    if (to === 'human') {
      await this.notifyHuman(request);
    }

    return request;
  }

  async completeHandover(
    requestId: string,
    completedBy: string
  ): Promise<void> {
    const request = this.pendingHandoffs.get(requestId);
    if (!request || request.status !== 'pending') {
      throw new Error('Invalid handover request');
    }

    const handover: HandoverEvent = {
      id: requestId,
      from: request.from,
      to: request.to,
      reason: request.reason,
      context: request.context,
      timestamp: new Date()
    };

    const actionHandovers = this.handovers.get(request.actionId) || [];
    actionHandovers.push(handover);
    this.handovers.set(request.actionId, actionHandovers);

    request.status = 'completed';
    request.completedBy = completedBy;
    request.completedAt = new Date();
  }

  async getHandoverHistory(actionId: string): Promise<HandoverEvent[]> {
    return this.handovers.get(actionId) || [];
  }
}
```

## Test Cases
1. Suggestions generated for each action type
2. Checkpoints created based on frequency
3. Human guidance applied at checkpoints
4. Handover requests properly tracked
5. Guidance learned from history
6. Confirmation required at configured intervals
7. Agent suggestions ranked by confidence
8. Interactive suggestion selection works
9. Handover notifications sent correctly
10. Checkpoint results persisted

## CLI Commands
```bash
# Check agent-assisted status
speclang agent-assisted --status specs/auth.spec.md

# Get suggestions for action
speclang agent-assisted --suggest --action "add-login" --spec specs/auth.spec.md

# Set checkpoint frequency
speclang agent-assisted --checkpoint-freq 5

# Request handover
speclang agent-assisted --handover req-123 --complete --user john

# View guidance history
speclang agent-assisted --guidance-history specs/auth.spec.md
```

## Validation
```bash
bun test tests/agent-support/agent-assisted/
```

## Output Format
After completing, output:
1. Agent-assisted enforcement
2. Human guidance integration
3. Agent suggestions
4. Checkpoint-based execution
5. Human-agent handover
6. Test results
