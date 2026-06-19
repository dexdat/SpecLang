// SPECLANG-GENERATED: @speclang/transition-workflows/upgrade
// DO NOT EDIT MANUALLY
// Source: specs/transition-workflows.spec.dir/upgrade.spec.md

export { UpgradePlanner } from './planner';
export { UpgradeValidator } from './validator';
export { UpgradeExecutor } from './executor';
export { UpgradeRollback } from './rollback';

export type {
  SpecRef,
  UpgradePlan,
  CheckResult,
  TransitionCheck,
  ValidationCheck,
  ValidationResult,
  ExecutionResult,
  MaturityLevel,
  AgentSupport,
} from './types';

import { TransitionRegistryImpl, UpgradeWorkflow } from '../registry';
import { UpgradePlanner } from './planner';
import { UpgradeValidator } from './validator';
import { UpgradeExecutor } from './executor';

export function registerUpgradeWorkflows(registry: TransitionRegistryImpl): void {
  const planner = new UpgradePlanner();
  const validator = new UpgradeValidator();
  const executor = new UpgradeExecutor();

  const transitions = [
    { from: 'POC', to: 'MVP' },
    { from: 'MVP', to: 'Alpha' },
    { from: 'Alpha', to: 'Beta' },
    { from: 'Beta', to: 'Production' },
    { from: 'human_only', to: 'agent_assisted' },
    { from: 'agent_assisted', to: 'agent_autonomous' },
  ];

  for (const { from, to } of transitions) {
    const workflow: UpgradeWorkflow = {
      type: 'upgrade',
      fromLevel: from,
      toLevel: to,
      async execute(): Promise<void> {
        const plan = planner.plan(from, to, []);
        const validation = validator.validate(plan);
        if (!validation.valid) {
          throw new Error('Validation failed: ' + (validation.blockingChecks || []).map(function(c) { return c.name; }).join(', '));
        }
        await executor.execute(plan);
      },
    };
    registry.registerUpgrade(workflow);
  }
}
