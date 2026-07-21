// SPECLANG-GENERATED: @speclang/transition-workflows/downgrade
// DO NOT EDIT MANUALLY
// Source: specs/transition-workflows.spec.dir/downgrade.spec.md

import type { DowngradePlan, DowngradeResult } from './types';

/**
 * Downgrade Audit
 *
 * Creates a structured audit trail for every downgrade action, as required
 * by the spec: "Audit logging for all downgrade actions".
 */
export class DowngradeAudit {
  /** In-memory store of audit entries (emitted via console + retained for reports). */
  private entries: Array<{
    timestamp: string;
    plan: DowngradePlan;
    result: DowngradeResult;
  }> = [];

  /**
   * Create an audit trail entry for a downgrade.
   *
   * Records the full plan context (spec id, current→target, type, triggers,
   * emergency) and the execution outcome (canTransition, executedAt,
   * executedBy) as a structured record.
   */
  async audit(plan: DowngradePlan, result: DowngradeResult): Promise<void> {
    const entry = {
      timestamp: new Date().toISOString(),
      plan,
      result,
    };

    this.entries.push(entry);

    const auditRecord = {
      event: 'downgrade_audit',
      timestamp: entry.timestamp,
      plan: {
        specId: plan.specId,
        current: plan.current,
        target: plan.target,
        type: plan.type,
        triggers: plan.triggers,
        emergency: plan.emergency,
        requiredApprovals: plan.requiredApprovals ?? [],
      },
      result: {
        canTransition: result.canTransition,
        executedAt: result.executedAt,
        executedBy: result.executedBy,
        rollbackRequired: result.rollbackRequired ?? false,
        reason: result.reason,
      },
    };

    console.log(JSON.stringify(auditRecord));
  }

  /**
   * Generate a human-readable audit report covering all recorded entries.
   */
  private generateReport(plan: DowngradePlan, result: DowngradeResult): string {
    const lines: string[] = [];
    const timestamp = new Date().toISOString();

    lines.push('=== Downgrade Audit Report ===');
    lines.push(`Generated: ${timestamp}`);
    lines.push('');
    lines.push('Plan:');
    lines.push(`  Spec ID: ${plan.specId}`);
    lines.push(
      `  Transition: ${JSON.stringify(plan.current)} → ${JSON.stringify(plan.target)}`
    );
    lines.push(`  Type: ${plan.type}`);
    lines.push(`  Emergency: ${plan.emergency}`);
    lines.push(`  Required Approvals: ${(plan.requiredApprovals ?? []).join(', ') || 'none'}`);
    lines.push(`  Triggers (${plan.triggers.length}):`);
    for (const trigger of plan.triggers) {
      lines.push(
        `    - [${trigger.severity}] ${trigger.type}: ${trigger.description}`
      );
    }
    lines.push('');
    lines.push('Result:');
    lines.push(`  Can Transition: ${result.canTransition}`);
    if (result.reason) {
      lines.push(`  Reason: ${result.reason}`);
    }
    lines.push(`  Executed At: ${result.executedAt ?? 'n/a'}`);
    lines.push(`  Executed By: ${result.executedBy ?? 'n/a'}`);
    lines.push(`  Rollback Required: ${result.rollbackRequired ?? false}`);
    if (result.results && result.results.length > 0) {
      lines.push(`  Check Results (${result.results.length}):`);
      for (const check of result.results) {
        const status = check.passed ? 'PASS' : 'FAIL';
        lines.push(
          `    - [${status}] ${check.category}: ${check.description}`
        );
      }
    }
    lines.push('');
    lines.push(`Total Audit Entries: ${this.entries.length}`);

    return lines.join('\n');
  }
}
