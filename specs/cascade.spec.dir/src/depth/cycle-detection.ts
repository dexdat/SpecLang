/**
speclang-header lines:5
id: @specs/cascade
version: 1.0.0
layer: 5
 */

// SPECLANG-GENERATED: Phase 0.20 - Cascade Depth and Cycle Detection
// DO NOT EDIT MANUALLY
// Source: docs/prompts/phase-0.20-cascade-depth.md

import { CycleDetectorConfig, CycleCheckResult, DEFAULT_CYCLE_CONFIG } from './types.js';

/**
 * Detects cycles in cascade file changes to prevent infinite loops
 */
export class CycleDetector {
  private config: CycleDetectorConfig;
  private fileEditCounts: Map<string, number>;
  private recentFiles: string[];

  constructor(config: Partial<CycleDetectorConfig> = {}) {
    this.config = { ...DEFAULT_CYCLE_CONFIG, ...config };
    this.fileEditCounts = new Map();
    this.recentFiles = [];
  }

  /**
   * Record a file edit and check for cycles
   */
  recordEdit(file: string): CycleCheckResult {
    // Track edit count
    const count = (this.fileEditCounts.get(file) || 0) + 1;
    this.fileEditCounts.set(file, count);

    // Track recent files
    this.recentFiles.push(file);
    if (this.recentFiles.length > this.config.max_pattern_length * 2) {
      this.recentFiles.shift();
    }

    return this.detectCycle();
  }

  /**
   * Get the current cycle detection result (public)
   */
  detectCycle(): CycleCheckResult {
    const cycles: string[] = [];

    // Check for repeated edits
    for (const [file, count] of Array.from(this.fileEditCounts.entries())) {
      if (count >= this.config.max_repeats) {
        cycles.push(`File ${file} edited ${count} times`);
      }
    }

    // Check for repeating patterns
    const pattern = this.findRepeatingPattern();
    if (pattern) {
      cycles.push(`Pattern detected: ${pattern.join(' -> ')}`);
    }

    return {
      hasCycle: cycles.length > 0,
      cycleFile: this.findCycleFile(),
      reasons: cycles
    };
  }

  /**
   * Check if there are any cycles (alias for detectCycle)
   */
  checkForCycles(): CycleCheckResult {
    return this.detectCycle();
  }

  /**
   * Find repeating patterns in recent files
   */
  private findRepeatingPattern(): string[] | null {
    const len = this.recentFiles.length;
    if (len < 4) return null;

    // Try different pattern lengths
    for (let patternLen = 2; patternLen <= this.config.max_pattern_length; patternLen++) {
      if (len < patternLen * 2) continue;

      const recent = this.recentFiles.slice(-patternLen * 2);
      const firstHalf = recent.slice(0, patternLen);
      const secondHalf = recent.slice(patternLen);

      if (JSON.stringify(firstHalf) === JSON.stringify(secondHalf)) {
        return firstHalf;
      }
    }

    return null;
  }

  /**
   * Find the file with the most edits (potential cycle source)
   */
  private findCycleFile(): string | null {
    let maxFile: string | null = null;
    let maxCount = 0;

    for (const [file, count] of Array.from(this.fileEditCounts.entries())) {
      if (count > maxCount) {
        maxCount = count;
        maxFile = file;
      }
    }

    if (maxCount >= this.config.max_repeats) {
      return maxFile;
    }

    return null;
  }

  /**
   * Get the edit count for a specific file
   */
  getEditCount(file: string): number {
    return this.fileEditCounts.get(file) || 0;
  }

  /**
   * Get all file edit counts
   */
  getAllEditCounts(): Map<string, number> {
    return new Map(this.fileEditCounts);
  }

  /**
   * Get recent files in order
   */
  getRecentFiles(): string[] {
    return [...this.recentFiles];
  }

  /**
   * Reset the detector state
   */
  reset(): void {
    this.fileEditCounts.clear();
    this.recentFiles = [];
  }
}
