import { TestReport } from './types';
/**
 * TestSpecReporter formats test results for display
 */
export declare class TestSpecReporter {
    /**
     * Format a single test report as a readable string
     */
    formatReport(report: TestReport): string;
    /**
     * Format multiple test reports as a summary
     */
    formatSummary(reports: TestReport[]): string;
    /**
     * Format a test result as JSON
     */
    formatJson(report: TestReport): string;
    /**
     * Format reports as JSON array
     */
    formatJsonAll(reports: TestReport[]): string;
    /**
     * Format a compact single-line summary
     */
    formatCompact(report: TestReport): string;
    /**
     * Format failures only
     */
    formatFailures(reports: TestReport[]): string;
    /**
     * Get summary statistics
     */
    getSummaryStats(reports: TestReport[]): {
        totalSpecs: number;
        totalScenarios: number;
        totalPassed: number;
        totalFailed: number;
        totalSkipped: number;
        totalDuration: number;
        passRate: number;
    };
    /**
     * Truncate error message to a reasonable length
     */
    private truncateError;
}
/**
 * Create a default reporter instance
 */
export declare const defaultReporter: TestSpecReporter;
/**
 * Format a test report using default reporter
 */
export declare function formatReport(report: TestReport): string;
/**
 * Format test summary using default reporter
 */
export declare function formatSummary(reports: TestReport[]): string;
//# sourceMappingURL=reporter.d.ts.map