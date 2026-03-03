import { TestReport } from './types';
/**
 * TestResultSync synchronizes test results back to test spec files
 */
export declare class TestResultSync {
    /**
     * Sync test results to a specific test spec file
     */
    syncResultsToSpec(specPath: string, report: TestReport): Promise<void>;
    /**
     * Update all test specs in a directory with their results
     */
    updateAllSpecs(dir: string, reports: TestReport[]): Promise<void>;
    /**
     * Find the spec file for a given report
     */
    private findSpecForReport;
    /**
     * Clear all test results from a spec file
     */
    clearResults(specPath: string): Promise<void>;
    /**
     * Clear all test results from all specs in a directory
     */
    clearAllResults(dir: string): Promise<void>;
    /**
     * Read test results from a spec file
     */
    readResults(specPath: string): Promise<{
        status?: string;
        passed?: number;
        failed?: number;
        skipped?: number;
        duration?: number;
        timestamp?: string;
    } | null>;
}
/**
 * Create a default sync instance
 */
export declare const testResultSync: TestResultSync;
/**
 * Sync results to a spec file
 */
export declare function syncResultsToSpec(specPath: string, report: TestReport): Promise<void>;
/**
 * Update all specs in a directory
 */
export declare function updateAllSpecs(dir: string, reports: TestReport[]): Promise<void>;
//# sourceMappingURL=sync.d.ts.map