/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/maturity.spec.dir/levels/beta.spec.md
 * Generated: 2026-03-20T18:30:00.000Z
 * 
 * Edit the spec, not this file.
 */
import { BETA_LEVEL, BETA_CRITERIA } from './beta';
import { ParsedSpec } from '../types';

interface BetaValidationResult {
  isValid: boolean;
  meetsBetaCriteria: boolean;
  issues: BetaValidationIssue[];
  warnings: string[];
  suggestions: string[];
}

interface BetaValidationIssue {
  type: 'error' | 'warning';
  field: string;
  message: string;
}

class BetaValidator {
  validate(spec: ParsedSpec): BetaValidationResult {
    const issues: BetaValidationIssue[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Check required fields (more strict than Alpha)
    for (const field of BETA_LEVEL.requiredFields) {
      if (!spec.metadata[field]) {
        issues.push({
          type: 'error',
          field,
          message: `Beta requires field: ${field}`
        });
      }
    }
    
    // Check layer is appropriate (0-6 for Beta)
    const layer = spec.metadata.layer;
    if (layer !== undefined && layer > 6) {
      issues.push({
        type: 'error',
        field: 'layer',
        message: `Beta should have layer 0-6, got ${layer}`
      });
    }
    
    // Check deployment target - Beta allows beta, staging, production
    const target = spec.metadata.target;
    if (typeof target === 'string' && !['beta', 'staging', 'production'].includes(target)) {
      issues.push({
        type: 'error',
        field: 'target',
        message: 'Beta level only supports beta, staging, or production deployment'
      });
    }
    
    // Check documentation completeness
    if (!spec.metadata.description && spec.content && spec.content.length < 500) {
      warnings.push('Beta benefits from detailed description (500+ chars)');
    }
    
    // Beta should have architecture documentation
    if (spec.content && !spec.content.toLowerCase().includes('architecture') && 
        !spec.content.toLowerCase().includes('overview')) {
      issues.push({
        type: 'error',
        field: 'content',
        message: 'Beta requires architecture overview'
      });
    }
    
    // Check for test coverage - Beta expects comprehensive
    const tags = spec.metadata.tags || [];
    if (!tags.includes('tested') && !tags.includes('testing')) {
      warnings.push('Beta expects comprehensive test coverage');
    }
    
    // Check depends_on for dependencies
    if (!spec.metadata.depends_on && spec.content?.includes('@ref:')) {
      warnings.push('References found but no depends_on declared');
    }
    
    // Status field required for Beta
    if (!spec.metadata.status) {
      issues.push({
        type: 'error',
        field: 'status',
        message: 'Beta requires status field (e.g., active, deprecated)'
      });
    }
    
    // Description field required for Beta
    if (!spec.metadata.description) {
      issues.push({
        type: 'error',
        field: 'description',
        message: 'Beta requires description field'
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
    
    // Check for e2e test recommendations for layer >= 5
    if (spec.metadata.layer && spec.metadata.layer >= 5) {
      suggestions.push('Consider adding end-to-end tests for this layer');
    }
    
    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      meetsBetaCriteria: issues.length === 0,
      issues,
      warnings,
      suggestions
    };
  }
  
  canPromoteFromBeta(spec: ParsedSpec): PromoteResult {
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
    if (!spec.metadata.description) {
      blockers.push('Missing description field');
    }
    
    // Should have comprehensive documentation
    const hasComprehensiveDoc = spec.content && spec.content.length > 500;
    if (!hasComprehensiveDoc) {
      blockers.push('Documentation not comprehensive enough for Beta');
    }
    
    // Should have test coverage indicators
    const tags = spec.metadata.tags || [];
    const hasTests = tags.includes('tested') || tags.includes('testing');
    if (!hasTests) {
      blockers.push('Test coverage expected for Beta');
    }
    
    // Should have architecture overview
    const hasArchitecture = spec.content && (spec.content.toLowerCase().includes('architecture') || 
                            spec.content.toLowerCase().includes('overview'));
    if (!hasArchitecture) {
      blockers.push('Architecture overview required for Beta');
    }
    
    return {
      canPromote: blockers.length === 0,
      blockers,
      readinessScore: this.calculateReadiness(spec)
    };
  }
  
  canDemoteToAlpha(spec: ParsedSpec): boolean {
    // Beta can always go back to Alpha
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
    if (spec.content && spec.content.length > 500) score += 8;
    if (spec.content && spec.content.length > 1000) score += 9;
    
    return Math.min(score, 100);
  }
}

interface PromoteResult {
  canPromote: boolean;
  blockers: string[];
  readinessScore: number;
}

export const betaValidator = new BetaValidator();