/**
 * SPECLANG-GENERATED: Blocks validator
 * Source: @specs/validation/completeness-blocks
 */

import { BlocksCheck, SpecBlock } from './types';

export class BlocksValidator {
  validate(blocks: SpecBlock[], criteria: { minimum: number; requiredKinds: string[] }): BlocksCheck {
    const total = blocks.length;
    const kinds: Record<string, number> = {};
    
    for (const block of blocks) {
      kinds[block.kind] = (kinds[block.kind] || 0) + 1;
    }
    
    // Check for required kinds
    const missing: string[] = [];
    for (const requiredKind of criteria.requiredKinds) {
      if (!kinds[requiredKind]) {
        missing.push(requiredKind);
      }
    }
    
    const minimumPassed = total >= criteria.minimum;
    const requiredKindsPassed = missing.length === 0;
    const passed = minimumPassed && requiredKindsPassed;
    
    // Score based on coverage
    const score = this.computeScore(total, kinds, criteria);
    
    return {
      passed,
      total,
      kinds,
      missing,
      score
    };
  }
  
  private computeScore(total: number, kinds: Record<string, number>, criteria: { minimum: number; requiredKinds: string[] }): number {
    let score = 0;
    
    // Minimum blocks (50%)
    score += Math.min(0.5, total / criteria.minimum * 0.5);
    
    // Required kinds (50%)
    const foundKinds = Object.keys(kinds).filter(k => criteria.requiredKinds.includes(k));
    score += (foundKinds.length / criteria.requiredKinds.length) * 0.5;
    
    return Math.round(score * 100) / 100;
  }
  
  getBlockKinds(blocks: SpecBlock[]): string[] {
    return [...new Set(blocks.map(b => b.kind))];
  }
  
  getBlockByKind(blocks: SpecBlock[], kind: string): SpecBlock[] {
    return blocks.filter(b => b.kind === kind);
  }
}
