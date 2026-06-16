# Bootstrap Phase 4.11: Pipeline Test Stages

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 4.11 of the bootstrap process.

**Prerequisites**: 
- Phase 4.1-4.10 (Pipeline system) complete
- Build stages implemented

## Your Task
Implement the test stage system for the pipeline. Test stages run unit tests, integration tests, and validate generated code correctness.

## Read These Specs First
1. `specs/pipeline.spec.md` - Pipeline overview
2. `specs/stages.spec.md` - Stage definitions
3. `specs/test.spec.md` - Test specifications

## What to Build

### Files to Create
```
src/pipeline/stages/
├── test/
│   ├── index.ts           # Test stage exports
│   ├── types.ts           # Test stage types
│   ├── runner.ts         # Test runner
│   ├── coverage.ts       # Coverage collection
│   ├── watcher.ts        # Test watcher
│   └── reporters.ts      # Test reporters

tests/pipeline/
└── test.test.ts
```

### Requirements

#### 1. Test Stage Types

```typescript
// src/pipeline/stages/test/types.ts

export interface TestStageConfig {
  name: string;
  type: TestType;
  patterns: string[];
  options?: TestOptions;
  coverage?: CoverageConfig;
  depends_on?: string[];
}

export type TestType = 
  | 'unit'
  | 'integration'
  | 'e2e'
  | 'all'
  | 'changed'
  | 'affected';

export interface TestOptions {
  timeout?: number;
  retries?: number;
  parallel?: boolean;
  maxWorkers?: number;
  grep?: string;
  invert?: boolean;
  updateSnapshots?: boolean;
  updateMocks?: boolean;
  clearMocks?: boolean;
  verbose?: boolean;
  coverage?: boolean;
  bail?: boolean;
  ci?: boolean;
}

export interface CoverageConfig {
  enabled: boolean;
  reporter?: ('text' | 'text-summary' | 'lcov' | 'json' | 'html')[];
  outputDirectory?: string;
  thresholds?: CoverageThresholds;
  include?: string[];
  exclude?: string[];
}

export interface CoverageThresholds {
  lines?: number;
  functions?: number;
  statements?: number;
  branches?: number;
}

export interface TestResult {
  stage: string;
  status: 'success' | 'failed' | 'skipped';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage?: CoverageResult;
  failures?: TestFailure[];
  error?: string;
}

export interface TestFailure {
  test: string;
  message: string;
  stack?: string;
  expected?: unknown;
  actual?: unknown;
}

export interface CoverageResult {
  lines: CoverageMetric;
  functions: CoverageMetric;
  statements: CoverageMetric;
  branches: CoverageMetric;
  outputDirectory?: string;
  reporter?: string;
}

export interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}
```

#### 2. Test Runner

```typescript
// src/pipeline/stages/test/runner.ts

import { TestStageConfig, TestResult, TestFailure, CoverageResult } from './types';
import { exec } from '../../utils/exec';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class TestRunner {
  private reporters: TestReporter[] = [];
  
  addReporter(reporter: TestReporter): void {
    this.reporters.push(reporter);
  }
  
  async execute(config: TestStageConfig): Promise<TestResult> {
    const start = Date.now();
    
    this.notifyReporters('start', { config });
    
    const args = this.buildArgs(config);
    
    try {
      const output = await this.runTests(args, config);
      const result = this.parseOutput(output, config);
      
      result.duration = Date.now() - start;
      this.notifyReporters('result', result);
      
      return result;
    } catch (error) {
      const result: TestResult = {
        stage: config.name,
        status: 'failed',
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
      
      this.notifyReporters('error', result);
      return result;
    }
  }
  
  private buildArgs(config: TestStageConfig): string[] {
    const args = ['vitest', 'run'];
    
    if (config.patterns.length > 0) {
      args.push(...config.patterns);
    }
    
    const opts = config.options || {};
    
    if (opts.timeout) args.push('--testTimeout', String(opts.timeout));
    if (opts.retries) args.push('--retry', String(opts.retries));
    if (opts.parallel) args.push('--parallel');
    if (opts.maxWorkers) args.push('--workers', String(opts.maxWorkers));
    if (opts.grep) args.push('--grep', opts.grep);
    if (opts.invert) args.push('--invert');
    if (opts.updateSnapshots) args.push('--update');
    if (opts.updateMocks) args.push('--updateMocks');
    if (opts.clearMocks) args.push('--clearMocks');
    if (opts.verbose) args.push('--verbose');
    if (opts.bail) args.push('--bail');
    if (opts.ci) args.push('--ci');
    
    if (config.coverage?.enabled) {
      args.push('--coverage');
    }
    
    return args;
  }
  
  private async runTests(args: string[], config: TestStageConfig): Promise<string> {
    const cmd = args.join(' ');
    const output = await exec(cmd, { timeout: config.options?.timeout || 60000 });
    return output;
  }
  
  private parseOutput(output: string, config: TestStageConfig): TestResult {
    const result: TestResult = {
      stage: config.name,
      status: 'success',
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: 0,
    };
    
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed|(\d+) failed|(\d+) skipped/);
        if (match) {
          result.passedTests += parseInt(match[1] || '0');
          result.failedTests += parseInt(match[2] || '0');
          result.skippedTests += parseInt(match[3] || '0');
          result.totalTests = result.passedTests + result.failedTests + result.skippedTests;
        }
      }
      
      if (line.includes('FAIL') || line.includes('failed')) {
        result.status = 'failed';
        
        const failure = this.parseFailure(line);
        if (failure) {
          result.failures = result.failures || [];
          result.failures.push(failure);
        }
      }
    }
    
    if (config.coverage?.enabled) {
      result.coverage = this.parseCoverage(config.coverage);
    }
    
    return result;
  }
  
  private parseFailure(line: string): TestFailure | null {
    const match = line.match(/✗ (.+?)(?:\s+(.+))?$/);
    if (match) {
      return {
        test: match[1],
        message: match[2] || 'Test failed',
      };
    }
    return null;
  }
  
  private parseCoverage(config: CoverageConfig): CoverageResult {
    const coverageFile = join(config.outputDirectory || 'coverage', 'coverage-summary.json');
    
    if (!existsSync(coverageFile)) {
      return {
        lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
        functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
        statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
        branches: { total: 0, covered: 0, skipped: 0, pct: 0 },
      };
    }
    
    const data = JSON.parse(readFileSync(coverageFile, 'utf-8'));
    
    return {
      lines: this.extractMetric(data, 'lines'),
      functions: this.extractMetric(data, 'functions'),
      statements: this.extractMetric(data, 'statements'),
      branches: this.extractMetric(data, 'branches'),
      outputDirectory: config.outputDirectory,
    };
  }
  
  private extractMetric(data: Record<string, unknown>, key: string): CoverageMetric {
    const entry = (data[key] || {}) as Record<string, number>;
    return {
      total: entry.total || 0,
      covered: entry.covered || 0,
      skipped: entry.skipped || 0,
      pct: entry.pct || 0,
    };
  }
  
  private notifyReporters(event: string, data: unknown): void {
    for (const reporter of this.reporters) {
      reporter.emit(event, data);
    }
  }
}

export interface TestReporter {
  emit(event: string, data: unknown): void;
}
```

#### 3. Coverage Collector

```typescript
// src/pipeline/stages/test/coverage.ts

import { CoverageConfig, CoverageResult } from './types';
import { exec } from '../../utils/exec';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export class CoverageCollector {
  async collect(config: CoverageConfig): Promise<CoverageResult> {
    const coverageFiles = this.findCoverageFiles(config.outputDirectory);
    
    const results = coverageFiles.map(file => this.mergeCoverage(file));
    const merged = this.mergeResults(results);
    
    if (config.thresholds) {
      this.checkThresholds(merged, config.thresholds);
    }
    
    return merged;
  }
  
  private findCoverageFiles(outputDir?: string): string[] {
    const dir = outputDir || 'coverage';
    const files: string[] = [];
    
    if (existsSync(join(dir, 'coverage-final.json'))) {
      files.push(join(dir, 'coverage-final.json'));
    }
    
    return files;
  }
  
  private mergeCoverage(filepath: string): Record<string, unknown> {
    const data = readFileSync(filepath, 'utf-8');
    return JSON.parse(data);
  }
  
  private mergeResults(results: Record<string, unknown>[]): CoverageResult {
    if (results.length === 0) {
      return this.emptyCoverage();
    }
    
    const merged = results.reduce((acc, result) => {
      for (const key of ['lines', 'functions', 'statements', 'branches']) {
        const metric = this.addMetrics(
          acc[key] as Record<string, number>,
          (result[key] || {}) as Record<string, number>
        );
        (acc as Record<string, unknown>)[key] = metric;
      }
      return acc;
    }, {} as Record<string, unknown>);
    
    return merged as unknown as CoverageResult;
  }
  
  private addMetrics(
    a: Record<string, number>, 
    b: Record<string, number>
  ): Record<string, number> {
    return {
      total: (a.total || 0) + (b.total || 0),
      covered: (a.covered || 0) + (b.covered || 0),
      skipped: (a.skipped || 0) + (b.skipped || 0),
      pct: ((a.pct || 0) + (b.pct || 0)) / 2,
    };
  }
  
  private emptyCoverage(): CoverageResult {
    return {
      lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
      functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
      statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
      branches: { total: 0, covered: 0, skipped: 0, pct: 0 },
    };
  }
  
  private checkThresholds(result: CoverageResult, thresholds: CoverageThresholds): void {
    const failures: string[] = [];
    
    if (thresholds.lines && result.lines.pct < thresholds.lines) {
      failures.push(`Lines coverage ${result.lines.pct}% < ${thresholds.lines}%`);
    }
    
    if (thresholds.functions && result.functions.pct < thresholds.functions) {
      failures.push(`Functions coverage ${result.functions.pct}% < ${thresholds.functions}%`);
    }
    
    if (thresholds.branches && result.branches.pct < thresholds.branches) {
      failures.push(`Branches coverage ${result.branches.pct}% < ${thresholds.branches}%`);
    }
    
    if (failures.length > 0) {
      throw new Error(`Coverage thresholds failed:\n${failures.join('\n')}`);
    }
  }
}
```

#### 4. Test Configuration

```yaml
# test.yaml (extends pipeline config)

stages:
  - name: unit-tests
    type: unit
    patterns:
      - tests/unit/**/*.test.ts
    options:
      timeout: 30000
      retries: 2
      parallel: true
      maxWorkers: 4
      verbose: true
      bail: true
    coverage:
      enabled: true
      reporter: [text-summary, lcov]
      outputDirectory: coverage/unit
      thresholds:
        lines: 80
        functions: 80
        branches: 75

  - name: integration-tests
    type: integration
    patterns:
      - tests/integration/**/*.test.ts
    options:
      timeout: 60000
      retries: 1
    depends_on: [unit-tests]
    coverage:
      enabled: true
      outputDirectory: coverage/integration
```

#### 5. CLI Commands

```bash
# Run all tests
speclang pipeline test

# Run specific test type
speclang pipeline test --type unit

# Run tests with coverage
speclang pipeline test --coverage

# Run tests matching pattern
speclang pipeline test --grep "auth"

# Watch mode
speclang pipeline test --watch

# Update snapshots
speclang pipeline test --update-snapshots
```

## Test Cases
1. Unit tests execute correctly
2. Integration tests run after unit
3. Coverage collection works
4. Coverage thresholds enforced
5. Test failures are reported
6. Parallel execution works
7. Test retry on failure works
8. Test watcher detects changes

## Validation
```bash
bun test tests/pipeline/test.test.ts
speclang pipeline test --dry-run
```

## Output Format
After completing, output:
1. Test stage types defined
2. Test runner implemented
3. Coverage collector working
4. Thresholds enforced
5. Test results
