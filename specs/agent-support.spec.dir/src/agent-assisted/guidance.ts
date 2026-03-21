/**
 * SPECLANG-GENERATED: Human guidance integration for agent-assisted mode
 * Source: @specs/agent-support-levels/levels#agent-assisted
 */

import {
  AgentAssistedLevel,
  HumanGuidance,
  GuidanceType,
  Suggestion,
  Checkpoint,
  CheckpointGuidance
} from './types';

/**
 * Action interface for guidance engine
 */
interface Action {
  id: string;
  type: string;
  resource: string;
  description: string;
  breaking?: boolean;
}

/**
 * Checkpoint guidance result
 */
interface CheckpointGuidanceResult {
  checkpointId: string;
  guidance: HumanGuidance | null;
  suggestions: Suggestion[];
  warnings: string[];
}

/**
 * Guidance engine for agent-assisted mode
 */
export class GuidanceEngine {
  private level: AgentAssistedLevel;
  private guidanceHistory: Map<string, HumanGuidance[]>;

  constructor(level: AgentAssistedLevel) {
    this.level = level;
    this.guidanceHistory = new Map();
  }

  /**
   * Get suggestions for an action
   */
  async getSuggestions(action: Action): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // Generate context-aware suggestions based on action type
    switch (action.type) {
      case 'feature':
      case 'generate_draft_code':
        suggestions.push(...this.suggestFeatureImplementation(action));
        break;
      case 'refactor':
      case 'propose_edits':
        suggestions.push(...this.suggestRefactoring(action));
        break;
      case 'fix':
      case 'run_tests':
        suggestions.push(...this.suggestFixes(action));
        break;
      case 'read_spec':
      case 'suggest_improvements':
        suggestions.push(...this.suggestReview(action));
        break;
    }

    // Apply learned guidance from history
    const historicalGuidance = this.getHistoricalGuidance(action.resource);
    for (const guidance of historicalGuidance) {
      suggestions.push({
        id: `learned-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'learned_preference',
        content: guidance.content,
        source: guidance.providedBy,
        confidence: 0.8,
        priority: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Get checkpoint guidance
   */
  async getCheckpointGuidance(
    checkpoint: Checkpoint,
    humanGuidance: HumanGuidance
  ): Promise<CheckpointGuidanceResult> {
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

  /**
   * Process human guidance
   */
  async processHumanGuidance(guidance: HumanGuidance): Promise<void> {
    // Store guidance for future learning
    for (const resource of guidance.appliesTo) {
      const resourceGuidance = this.guidanceHistory.get(resource) || [];
      resourceGuidance.push(guidance);
      this.guidanceHistory.set(resource, resourceGuidance);
    }

    // Apply immediate guidance if applicable
    if (guidance.type === 'correction') {
      await this.applyCorrection(guidance);
    }
  }

  /**
   * Get guidance history for a resource
   */
  getHistory(resource: string): HumanGuidance[] {
    return this.guidanceHistory.get(resource) || [];
  }

  /**
   * Clear guidance history
   */
  clearHistory(): void {
    this.guidanceHistory.clear();
  }

  private getHistoricalGuidance(resource: string): HumanGuidance[] {
    return this.guidanceHistory.get(resource) || [];
  }

  private suggestFeatureImplementation(action: Action): Suggestion[] {
    return [
      {
        id: `feat-${Date.now()}-1`,
        type: 'implementation_approach',
        content: `Consider breaking this feature into smaller, incremental steps`,
        confidence: 0.9,
        priority: 'high'
      },
      {
        id: `feat-${Date.now()}-2`,
        type: 'test_strategy',
        content: `Write tests before implementing to define the expected behavior`,
        confidence: 0.8,
        priority: 'medium'
      }
    ];
  }

  private suggestRefactoring(action: Action): Suggestion[] {
    return [
      {
        id: `ref-${Date.now()}-1`,
        type: 'code_pattern',
        content: `Ensure refactoring maintains backward compatibility`,
        confidence: 0.85,
        priority: 'high'
      },
      {
        id: `ref-${Date.now()}-2`,
        type: 'test_strategy',
        content: `Run existing tests to verify refactoring doesn't break functionality`,
        confidence: 0.9,
        priority: 'high'
      }
    ];
  }

  private suggestFixes(action: Action): Suggestion[] {
    return [
      {
        id: `fix-${Date.now()}-1`,
        type: 'implementation_approach',
        content: `First reproduce the issue, then fix it`,
        confidence: 0.95,
        priority: 'high'
      },
      {
        id: `fix-${Date.now()}-2`,
        type: 'test_strategy',
        content: `Add a test case that catches this bug for future regression`,
        confidence: 0.85,
        priority: 'medium'
      }
    ];
  }

  private suggestReview(action: Action): Suggestion[] {
    return [
      {
        id: `rev-${Date.now()}-1`,
        type: 'implementation_approach',
        content: `Review the spec for completeness before proceeding`,
        confidence: 0.8,
        priority: 'medium'
      }
    ];
  }

  private async getSuggestionsForCheckpoint(checkpoint: Checkpoint): Promise<Suggestion[]> {
    return [
      {
        id: `cp-${checkpoint.id}-1`,
        type: 'implementation_approach',
        content: `Execute checkpoint: ${checkpoint.name}`,
        confidence: 1.0,
        priority: checkpoint.requiresHumanCheck ? 'high' : 'medium'
      }
    ];
  }

  private getWarningsForCheckpoint(checkpoint: Checkpoint): string[] {
    const warnings: string[] = [];
    
    if (checkpoint.requiresHumanCheck) {
      warnings.push('This checkpoint requires human verification');
    }
    
    return warnings;
  }

  private async applyCorrection(guidance: HumanGuidance): Promise<void> {
    // Apply correction logic - in real implementation would modify state
    console.log(`Applying correction from ${guidance.providedBy}: ${guidance.content}`);
  }
}
