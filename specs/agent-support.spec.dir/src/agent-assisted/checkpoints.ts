/**
 * SPECLANG-GENERATED: Checkpoint-based execution for agent-assisted mode
 * Source: @specs/agent-support-levels/levels#agent-assisted
 */

import { Checkpoint, CheckpointResult } from './types';

/**
 * Action interface for checkpoint manager
 */
interface Action {
  id: string;
  type: string;
  resource: string;
  description: string;
  breaking?: boolean;
}

/**
 * Checkpoint manager for agent-assisted execution
 */
export class CheckpointManager {
  private frequency: number;
  private checkpoints: Map<string, Checkpoint[]>;

  constructor(frequency: number) {
    this.frequency = frequency;
    this.checkpoints = new Map();
  }

  /**
   * Get checkpoints for an action
   */
  getCheckpoints(action: Action): Checkpoint[] {
    const stored = this.checkpoints.get(action.id);
    if (stored) return stored;

    return this.createCheckpoints(action);
  }

  /**
   * Create checkpoints for an action
   */
  createCheckpoints(action: Action): Checkpoint[] {
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

  /**
   * Verify checkpoint success
   */
  async verifyCheckpoint(checkpointId: string): Promise<boolean> {
    const allCheckpoints = Array.from(this.checkpoints.values()).flat();
    const checkpoint = allCheckpoints.find(c => c.id === checkpointId);
    
    if (!checkpoint) return false;

    // Verify checkpoint results
    return checkpoint.results?.success ?? false;
  }

  /**
   * Get checkpoint by ID
   */
  getCheckpoint(checkpointId: string): Checkpoint | undefined {
    const allCheckpoints = Array.from(this.checkpoints.values()).flat();
    return allCheckpoints.find(c => c.id === checkpointId);
  }

  /**
   * Mark checkpoint as completed
   */
  completeCheckpoint(checkpointId: string, result: CheckpointResult): void {
    const checkpoint = this.getCheckpoint(checkpointId);
    if (checkpoint) {
      checkpoint.completed = true;
      checkpoint.results = result;
    }
  }

  /**
   * Reset checkpoints for an action
   */
  resetCheckpoints(actionId: string): void {
    this.checkpoints.delete(actionId);
  }

  /**
   * Get all active checkpoints
   */
  getActiveCheckpoints(): Checkpoint[] {
    const allCheckpoints = Array.from(this.checkpoints.values()).flat();
    return allCheckpoints.filter(c => !c.completed);
  }

  /**
   * Clear all checkpoints
   */
  clear(): void {
    this.checkpoints.clear();
  }

  /**
   * Update checkpoint frequency
   */
  setFrequency(frequency: number): void {
    this.frequency = frequency;
  }

  private estimateSteps(action: Action): number {
    // Estimate based on action complexity
    const baseSteps = 5;
    const complexityMultiplier = action.breaking ? 2 : 1;
    return baseSteps * complexityMultiplier;
  }
}
