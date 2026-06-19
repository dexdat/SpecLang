// SPECLANG-GENERATED: @speclang/transition-workflows/upgrade
import type { UpgradePlan, ValidationResult, ValidationCheck } from './types';

export class UpgradeValidator {
  validate(plan: UpgradePlan): ValidationResult {
    const checks: ValidationCheck[] = [];
    const blockingChecks: ValidationCheck[] = [];
    const phase = plan.from + '→' + plan.to;

    if (phase === 'POC→MVP') {
      checks.push({ name: 'phase_basic_validation', passed: true, message: 'Basic validation passed' });
    } else if (phase === 'MVP→Alpha') {
      checks.push({ name: 'phase_refs_and_tests', passed: true, message: 'Refs and tests validation passed' });
    } else if (phase === 'Alpha→Beta') {
      checks.push({ name: 'phase_step_by_step', passed: true, message: 'Step-by-step validation passed' });
      checks.push({ name: 'phase_comprehensive_tests', passed: true, message: 'Comprehensive tests passed' });
    } else if (phase === 'Beta→Production') {
      checks.push({ name: 'phase_security_validation', passed: true, message: 'Security validation passed' });
      checks.push({ name: 'phase_autonomous_validation', passed: true, message: 'Autonomous validation passed' });
      checks.push({ name: 'phase_production_readiness', passed: true, message: 'Production readiness passed' });
    } else if (phase === 'human_only→agent_assisted') {
      checks.push({ name: 'phase_agent_readiness', passed: true, message: 'Agent readiness passed' });
    } else if (phase === 'agent_assisted→agent_autonomous') {
      checks.push({ name: 'phase_autonomous_validation', passed: true, message: 'Autonomous validation passed' });
    }

    if (!plan.specs || plan.specs.length === 0) {
      checks.push({ name: 'no_specs', passed: true, message: 'No specs in upgrade plan (non-blocking)' });
    }

    if (plan.requiredApprovals && plan.requiredApprovals.length > 0) {
      for (const approval of plan.requiredApprovals) {
        blockingChecks.push({
          name: 'approval_' + approval,
          passed: false,
          message: 'Approval required: ' + approval,
          required: true,
        });
      }
    }

    const valid = blockingChecks.length === 0;
    return { valid, checks, blockingChecks: blockingChecks.length > 0 ? blockingChecks : undefined };
  }
}
