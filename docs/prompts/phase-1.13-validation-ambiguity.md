# Bootstrap Phase 1.13: Ambiguity Detection

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.13 of the bootstrap process.

**Prerequisites**: 
- Phase 0 complete (SQLite, Parser, Indexer)
- Phase 1.5 (Validation Tool) in progress or complete

## Your Task
Implement the ambiguity detection module for validating `agent_autonomous` specs. This module identifies vague, uncertain, and imprecise language that could prevent autonomous agents from operating reliably.

## Read These Specs First
1. `specs/validation-tool.spec.md` - Validation tool specification
2. `specs/autonomous-validation.spec.md` - Validation rules
3. `specs/ambiguity-detection.spec.md` - Ambiguity patterns

## What to Build

### Files to Create
```
src/validation/
├── ambiguity/
│   ├── index.ts           # Exports
│   ├── detector.ts        # Main detection logic
│   ├── patterns.ts        # Ambiguity patterns
│   ├── context.ts         # Context-aware filtering
│   ├── scorer.ts          # Ambiguity severity scoring
│   └── reporter.ts       # Report generation
```

### Requirements

#### 1. Ambiguity Patterns (patterns.ts)

```typescript
interface AmbiguityPattern {
  category: string;
  terms: string[];
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export const AMBIGUITY_PATTERNS: AmbiguityPattern[] = [
  {
    category: 'modal_verbs_uncertain',
    terms: ['should', 'could', 'might', 'may', 'would'],
    severity: 'medium',
    suggestion: 'Use definitive language: must, will, shall'
  },
  {
    category: 'uncertainty',
    terms: ['maybe', 'perhaps', 'possibly', 'probably', 'likely'],
    severity: 'high',
    suggestion: 'Replace with specific outcome or condition'
  },
  {
    category: 'vagueness_quantifiers',
    terms: ['some', 'few', 'many', 'several', 'various', 'numerous'],
    severity: 'high',
    suggestion: 'Specify exact count or use defined set'
  },
  {
    category: 'imprecision',
    terms: ['etc', 'etc.', 'and so on', 'and more', 'among others'],
    severity: 'high',
    suggestion: 'List all items explicitly or use "specifically:"'
  },
  {
    category: 'subjective_terms',
    terms: ['better', 'worse', 'fast', 'slow', 'easy', 'hard', 'good', 'bad', 'optimal'],
    severity: 'medium',
    suggestion: 'Define specific criteria or measurable threshold'
  },
  {
    category: 'temporal_vague',
    terms: ['soon', 'later', 'eventually', 'sometimes', 'often', 'rarely'],
    severity: 'medium',
    suggestion: 'Specify exact timing or trigger condition'
  },
  {
    category: 'ambiguous_pronouns',
    terms: ['it', 'they', 'this', 'that', 'these', 'those'],
    severity: 'low',
    suggestion: 'Replace with specific noun'
  },
  {
    category: 'conditional_weak',
    terms: ['if possible', 'if needed', 'as appropriate', 'when necessary'],
    severity: 'medium',
    suggestion: 'Specify exact condition or always execute'
  }
];

export class AmbiguityPatterns {
  private patterns: Map<string, AmbiguityPattern>;
  
  constructor() {
    this.patterns = new Map();
    for (const pattern of AMBIGUITY_PATTERNS) {
      for (const term of pattern.terms) {
        this.patterns.set(term.toLowerCase(), pattern);
      }
    }
  }
  
  get(term: string): AmbiguityPattern | undefined {
    return this.patterns.get(term.toLowerCase());
  }
  
  getByCategory(category: string): AmbiguityPattern[] {
    return AMBIGUITY_PATTERNS.filter(p => p.category === category);
  }
  
  getAllTerms(): string[] {
    return Array.from(this.patterns.keys());
  }
}
```

#### 2. Context-Aware Filtering (context.ts)

```typescript
interface ContextFilter {
  ignorePatterns: RegExp[];
  ignoreRegions: { start: RegExp; end: RegExp }[];
}

export class ContextFilter {
  private filter: ContextFilter;
  
  constructor() {
    this.filter = {
      ignorePatterns: [
        /^```\w*/,           // Code blocks
        /^```$/,             // End code block
        /^<!--/,             // HTML comments
        /^\/\*/,             // Block comments start
        /\*\/$/,             // Block comments end
        /^#.*example/i,      // Example headers
        /^#.*note:/i,        // Note headers
      ],
      ignoreRegions: [
        { start: /```/, end: /```/ },
        { start: /<!--/, end: /-->/ },
        { start: /\/\*/, end: /\*\// },
      ]
    };
  }
  
  shouldIgnore(line: string): boolean {
    for (const pattern of this.filter.ignorePatterns) {
      if (pattern.test(line.trim())) {
        return true;
      }
    }
    return false;
  }
  
  filterContent(lines: string[]): string[] {
    const result: string[] = [];
    let inIgnoredRegion = false;
    let currentRegion: { start: RegExp; end: RegExp } | null = null;
    
    for (const line of lines) {
      // Check for region start
      if (!inIgnoredRegion) {
        for (const region of this.filter.ignoreRegions) {
          if (region.start.test(line)) {
            inIgnoredRegion = true;
            currentRegion = region;
            break;
          }
        }
      }
      
      // Check for region end
      if (inIgnoredRegion && currentRegion) {
        if (currentRegion.end.test(line)) {
          inIgnoredRegion = false;
          currentRegion = null;
        }
        continue;
      }
      
      // Add non-ignored lines
      if (!this.shouldIgnore(line)) {
        result.push(line);
      }
    }
    
    return result;
  }
  
  extractCodeBlocks(content: string): string[] {
    const blocks: string[] = [];
    const regex = /```(\w*)\n([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      blocks.push(match[2]);
    }
    
    return blocks;
  }
}
```

#### 3. Main Detector (detector.ts)

```typescript
import { AmbiguityPatterns } from './patterns';
import { ContextFilter } from './context';
import { AmbiguityScorer } from './scorer';

export interface AmbiguityFinding {
  term: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  line: number;
  content: string;
  suggestion: string;
}

export interface AmbiguityReport {
  totalFindings: number;
  bySeverity: { low: number; medium: number; high: number };
  byCategory: Record<string, number>;
  findings: AmbiguityFinding[];
  score: number;
  passed: boolean;
}

export class AmbiguityDetector {
  private patterns: AmbiguityPatterns;
  private filter: ContextFilter;
  private scorer: AmbiguityScorer;
  
  constructor() {
    this.patterns = new AmbiguityPatterns();
    this.filter = new ContextFilter();
    this.scorer = new AmbiguityScorer();
  }
  
  detect(content: string): AmbiguityReport {
    const findings: AmbiguityFinding[] = [];
    const lines = content.split('\n');
    const filteredLines = this.filter.filterContent(lines);
    
    for (let i = 0; i < filteredLines.length; i++) {
      const line = filteredLines[i];
      const lineNumber = lines.indexOf(line) + 1;
      
      const lineFindings = this.detectLine(line, lineNumber);
      findings.push(...lineFindings);
    }
    
    const bySeverity = this.aggregateBySeverity(findings);
    const byCategory = this.aggregateByCategory(findings);
    const score = this.scorer.compute(findings);
    const passed = this.determinePass(findings);
    
    return {
      totalFindings: findings.length,
      bySeverity,
      byCategory,
      findings,
      score,
      passed
    };
  }
  
  private detectLine(line: string, lineNumber: number): AmbiguityFinding[] {
    const findings: AmbiguityFinding[] = [];
    const terms = this.patterns.getAllTerms();
    
    for (const term of terms) {
      const pattern = this.createTermPattern(term);
      const matches = line.matchAll(pattern);
      
      for (const match of matches) {
        const patternInfo = this.patterns.get(term);
        if (!patternInfo) continue;
        
        findings.push({
          term: match[0],
          category: patternInfo.category,
          severity: patternInfo.severity,
          line: lineNumber,
          content: line.trim(),
          suggestion: patternInfo.suggestion
        });
      }
    }
    
    return findings;
  }
  
  private createTermPattern(term: string): RegExp {
    return new RegExp(`\\b${term}\\b`, 'gi');
  }
  
  private aggregateBySeverity(findings: AmbiguityFinding[]): { low: number; medium: number; high: number } {
    return {
      low: findings.filter(f => f.severity === 'low').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      high: findings.filter(f => f.severity === 'high').length
    };
  }
  
  private aggregateByCategory(findings: AmbiguityFinding[]): Record<string, number> {
    const categories: Record<string, number> = {};
    
    for (const finding of findings) {
      categories[finding.category] = (categories[finding.category] || 0) + 1;
    }
    
    return categories;
  }
  
  private determinePass(findings: AmbiguityFinding[]): boolean {
    const highSeverity = findings.filter(f => f.severity === 'high').length;
    const mediumSeverity = findings.filter(f => f.severity === 'medium').length;
    
    return highSeverity === 0 && mediumSeverity <= 2;
  }
  
  detectInBlock(block: { id: string; content: string }): AmbiguityFinding[] {
    return this.detect(block.content).findings.map(f => ({
      ...f,
      term: `${block.id}:${f.term}`
    }));
  }
}
```

#### 4. Severity Scorer (scorer.ts)

```typescript
export class AmbiguityScorer {
  private severityWeights = {
    low: 0.1,
    medium: 0.3,
    high: 1.0
  };
  
  private categoryWeights: Record<string, number> = {
    uncertainty: 1.0,
    vagueness_quantifiers: 1.0,
    imprecision: 0.9,
    modal_verbs_uncertain: 0.5,
    subjective_terms: 0.5,
    temporal_vague: 0.4,
    conditional_weak: 0.5,
    ambiguous_pronouns: 0.2
  };
  
  compute(findings: AmbiguityFinding[]): number {
    if (findings.length === 0) {
      return 1.0;
    }
    
    let totalPenalty = 0;
    
    for (const finding of findings) {
      const severityWeight = this.severityWeights[finding.severity];
      const categoryWeight = this.categoryWeights[finding.category] || 0.5;
      
      totalPenalty += severityWeight * categoryWeight;
    }
    
    // Normalize to 0-1 scale
    const score = Math.max(0, 1 - totalPenalty);
    return Math.round(score * 100) / 100;
  }
  
  getGrade(score: number): string {
    if (score >= 0.9) return 'Excellent - No ambiguity detected';
    if (score >= 0.7) return 'Good - Minor ambiguity';
    if (score >= 0.5) return 'Fair - Moderate ambiguity';
    return 'Poor - High ambiguity';
  }
  
  shouldFail(score: number): boolean {
    return score < 0.5;
  }
}
```

#### 5. Reporter (reporter.ts)

```typescript
import { AmbiguityReport, AmbiguityFinding } from './detector';

export class AmbiguityReporter {
  formatHuman(report: AmbiguityReport): string {
    const lines: string[] = [];
    
    lines.push('Ambiguity Detection Report');
    lines.push('═'.repeat(50));
    lines.push(`Total findings: ${report.totalFindings}`);
    lines.push(`Score: ${report.score.toFixed(2)}/1.00`);
    lines.push(`Status: ${report.passed ? '✓ PASSED' : '✗ FAILED'}`);
    lines.push('');
    
    lines.push('By Severity:');
    lines.push(`  High:   ${report.bySeverity.high}`);
    lines.push(`  Medium: ${report.bySeverity.medium}`);
    lines.push(`  Low:    ${report.bySeverity.low}`);
    lines.push('');
    
    if (report.findings.length > 0) {
      lines.push('Findings:');
      for (const finding of report.findings) {
        lines.push(`  [${finding.severity.toUpperCase()}] Line ${finding.line}: "${finding.term}"`);
        lines.push(`    → ${finding.suggestion}`);
      }
    }
    
    return lines.join('\n');
  }
  
  formatJson(report: AmbiguityReport): string {
    return JSON.stringify(report, null, 2);
  }
  
  formatCsv(report: AmbiguityReport): string {
    const lines = ['term,category,severity,line,suggestion'];
    
    for (const finding of report.findings) {
      lines.push([
        finding.term,
        finding.category,
        finding.severity,
        finding.line.toString(),
        `"${finding.suggestion}"`
      ].join(','));
    }
    
    return lines.join('\n');
  }
}
```

#### 6. Main Exports (index.ts)

```typescript
export * from './detector';
export * from './patterns';
export * from './context';
export * from './scorer';
export * from './reporter';

export { AmbiguityDetector } from './detector';
export { AmbiguityPatterns, AMBIGUITY_PATTERNS } from './patterns';
export { AmbiguityScorer } from './scorer';
export { AmbiguityReporter } from './reporter';
```

## Test Cases
1. Detect modal verbs (should, could, might)
2. Detect uncertainty words (maybe, perhaps)
3. Detect vague quantifiers (some, many)
4. Detect imprecision (etc, and so on)
5. Ignore code blocks
6. Ignore comments
7. Score severity correctly
8. Generate all report formats
9. Pass/fail determination works
10. Per-block detection works

## Validation
```bash
bun test tests/validation/ambiguity.test.ts

# Run detector directly
node -e "
const { AmbiguityDetector } = require('./dist/validation/ambiguity');
const d = new AmbiguityDetector();
const r = d.detect('The spec should handle errors. Maybe it works.');
console.log(JSON.stringify(r, null, 2));
"
```

## Output Format
After completing, output:
1. Files created
2. Patterns implemented
3. Test results
