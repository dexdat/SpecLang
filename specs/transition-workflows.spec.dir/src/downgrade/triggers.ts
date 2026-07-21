// SPECLANG-GENERATED: @speclang/transition-workflows/downgrade
// DO NOT EDIT MANUALLY
// Source: specs/transition-workflows.spec.dir/downgrade.spec.md

import type { DowngradeTrigger, ParsedSpec } from './types';

/**
 * Downgrade Triggers
 *
 * Detects conditions that require a downgrade.
 */
export class DowngradeTriggers {
  /**
   * Check if any downgrade triggers are active.
   *
   * Inspects the spec metadata and test coverage for known failure patterns
   * (failed status, security/vulnerability tags, regression markers) and
   * returns the set of detected triggers, ordered by severity.
   */
  checkTriggers(spec: ParsedSpec): DowngradeTrigger[] {
    const triggers: DowngradeTrigger[] = [];

    const regression = this.detectRegression(spec);
    if (regression) {
      triggers.push(regression);
    }

    const security = this.detectSecurity(spec);
    if (security) {
      triggers.push(security);
    }

    const performance = this.detectPerformance(spec);
    if (performance) {
      triggers.push(performance);
    }

    // Sort by severity (critical first)
    const severityOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    triggers.sort(
      (a, b) =>
        (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99)
    );

    return triggers;
  }

  /**
   * Detect regression.
   *
   * A regression is indicated by:
   *   - spec.metadata.status === "failed"
   *   - known regression markers present in tags (e.g. "regression",
   *     "test-failure", "broken")
   *   - failing entries in spec.testCoverage
   */
  private detectRegression(spec: ParsedSpec): DowngradeTrigger | null {
    const meta = spec.metadata ?? {};

    // Status-based detection
    if (typeof meta.status === 'string' && meta.status.toLowerCase() === 'failed') {
      return {
        type: 'regression',
        severity: 'high',
        description: `Spec status is 'failed' — regression detected after transition`,
        detectedAt: new Date().toISOString(),
        detectedBy: 'automated',
      };
    }

    // Tag-based detection of known regression markers
    const regressionMarkers = ['regression', 'test-failure', 'broken'];
    const tags: string[] = Array.isArray(meta.tags) ? meta.tags : [];
    const hasRegressionTag = tags.some((tag) =>
      regressionMarkers.includes(String(tag).toLowerCase())
    );

    if (hasRegressionTag) {
      return {
        type: 'regression',
        severity: 'high',
        description: `Regression marker present in spec tags: ${regressionMarkers.filter((m) =>
          tags.some((t) => String(t).toLowerCase() === m)
        ).join(', ')}`,
        detectedAt: new Date().toISOString(),
        detectedBy: 'automated',
      };
    }

    // testCoverage-based detection (any failed coverage entry)
    if (spec.testCoverage && typeof spec.testCoverage === 'object') {
      const failing = Object.entries(spec.testCoverage).filter(
        ([, passed]) => passed === false
      );
      if (failing.length > 0) {
        return {
          type: 'regression',
          severity: 'high',
          description: `${failing.length} test coverage check(s) failing: ${failing
            .map(([key]) => key)
            .join(', ')}`,
          detectedAt: new Date().toISOString(),
          detectedBy: 'automated',
        };
      }
    }

    return null;
  }

  /**
   * Detect security vulnerability.
   *
   * Triggered when the spec metadata tags contain "security" or
   * "vulnerability", or when the status is explicitly "vulnerable".
   */
  private detectSecurity(spec: ParsedSpec): DowngradeTrigger | null {
    const meta = spec.metadata ?? {};
    const tags: string[] = Array.isArray(meta.tags) ? meta.tags : [];

    const securityMarkers = ['security', 'vulnerability', 'cve'];
    const hasSecurityTag = tags.some((tag) =>
      securityMarkers.includes(String(tag).toLowerCase())
    );

    if (hasSecurityTag) {
      return {
        type: 'security',
        severity: 'critical',
        description: `Security concern flagged in spec tags: ${tags
          .filter((t) => securityMarkers.includes(String(t).toLowerCase()))
          .join(', ')}`,
        detectedAt: new Date().toISOString(),
        detectedBy: 'automated',
      };
    }

    if (typeof meta.status === 'string' && meta.status.toLowerCase() === 'vulnerable') {
      return {
        type: 'security',
        severity: 'critical',
        description: `Spec status is 'vulnerable' — security vulnerability detected`,
        detectedAt: new Date().toISOString(),
        detectedBy: 'automated',
      };
    }

    return null;
  }

  /**
   * Detect performance degradation.
   *
   * Triggered when the spec metadata status is "degraded" or tags contain
   * performance-related markers (e.g. "performance", "slow", "latency").
   */
  private detectPerformance(spec: ParsedSpec): DowngradeTrigger | null {
    const meta = spec.metadata ?? {};
    const tags: string[] = Array.isArray(meta.tags) ? meta.tags : [];

    const performanceMarkers = ['performance', 'slow', 'latency', 'degraded'];
    const hasPerfTag = tags.some((tag) =>
      performanceMarkers.includes(String(tag).toLowerCase())
    );

    if (hasPerfTag) {
      return {
        type: 'performance',
        severity: 'medium',
        description: `Performance degradation flagged in spec tags: ${tags
          .filter((t) => performanceMarkers.includes(String(t).toLowerCase()))
          .join(', ')}`,
        detectedAt: new Date().toISOString(),
        detectedBy: 'automated',
      };
    }

    if (typeof meta.status === 'string' && meta.status.toLowerCase() === 'degraded') {
      return {
        type: 'performance',
        severity: 'medium',
        description: `Spec status is 'degraded' — performance degradation detected`,
        detectedAt: new Date().toISOString(),
        detectedBy: 'automated',
      };
    }

    return null;
  }
}
