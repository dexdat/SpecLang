/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/maturity.spec.dir/levels/production.spec.md
 * Generated: 2026-03-20T19:00:00.000Z
 * 
 * Edit the spec, not this file.
 */
import { PRODUCTION_LEVEL, PRODUCTION_CRITERIA } from './production';
import { ParsedSpec } from '../types';

interface ProductionValidationResult {
  isValid: boolean;
  meetsProductionCriteria: boolean;
  issues: ProductionValidationIssue[];
  warnings: string[];
  suggestions: string[];
}

interface ProductionValidationIssue {
  type: 'error' | 'warning';
  field: string;
  message: string;
}

class ProductionValidator {
  validate(spec: ParsedSpec): ProductionValidationResult {
    const issues: ProductionValidationIssue[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Check required fields (most strict)
    for (const field of PRODUCTION_LEVEL.requiredFields) {
      if (!spec.metadata[field]) {
        issues.push({
          type: 'error',
          field,
          message: `Production requires field: ${field}`
        });
      }
    }
    
    // Check layer is appropriate (0-10 for Production)
    const layer = spec.metadata.layer;
    if (layer !== undefined && layer > 10) {
      issues.push({
        type: 'error',
        field: 'layer',
        message: `Production should have layer 0-10, got ${layer}`
      });
    }
    
    // Check deployment target - Production only allows production
    const target = spec.metadata.target;
    if (target && target !== 'production') {
      issues.push({
        type: 'error',
        field: 'target',
        message: 'Production level only supports production deployment'
      });
    }
    
    // Check documentation completeness
    if (!spec.metadata.description && spec.content && spec.content.length < 1000) {
      warnings.push('Production benefits from detailed description (1000+ chars)');
    }
    
    // Production should have architecture documentation
    if (spec.content && !spec.content.toLowerCase().includes('architecture') && 
        !spec.content.toLowerCase().includes('overview')) {
      issues.push({
        type: 'error',
        field: 'content',
        message: 'Production requires architecture overview'
      });
    }
    
    // Check for test coverage - Production expects full coverage
    const tags = spec.metadata.tags || [];
    if (!tags.includes('tested') && !tags.includes('testing')) {
      warnings.push('Production expects full test coverage');
    }
    
    // Check depends_on for dependencies
    if (!spec.metadata.depends_on && spec.content?.includes('@ref:')) {
      warnings.push('References found but no depends_on declared');
    }
    
    // Status field required for Production
    if (!spec.metadata.status) {
      issues.push({
        type: 'error',
        field: 'status',
        message: 'Production requires status field (e.g., active, deprecated)'
      });
    }
    
    // Description field required for Production
    if (!spec.metadata.description) {
      issues.push({
        type: 'error',
        field: 'description',
        message: 'Production requires description field'
      });
    }
    
    // Agent support field required for Production
    if (!spec.metadata.agent_support) {
      issues.push({
        type: 'error',
        field: 'agent_support',
        message: 'Production requires agent_support field'
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
    
    // Check for performance test recommendations for layer >= 5
    if (spec.metadata.layer && spec.metadata.layer >= 5) {
      suggestions.push('Consider adding performance tests for this layer');
    }
    
    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      meetsProductionCriteria: issues.length === 0,
      issues,
      warnings,
      suggestions
    };
  }
  
  canPromoteFromProduction(spec: ParsedSpec): PromoteResult {
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
    if (!spec.metadata.agent_support) {
      blockers.push('Missing agent_support field');
    }
    
    // Should have comprehensive documentation
    const hasComprehensiveDoc = spec.content && spec.content.length > 1000;
    if (!hasComprehensiveDoc) {
      blockers.push('Documentation not comprehensive enough for Production');
    }
    
    // Should have test coverage indicators
    const tags = spec.metadata.tags || [];
    const hasTests = tags.includes('tested') || tags.includes('testing');
    if (!hasTests) {
      blockers.push('Test coverage expected for Production');
    }
    
    // Should have architecture overview
    const hasArchitecture = spec.content && (spec.content.toLowerCase().includes('architecture') || 
                            spec.content.toLowerCase().includes('overview'));
    if (!hasArchitecture) {
      blockers.push('Architecture overview required for Production');
    }
    
    return {
      canPromote: blockers.length === 0,
      blockers,
      readinessScore: this.calculateReadiness(spec)
    };
  }
  
  canDemoteToBeta(spec: ParsedSpec): boolean {
    // Production can always go back to Beta
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
    if (spec.content && spec.content.length > 1000) score += 8;
    if (spec.content && spec.content.length > 2000) score += 9;
    
    return Math.min(score, 100);
  }
}

interface PromoteResult {
  canPromote: boolean;
  blockers: string[];
  readinessScore: number;
}

export const productionValidator = new ProductionValidator();