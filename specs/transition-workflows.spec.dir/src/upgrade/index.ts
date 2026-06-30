// SPECLANG-GENERATED: @speclang/transition-workflows/upgrade
// DO NOT EDIT MANUALLY
// Source: specs/transition-workflows.spec.dir/upgrade.spec.md

export { UpgradePlanner } from './planner';
export { UpgradeValidator } from './validator';
export { UpgradeExecutor } from './executor';
export { UpgradeRollback } from './rollback';
export { UpgradeChecklistProvider } from './checklist';

export type {
  UpgradePlan,
  UpgradeCheck,
  UpgradeResult,
  UpgradeOptions,
  SpecRef,
  ValidationResult,
  ExecutionResult,
} from './types';

import type { TransitionRegistryImpl } from '../registry';

/**
 * Register all predefined upgrade workflows into a registry
 */
export function registerUpgradeWorkflows(registry: TransitionRegistryImpl): void {
  const paths = [
    { from: 'POC', to: 'MVP', type: 'project_level' },
    { from: 'MVP', to: 'Alpha', type: 'project_level' },
    { from: 'Alpha', to: 'Beta', type: 'project_level' },
    { from: 'Beta', to: 'Production', type: 'project_level' },
    { from: 'human_only', to: 'agent_assisted', type: 'agent_support' },
    { from: 'agent_assisted', to: 'agent_autonomous', type: 'agent_support' },
  ];

  for (const path of paths) {
    registry.registerUpgrade({
      type: 'upgrade',
      fromLevel: path.from,
      toLevel: path.to,
      async execute() {
        // No-op for registration
      },
    });
  }
}