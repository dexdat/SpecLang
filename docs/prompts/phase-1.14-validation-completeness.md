# Bootstrap Phase 1.14: Validation Completeness Checking

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.14 of the bootstrap process.

**Prerequisites**: 
- Phase 0 complete (SQLite, Parser, Indexer)
- Phase 1.5 (Validation Tool) in progress
- Phase 1.13 (Ambiguity Detection) complete

## Your Task
Implement the completeness checking module that validates whether `agent_autonomous` specs contain all required elements for autonomous operation.

## Read These Specs First
1. `specs/validation-tool.spec.md` - Validation tool specification
2. `specs/autonomous-validation.spec.md` - Validation rules
3. `specs/completeness-check.spec.md` - Completeness criteria

## What to Build

### Files to Create
```
src/validation/
├── completeness/
│   ├── index.ts           # Exports
│   ├── checker.ts         # Main completeness checking
│   ├── metadata.ts       # Metadata validation
│   ├── blocks.ts         # Block structure validation
│   ├── references.ts     # Reference validation
│   ├── scorer.ts          # Completeness scoring
│   └── reporter.ts        # Report generation
```

### Requirements

#### 1. Completeness Criteria (checker.ts)

```typescript
interface CompletenessCriteria {
  metadata: {
    required: string[];
    recommended: string[];
  };
  blocks: {
    minimum:K number;
    requiredinds: string[];
  };
  references: {
    minReferences: number;
    mustResolve: boolean;
  };
  steps: {
    minCoverage: number;
  };
}

const DEFAULT_CRITERIA: CompletenessCriteria = {
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

export interface CompletenessResult {
  specId: string;
  passed: boolean;
  score: number;
  checks: {
    metadata: MetadataCheck;
    blocks: BlocksCheck;
    references: ReferencesCheck;
    steps: StepsCheck;
  };
  missing: string[];
  suggestions: string[];
}

export interface MetadataCheck {
  passed: boolean;
  present: string[];
  missing: string[];
  score: number;
}

export interface BlocksCheck {
  passed: boolean;
  total: number;
  kinds: Record<string, number>;
  missing: string[];
  score: number;
}

export interface ReferencesCheck {
  passed: boolean;
  total: number;
  resolved: number;
  unresolved: string[];
  score: number;
}

export interface StepsCheck {
  passed: boolean;
  blocksWithSteps: number;
  totalBlocks: number;
  coverage: number;
  score: number;
}
```

#### 2. Main Checker (checker.ts)

```typescript
import { CompletenessCriteria, CompletenessResult, MetadataCheck, BlocksCheck, ReferencesCheck, StepsCheck } from './types';
import { MetadataValidator } from './metadata';
import { BlocksValidator } from './blocks';
import { ReferencesValidator } from './references';
import { StepsValidator } from './steps';
import { CompletenessScorer } from './scorer';

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
    const metadataCheck = await this.checkMetadata(spec.header);
    const blocksCheck = await this.checkBlocks(spec.blocks);
    const referencesCheck = await this.checkReferences(spec.content);
    const stepsCheck = await this.checkSteps(spec.blocks);
    
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
  
  private async checkMetadata(header: SpecHeader): Promise<MetadataCheck> {
    return this.metadataValidator.validate(header, this.criteria.metadata);
  }
  
  private async checkBlocks(blocks: SpecBlock[]): Promise<BlocksCheck> {
    return this.blocksValidator.validate(blocks, this.criteria.blocks);
  }
  
  private async checkReferences(content: string): Promise<ReferencesCheck> {
    return this.referencesValidator.validate(content, this.criteria.references);
  }
  
  private async checkSteps(blocks: SpecBlock[]): Promise<StepsCheck> {
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

interface ParsedSpec {
  header: SpecHeader;
  blocks: SpecBlock[];
  content: string;
}

interface SpecHeader {
  id: string;
  version?: string;
  layer?: number;
  project_level?: string;
  agent_support?: string;
  short?: string;
  tags?: string[];
  [key: string]: unknown;
}

interface SpecBlock {
  id: string;
  kind: string;
  content: string;
}
```

#### 3. Metadata Validation (metadata.ts)

```typescript
import { MetadataCheck } from './types';

export class MetadataValidator {
  validate(header: SpecHeader, criteria: { required: string[]; recommended: string[] }): MetadataCheck {
    const present: string[] = [];
    const missing: string[] = [];
    
    // Check required fields
    for (const field of criteria.required) {
      if (header[field] !== undefined && header[field] !== null && header[field] !== '') {
        present.push(field);
      } else {
        missing.push(field);
      }
    }
    
    const passed = missing.length === 0;
    const score = present.length / (criteria.required.length + criteria.recommended.length);
    
    return {
      passed,
      present,
      missing,
      score: Math.round(score * 100) / 100
    };
  }
  
  validateId(id: string): boolean {
    return /^@[a-z][a-z0-9/-]*$/.test(id);
  }
  
  validateVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+/.test(version);
  }
  
  validateLayer(layer: number): boolean {
    return layer >= 0 && layer <= 10;
  }
  
  validateProjectLevel(level: string): boolean {
    const validLevels = ['POC', 'MVP', 'Alpha', 'Beta', 'Production', 'Startup', 'SMB', 'MSB', 'Enterprise'];
    return validLevels.includes(level);
  }
  
  validateAgentSupport(support: string): boolean {
    const validSupports = ['human_only', 'agent_assisted', 'agent_autonomous'];
    return validSupports.includes(support);
  }
}
```

#### 4. Blocks Validation (blocks.ts)

```typescript
import { BlocksCheck } from './types';

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

interface SpecBlock {
  id: string;
  kind: string;
  content: string;
}
```

#### 5. References Validation (references.ts)

```typescript
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
```

#### 6. Steps Validation (steps.ts)

```typescript
import { StepsCheck } from './types';

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

interface SpecBlock {
  id: string;
  kind: string;
  content: string;
}
```

#### 7. Scorer (scorer.ts)

```typescript
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
```

#### 8. Reporter (reporter.ts)

```typescript
import { CompletenessResult } from './types';

export class CompletenessReporter {
  formatHuman(result: CompletenessResult): string {
    const lines: string[] = [];
    
    lines.push('Completeness Check Report');
    lines.push('═'.repeat(50));
    lines.push(`Spec: ${result.specId}`);
    lines.push(`Score: ${result.score.toFixed(2)}/1.00`);
    lines.push(`Status: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);
    lines.push('');
    
    lines.push('Checks:');
    lines.push(`  Metadata:   ${this.formatCheck(result.checks.metadata.passed)} (${result.checks.metadata.present.length}/${result.checks.metadata.present.length + result.checks.metadata.missing.length})`);
    lines.push(`  Blocks:     ${this.formatCheck(result.checks.blocks.passed)} (${result.checks.blocks.total} blocks, ${Object.keys(result.checks.blocks.kinds).length} kinds)`);
    lines.push(`  References: ${this.formatCheck(result.checks.references.passed)} (${result.checks.references.resolved}/${result.checks.references.total})`);
    lines.push(`  Steps:      ${this.formatCheck(result.checks.steps.passed)} (${result.checks.steps.coverage * 100}% coverage)`);
    lines.push('');
    
    if (result.missing.length > 0) {
      lines.push('Missing:');
      for (const m of result.missing) {
        lines.push(`  • ${m}`);
      }
      lines.push('');
    }
    
    if (result.suggestions.length > 0) {
      lines.push('Suggestions:');
      for (const s of result.suggestions) {
        lines.push(`  • ${s}`);
      }
    }
    
    return lines.join('\n');
  }
  
  formatJson(result: CompletenessResult): string {
    return JSON.stringify(result, null, 2);
  }
  
  private formatCheck(passed: boolean): string {
    return passed ? '✓' : '✗';
  }
}
```

## Test Cases
1. Check complete metadata
2. Detect missing required fields
3. Validate block count
4. Detect missing required block kinds
5. Count and validate references
6. Detect unresolved references
7. Check step coverage
8. Calculate correct score
9. Generate suggestions
10. All report formats

## Validation
```bash
bun test tests/validation/completeness.test.ts

# Run checker directly
node -e "
const { CompletenessChecker } = require('./dist/validation/completeness');
const checker = new CompletenessChecker();
checker.check({ header: { id: '@specs/test', version: '1.0.0', layer: 5, project_level: 'Alpha', agent_support: 'agent_autonomous', short: 'Test' }, blocks: [], content: '' }).then(r => console.log(JSON.stringify(r, null, 2)));
"
```

## Output Format
After completing, output:
1. Files created
2. Criteria implemented
3. Test results
