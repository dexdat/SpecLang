import { CycleDetectorConfig, CycleCheckResult } from './types.js';
/**
 * Detects cycles in cascade file changes to prevent infinite loops
 */
export declare class CycleDetector {
    private config;
    private fileEditCounts;
    private recentFiles;
    constructor(config?: Partial<CycleDetectorConfig>);
    /**
     * Record a file edit and check for cycles
     */
    recordEdit(file: string): CycleCheckResult;
    /**
     * Get the current cycle detection result (public)
     */
    detectCycle(): CycleCheckResult;
    /**
     * Check if there are any cycles (alias for detectCycle)
     */
    checkForCycles(): CycleCheckResult;
    /**
     * Find repeating patterns in recent files
     */
    private findRepeatingPattern;
    /**
     * Find the file with the most edits (potential cycle source)
     */
    private findCycleFile;
    /**
     * Get the edit count for a specific file
     */
    getEditCount(file: string): number;
    /**
     * Get all file edit counts
     */
    getAllEditCounts(): Map<string, number>;
    /**
     * Get recent files in order
     */
    getRecentFiles(): string[];
    /**
     * Reset the detector state
     */
    reset(): void;
}
//# sourceMappingURL=cycle-detection.d.ts.map