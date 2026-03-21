/**
 * SPECLANG-GENERATED: Step detection scoring
 * Source: @specs/validation-tool/implementation#step-detection
 */

import { StepDetectionResult } from './types';

export class StepScorer {
  /**
   * Calculate confidence score based on step coverage
   * Formula: coverage * 0.4 (step coverage weight)
   * Additional factors could be added later
   */
  static score(result: StepDetectionResult): number {
    return result.coverage * 0.4;
  }

  /**
   * Calculate overall confidence including other factors
   */
  static overallConfidence(
    stepCoverage: number,
    referenceResolution: number = 1,
    ambiguityScore: number = 1,
    metadataCompleteness: number = 1
  ): number {
    return (stepCoverage * 0.4) +
           (referenceResolution * 0.3) +
           (ambiguityScore * 0.2) +
           (metadataCompleteness * 0.1);
  }

  /**
   * Determine if score meets threshold for agent support level
   */
  static meetsThreshold(score: number, level: string): boolean {
    switch (level) {
      case 'agent_autonomous':
        return score >= 0.8;
      case 'agent_assisted':
        return score >= 0.6;
      case 'human_only':
        return true; // no threshold
      default:
        return score >= 0.6;
    }
  }
}