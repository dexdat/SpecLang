/**
 * SPECLANG-BENCHMARK: Real performance benchmarks using actual project modules
 *
 * Tests the real indexer, assembler, and graph analysis pipelines
 * using the actual specs/ directory as data source.
 *
 * Requires: RUN_BENCHMARKS=1 to execute (skipped by default for CI)
 *
 * NOTE: The CLI benchmark uses direct module invocation within vitest rather
 * than an external subprocess because npx tsx has module resolution issues
 * with .spec.md files in the import chain. vitest handles them correctly.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { generateIndex } from '../../src/indexer/index.js';
import {
  buildDependencyGraph,
  detectCycles,
  getTransitiveDependencies,
  findOrphans,
} from '../../src/indexer/graph.js';

// ============================================================================
// Benchmark infrastructure (same pattern as existing daemon.test.ts)
// ============================================================================

interface BenchmarkResult {
  name: string;
  samples: number[];
  mean_ms: number;
  median_ms: number;
  p90_ms: number;
  p95_ms: number;
  p99_ms: number;
  min_ms: number;
  max_ms: number;
  std_dev: number;
  pass: boolean;
  target_met: boolean;
  regression: boolean;
}

function calculateStats(samples: number[], target: number, max: number): BenchmarkResult {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / sorted.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p90 = sorted[Math.floor(sorted.length * 0.9)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const min = sorted[0];
  const max_val = sorted[sorted.length - 1];
  const squaredDiffs = samples.map(x => Math.pow(x - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / samples.length;
  const std_dev = Math.sqrt(variance);
  const target_met = mean <= target;
  const pass = max_val <= max;
  return {
    name: '',
    samples,
    mean_ms: mean,
    median_ms: median,
    p90_ms: p90,
    p95_ms: p95,
    p99_ms: p99,
    min_ms: min,
    max_ms: max_val,
    std_dev,
    pass,
    target_met,
    regression: false,
  };
}

function formatStats(label: string, r: BenchmarkResult, extra: string[] = []): void {
  console.log(`  ${label}:`);
  console.log(`    Mean: ${r.mean_ms.toFixed(1)}ms  Median: ${r.median_ms.toFixed(1)}ms  P90: ${r.p90_ms.toFixed(1)}ms`);
  console.log(`    P95: ${r.p95_ms.toFixed(1)}ms  P99: ${r.p99_ms.toFixed(1)}ms  Min: ${r.min_ms.toFixed(1)}ms  Max: ${r.max_ms.toFixed(1)}ms`);
  console.log(`    StdDev: ${r.std_dev.toFixed(1)}ms  Samples: ${r.samples.length}`);
  for (const e of extra) console.log(`    ${e}`);
}

// ============================================================================
// Helpers
// ============================================================================

function createBenchSpec(): string {
  const outputDir = '/tmp/speclang-bench-assembly';
  fs.mkdirSync(outputDir, { recursive: true });
  const specPath = path.join(outputDir, 'bench-test.spec.md');
  const outputPath = path.join(outputDir, 'bench-output.ts');

  const specContent = [
    '---',
    'id: "@bench/assembly-test"',
    'version: 1.0.0',
    'layer: 5',
    'target_lang: ts',
    `output: "${outputPath}"`,
    'tags: [bench, test]',
    'short: "Benchmark assembly test spec"',
    '---',
    '',
    '# Benchmark Assembly Test',
    '',
    '## Implementation',
    '',
    '```typescript',
    'export function hello(): string {',
    '  return "hello, world!";',
    '}',
    '',
    'export function add(a: number, b: number): number {',
    '  return a + b;',
    '}',
    '```',
    '',
    '### @block:extra @kind:function',
    '',
    '```typescript',
    'export function multiply(a: number, b: number): number {',
    '  return a * b;',
    '}',
    '```',
  ].join('\n');

  fs.writeFileSync(specPath, specContent, 'utf-8');
  return specPath;
}

// ============================================================================
// Benchmarks — skipped by default, run with RUN_BENCHMARKS=1
// ============================================================================

describe.skipIf(!process.env.RUN_BENCHMARKS)('SpecLang Real Benchmarks', () => {

  // ────────────────────────────────────────────────────────────────
  // 1. Index Build Benchmark — uses real generateIndex on specs/
  // ────────────────────────────────────────────────────────────────
  describe('Index Build (generateIndex)', () => {
    const TARGET_MS = 60000;
    const MAX_MS = 120000;
    let results: BenchmarkResult;
    let specCount: number;
    let cycleCount: number;
    let orphanCount: number;

    beforeAll(() => {
      const samples: number[] = [];

      for (let i = 0; i < 1; i++) {
        const start = performance.now();
        const index = generateIndex({ rootDir: 'specs', outputPath: undefined });
        const end = performance.now();
        specCount = Object.keys(index.specs).length;
        cycleCount = index.cycles.length;
        orphanCount = index.orphans.length;
        samples.push(end - start);
      }

      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        const index = generateIndex({ rootDir: 'specs', outputPath: undefined });
        const end = performance.now();
        samples.push(end - start);
      }

      results = calculateStats(samples, TARGET_MS, MAX_MS);
      results.name = 'index_build';
    });

    it('should discover spec files and build index', () => {
      expect(specCount).toBeGreaterThan(0);
    });

    it('should meet target execution time', () => {
      expect(results.mean_ms).toBeLessThanOrEqual(TARGET_MS);
    });

    it('should not exceed max execution time', () => {
      expect(results.max_ms).toBeLessThanOrEqual(MAX_MS);
    });

    it('should report timing stats', () => {
      formatStats('Index Build', results, [
        `Specs: ${specCount}  Cycles: ${cycleCount}  Orphans: ${orphanCount}`,
      ]);
      expect(results).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 2. Complexity/Graph Analysis — real graph ops on generated index
  // ────────────────────────────────────────────────────────────────
  describe('Graph Analysis (dependency graph)', () => {
    const TARGET_MS = 5000;
    const MAX_MS = 30000;
    let results: BenchmarkResult;
    let graphStats: { nodeCount: number; dependencyEdges: number; cycleCount: number; orphanCount: number };

    beforeAll(() => {
      const index = generateIndex({ rootDir: 'specs', outputPath: undefined });
      const entries = Object.values(index.specs);

      graphStats = {
        nodeCount: entries.length,
        dependencyEdges: Object.values(index.graph.dependencies).reduce((s, a) => s + a.length, 0),
        cycleCount: index.cycles.length,
        orphanCount: index.orphans.length,
      };

      const samples: number[] = [];

      for (let i = 0; i < 1; i++) {
        const start = performance.now();
        buildDependencyGraph(entries);
        detectCycles(index.graph.dependencies);
        findOrphans(index.graph.dependencies, index.graph.dependents, new Set(Object.keys(index.specs)));
        const mostConnected = Object.entries(index.graph.dependencies).sort((a, b) => b[1].length - a[1].length)[0];
        if (mostConnected) {
          getTransitiveDependencies(mostConnected[0], index.graph.dependencies);
        }
        const end = performance.now();
        samples.push(end - start);
      }

      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        buildDependencyGraph(entries);
        detectCycles(index.graph.dependencies);
        findOrphans(index.graph.dependencies, index.graph.dependents, new Set(Object.keys(index.specs)));
        const mostConnected = Object.entries(index.graph.dependencies).sort((a, b) => b[1].length - a[1].length)[0];
        if (mostConnected) {
          getTransitiveDependencies(mostConnected[0], index.graph.dependencies);
        }
        const end = performance.now();
        samples.push(end - start);
      }

      results = calculateStats(samples, TARGET_MS, MAX_MS);
      results.name = 'graph_analysis';
    });

    it('should analyze graph structure', () => {
      expect(graphStats.nodeCount).toBeGreaterThan(0);
    });

    it('should meet target execution time', () => {
      expect(results.mean_ms).toBeLessThanOrEqual(TARGET_MS);
    });

    it('should not exceed max execution time', () => {
      expect(results.max_ms).toBeLessThanOrEqual(MAX_MS);
    });

    it('should report graph stats', () => {
      formatStats('Graph Analysis', results, [
        `Nodes: ${graphStats.nodeCount}  Edges: ${graphStats.dependencyEdges}`,
        `Cycles: ${graphStats.cycleCount}  Orphans: ${graphStats.orphanCount}`,
      ]);
      expect(results).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 3. Assembly Benchmark — real Assembler from .speclang/assembler.spec
  //    Creates a temp spec with proper header and Implementation section,
  //    then assembles it using the REAL assembler. This exercises the
  //    full assembly pipeline: header parse, code extraction, output write.
  // ────────────────────────────────────────────────────────────────
  describe('Assembly (Assembler)', () => {
    const TARGET_MS = 30000;
    const MAX_MS = 60000;
    let results: BenchmarkResult;
    let tempSpecPath: string;

    beforeAll(async () => {
      const { Assembler } = await import('../../.speclang/assembler.spec.ts') as any;
      const assembler = new Assembler();
      tempSpecPath = createBenchSpec();

      const samples: number[] = [];

      for (let i = 0; i < 1; i++) {
        const start = performance.now();
        await assembler.assemble(tempSpecPath);
        const end = performance.now();
        samples.push(end - start);
      }

      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        await assembler.assemble(tempSpecPath);
        const end = performance.now();
        samples.push(end - start);
      }

      results = calculateStats(samples, TARGET_MS, MAX_MS);
      results.name = 'assembly';
    });

    it('should produce assembled output file', () => {
      const outputPath = '/tmp/speclang-bench-assembly/bench-output.ts';
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should meet target execution time', () => {
      expect(results.mean_ms).toBeLessThanOrEqual(TARGET_MS);
    });

    it('should not exceed max execution time', () => {
      expect(results.max_ms).toBeLessThanOrEqual(MAX_MS);
    });

    it('should report assembly timing', () => {
      const blocksPerSec = 3 / (results.mean_ms / 1000);
      formatStats('Assembly', results, [
        `Blocks assembled: 3 (hello, add, multiply)`,
        `Blocks/s: ${blocksPerSec.toFixed(1)}`,
      ]);
      expect(results).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 4. CLI Index Build Benchmark — measures generateIndex wall-clock time
  //    Uses direct module invocation within vitest because npx tsx cannot
  //    resolve the indexer module chain (encounters .spec.md files as TS).
  //    vitest's module transform pipeline handles these correctly.
  //    This measures the index build time as a "CLI command equivalent".
  // ────────────────────────────────────────────────────────────────
  describe('CLI Index Build', () => {
    const TARGET_MS = 60000;
    const MAX_MS = 120000;
    let results: BenchmarkResult;
    let specCount: number;

    beforeAll(() => {
      const samples: number[] = [];

      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        const index = generateIndex({ rootDir: 'specs', outputPath: undefined });
        const end = performance.now();
        specCount = Object.keys(index.specs).length;
        samples.push(end - start);
      }

      results = calculateStats(samples, TARGET_MS, MAX_MS);
      results.name = 'cli_index_build';
    });

    it('should build index via CLI-equivalent path', () => {
      expect(specCount).toBeGreaterThan(0);
    });

    it('should meet target execution time', () => {
      expect(results.mean_ms).toBeLessThanOrEqual(TARGET_MS);
    });

    it('should not exceed max execution time', () => {
      expect(results.max_ms).toBeLessThanOrEqual(MAX_MS);
    });

    it('should report CLI timing', () => {
      formatStats('CLI Index Build', results, [`Specs: ${specCount}`]);
      expect(results).toBeDefined();
    });
  });
});
