// SPECLANG-GENERATED: Phase 0.20 - Cascade Depth and Cycle Detection
// DO NOT EDIT MANUALLY
// Source: specs/cascade.spec.dir/convergence.spec.md

import { ConvergenceStatus } from './types.js';
import { DepthState } from './types.js';

export type TerminationType = 'normal' | 'forced';

export interface TerminationConditions {
  normal: TerminationCondition[];
  forced: TerminationCondition[];
  onTerminate: TerminationAction[];
}

export interface TerminationCondition {
  name: string;
  check: () => boolean;
}

export interface TerminationAction {
  name: string;
  execute: () => Promise<void> | void;
}

export interface TerminationResult {
  shouldTerminate: boolean;
  type: TerminationType;
  reason: string;
  conditions: string[];
}

export class CascadeTerminator {
  private conditions: TerminationConditions;
  private pendingActions: Set<string>;

  constructor() {
    this.pendingActions = new Set();
    this.conditions = {
      normal: [],
      forced: [],
      onTerminate: []
    };
  }

  addNormalCondition(name: string, check: () => boolean): void {
    this.conditions.normal.push({ name, check });
  }

  addForcedCondition(name: string, check: () => boolean): void {
    this.conditions.forced.push({ name, check });
  }

  addTerminateAction(name: string, action: () => Promise<void> | void): void {
    this.conditions.onTerminate.push({ name, execute: action });
  }

  checkTermination(
    convergenceStatus: ConvergenceStatus,
    depthState: DepthState | null,
    agentsIdle: boolean = true,
    pendingEvents: number = 0
  ): TerminationResult {
    const triggeredConditions: string[] = [];

    // Check forced conditions first (they take precedence)
    for (const condition of this.conditions.forced) {
      if (condition.check()) {
        return {
          shouldTerminate: true,
          type: 'forced',
          reason: condition.name,
          conditions: [condition.name]
        };
      }
    }

    // Check normal conditions
    for (const condition of this.conditions.normal) {
      if (condition.check()) {
        triggeredConditions.push(condition.name);
      }
    }

    // Determine termination based on standard conditions
    const isQuiet = convergenceStatus?.converged ?? false;
    const isDepthStable = depthState ? this.isDepthStable(depthState) : true;
    const isIdle = agentsIdle;
    const hasNoPending = pendingEvents === 0;

    if (isQuiet && isIdle && isDepthStable && hasNoPending) {
      return {
        shouldTerminate: true,
        type: 'normal',
        reason: 'all_conditions_met',
        conditions: triggeredConditions.length > 0 ? triggeredConditions : ['quiet_period', 'all_agents_idle', 'depth_stable', 'no_pending_events']
      };
    }

    return {
      shouldTerminate: false,
      type: 'normal',
      reason: 'conditions_not_met',
      conditions: triggeredConditions
    };
  }

  private isDepthStable(state: DepthState): boolean {
    if (!state.depth_history || state.depth_history.length < 2) {
      return true;
    }

    const recent = state.depth_history.slice(-5);
    const depths = recent.map(e => e.depth);
    const max = Math.max(...depths);
    const min = Math.min(...depths);

    return max - min <= 1;
  }

  async executeTermination(): Promise<void> {
    const executed: string[] = [];

    for (const action of this.conditions.onTerminate) {
      try {
        await action.execute();
        executed.push(action.name);
        this.pendingActions.add(action.name);
      } catch (error) {
        console.error(`[termination] Action ${action.name} failed: ${error}`);
      }
    }

    console.log(`[termination] Executed ${executed.length} termination actions`);
  }

  getPendingActions(): string[] {
    return Array.from(this.pendingActions);
  }

  hasPendingAction(name: string): boolean {
    return this.pendingActions.has(name);
  }

  clearPendingActions(): void {
    this.pendingActions.clear();
  }

  static createDefault(): CascadeTerminator {
    const terminator = new CascadeTerminator();

    terminator.addNormalCondition('quiet_period', () => {
      return false;
    });

    terminator.addNormalCondition('all_agents_idle', () => {
      return true;
    });

    terminator.addNormalCondition('depth_stable', () => {
      return true;
    });

    terminator.addNormalCondition('no_pending_events', () => {
      return true;
    });

    terminator.addTerminateAction('wait_for_in_flight', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    terminator.addTerminateAction('log_cascade_summary', () => {
      console.log('[termination] Cascade summary logged');
    });

    return terminator;
  }
}
