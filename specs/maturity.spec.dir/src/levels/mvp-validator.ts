import { MVP_LEVEL, MVP_CRITERIA } from './mvp';
import { ParsedSpec } from '../types';

interface MVPValidationResult {
  isValid: boolean;
  meetsMVPCriteria: boolean;
  issues: MVPValidationIssue[];
  warnings: string[];
  suggestions: string[];
}

interface MVPValidationIssue {
  type: 'error' | 'warning';
  field: string;
  message: string;
}

class MVPValidator {
  validate(spec: ParsedSpec): MVPValidationResult {
    const issues: MVPValidationIssue[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Check required fields
    for (const field of MVP_LEVEL.requiredFields) {
      if (!spec.metadata[field]) {
        issues.push({
          type: 'error',
          field,
          message: `MVP requires field: ${field}`
        });
      }
    }
    
    // Check layer is appropriate (0-4 for MVP)
    const layer = spec.metadata.layer;
    if (layer !== undefined && layer > 4) {
      issues.push({
        type: 'error',
        field: 'layer',
        message: `MVP should have layer 0-4, got ${layer}`
      });
    }
    
    // Check deployment target
    const target = spec.metadata.target;
    if (target === 'production') {
      issues.push({
        type: 'error',
        field: 'target',
        message: 'MVP level does not support production deployment'
      });
    }
    
    // Check documentation completeness
    if (!spec.metadata.description && (spec.content?.length ?? 0) < 200) {
      warnings.push('MVP benefits from more detailed description');
    }
    
    // Check for test coverage
    const tags = spec.metadata.tags || [];
    if (!tags.includes('tested') && !tags.includes('testing')) {
      suggestions.push('Consider adding test coverage for core functionality');
    }
    
    // Check depends_on for dependencies
    if (!spec.metadata.depends_on && spec.content?.includes('@ref:')) {
      warnings.push('References found but no depends_on declared');
    }
    
    // Check status field
    if (!spec.metadata.status) {
      suggestions.push('MVP should have status field (e.g., active, deprecated)');
    }
    
    // Suggestions for improvement
    if (!spec.metadata.layer) {
      suggestions.push('Add layer to clarify spec abstraction level');
    }
    
    if (!spec.metadata.target && spec.metadata.layer && spec.metadata.layer >= 4) {
      suggestions.push('Code-level specs should specify target');
    }
    
    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      meetsMVPCriteria: issues.length === 0,
      issues,
      warnings,
      suggestions
    };
  }
  
  canPromoteFromMVP(spec: ParsedSpec): PromoteResult {
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
    
    // Should have demonstrated core functionality
    const hasCoreFunctionality = !!(spec.content && spec.content.length > 100);
    if (!hasCoreFunctionality) {
      blockers.push('Core functionality not documented');
    }
    
    // Should have defined layer
    if (spec.metadata.layer === undefined) {
      blockers.push('Layer not defined');
    }
    
    return {
      canPromote: blockers.length === 0,
      blockers,
      readinessScore: this.calculateReadiness(spec)
    };
  }
  
  canDemoteToPOC(spec: ParsedSpec): boolean {
    // MVP can always go back to POC
    return true;
  }
  
  private calculateReadiness(spec: ParsedSpec): number {
    let score = 0;
    
    // Required fields (40 points)
    if (spec.metadata.id) score += 10;
    if (spec.metadata.version) score += 10;
    if (spec.metadata.tags?.length) score += 10;
    if (spec.metadata.short) score += 10;
    
    // Recommended fields (30 points)
    if (spec.metadata.layer !== undefined) score += 10;
    if (spec.metadata.description) score += 10;
    if (spec.metadata.target) score += 10;
    
    // Content quality (30 points)
    if ((spec.content?.length ?? 0) > 0) score += 10;
    if ((spec.content?.length ?? 0) > 200) score += 10;
    if ((spec.content?.length ?? 0) > 500) score += 10;
    
    return Math.min(score, 100);
  }
}

interface PromoteResult {
  canPromote: boolean;
  blockers: string[];
  readinessScore: number;
}

export const mvpValidator = new MVPValidator();