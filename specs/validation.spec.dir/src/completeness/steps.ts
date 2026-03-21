/**
 * SPECLANG-GENERATED: Steps validator
 * Source: @specs/validation/completeness-steps
 */

import { StepsCheck, SpecBlock } from './types';

export class StepsValidator {
  private stepPatterns = [
    /^\s*\d+\.\s+/,           // Numbered list
    /^\s*[-*•]\s+/,           // Bulleted list
    /^(first|then|next|finally|after|step|stage)\b/i  // Sequence words
  ];
  
  validate(blocks: SpecBlock[], criteria: { minCoverage: number }): StepsCheck {
    let blocksWithSteps = 0;
    
    for (const block of blocks) {
      if (this.hasSteps(block.content)) {
        blocksWithSteps++;
      }
    }
    
    const totalBlocks = blocks.length;
    const coverage = totalBlocks > 0 ? blocksWithSteps / totalBlocks : 0;
    const passed = coverage >= criteria.minCoverage;
    
    return {
      passed,
      blocksWithSteps,
      totalBlocks,
      coverage: Math.round(coverage * 100) / 100,
      score: coverage
    };
  }
  
  private hasSteps(content: string): boolean {
    const lines = content.split('\n');
    let stepCount = 0;
    
    for (const line of lines) {
      for (const pattern of this.stepPatterns) {
        if (pattern.test(line)) {
          stepCount++;
        }
      }
    }
    
    return stepCount >= 2;
  }
  
  countSteps(content: string): number {
    const lines = content.split('\n');
    let count = 0;
    
    for (const line of lines) {
      for (const pattern of this.stepPatterns) {
        if (pattern.test(line)) {
          count++;
        }
      }
    }
    
    return count;
  }
}
