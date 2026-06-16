/**
 * SPECLANG-GENERATED: Validation error reporter
 * Source: @speclang/validation
 */
import type { ValidationReport, ValidationReportBatch } from './types';
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