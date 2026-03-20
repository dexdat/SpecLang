/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/maturity.spec.dir/levels/alpha.spec.md
 * Generated: 2026-03-20T18:07:00.000Z
 * 
 * Edit the spec, not this file.
 */
import { ALPHA_LEVEL, ALPHA_CRITERIA } from './alpha';
import { ParsedSpec } from '../types';

interface AlphaValidationResult {
  isValid: boolean;
  meetsAlphaCriteria: boolean;
  issues: AlphaValidationIssue[];
  warnings: string[];
  suggestions: string[];
}

interface AlphaValidationIssue {
  type: 'error' | 'warning';
  field: string;
  message: string;
}

class AlphaValidator {
  validate(spec: ParsedSpec): AlphaValidationResult {
    const issues: AlphaValidationIssue[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Check required fields (more strict than MVP)
    for (const field of ALPHA_LEVEL.requiredFields) {
      if (!spec.metadata[field]) {
        issues.push({
          type: 'error',
          field,
          message: `Alpha requires field: ${field}`
        });
      }
    }
    
    // Check layer is appropriate (0-5 for Alpha)
    const layer = spec.metadata.layer;
    if (layer !== undefined && layer > 5) {
      issues.push({
        type: 'error',
        field: 'layer',
        message: `Alpha should have layer 0-5, got ${layer}`
      });
    }
    
    // Check deployment target
    const target = spec.metadata.target;
    if (target === 'production') {
      issues.push({
        type: 'error',
        field: 'target',
        message: 'Alpha level does not support production deployment'
      });
    }
    
    // Check documentation completeness
    if (!spec.metadata.description && spec.content && spec.content.length < 300) {
      warnings.push('Alpha benefits from more detailed description');
    }
    
    // Alpha should have architecture documentation
    if (!spec.content?.toLowerCase().includes('architecture') && 
        !spec.content?.toLowerCase().includes('overview')) {
      suggestions.push('Consider adding architecture overview');
    }
    
    // Check for test coverage - Alpha expects more
    const tags = spec.metadata.tags || [];
    if (!tags.includes('tested') && !tags.includes('testing')) {
      suggestions.push('Alpha expects test coverage for core features');
    }
    
    // Check depends_on for dependencies
    if (!spec.metadata.depends_on && spec.content?.includes('@ref:')) {
      warnings.push('References found but no depends_on declared');
    }
    
    // Status field required for Alpha
    if (!spec.metadata.status) {
      issues.push({
        type: 'error',
        field: 'status',
        message: 'Alpha requires status field (e.g., active, deprecated)'
      });
    }
    
    // Suggestions for improvement
    if (!spec.metadata.layer) {
      suggestions.push('Add layer to clarify spec abstraction level');
    }
    
    if (!spec.metadata.target && spec.metadata.layer && spec.metadata.layer >= 4) {
      suggestions.push('Code-level specs should specify target');
    }
    
    // Check for integration test recommendations
    if (spec.metadata.layer && spec.metadata.layer >= 3) {
      suggestions.push('Consider adding integration tests for this layer');
    }
    
    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      meetsAlphaCriteria: issues.length === 0,
      issues,
      warnings,
      suggestions
    };
  }
  
  canPromoteFromAlpha(spec: ParsedSpec): PromoteResult {
    const blockers: string[] = [];
    
    // Required fields must exist
    if (!spec.metadata.id || !spec.metadata.version) {
      blockers.push('Missing required fields');
    }
    if (!spec.metadata.tags || spec.metadata.tags.length === 0) {
      blockers.push('Missing tags');
    }
    if (!spec.metadata.short) {
      blockers.push('Missing short description');
    }
    if (!spec.metadata.status) {
      blockers.push('Missing status field');
    }
    if (spec.metadata.layer === undefined) {
      blockers.push('Layer not defined');
    }
    
    // Should have demonstrated core functionality
    const hasCoreFunctionality = spec.content && spec.content.length > 200;
    if (!hasCoreFunctionality) {
      blockers.push('Core functionality not documented enough');
    }
    
    // Should have some test coverage
    const tags = spec.metadata.tags || [];
    const hasTests = tags.includes('tested') || tags.includes('testing');
    if (!hasTests) {
      blockers.push('Test coverage expected for Alpha');
    }
    
    return {
      canPromote: blockers.length === 0,
      blockers,
      readinessScore: this.calculateReadiness(spec)
    };
  }
  
  canDemoteToMVP(spec: ParsedSpec): boolean {
    // Alpha can always go back to MVP
    return true;
  }
  
  private calculateReadiness(spec: ParsedSpec): number {
    let score = 0;
    
    // Required fields (50 points)
    if (spec.metadata.id) score += 8;
    if (spec.metadata.version) score += 8;
    if (spec.metadata.tags?.length) score += 8;
    if (spec.metadata.short) score += 8;
    if (spec.metadata.status) score += 8;
    if (spec.metadata.layer !== undefined) score += 10;
    
    // Recommended fields (25 points)
    if (spec.metadata.description) score += 8;
    if (spec.metadata.target) score += 8;
    if (spec.metadata.depends_on?.length) score += 9;
    
    // Content quality (25 points)
    if (spec.content && spec.content.length > 0) score += 8;
    if (spec.content && spec.content.length > 300) score += 8;
    if (spec.content && spec.content.length > 500) score += 9;
    
    return Math.min(score, 100);
  }
}

interface PromoteResult {
  canPromote: boolean;
  blockers: string[];
  readinessScore: number;
}

export const alphaValidator = new AlphaValidator();
