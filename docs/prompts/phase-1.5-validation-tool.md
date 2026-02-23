# Bootstrap Phase 1.5: Autonomous Validation Tool

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.5 of the bootstrap process.

**Prerequisites**: 
- Phase 0 complete (SQLite, Parser, Indexer)
- Phase 1.1-1.4 in progress (Daemon, Agents, Cascade)

## Your Task
Implement the autonomous validation tool that scans `agent_autonomous` specs for completeness and correctness. This tool ensures specs have sufficient detail for fully autonomous agent operation.

## Read These Specs First
1. `specs/validation-tool.spec.md` - Validation tool specification
2. `specs/autonomous-validation.spec.md` - Validation rules
3. `specs/headers.spec.md` - Header requirements

## What to Build

### Files to Create
```
src/validation/
├── index.ts              # Main exports
├── validator.ts          # Main validation logic
├── step-detection.ts     # Step-by-step detection
├── ref-resolution.ts     # Reference resolution
├── ambiguity.ts          # Ambiguity detection
├── scorer.ts             # Confidence scoring
├── reporter.ts           # Report generation
├── cli.ts                # CLI interface
└── types.ts              # TypeScript types

tests/
└── validation.test.ts

bin/
└── speclang-validate     # CLI entry point
```

### Requirements

#### 1. Types (types.ts)

```typescript
interface ValidationResult {
  specId: string;
  agentSupport: string;
  passed: boolean;
  confidence: number;
  checks: CheckResults;
  suggestions: string[];
}

interface CheckResults {
  step_by_step: StepCheckResult;
  references: ReferenceCheckResult;
  ambiguity: AmbiguityCheckResult;
  metadata: MetadataCheckResult;
}

interface StepCheckResult {
  passed: boolean;
  coverage: number;
  missing: string[];
}

interface ReferenceCheckResult {
  passed: boolean;
  resolved: number;
  unresolved: string[];
}

interface AmbiguityCheckResult {
  passed: boolean;
  ambiguousTerms: string[];
}

interface MetadataCheckResult {
  passed: boolean;
  missingFields: string[];
}
```

#### 2. Main Validator (validator.ts)

```typescript
import { StepDetector } from './step-detection';
import { ReferenceResolver } from './ref-resolution';
import { AmbiguityDetector } from './ambiguity';
import { ConfidenceScorer } from './scorer';

export class SpecValidator {
  private stepDetector: StepDetector;
  private refResolver: ReferenceResolver;
  private ambiguityDetector: AmbiguityDetector;
  private scorer: ConfidenceScorer;
  
  constructor(private indexPath: string) {
    this.stepDetector = new StepDetector();
    this.refResolver = new ReferenceResolver(indexPath);
    this.ambiguityDetector = new AmbiguityDetector();
    this.scorer = new ConfidenceScorer();
  }
  
  async validate(filePath: string): Promise<ValidationResult> {
    // 1. Parse header
    const { header, content } = await this.parseFile(filePath);
    
    // 2. Check agent_support level
    if (header.agent_support !== 'agent_autonomous') {
      return this.basicValidation(header);
    }
    
    // 3. Run all checks for autonomous specs
    const checks: CheckResults = {
      step_by_step: await this.checkStepByStep(content),
      references: await this.checkReferences(content),
      ambiguity: await this.checkAmbiguity(content),
      metadata: await this.checkMetadata(header)
    };
    
    // 4. Compute confidence score
    const confidence = this.scorer.compute(checks);
    
    // 5. Generate suggestions
    const suggestions = this.generateSuggestions(checks);
    
    // 6. Determine pass/fail
    const passed = this.determinePass(checks, confidence);
    
    return {
      specId: header.id,
      agentSupport: header.agent_support,
      passed,
      confidence,
      checks,
      suggestions
    };
  }
  
  async validateDirectory(dirPath: string): Promise<ValidationResult[]> {
    const specs = await this.findSpecs(dirPath);
    return Promise.all(specs.map(s => this.validate(s)));
  }
  
  async validateProject(): Promise<ValidationResult[]> {
    const index = await this.loadIndex();
    const specs = Object.keys(index).map(id => index[id].path);
    return Promise.all(specs.map(s => this.validate(s)));
  }
  
  private async checkStepByStep(content: string): Promise<StepCheckResult> {
    const operations = this.extractOperations(content);
    const results = await Promise.all(
      operations.map(op => this.stepDetector.analyze(op))
    );
    
    const totalSteps = results.reduce((sum, r) => sum + r.steps, 0);
    const totalSentences = results.reduce((sum, r) => sum + r.sentences, 0);
    const coverage = totalSentences > 0 ? totalSteps / totalSentences : 0;
    
    const missing = results
      .filter(r => r.coverage < 0.8)
      .map(r => r.blockId);
    
    return {
      passed: coverage >= 0.8,
      coverage,
      missing
    };
  }
  
  private async checkReferences(content: string): Promise<ReferenceCheckResult> {
    const refs = this.extractRefs(content);
    const results = await this.refResolver.resolveAll(refs);
    
    const resolved = results.filter(r => r.resolved).length;
    const unresolved = results.filter(r => !r.resolved).map(r => r.ref);
    
    return {
      passed: unresolved.length === 0,
      resolved,
      unresolved
    };
  }
  
  private async checkAmbiguity(content: string): Promise<AmbiguityCheckResult> {
    const operations = this.extractOperations(content);
    const ambiguousTerms: string[] = [];
    
    for (const op of operations) {
      const detected = this.ambiguityDetector.detect(op.content);
      ambiguousTerms.push(...detected);
    }
    
    return {
      passed: ambiguousTerms.length === 0,
      ambiguousTerms: [...new Set(ambiguousTerms)]
    };
  }
  
  private async checkMetadata(header: any): Promise<MetadataCheckResult> {
    const required = ['id', 'version', 'layer', 'project_level', 'agent_support', 'short'];
    const missing = required.filter(f => !header[f]);
    
    return {
      passed: missing.length === 0,
      missingFields: missing
    };
  }
  
  private determinePass(checks: CheckResults, confidence: number): boolean {
    return (
      checks.step_by_step.passed &&
      checks.references.passed &&
      checks.ambiguity.passed &&
      checks.metadata.passed &&
      confidence >= 0.8
    );
  }
}
```

#### 3. Step Detection (step-detection.ts)

```typescript
interface StepAnalysis {
  blockId: string;
  steps: number;
  sentences: number;
  coverage: number;
}

export class StepDetector {
  private patterns = {
    numbered: /^\s*\d+\.\s+/,
    bulleted: /^\s*[-*•]\s+/,
    imperative: /^(create|write|update|delete|read|fetch|send|process|validate|check|execute|run|build|deploy|configure|initialize|return|handle|parse|extract|generate|compute|calculate)\b/i
  };
  
  private sequenceWords = ['first', 'then', 'next', 'after', 'finally', 'step', 'stage'];
  
  analyze(operation: { blockId: string; content: string }): StepAnalysis {
    const lines = operation.content.split('\n').filter(l => l.trim());
    let steps = 0;
    
    for (const line of lines) {
      if (this.isStep(line)) {
        steps++;
      }
    }
    
    // Count meaningful sentences (approximation)
    const sentences = this.countSentences(operation.content);
    const coverage = sentences > 0 ? steps / sentences : 0;
    
    return {
      blockId: operation.blockId,
      steps,
      sentences,
      coverage
    };
  }
  
  private isStep(line: string): boolean {
    // Check for numbered list
    if (this.patterns.numbered.test(line)) return true;
    
    // Check for bulleted list
    if (this.patterns.bulleted.test(line)) return true;
    
    // Check for imperative sentence
    if (this.patterns.imperative.test(line)) return true;
    
    // Check for sequence words
    const lowerLine = line.toLowerCase();
    if (this.sequenceWords.some(w => lowerLine.includes(w))) return true;
    
    return false;
  }
  
  private countSentences(content: string): number {
    // Simple sentence counting
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.length;
  }
}
```

#### 4. Reference Resolution (ref-resolution.ts)

```typescript
interface RefResult {
  ref: string;
  resolved: boolean;
  target?: string;
}

export class ReferenceResolver {
  private index: Map<string, string>;
  
  constructor(indexPath: string) {
    this.index = new Map();
  }
  
  async loadIndex(indexPath: string): Promise<void> {
    const content = await fs.readFile(indexPath, 'utf-8');
    const data = JSON.parse(content);
    
    for (const [id, spec] of Object.entries(data)) {
      this.index.set(id, (spec as any).path);
      
      // Also index block references
      if ((spec as any).blocks) {
        for (const block of (spec as any).blocks) {
          this.index.set(`${id}#${block}`, (spec as any).path);
        }
      }
    }
  }
  
  async resolveAll(refs: string[]): Promise<RefResult[]> {
    return refs.map(ref => this.resolve(ref));
  }
  
  resolve(ref: string): RefResult {
    // Parse ref format: @domain/path or @domain/path#block
    const cleanRef = ref.replace('@', '');
    
    // Check if it's a special reference
    if (cleanRef === 'northstar' || cleanRef === 'project') {
      return { ref, resolved: true, target: 'special' };
    }
    
    // Look up in index
    const target = this.index.get(cleanRef);
    
    if (target) {
      return { ref, resolved: true, target };
    }
    
    // Try without block reference
    const baseRef = cleanRef.split('#')[0];
    const baseTarget = this.index.get(baseRef);
    
    if (baseTarget) {
      return { ref, resolved: true, target: baseTarget };
    }
    
    return { ref, resolved: false };
  }
}
```

#### 5. Ambiguity Detection (ambiguity.ts)

```typescript
export class AmbiguityDetector {
  private ambiguousTerms = {
    modalVerbs: ['should', 'could', 'might', 'may', 'would'],
    uncertainty: ['maybe', 'perhaps', 'possibly', 'probably'],
    vagueness: ['some', 'few', 'many', 'several', 'various'],
    imprecise: ['etc', 'etc.', 'and so on', 'and more', 'among others'],
    subjective: ['better', 'worse', 'fast', 'slow', 'easy', 'hard', 'good', 'bad']
  };
  
  private ignoreContexts = ['```', '<!--', '# example', '# example:'];
  
  detect(content: string): string[] {
    const detected: string[] = [];
    const lines = content.split('\n');
    let inIgnoreBlock = false;
    
    for (const line of lines) {
      // Track code blocks and comments
      if (line.includes('```')) {
        inIgnoreBlock = !inIgnoreBlock;
        continue;
      }
      
      if (inIgnoreBlock) continue;
      if (this.isInIgnoreContext(line)) continue;
      
      const lowerLine = line.toLowerCase();
      
      for (const [category, terms] of Object.entries(this.ambiguousTerms)) {
        for (const term of terms) {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          if (regex.test(lowerLine)) {
            detected.push(term);
          }
        }
      }
    }
    
    return detected;
  }
  
  private isInIgnoreContext(line: string): boolean {
    const lower = line.toLowerCase();
    return this.ignoreContexts.some(ctx => lower.includes(ctx));
  }
  
  getSuggestions(term: string): string[] {
    const suggestions: Record<string, string[]> = {
      'should': ['must', 'will', 'shall'],
      'could': ['can', 'will', 'is able to'],
      'might': ['will', 'may'],
      'maybe': ['yes/no', 'determined by'],
      'probably': ['deterministically', 'with certainty'],
      'some': ['N specific', 'a defined set of'],
      'many': ['N specific', 'a defined number of'],
      'etc': ['list all items', 'specifically:'],
      'better': ['optimized for X', 'meets criteria Y'],
      'fast': ['< N ms', 'O(N) complexity']
    };
    
    return suggestions[term] || ['Be more specific'];
  }
}
```

#### 6. Confidence Scorer (scorer.ts)

```typescript
export class ConfidenceScorer {
  private weights = {
    step_coverage: 0.4,
    reference_resolution: 0.3,
    ambiguity_score: 0.2,
    metadata_completeness: 0.1
  };
  
  compute(checks: CheckResults): number {
    const stepScore = checks.step_by_step.coverage;
    
    const totalRefs = checks.references.resolved + checks.references.unresolved.length;
    const refScore = totalRefs > 0 ? checks.references.resolved / totalRefs : 1;
    
    // Ambiguity: higher = less ambiguous (invert)
    const ambiguityCount = checks.ambiguity.ambiguousTerms.length;
    const ambiguityScore = Math.max(0, 1 - (ambiguityCount * 0.1));
    
    // Metadata: check all required fields
    const totalFields = 6;
    const presentFields = totalFields - checks.metadata.missingFields.length;
    const metadataScore = presentFields / totalFields;
    
    return (
      stepScore * this.weights.step_coverage +
      refScore * this.weights.reference_resolution +
      ambiguityScore * this.weights.ambiguity_score +
      metadataScore * this.weights.metadata_completeness
    );
  }
  
  getGrade(confidence: number): string {
    if (confidence >= 0.9) return 'Excellent (exemplary spec)';
    if (confidence >= 0.8) return 'Good (fully autonomous)';
    if (confidence >= 0.6) return 'Fair (autonomous with warnings)';
    return 'Poor (downgrade recommended)';
  }
  
  shouldDowngrade(confidence: number): boolean {
    return confidence < 0.6;
  }
  
  needsReview(confidence: number): boolean {
    return confidence < 0.7;
  }
}
```

#### 7. Reporter (reporter.ts)

```typescript
export class ValidationReporter {
  formatJson(result: ValidationResult): string {
    return JSON.stringify(result, null, 2);
  }
  
  formatYaml(result: ValidationResult): string {
    return yaml.stringify(result);
  }
  
  formatHuman(result: ValidationResult): string {
    const lines: string[] = [];
    const status = result.passed ? '✓ PASSED' : '✗ FAILED';
    
    lines.push(`Validation Report: ${result.specId}`);
    lines.push('─'.repeat(40));
    lines.push(`${status} (confidence: ${result.confidence.toFixed(2)})`);
    lines.push('');
    lines.push('Checks:');
    lines.push(`  ${this.formatCheck('Step-by-step', result.checks.step_by_step.passed)}: ${Math.round(result.checks.step_by_step.coverage * 100)}% coverage`);
    lines.push(`  ${this.formatCheck('References', result.checks.references.passed)}: ${result.checks.references.resolved}/${result.checks.references.resolved + result.checks.references.unresolved.length} resolved`);
    lines.push(`  ${this.formatCheck('Ambiguity', result.checks.ambiguity.passed)}: ${result.checks.ambiguity.ambiguousTerms.length} ambiguous terms`);
    lines.push(`  ${this.formatCheck('Metadata', result.checks.metadata.passed)}: ${result.checks.metadata.missingFields.length} missing fields`);
    
    if (result.suggestions.length > 0) {
      lines.push('');
      lines.push('Suggestions:');
      for (const s of result.suggestions) {
        lines.push(`  • ${s}`);
      }
    }
    
    return lines.join('\n');
  }
  
  private formatCheck(name: string, passed: boolean): string {
    return passed ? `✓ ${name}` : `✗ ${name}`;
  }
}
```

#### 8. CLI (cli.ts)

```bash
#!/usr/bin/env node

import { Command } from 'commander';
import { SpecValidator } from './validator';
import { ValidationReporter } from './reporter';

const program = new Command();

program
  .name('speclang-validate')
  .description('Validate SpecLang specs for autonomous agent readiness');

program
  .command('file <path>')
  .description('Validate a single spec file')
  .option('-f, --format <format>', 'Output format: json, yaml, human', 'human')
  .option('--suggest-fixes', 'Show fix suggestions', false)
  .option('--suggest-downgrade', 'Suggest downgrade if low confidence', false)
  .option('--confidence', 'Show confidence breakdown', false)
  .action(async (path, options) => {
    const validator = new SpecValidator('.speclang/_index.json');
    const reporter = new ValidationReporter();
    
    const result = await validator.validate(path);
    
    let output: string;
    switch (options.format) {
      case 'json':
        output = reporter.formatJson(result);
        break;
      case 'yaml':
        output = reporter.formatYaml(result);
        break;
      default:
        output = reporter.formatHuman(result);
    }
    
    console.log(output);
    
    if (!result.passed) {
      process.exit(1);
    }
  });

program
  .command('dir <path>')
  .description('Validate all specs in directory')
  .option('-r, --recursive', 'Recursive scan', false)
  .option('-f, --format <format>', 'Output format', 'human')
  .action(async (path, options) => {
    const validator = new SpecValidator('.speclang/_index.json');
    const reporter = new ValidationReporter();
    
    const results = await validator.validateDirectory(path);
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log(`Validated ${results.length} specs: ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
      console.log('\nFailed specs:');
      for (const r of results.filter(r => !r.passed)) {
        console.log(`  ${r.specId} (confidence: ${r.confidence.toFixed(2)})`);
      }
      process.exit(1);
    }
  });

program
  .command('project')
  .description('Validate all specs in project using index')
  .option('-f, --format <format>', 'Output format', 'human')
  .action(async (options) => {
    const validator = new SpecValidator('.speclang/_index.json');
    
    const results = await validator.validateProject();
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log(`Project validation: ${passed}/${results.length} specs passed`);
    
    if (failed > 0) {
      process.exit(1);
    }
  });

program.parse();
```

## Test Cases
1. Validate spec with complete step-by-step
2. Detect missing step descriptions
3. Resolve all references correctly
4. Detect unresolved references
5. Detect ambiguous terms
6. Ignore ambiguous terms in code blocks
7. Compute correct confidence score
8. Suggest appropriate fixes
9. Suggest downgrade for low confidence
10. Generate all report formats

## Validation
```bash
bun test tests/validation.test.ts

# CLI tests
speclang-validate file specs/auth.spec.md
speclang-validate dir specs/ --recursive
speclang-validate project
speclang-validate file specs/auth.spec.md --format json
```

## Output Format
After completing, output:
1. Files created
2. Validation checks implemented
3. CLI commands available
4. Test results
