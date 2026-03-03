"use strict";
/**
 * SPECLANG-GENERATED: Validation error reporter
 * Source: @speclang/validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationReporter = void 0;
exports.format = format;
exports.formatBatch = formatBatch;
exports.formatJSON = formatJSON;
exports.formatSummary = formatSummary;
/**
 * Validation Reporter
 *
 * Formats validation results for display.
 */
class ValidationReporter {
    verbose;
    constructor(verbose = false) {
        this.verbose = verbose;
    }
    /**
     * Format a single validation report
     */
    format(report) {
        const lines = [];
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
        }
        else {
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
     * Format a single validation result
     */
    formatResult(result) {
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
    formatBatch(batch) {
        const lines = [];
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
        }
        else {
            lines.push(`✗ ${summary.failed} spec(s) failed validation`);
        }
        return lines.join('\n');
    }
    /**
     * Format as JSON
     */
    formatJSON(report) {
        return JSON.stringify(report, null, 2);
    }
    /**
     * Format batch as JSON
     */
    formatBatchJSON(batch) {
        return JSON.stringify(batch, null, 2);
    }
    /**
     * Format summary only
     */
    formatSummary(reports) {
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
    formatMinimal(reports) {
        return reports.map(r => {
            const status = r.passed ? 'PASS' : 'FAIL';
            const errorCount = r.errors.length;
            return `${status} ${r.file} (${errorCount} errors)`;
        }).join('\n');
    }
    /**
     * Set verbose mode
     */
    setVerbose(verbose) {
        this.verbose = verbose;
    }
}
exports.ValidationReporter = ValidationReporter;
// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================
/**
 * Quick format function
 */
function format(report, verbose = false) {
    const reporter = new ValidationReporter(verbose);
    return reporter.format(report);
}
/**
 * Quick format batch function
 */
function formatBatch(batch, verbose = false) {
    const reporter = new ValidationReporter(verbose);
    return reporter.formatBatch(batch);
}
/**
 * Quick format JSON
 */
function formatJSON(report) {
    return JSON.stringify(report, null, 2);
}
/**
 * Quick summary
 */
function formatSummary(reports) {
    const reporter = new ValidationReporter();
    return reporter.formatSummary(reports);
}
//# sourceMappingURL=reporter.js.map