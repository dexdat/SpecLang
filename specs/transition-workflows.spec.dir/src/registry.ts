// SPECLANG-GENERATED - Do not edit directly
// Source: specs/transition.spec.md
// Generated: 2026-03-31T03:55:00Z

/**
 * Transition Workflow Registry
 * 
 * Manages upgrade and downgrade workflows for transitioning specs
 * between maturity levels and agent support levels.
 */

/**
 * Represents a transition workflow
 */
export interface Workflow {
  type: 'upgrade' | 'downgrade';
  fromLevel: string;
  toLevel: string;
  execute(): Promise<void>;
}

/**
 * Upgrade workflow interface
 */
export interface UpgradeWorkflow extends Workflow {
  type: 'upgrade';
  fromLevel: string;
  toLevel: string;
  execute(): Promise<void>;
}

/**
 * Downgrade workflow interface
 */
export interface DowngradeWorkflow extends Workflow {
  type: 'downgrade';
  fromLevel: string;
  toLevel: string;
  execute(): Promise<void>;
}

/**
 * Transition Registry Interface
 * Manages registration and lookup of transition workflows
 */
export interface TransitionRegistry {
  registerUpgrade(workflow: UpgradeWorkflow): void;
  registerDowngrade(workflow: DowngradeWorkflow): void;
  getWorkflow(type: 'upgrade' | 'downgrade', fromLevel: string, toLevel: string): Workflow | null;
  listWorkflows(): Workflow[];
  hasWorkflow(type: 'upgrade' | 'downgrade', fromLevel: string, toLevel: string): boolean;
}

/**
 * Implementation of TransitionRegistry
 */
export class TransitionRegistryImpl implements TransitionRegistry {
  private workflows: Map<string, Workflow> = new Map();

  /**
   * Generate a key for workflow lookup
   */
  private getKey(type: 'upgrade' | 'downgrade', fromLevel: string, toLevel: string): string {
    return `${type}:${fromLevel}:${toLevel}`;
  }

  /**
   * Register an upgrade workflow
   */
  registerUpgrade(workflow: UpgradeWorkflow): void {
    const key = this.getKey('upgrade', workflow.fromLevel, workflow.toLevel);
    this.workflows.set(key, workflow);
  }

  /**
   * Register a downgrade workflow
   */
  registerDowngrade(workflow: DowngradeWorkflow): void {
    const key = this.getKey('downgrade', workflow.fromLevel, workflow.toLevel);
    this.workflows.set(key, workflow);
  }

  /**
   * Get a workflow by type and levels
   */
  getWorkflow(type: 'upgrade' | 'downgrade', fromLevel: string, toLevel: string): Workflow | null {
    const key = this.getKey(type, fromLevel, toLevel);
    return this.workflows.get(key) || null;
  }

  /**
   * Check if a workflow exists
   */
  hasWorkflow(type: 'upgrade' | 'downgrade', fromLevel: string, toLevel: string): boolean {
    const key = this.getKey(type, fromLevel, toLevel);
    return this.workflows.has(key);
  }

  /**
   * List all registered workflows
   */
  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get all workflow keys (useful for debugging)
   */
  listWorkflowKeys(): string[] {
    return Array.from(this.workflows.keys());
  }

  /**
   * Clear all workflows (useful for testing)
   */
  clear(): void {
    this.workflows.clear();
  }
}

/**
 * Default singleton instance for global access
 */
let defaultRegistry: TransitionRegistryImpl | null = null;

export function getDefaultRegistry(): TransitionRegistryImpl {
  if (!defaultRegistry) {
    defaultRegistry = new TransitionRegistryImpl();
  }
  return defaultRegistry;
}
