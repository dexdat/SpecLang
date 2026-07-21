// SPECLANG-GENERATED: @speclang/transition-workflows/downgrade
// DO NOT EDIT MANUALLY
// Source: specs/transition-workflows.spec.dir/downgrade.spec.md

import type { DowngradePlan, DowngradeResult } from './types';

/**
 * Downgrade Notification
 *
 * Notifies stakeholders about a downgrade. The stakeholder list is computed
 * by {@link DowngradeNotification.getStakeholders} per the spec rules:
 *   - emergency → on-call engineer + technical lead
 *   - project_level / combined → product owner + QA lead
 */
export class DowngradeNotification {
  /**
   * Notify stakeholders about a downgrade.
   *
   * Emits a structured notification record containing the spec id, downgrade
   * type, severity (derived from triggers), timestamp, the stakeholder list,
   * and the action required. Severity reflects the highest-severity trigger.
   */
  async notify(plan: DowngradePlan, result: DowngradeResult): Promise<void> {
    const stakeholders = this.getStakeholders(plan);
    const severity = this.getSeverity(plan);
    const actionRequired = this.getActionRequired(plan, result);

    const notification = {
      event: 'downgrade',
      specId: plan.specId,
      downgradeType: plan.type,
      severity,
      emergency: plan.emergency,
      current: plan.current,
      target: plan.target,
      timestamp: new Date().toISOString(),
      stakeholders,
      actionRequired,
      canTransition: result.canTransition,
      executedAt: result.executedAt,
      executedBy: result.executedBy,
    };

    // Structured log — consumed by monitoring/alerting pipelines.
    console.log(JSON.stringify(notification));
  }

  /**
   * Get list of stakeholders to notify.
   *
   * Per spec:
   *   - emergency → on_call_engineer, technical_lead
   *   - project_level or combined → product_owner, qa_lead
   */
  private getStakeholders(plan: DowngradePlan): string[] {
    const stakeholders: string[] = [];

    if (plan.emergency) {
      stakeholders.push('on_call_engineer');
      stakeholders.push('technical_lead');
    }

    if (plan.type === 'project_level' || plan.type === 'combined') {
      stakeholders.push('product_owner');
      stakeholders.push('qa_lead');
    }

    // De-duplicate while preserving order.
    return Array.from(new Set(stakeholders));
  }

  /**
   * Derive notification severity from the plan's triggers (highest wins).
   */
  private getSeverity(plan: DowngradePlan): string {
    const order: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    if (!plan.triggers || plan.triggers.length === 0) {
      return plan.emergency ? 'critical' : 'low';
    }
    const sorted = [...plan.triggers].sort(
      (a, b) =>
        (order[a.severity] ?? 99) - (order[b.severity] ?? 99)
    );
    return sorted[0].severity;
  }

  /**
   * Determine the action required from stakeholders.
   */
  private getActionRequired(plan: DowngradePlan, result: DowngradeResult): string {
    if (!result.canTransition) {
      return 'review downgrade blockers and remediate before retrying';
    }
    if (plan.emergency) {
      return 'acknowledge emergency downgrade and schedule post-mortem';
    }
    return 'review downgrade outcome and confirm spec integrity';
  }
}
