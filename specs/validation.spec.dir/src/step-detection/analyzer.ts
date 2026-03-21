/**
 * SPECLANG-GENERATED: Step analysis utilities
 * Source: @specs/validation-tool/implementation#step-detection
 */

import { StepBlockResult, StepDetectionResult } from './types';

export class StepAnalyzer {
  /**
   * Find blocks with the lowest coverage
   */
  static findWeakestBlocks(result: StepDetectionResult, count: number = 3): StepBlockResult[] {
    return [...result.blocks]
      .sort((a, b) => a.coverage - b.coverage)
      .slice(0, count);
  }

  /**
   * Calculate average steps per sentence across all blocks
   */
  static averageStepsPerSentence(result: StepDetectionResult): number {
    if (result.totalSentences === 0) return 0;
    return result.totalSteps / result.totalSentences;
  }

  /**
   * Determine if spec meets autonomous threshold (>80% coverage)
   */
  static isAutonomousReady(result: StepDetectionResult): boolean {
    return result.coverage >= 0.8;
  }

  /**
   * Generate a summary report
   */
  static generateSummary(result: StepDetectionResult): string {
    const weakBlocks = this.findWeakestBlocks(result, 2);
    let summary = `Step coverage: ${(result.coverage * 100).toFixed(1)}% (${result.totalSteps} steps / ${result.totalSentences} sentences)\n`;
    summary += `Blocks: ${result.blocks.length} total, ${result.blocks.filter(b => b.passed).length} passed\n`;
    if (weakBlocks.length > 0) {
      summary += `Weakest blocks:\n`;
      weakBlocks.forEach(b => {
        summary += `  - ${b.blockId}: ${(b.coverage * 100).toFixed(1)}% coverage\n`;
      });
    }
    return summary;
  }
}