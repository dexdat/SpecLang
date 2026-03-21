/**
 * SPECLANG-GENERATED: Completeness scorer
 * Source: @specs/validation/completeness-scorer
 */

import { CompletenessResult } from './types';

export class CompletenessScorer {
  private weights = {
    metadata: 0.25,
    blocks: 0.25,
    references: 0.25,
    steps: 0.25
  };
  
  compute(checks: CompletenessResult['checks']): number {
    const metadataScore = checks.metadata.score * this.weights.metadata;
    const blocksScore = checks.blocks.score * this.weights.blocks;
    const referencesScore = checks.references.score * this.weights.references;
    const stepsScore = checks.steps.score * this.weights.steps;
    
    const total = metadataScore + blocksScore + referencesScore + stepsScore;
    
    return Math.round(total * 100) / 100;
  }
  
  getGrade(score: number): string {
    if (score >= 0.9) return 'Excellent - Fully complete';
    if (score >= 0.75) return 'Good - Nearly complete';
    if (score >= 0.5) return 'Fair - Partially complete';
    return 'Incomplete';
  }
  
  shouldFail(score: number): boolean {
    return score < 0.5;
  }
}
