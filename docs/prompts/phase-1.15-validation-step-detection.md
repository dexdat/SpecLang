# Bootstrap Phase 1.15: Step-by-Step Detection

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.15 of the bootstrap process.

**Prerequisites**: 
- Phase 0 complete (SQLite, Parser, Indexer)
- Phase 1.5 (Validation Tool) in progress
- Phase 1.14 (Completeness Checking) complete

## Your Task
Implement the step-by-step detection module that identifies whether operation blocks contain sufficient step-by-step descriptions for autonomous agents to execute.

## Read These Specs First
1. `specs/validation-tool.spec.md` - Validation tool specification
2. `specs/step-detection.spec.md` - Step detection patterns
3. `specs/autonomous-validation.spec.md` - Validation rules

## What to Build

### Files to Create
```
src/validation/
├── step-detection/
│   ├── index.ts           # Exports
│   ├── detector.ts        # Main step detection
│   ├── patterns.ts        # Step patterns
│   ├── analyzer.ts        # Content analysis
│   ├── scorer.ts          # Coverage scoring
│   └── reporter.ts        # Report generation
```

### Requirements

#### 1. Step Patterns (patterns.ts)

```typescript
export interface StepPattern {
  type: 'numbered' | 'bulleted' | 'imperative' | 'sequence' | 'conditional';
  pattern: RegExp;
  weight: number;
  description: string;
}

export const STEP_PATTERNS: StepPattern[] = [
  // Numbered lists: "1. Do this"
  {
    type: 'numbered',
    pattern: /^\s*\d+[\.\)]\s+/,
    weight: 1.0,
    description: 'Numbered list item'
  },
  
  // Bulleted lists: "- Do this", "* Do this", "• Do this"
  {
    type: 'bulleted',
    pattern: /^\s*[-*•▸→]\s+/,
    weight: 0.9,
    description: 'Bulleted list item'
  },
  
  // Imperative verbs: "Create the file", "Update the database"
  {
    type: 'imperative',
    pattern: /^(create|write|update|delete|read|fetch|send|process|validate|check|execute|run|build|deploy|configure|initialize|return|handle|parse|extract|generate|compute|calculate|verify|ensure|implement|add|remove|modify|transform|convert|format|serialize|deserialize|encode|decode|encrypt|decrypt|compress|decompress|copy|move|rename|backup|restore|install|uninstall|start|stop|restart|enable|disable|connect|disconnect|authenticate|authorize|log|notify|trigger|cancel|abort|retry|timeout|sleep|wait|acquire|release|lock|unlock|commit|rollback|save|load|open|close|submit|approve|reject|accept|deny|allow|block|filter|sort|group|paginate|cache|invalidate|refresh|sync|merge|split|join|append|prepend|insert|delete|update|set|get|list|count|sum|average|min|max|check|test|debug|trace|log|profile|optimize|monitor|alert|scale|balance|distribute|route|forward|redirect|proxy|gateway|bridge|tunnel|pipe|stream|batch|queue|dequeue)\b/i,
    weight: 0.85,
    description: 'Imperative verb sentence'
  },
  
  // Sequence words: "First do X, then do Y"
  {
    type: 'sequence',
    pattern: /^(first|then|next|finally|last|after|before|when|once|upon|step|stage|phase|step\s+\d+|stage\s+\d+|phase\s+\d+)\b/i,
    weight: 0.95,
    description: 'Sequence indicator'
  },
  
  // Conditional steps: "If X, then do Y"
  {
    type: 'conditional',
    pattern: /^(if|unless|when|whenever|while|until|provided|assuming|given|should|check\s+whether)\b/i,
    weight: 0.7,
    description: 'Conditional step'
  }
];

export class StepPatternMatcher {
  private patterns: StepPattern[];
  
  constructor(patterns: StepPattern[] = STEP_PATTERNS) {
    this.patterns = patterns;
  }
  
  match(line: string): StepPattern | null {
    for (const pattern of this.patterns) {
      if (pattern.pattern.test(line.trim())) {
        return pattern;
      }
    }
    return null;
  }
  
  getWeight(line: string): number {
    const matched = this.match(line);
    return matched ? matched.weight : 0;
  }
  
  getType(line: string): string | null {
    const matched = this.match(line);
    return matched ? matched.type : null;
  }
}
```

#### 2. Content Analyzer (analyzer.ts)

```typescript
export interface BlockAnalysis {
  blockId: string;
  lines: number;
  sentences: number;
  steps: StepInfo[];
  stepTypes: Record<string, number>;
  hasIntroduction: boolean;
  hasConclusion: boolean;
  coverage: number;
}

export interface StepInfo {
  line: number;
  content: string;
  type: string;
  weight: number;
  isStep: boolean;
}

export class ContentAnalyzer {
  private matcher: StepPatternMatcher;
  
  constructor() {
    this.matcher = new StepPatternMatcher();
  }
  
  analyze(block: { id: string; content: string }): BlockAnalysis {
    const lines = block.content.split('\n').filter(l => l.trim());
    const sentences = this.countSentences(block.content);
    const steps: StepInfo[] = [];
    const stepTypes: Record<string, number> = {};
    let hasIntroduction = false;
    let hasConclusion = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const pattern = this.matcher.match(line);
      const isStep = pattern !== null;
      
      steps.push({
        line: i + 1,
        content: line,
        type: pattern?.type || 'none',
        weight: pattern?.weight || 0,
        isStep
      });
      
      if (isStep) {
        stepTypes[pattern.type] = (stepTypes[pattern.type] || 0) + 1;
      }
      
      // Check for introduction
      if (i < 2 && /^(overview|introduction|summary|description|this\s+(spec|document|describes))/i.test(line)) {
        hasIntroduction = true;
      }
      
      // Check for conclusion
      if (i >= lines.length - 2 && /^(in\s+summary|to\s+sum|conclusion|finally|overall|thus|therefore)/i.test(line)) {
        hasConclusion = true;
      }
    }
    
    const totalSentences = Math.max(sentences, 1);
    const stepsCount = steps.filter(s => s.isStep).length;
    const coverage = stepsCount / totalSentences;
    
    return {
      blockId: block.id,
      lines: lines.length,
      sentences,
      steps,
      stepTypes,
      hasIntroduction,
      hasConclusion,
      coverage: Math.round(coverage * 100) / 100
    };
  }
  
  private countSentences(content: string): number {
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
    return Math.max(sentences.length, 1);
  }
  
  getImperativeRatio(content: string): number {
    const lines = content.split('\n').filter(l => l.trim());
    let imperative = 0;
    
    for (const line of lines) {
      if (this.matcher.getType(line) === 'imperative') {
        imperative++;
      }
    }
    
    return lines.length > 0 ? imperative / lines.length : 0;
  }
}
```

#### 3. Main Detector (detector.ts)

```typescript
import { StepPatternMatcher } from './patterns';
import { ContentAnalyzer, BlockAnalysis } from './analyzer';
import { StepScorer } from './scorer';

export interface StepDetectionResult {
  specId: string;
  blocks: BlockAnalysis[];
  totalSteps: number;
  totalSentences: number;
  coverage: number;
  passed: boolean;
  missingBlocks: string[];
  recommendations: string[];
}

export class StepDetector {
  private matcher: StepPatternMatcher;
  private analyzer: ContentAnalyzer;
  private scorer: StepScorer;
  
  constructor() {
    this.matcher = new StepPatternMatcher();
    this.analyzer = new ContentAnalyzer();
    this.scorer = new StepScorer();
  }
  
  detect(spec: { id: string; blocks: { id: string; content: string }[] }): StepDetectionResult {
    const blockAnalyses: BlockAnalysis[] = [];
    const missingBlocks: string[] = [];
    let totalSteps = 0;
    let totalSentences = 0;
    
    for (const block of spec.blocks) {
      const analysis = this.analyzer.analyze(block);
      blockAnalyses.push(analysis);
      
      totalSteps += analysis.steps.filter(s => s.isStep).length;
      totalSentences += analysis.sentences;
      
      if (analysis.coverage < 0.5) {
        missingBlocks.push(block.id);
      }
    }
    
    const coverage = totalSentences > 0 ? totalSteps / totalSentences : 0;
    const passed = this.determinePass(blockAnalyses, coverage);
    const recommendations = this.generateRecommendations(blockAnalyses, coverage);
    
    return {
      specId: spec.id,
      blocks: blockAnalyses,
      totalSteps,
      totalSentences,
      coverage: Math.round(coverage * 100) / 100,
      passed,
      missingBlocks,
      recommendations
    };
  }
  
  detectBlock(block: { id: string; content: string }): BlockAnalysis {
    return this.analyzer.analyze(block);
  }
  
  private determinePass(analyses: BlockAnalysis[], coverage: number): boolean {
    const minCoverage = 0.5;
    
    if (coverage < minCoverage) {
      return false;
    }
    
    const blocksWithSteps = analyses.filter(a => a.steps.filter(s => s.isStep).length >= 2).length;
    const blocksWithoutSteps = analyses.filter(a => a.steps.filter(s => s.isStep).length < 2).length;
    
    // Allow some blocks without steps if most have steps
    if (analyses.length > 3 && blocksWithoutSteps > analyses.length * 0.3) {
    }
    
    return true;
       return false;
 }
  
  private generateRecommendations(analyses: BlockAnalysis[], coverage: number): string[] {
    const recommendations: string[] = [];
    
    if (coverage < 0.5) {
      recommendations.push('Increase step-by-step descriptions in operation blocks');
    }
    
    const weakBlocks = analyses.filter(a => a.steps.filter(s => s.isStep).length < 2);
    if (weakBlocks.length > 0) {
      recommendations.push(`Add more steps to blocks: ${weakBlocks.map(b => b.blockId).join(', ')}`);
    }
    
    for (const analysis of analyses) {
      if (!analysis.hasIntroduction) {
        recommendations.push(`Add introduction to block: ${analysis.blockId}`);
      }
      if (!analysis.hasConclusion) {
        recommendations.push(`Add conclusion/summary to block: ${analysis.blockId}`);
      }
    }
    
    const types = new Set<string>();
    for (const analysis of analyses) {
      for (const step of analysis.steps) {
        if (step.isStep) types.add(step.type);
      }
    }
    
    if (!types.has('numbered') && !types.has('bulleted')) {
      recommendations.push('Use numbered or bulleted lists for clearer steps');
    }
    
    if (!types.has('sequence')) {
      recommendations.push('Add sequence indicators (First, Then, Finally) to show order');
    }
    
    return recommendations;
  }
  
  countStepsInLine(line: string): number {
    let count = 0;
    const subSteps = line.split(/[;,]|(?=\bthen\b)|(?=\band\b)/);
    
    for (const subStep of subSteps) {
      if (this.matcher.match(subStep.trim())) {
        count++;
      }
    }
    
    return Math.max(count, this.matcher.match(line) ? 1 : 0);
  }
}
```

#### 4. Coverage Scorer (scorer.ts)

```typescript
export class StepScorer {
  private minCoverage = 0.5;
  private goodCoverage = 0.8;
  private excellentCoverage = 0.9;
  
  compute(analyses: { steps: { isStep: boolean }[]; sentences: number }[], coverage: number): number {
    let blockScores = 0;
    
    for (const analysis of analyses) {
      const stepCount = analysis.steps.filter(s => s.isStep).length;
      const sentences = Math.max(analysis.sentences, 1);
      
      const blockCoverage = Math.min(stepCount / sentences, 1);
      blockScores += blockCoverage;
    }
    
    const avgBlockScore = analyses.length > 0 ? blockScores / analyses.length : 0;
    const finalScore = (avgBlockScore * 0.6) + (coverage * 0.4);
    
    return Math.round(finalScore * 100) / 100;
  }
  
  getGrade(coverage: number): string {
    if (coverage >= this.excellentCoverage) return 'Excellent - Comprehensive steps';
    if (coverage >= this.goodCoverage) return 'Good - Sufficient steps';
    if (coverage >= this.minCoverage) return 'Fair - Some steps';
    return 'Poor - Insufficient steps';
  }
  
  shouldFail(coverage: number): boolean {
    return coverage < this.minCoverage;
  }
  
  getBreakdown(analyses: { blockId: string; steps: { isStep: boolean }[]; sentences: number }[]): Record<string, { steps: number; sentences: number; coverage: number }> {
    const breakdown: Record<string, { steps: number; sentences: number; coverage: number }> = {};
    
    for (const analysis of analyses) {
      const steps = analysis.steps.filter(s => s.isStep).length;
      const sentences = analysis.sentences;
      const coverage = sentences > 0 ? steps / sentences : 0;
      
      breakdown[analysis.blockId] = {
        steps,
        sentences,
        coverage: Math.round(coverage * 100) / 100
      };
    }
    
    return breakdown;
  }
}
```

#### 5. Reporter (reporter.ts)

```typescript
import { StepDetectionResult, BlockAnalysis } from './detector';

export class StepReporter {
  formatHuman(result: StepDetectionResult): string {
    const lines: string[] = [];
    
    lines.push('Step-by-Step Detection Report');
    lines.push('═'.repeat(50));
    lines.push(`Spec: ${result.specId}`);
    lines.push(`Total Steps: ${result.totalSteps}`);
    lines.push(`Total Sentences: ${result.totalSentences}`);
    lines.push(`Coverage: ${(result.coverage * 100).toFixed(1)}%`);
    lines.push(`Status: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);
    lines.push('');
    
    lines.push('Block Breakdown:');
    for (const block of result.blocks) {
      const stepCount = block.steps.filter(s => s.isStep).length;
      const types = Object.entries(block.stepTypes)
        .map(([type, count]) => `${type}:${count}`)
        .join(', ');
      lines.push(`  ${block.blockId}: ${stepCount} steps (${types}) - ${block.coverage * 100}%`);
    }
    lines.push('');
    
    if (result.missingBlocks.length > 0) {
      lines.push('Blocks needing more steps:');
      for (const blockId of result.missingBlocks) {
        lines.push(`  • ${blockId}`);
      }
      lines.push('');
    }
    
    if (result.recommendations.length > 0) {
      lines.push('Recommendations:');
      for (const rec of result.recommendations) {
        lines.push(`  • ${rec}`);
      }
    }
    
    return lines.join('\n');
  }
  
  formatJson(result: StepDetectionResult): string {
    return JSON.stringify(result, null, 2);
  }
  
  formatMarkdown(result: StepDetectionResult): string {
    const lines: string[] = [];
    
    lines.push(`# Step Detection: ${result.specId}`);
    lines.push('');
    lines.push(`**Coverage:** ${(result.coverage * 100).toFixed(1)}% | **Status:** ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);
    lines.push('');
    lines.push('## Blocks');
    lines.push('');
    lines.push('| Block | Steps | Sentences | Coverage |');
    lines.push('|-------|-------|-----------|----------|');
    
    for (const block of result.blocks) {
      const stepCount = block.steps.filter(s => s.isStep).length;
      lines.push(`| ${block.blockId} | ${stepCount} | ${block.sentences} | ${block.coverage * 100}% |`);
    }
    
    if (result.recommendations.length > 0) {
      lines.push('');
      lines.push('## Recommendations');
      lines.push('');
      for (const rec of result.recommendations) {
        lines.push(`- ${rec}`);
      }
    }
    
    return lines.join('\n');
  }
}
```

#### 6. Main Exports (index.ts)

```typescript
export * from './detector';
export * from './patterns';
export * from './analyzer';
export * from './scorer';
export * from './reporter';

export { StepDetector, StepDetectionResult } from './detector';
export { StepPatternMatcher, STEP_PATTERNS, StepPattern } from './patterns';
export { ContentAnalyzer, BlockAnalysis, StepInfo } from './analyzer';
export { StepScorer } from './scorer';
export { StepReporter } from './reporter';
```

## Test Cases
1. Detect numbered list steps
2. Detect bulleted list steps
3. Detect imperative steps
4. Detect sequence indicators
5. Calculate coverage correctly
6. Pass/fail determination works
7. Generate recommendations
8. All report formats
9. Per-block analysis
10. Ignore non-content lines

## Validation
```bash
bun test tests/validation/step-detection.test.ts

# Run detector directly
node -e "
const { StepDetector } = require('./dist/validation/step-detection');
const d = new StepDetector();
const r = d.detect({ id: '@specs/test', blocks: [{ id: 'test-block', content: '1. First step\\n2. Second step\\n3. Third step' }] });
console.log(JSON.stringify(r, null, 2));
"
```

## Output Format
After completing, output:
1. Files created
2. Step patterns implemented
3. Test results
