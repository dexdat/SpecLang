/**
 * SPECLANG-GENERATED: Agent-assisted agent support enforcer
 * Source: @specs/agent-support-levels/levels#agent-assisted
 */

import {
  AgentAssistedLevel,
  AgentAssistedConfig,
  AgentAssistedResult,
  AgentAction,
  ExecutionResult,
  Suggestion,
  Checkpoint,
  Violation,
  AgentAssistedValidationResult
} from './types';
import { GuidanceEngine } from './guidance';
import { CheckpointManager } from './checkpoints';

/**
 * Predefined configurations for each agent-assisted level
 */
export const AGENT_ASSISTED_CONFIGS: Record<AgentAssistedLevel, AgentAssistedConfig> = {
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

/**
 * Agent-assisted enforcer class
 */
export class AgentAssistedEnforcer {
  private config: AgentAssistedConfig;
  private guidance: GuidanceEngine;
  private checkpoints: CheckpointManager;

  /**
   * Create an agent-assisted enforcer
   * @param config - Agent-assisted level or partial config
   */
  constructor(config: AgentAssistedLevel | Partial<AgentAssistedConfig>) {
    if (typeof config === 'string') {
      this.config = AGENT_ASSISTED_CONFIGS[config];
    } else {
      this.config = {
        ...AGENT_ASSISTED_CONFIGS.execute_with_approval,
        ...config
      };
    }
    
    this.guidance = new GuidanceEngine(this.config.level);
    this.checkpoints = new CheckpointManager(this.config.checkpointFrequency);
  }

  /**
   * Check if an action can proceed
   */
  async canProceed(action: AgentAction): Promise<AgentAssistedResult> {
    const result: AgentAssistedResult = {
      allowed: true,
      requiresGuidance: this.config.requireHumanGuidance,
      requiresConfirmation: this.config.confirmationRequired,
      requiresApproval: this.config.approvalRequired,
      suggestions: await this.guidance.getSuggestions({
        id: 'temp',
        type: action,
        resource: '',
        description: ''
      }),
      checkpoints: this.checkpoints.getCheckpoints({
        id: 'temp',
        type: action,
        resource: '',
        description: ''
      })
    };

    if (this.config.confirmationRequired) {
      result.pendingConfirmation = true;
      result.confirmationPrompt = this.generatePrompt(action);
    }

    return result;
  }

  /**
   * Execute an action with human guidance at checkpoints
   */
  async executeWithGuidance(
    action: AgentAction,
    humanGuidance: {
      providedBy: string;
      type: 'direction' | 'constraint' | 'preference' | 'correction' | 'approval';
      content: string;
      appliesTo: string[];
    }
  ): Promise<ExecutionResult> {
    const agentAction = {
      id: `action-${Date.now()}`,
      type: action,
      resource: '',
      description: ''
    };
    
    const checkpoints = this.checkpoints.createCheckpoints(agentAction);
    let currentStep = 0;
    let result: ExecutionResult = { success: false, error: 'No checkpoints executed', duration: 0 };

    for (const checkpoint of checkpoints) {
      // Get human guidance at each checkpoint
      const guidance = await this.guidance.getCheckpointGuidance(
        checkpoint,
        {
          id: `guidance-${Date.now()}`,
          providedBy: humanGuidance.providedBy,
          providedAt: new Date(),
          type: humanGuidance.type,
          content: humanGuidance.content,
          appliesTo: humanGuidance.appliesTo
        }
      );

      // Execute checkpoint with guidance
      result = await this.executeCheckpoint(checkpoint, guidance.guidance?.content || '');
      
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

    return result || { success: false, error: 'No execution result', duration: 0 };
  }

  /**
   * Validate a spec against agent-assisted policy
   */
  validateSpec(specId: string, agentActions: AgentAction[]): AgentAssistedValidationResult {
    const violations: Violation[] = [];
    
    // Check if actions are appropriate for agent-assisted level
    const disallowedActions: AgentAction[] = [];
    
    for (const action of agentActions) {
      if (this.config.approvalRequired && action === 'execute_with_guidance') {
        violations.push({
          type: 'action_requires_approval',
          message: `Action "${action}" requires approval in ${this.config.level} mode`,
          severity: 'high'
        });
      }
    }

    const passed = violations.length === 0;
    const suggestions = passed ? [] : ['Consider using a higher autonomy level for this action'];

    return {
      specId,
      passed,
      violations,
      suggestions
    };
  }

  /**
   * Get the current configuration
   */
  getConfig(): AgentAssistedConfig {
    return { ...this.config };
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(partial: Partial<AgentAssistedConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  private generatePrompt(action: AgentAction): string {
    return `Agent-assisted execution for: ${action}
    
    Agent will execute with human guidance.
    Checkpoints: ${this.config.checkpointFrequency}
    
    Please confirm to begin.`;
  }

  private async executeCheckpoint(
    checkpoint: Checkpoint,
    _guidance: string
  ): Promise<ExecutionResult> {
    // Simulate checkpoint execution
    const startTime = Date.now();
    
    // Mark checkpoint as completed
    checkpoint.completed = true;
    checkpoint.results = {
      success: true,
      output: { checkpointId: checkpoint.id },
      duration: Date.now() - startTime
    };

    return checkpoint.results;
  }

  private async handleCheckpointFailure(
    checkpoint: Checkpoint,
    result: ExecutionResult
  ): Promise<void> {
    checkpoint.results = result;
    checkpoint.completed = false;
  }

  private async requestIntermediateConfirmation(checkpoint: Checkpoint): Promise<void> {
    // This would trigger a human confirmation request in a real implementation
    console.log(`Confirmation requested for checkpoint: ${checkpoint.id}`);
  }

  /**
   * Get default configuration
   */
  static defaultConfig(): AgentAssistedConfig {
    return AGENT_ASSISTED_CONFIGS.execute_with_approval;
  }
}
