/**
 * SPECLANG-GENERATED: Validation error reporter
 * Source: @speclang/validation
 */

import type { ValidationReport, ValidationReportBatch, ValidationResult } from './types';

/**
 * Options for {@link ValidationReporter.formatWarningSummary}.
 */
export interface WarningSummaryOptions {
  /** How many distinct warning messages to list (default 5; 0 = none). */
  topMessages?: number;
  /** Maximum characters per message line before truncation (default 80). */
  maxMessageWidth?: number;
  /** Line prefix for the block (default two spaces). */
  indent?: string;
}

/** A distinct warning message and how many times it occurred. */
interface MessageCount {
  rule: string;
  message: string;
  count: number;
}

/**
 * Validation Reporter
 * 
 * Formats validation results for display.
 */
export class ValidationReporter {
  private verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  /**
   * Format a single validation report
   */
  format(report: ValidationReport): string {
    const lines: string[] = [];

    // File header
    lines.push(`\n${report.file}`);
    lines.push('─'.repeat(Math.min(40, report.file.length + 2)));

    if (report.passed) {
      // Passed with no issues
      lines.push('✓ Passed');
      
      if (report.warnings.length > 0) {
        lines.push(`  ${report.warnings.length} warning(s)`);
        
        if (this.verbose) {
          for (const warning of report.warnings) {
            lines.push(this.formatResult(warning));
          }
        }
      }
    } else {
      // Failed - show errors
      lines.push(`✗ Failed`);
      
      if (report.errors.length > 0) {
        lines.push(`  ${report.errors.length} error(s):`);
        for (const error of report.errors) {
          lines.push(this.formatResult(error));
        }
      }

      if (report.warnings.length > 0 && this.verbose) {
        lines.push(`\n  ${report.warnings.length} warning(s):`);
        for (const warning of report.warnings) {
          lines.push(this.formatResult(warning));
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Format a compact, grouped breakdown of the warnings across many reports.
   *
   * DF-SPECLANG-5-R4: `speclang validate` on a real spec tree produced 535
   * warnings over 452 files. Printing a block per file (and every warning)
   * buries the actionable signal — a warning says nothing about whether the
   * project is valid, and no new user reads 535 lines. The default text
   * output therefore shows the COUNT plus a compact breakdown (by rule, then
   * by the most frequent messages) and leaves the per-warning detail to
   * `--verbose` (or `--format json`).
   *
   * Returns an empty string when there is nothing to summarize, so callers can
   * append it unconditionally.
   */
  formatWarningSummary(
    reports: ValidationReport[],
    options: WarningSummaryOptions = {}
  ): string {
    const { topMessages = 5, maxMessageWidth = 80, indent = '  ' } = options;

    const warnings = reports.flatMap(r => r.warnings);
    if (warnings.length === 0) {
      return '';
    }

    const filesWithWarnings = reports.filter(r => r.warnings.length > 0).length;

    const byRule = new Map<string, number>();
    const byMessage = new Map<string, MessageCount>();
    for (const warning of warnings) {
      byRule.set(warning.rule, (byRule.get(warning.rule) ?? 0) + 1);
      const key = `${warning.rule}\u0000${warning.message}`;
      const entry = byMessage.get(key);
      if (entry) {
        entry.count++;
      } else {
        byMessage.set(key, { rule: warning.rule, message: warning.message, count: 1 });
      }
    }

    const ruleRows = [...byRule.entries()].sort((a, b) => b[1] - a[1]);
    const ruleWidth = Math.max(...ruleRows.map(([rule]) => rule.length));
    const countWidth = String(warnings.length).length;

    const lines: string[] = [];
    lines.push(`${indent}Warnings by rule (${filesWithWarnings} of ${reports.length} files):`);
    for (const [rule, count] of ruleRows) {
      lines.push(`${indent}  ${rule.padEnd(ruleWidth)}  ${String(count).padStart(countWidth)}`);
    }

    const messageRows = [...byMessage.values()].sort(
      (a, b) => b.count - a.count || a.message.localeCompare(b.message)
    );
    if (topMessages > 0 && messageRows.length > 0) {
      lines.push(`${indent}Most frequent warnings:`);
      for (const row of messageRows.slice(0, topMessages)) {
        const message = this.truncate(row.message, maxMessageWidth);
        lines.push(
          `${indent}  ${String(row.count).padStart(countWidth)}  ${row.rule.padEnd(ruleWidth)}  ${message}`
        );
      }
      const hidden = messageRows.length - topMessages;
      if (hidden > 0) {
        lines.push(`${indent}  … ${hidden} more distinct warning(s)`);
      }
    }

    if (!this.verbose) {
      lines.push(
        `${indent}Run the same command with --verbose to list every warning, ` +
        `or --format json for machine-readable output.`
      );
    }

    return lines.join('\n');
  }

  /**
   * Truncate a message to `max` characters with an ellipsis.
   */
  private truncate(message: string, max: number): string {
    if (message.length <= max) {
      return message;
    }
    return `${message.slice(0, Math.max(0, max - 1))}…`;
  }

  /**
   * Format a single validation result
   */
  private formatResult(result: ValidationResult): string {
    const prefix = result.level === 'error' ? '✗' : '⚠';
    const location = typeof result.location.line === 'number' 
      ? `${result.location.line}` 
      : result.location.line;
    
    let line = `  ${prefix} [${result.rule}] ${location}: ${result.message}`;
    
    if (result.suggestion && this.verbose) {
      line += `\n     💡 ${result.suggestion}`;
    }
    
    return line;
  }

  /**
   * Format a batch validation report
   */
  formatBatch(batch: ValidationReportBatch): string {
    const lines: string[] = [];

    // Summary header
    lines.push('╔════════════════════════════════════════╗');
    lines.push('║        Validation Summary              ║');
    lines.push('╚════════════════════════════════════════╝');

    // Summary stats
    const { summary } = batch;
    lines.push('');
    lines.push(`  Total Specs:     ${summary.total}`);
    lines.push(`  ✓ Passed:       ${summary.passed}`);
    lines.push(`  ✗ Failed:       ${summary.failed}`);
    lines.push(`  Errors:         ${summary.errors}`);
    lines.push(`  Warnings:       ${summary.warnings}`);
    lines.push('');

    // Individual reports
    for (const report of batch.reports) {
      lines.push(this.format(report));
    }

    // Final summary
    lines.push('\n────────────────────────────────────────');
    if (summary.failed === 0) {
      lines.push('✓ All specs valid');
    } else {
      lines.push(`✗ ${summary.failed} spec(s) failed validation`);
    }

    return lines.join('\n');
  }

  /**
   * Format as JSON
   */
  formatJSON(report: ValidationReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Format batch as JSON
   */
  formatBatchJSON(batch: ValidationReportBatch): string {
    return JSON.stringify(batch, null, 2);
  }

  /**
   * Format summary only
   */
  formatSummary(reports: ValidationReport[]): string {
    const passed = reports.filter(r => r.passed).length;
    const failed = reports.length - passed;
    const totalErrors = reports.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = reports.reduce((sum, r) => sum + r.warnings.length, 0);

    return `
Validation Summary
────────────────────
Passed:   ${passed}
Failed:   ${failed}
Errors:   ${totalErrors}
Warnings: ${totalWarnings}
`;
  }

  /**
   * Format for machine-readable output (minimal)
   */
  formatMinimal(reports: ValidationReport[]): string {
    return reports.map(r => {
      const status = r.passed ? 'PASS' : 'FAIL';
      const errorCount = r.errors.length;
      return `${status} ${r.file} (${errorCount} errors)`;
    }).join('\n');
  }

  /**
   * Set verbose mode
   */
  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick format function
 */
export function format(report: ValidationReport, verbose = false): string {
  const reporter = new ValidationReporter(verbose);
  return reporter.format(report);
}

/**
 * Quick format batch function
 */
export function formatBatch(batch: ValidationReportBatch, verbose = false): string {
  const reporter = new ValidationReporter(verbose);
  return reporter.formatBatch(batch);
}

/**
 * Quick format JSON
 */
export function formatJSON(report: ValidationReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Quick summary
 */
export function formatSummary(reports: ValidationReport[]): string {
  const reporter = new ValidationReporter();
  return reporter.formatSummary(reports);
}
