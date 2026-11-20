/**
 * SPECLANG-GENERATED: Validation error reporter
 * Source: @speclang/validation
 */
import type { ValidationReport, ValidationReportBatch } from './types';
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
/**
 * Validation Reporter
 *
 * Formats validation results for display.
 */
export declare class ValidationReporter {
    private verbose;
    constructor(verbose?: boolean);
    /**
     * Format a single validation report
     */
    format(report: ValidationReport): string;
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
    formatWarningSummary(reports: ValidationReport[], options?: WarningSummaryOptions): string;
    /**
     * Truncate a message to `max` characters with an ellipsis.
     */
    private truncate;
    /**
     * Format a single validation result
     */
    private formatResult;
    /**
     * Format a batch validation report
     */
    formatBatch(batch: ValidationReportBatch): string;
    /**
     * Format as JSON
     */
    formatJSON(report: ValidationReport): string;
    /**
     * Format batch as JSON
     */
    formatBatchJSON(batch: ValidationReportBatch): string;
    /**
     * Format summary only
     */
    formatSummary(reports: ValidationReport[]): string;
    /**
     * Format for machine-readable output (minimal)
     */
    formatMinimal(reports: ValidationReport[]): string;
    /**
     * Set verbose mode
     */
    setVerbose(verbose: boolean): void;
}
/**
 * Quick format function
 */
export declare function format(report: ValidationReport, verbose?: boolean): string;
/**
 * Quick format batch function
 */
export declare function formatBatch(batch: ValidationReportBatch, verbose?: boolean): string;
/**
 * Quick format JSON
 */
export declare function formatJSON(report: ValidationReport): string;
/**
 * Quick summary
 */
export declare function formatSummary(reports: ValidationReport[]): string;
//# sourceMappingURL=reporter.d.ts.map