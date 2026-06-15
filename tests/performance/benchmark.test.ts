import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { generateIndex } from '../../src/indexer/index.js';
import { buildDependencyGraph, detectCycles, findOrphans, getTransitiveDependencies } from '../../src/indexer/graph.js';

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

const BENCH_TIMEOUT = 300_000;

describe.skipIf(!process.env.RUN_BENCHMARKS)('SpecLang Real Benchmarks', () => {

  describe('Index Build (generateIndex)', () => {
    const TARGET_MS = 60000;
    const MAX_MS = 120000;
    let results: BenchmarkResult;
    let specCount: number;
    let cycleCount: number;
    let orphanCount: number;

    beforeAll(() => {
      const samples: number[] = [];

      const warmup = generateIndex({ rootDir: 'specs', outputPath: undefined });
      specCount = Object.keys(warmup.specs).length;
      cycleCount = warmup.cycles.length;
      orphanCount = warmup.orphans.length;

      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        generateIndex({ rootDir: 'specs', outputPath: undefined });
        const end = performance.now();
        samples.push(end - start);
      }

      results = calculateStats(samples, TARGET_MS, MAX_MS);
      results.name = 'index_build';
    }, BENCH_TIMEOUT);

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

  describe('Assembly (npm run assemble:all)', () => {
    const TARGET_MS = 60000;
    const MAX_MS = 120000;
    let results: BenchmarkResult;
    let totalSpecs: number;
    let assembledCount: number;
    let blocksCount: number;

    beforeAll(() => {
      const samples: number[] = [];
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

      try {
        execSync(`${npmCmd} run assemble:all`, { encoding: 'utf-8', cwd: process.cwd() });
      } catch {
        // ignore warmup failures
      }

      for (let i = 0; i < 2; i++) {
        try {
          const start = performance.now();
          const output = execSync(`${npmCmd} run assemble:all`, { encoding: 'utf-8', cwd: process.cwd() });
          const end = performance.now();
          samples.push(end - start);

          const totalMatch = output.match(/Total specs:\s+(\d+)/);
          const successMatch = output.match(/✅ Assembled:\s+(\d+)/);
          const blocksMatch = output.match(/📦 Total blocks:\s+(\d+)/);
          if (totalMatch) totalSpecs = parseInt(totalMatch[1], 10);
          if (successMatch) assembledCount = parseInt(successMatch[1], 10);
          if (blocksMatch) blocksCount = parseInt(blocksMatch[1], 10);
        } catch (e) {
          const stderr = (e as any)?.stderr || '';
          const stdout = (e as any)?.stdout || '';
          const output = stdout + stderr;
          const totalMatch = output.match(/Total specs:\s+(\d+)/);
          if (totalMatch) totalSpecs = parseInt(totalMatch[1], 10);
        }
      }

      results = calculateStats(samples, TARGET_MS, MAX_MS);
      results.name = 'assembly_assemble_all';
    }, BENCH_TIMEOUT);

    it('should process spec files for assembly', () => {
      expect(totalSpecs).toBeGreaterThan(0);
    });

    it('should meet target execution time', () => {
      expect(results.mean_ms).toBeLessThanOrEqual(TARGET_MS);
    });

    it('should not exceed max execution time', () => {
      expect(results.max_ms).toBeLessThanOrEqual(MAX_MS);
    });

    it('should report assembly timing with throughput', () => {
      const blocksPerSec = blocksCount ? blocksCount / (results.mean_ms / 1000) : 0;
      formatStats('Assembly (npm run assemble:all)', results, [
        `Total specs: ${totalSpecs}`,
        `Files assembled: ${assembledCount}`,
        `Total blocks: ${blocksCount}`,
        `Blocks/s: ${blocksPerSec.toFixed(1)}`,
      ]);
      expect(results).toBeDefined();
    });
  });

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

      buildDependencyGraph(entries);
      detectCycles(index.graph.dependencies);
      findOrphans(index.graph.dependencies, index.graph.dependents, new Set(Object.keys(index.specs)));

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
    }, BENCH_TIMEOUT);

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
});
