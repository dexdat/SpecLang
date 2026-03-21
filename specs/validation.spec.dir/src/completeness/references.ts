/**
 * SPECLANG-GENERATED: References validator
 * Source: @specs/validation/completeness-references
 */

import { ReferencesCheck } from './types';

export class ReferencesValidator {
  validate(content: string, criteria: { minReferences: number; mustResolve: boolean }): ReferencesCheck {
    const refs = this.extractRefs(content);
    const total = refs.length;
    
    const resolved: string[] = [];
    const unresolved: string[] = [];
    
    for (const ref of refs) {
      if (this.canResolve(ref)) {
        resolved.push(ref);
      } else {
        unresolved.push(ref);
      }
    }
    
    const passed = (
      total >= criteria.minReferences &&
      (unresolved.length === 0 || !criteria.mustResolve)
    );
    
    const score = total > 0 ? resolved.length / total : 1;
    
    return {
      passed,
      total,
      resolved: resolved.length,
      unresolved,
      score: Math.round(score * 100) / 100
    };
  }
  
  extractRefs(content: string): string[] {
    const refPattern = /@ref:([^\s\n]+)/g;
    const refs: string[] = [];
    let match;
    
    while ((match = refPattern.exec(content)) !== null) {
      refs.push(match[1]);
    }
    
    return refs;
  }
  
  private canResolve(ref: string): boolean {
    // Special references always resolve
    if (ref === 'northstar' || ref === 'project') {
      return true;
    }
    
    // Check if it's a valid format
    return /^@[a-z]/i.test(ref) || /^[a-z][a-z0-9-]*(\.spec)?$/i.test(ref);
  }
}
