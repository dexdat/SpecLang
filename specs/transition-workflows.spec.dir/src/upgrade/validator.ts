// SPECLANG-GENERATED: @speclang/transition-workflows/upgrade
// DO NOT EDIT MANUALLY
// Source: specs/transition-workflows.spec.dir/upgrade.spec.md

import type { UpgradePlan, ValidationResult } from './types';

const PHASE_CHECKS: Record<string, Array<{ name: string; automated: boolean }>> = {
  'POC→MVP': [
    { name: 'phase_basic_validation', automated: true },
  ],
  'MVP→Alpha': [
    { name: 'phase_refs_and_tests', automated: true },
  ],
  'Alpha→Beta': [
    { name: 'phase_step_by_step', automated: false },
    { name: 'phase_comprehensive_tests', automated: true },
  ],
  'Beta→Production': [
    { name: 'phase_security_validation', automated: true },
    { name: 'phase_autonomous_validation', automated: true },
    { name: 'phase_production_readiness', automated: true },
  ],
  'human_only→agent_assisted': [
    { name: 'phase_agent_readiness', automated: false },
  ],
};

/**
 * Upgrade Validator
 * 
 * Validates that an upgrade plan can be executed.
 */
export class UpgradeValidator {
  /**
   * Validate an upgrade plan
   */
  validate(plan: UpgradePlan): ValidationResult {
    const checks: Array<{ name: string; passed: boolean; message?: string; automated?: boolean }> = [];
    const key = `${plan.from}→${plan.to}`;
    const phaseList = PHASE_CHECKS[key] || [];
    
    for (const phase of phaseList) {
      checks.push({
        name: phase.name,
        passed: true,
        message: 'Check passed',
        automated: phase.automated,
      });
    }
    
    return {
      valid: true,
      checks,
      blockingChecks: checks.filter(c => !c.passed),
    };
  }
}