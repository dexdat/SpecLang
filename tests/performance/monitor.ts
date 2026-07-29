/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/testing/performance.spec.md
 * Generated: 2026-03-31T19:00:00Z
 *
 * Performance monitoring for SpecLang.
 */

import * as fs from "fs";
import * as path from "path";

export interface PerfMetric {
  timestamp: number;
  name: string;
  value: number;
  unit: string;
}

export interface AlertConfig {
  warningThreshold: number;
  criticalThreshold: number;
  comparison: "greater" | "less";
}

export interface BenchmarkBaseline {
  name: string;
  mean_ms: number;
  p90_ms: number;
  p95_ms: number;
  p99_ms: number;
  recorded_at: string;
}

class PerformanceMonitor {
  private metrics: PerfMetric[] = [];
  private baselines: Map<string, BenchmarkBaseline> = new Map();
  private alerts: Map<string, AlertConfig> = new Map();
  private logPath: string = "tests/perf.log";

  constructor(logPath?: string) {
    if (logPath) {
      this.logPath = logPath;
    }
    this.loadBaselines();
  }

  /**
   * Record a performance metric
   */
  record(name: string, value: number, unit: string = "ms"): void {
    const metric: PerfMetric = {
      timestamp: Date.now(),
      name,
      value,
      unit,
    };
    this.metrics.push(metric);
    this.log(metric);
  }

  /**
   * Check if performance has degraded beyond threshold
   */
  checkRegression(
    name: string,
    currentValue: number,
    thresholdPercent: number = 20,
  ): boolean {
    const baseline = this.baselines.get(name);
    if (!baseline) return false;

    const allowedIncrease = baseline.mean_ms * (1 + thresholdPercent / 100);
    return currentValue > allowedIncrease;
  }

  /**
   * Get alert status for a metric
   */
  getAlertStatus(name: string, value: number): "ok" | "warning" | "critical" {
    const config = this.alerts.get(name);
    if (!config) return "ok";

    if (config.comparison === "greater") {
      if (value >= config.criticalThreshold) return "critical";
      if (value >= config.warningThreshold) return "warning";
    } else {
      if (value <= config.criticalThreshold) return "critical";
      if (value <= config.warningThreshold) return "warning";
    }

    return "ok";
  }

  /**
   * Register an alert configuration
   */
  registerAlert(name: string, config: AlertConfig): void {
    this.alerts.set(name, config);
  }

  /**
   * Save current measurements as baseline
   */
  saveBaseline(
    name: string,
    stats: {
      mean_ms: number;
      p90_ms: number;
      p95_ms: number;
      p99_ms: number;
    },
  ): void {
    const baseline: BenchmarkBaseline = {
      ...stats,
      name,
      recorded_at: new Date().toISOString(),
    };
    this.baselines.set(name, baseline);
    this.persistBaselines();
  }

  /**
   * Load baselines from disk
   */
  private loadBaselines(): void {
    const baselinesDir = path.join(
      process.cwd(),
      "tests/performance/baselines",
    );
    const baselinesFile = path.join(baselinesDir, "baselines.json");

    try {
      if (fs.existsSync(baselinesFile)) {
        const data = fs.readFileSync(baselinesFile, "utf-8");
        const baselines: BenchmarkBaseline[] = JSON.parse(data);
        baselines.forEach((b) => this.baselines.set(b.name, b));
      }
    } catch (e) {
      // Ignore errors loading baselines
    }
  }

  /**
   * Persist baselines to disk
   */
  private persistBaselines(): void {
    const baselinesDir = path.join(
      process.cwd(),
      "tests/performance/baselines",
    );
    const baselinesFile = path.join(baselinesDir, "baselines.json");

    try {
      fs.mkdirSync(baselinesDir, { recursive: true });
      const baselines = Array.from(this.baselines.values());
      fs.writeFileSync(baselinesFile, JSON.stringify(baselines, null, 2));
    } catch (e) {
      console.error("Failed to persist baselines:", e);
    }
  }

  /**
   * Log metric to file
   */
  private log(metric: PerfMetric): void {
    const logLine = `[${new Date(metric.timestamp).toISOString()}] ${metric.name}: ${metric.value}${metric.unit}\n`;

    try {
      fs.appendFileSync(this.logPath, logLine);
    } catch (e) {
      // Ignore logging errors
    }
  }

  /**
   * Get all metrics for a name
   */
  getMetrics(name: string): PerfMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Generate report
   */
  generateReport(): string {
    const lines: string[] = ["=== Performance Report ===", ""];

    // Group metrics by name
    const byName = new Map<string, PerfMetric[]>();
    this.metrics.forEach((m) => {
      const existing = byName.get(m.name) || [];
      existing.push(m);
      byName.set(m.name, existing);
    });

    // Generate summary for each metric
    byName.forEach((metrics, name) => {
      const values = metrics.map((m) => m.value);
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      lines.push(`${name}:`);
      lines.push(`  count: ${values.length}`);
      lines.push(`  mean: ${mean.toFixed(2)}ms`);
      lines.push(`  min: ${min.toFixed(2)}ms`);
      lines.push(`  max: ${max.toFixed(2)}ms`);
      lines.push("");
    });

    // Check baselines
    lines.push("=== Baseline Comparison ===");
    this.baselines.forEach((baseline, name) => {
      const current = this.getMetrics(name);
      if (current.length > 0) {
        const values = current.map((m) => m.value);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const diff = (
          ((mean - baseline.mean_ms) / baseline.mean_ms) *
          100
        ).toFixed(1);

        lines.push(`${name}:`);
        lines.push(`  baseline: ${baseline.mean_ms.toFixed(2)}ms`);
        lines.push(`  current: ${mean.toFixed(2)}ms`);
        lines.push(`  change: ${diff}%`);
        lines.push("");
      }
    });

    return lines.join("\n");
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

// Default alert configurations
perfMonitor.registerAlert("cascade", {
  warningThreshold: 5000,
  criticalThreshold: 10000,
  comparison: "greater",
});

perfMonitor.registerAlert("daemon:event_latency", {
  warningThreshold: 20,
  criticalThreshold: 50,
  comparison: "greater",
});

perfMonitor.registerAlert("mcp:request_latency", {
  warningThreshold: 10,
  criticalThreshold: 25,
  comparison: "greater",
});
