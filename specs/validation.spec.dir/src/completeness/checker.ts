/**
 * SPECLANG-GENERATED: Completeness checker
 * Source: @specs/validation/completeness-checker
 */

import {
  CompletenessCriteria,
  CompletenessResult,
  ParsedSpec,
  SpecHeader,
  SpecBlock,
  MetadataCheck,
  BlocksCheck,
  ReferencesCheck,
  StepsCheck
} from './types';
import { MetadataValidator } from './metadata';
import { BlocksValidator } from './blocks';
import { ReferencesValidator } from './references';
import { StepsValidator } from './steps';
import { CompletenessScorer } from './scorer';

export const DEFAULT_CRITERIA: CompletenessCriteria = {
  metadata: {
    required: ['id', 'version', 'layer', 'project_level', 'agent_support', 'short'],
    recommended: ['tags', 'description', 'author', 'dependencies']
  },
  blocks: {
    minimum: 3,
    requiredKinds: ['overview', 'api', 'data']
  },
  references: {
    minReferences: 2,
    mustResolve: true
  },
  steps: {
    minCoverage: 0.8
  }
};

export class CompletenessChecker {
  private criteria: CompletenessCriteria;
  private metadataValidator: MetadataValidator;
  private blocksValidator: BlocksValidator;
  private referencesValidator: ReferencesValidator;
  private stepsValidator: StepsValidator;
  private scorer: CompletenessScorer;
  
  constructor(criteria: Partial<CompletenessCriteria> = {}) {
    this.criteria = { ...DEFAULT_CRITERIA, ...criteria };
    this.metadataValidator = new MetadataValidator();
    this.blocksValidator = new BlocksValidator();
    this.referencesValidator = new ReferencesValidator();
    this.stepsValidator = new StepsValidator();
    this.scorer = new CompletenessScorer();
  }
  
  async check(spec: ParsedSpec): Promise<CompletenessResult> {
    const metadataCheck = this.checkMetadata(spec.header);
    const blocksCheck = this.checkBlocks(spec.blocks);
    const referencesCheck = this.checkReferences(spec.content);
    const stepsCheck = this.checkSteps(spec.blocks);
    
    const checks = {
      metadata: metadataCheck,
      blocks: blocksCheck,
      references: referencesCheck,
      steps: stepsCheck
    };
    
    const score = this.scorer.compute(checks);
    const missing = this.collectMissing(checks);
    const suggestions = this.generateSuggestions(checks);
    const passed = this.determinePass(checks);
    
    return {
      specId: spec.header.id,
      passed,
      score,
      checks,
      missing,
      suggestions
    };
  }
  
  private checkMetadata(header: SpecHeader): MetadataCheck {
    return this.metadataValidator.validate(header, this.criteria.metadata);
  }
  
  private checkBlocks(blocks: SpecBlock[]): BlocksCheck {
    return this.blocksValidator.validate(blocks, this.criteria.blocks);
  }
  
  private checkReferences(content: string): ReferencesCheck {
    return this.referencesValidator.validate(content, this.criteria.references);
  }
  
  private checkSteps(blocks: SpecBlock[]): StepsCheck {
    return this.stepsValidator.validate(blocks, this.criteria.steps);
  }
  
  private collectMissing(checks: CompletenessResult['checks']): string[] {
    const missing: string[] = [];
    
    if (!checks.metadata.passed) {
      missing.push(`Missing metadata: ${checks.metadata.missing.join(', ')}`);
    }
    
    if (!checks.blocks.passed) {
      missing.push(`Missing block kinds: ${checks.blocks.missing.join(', ')}`);
    }
    
    if (!checks.references.passed) {
      for (const ref of checks.references.unresolved) {
        missing.push(`Unresolved reference: ${ref}`);
      }
    }
    
    if (!checks.steps.passed) {
      missing.push('Insufficient step-by-step coverage');
    }
    
    return missing;
  }
  
  private generateSuggestions(checks: CompletenessResult['checks']): string[] {
    const suggestions: string[] = [];
    
    if (checks.metadata.missing.length > 0) {
      suggestions.push(`Add required metadata fields: ${checks.metadata.missing.join(', ')}`);
    }
    
    if (checks.blocks.missing.length > 0) {
      suggestions.push(`Add required block kinds: ${checks.blocks.missing.join(', ')}`);
    }
    
    if (checks.references.unresolved.length > 0) {
      suggestions.push(`Resolve these references: ${checks.references.unresolved.join(', ')}`);
    }
    
    if (checks.steps.coverage < this.criteria.steps.minCoverage) {
      suggestions.push('Add step-by-step descriptions to operations');
    }
    
    return suggestions;
  }
  
  private determinePass(checks: CompletenessResult['checks']): boolean {
    return (
      checks.metadata.passed &&
      checks.blocks.passed &&
      checks.references.passed &&
      checks.steps.passed
    );
  }
}
