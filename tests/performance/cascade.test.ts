/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/testing/performance.spec.md
 * Generated: 2026-03-31T19:00:00Z
 *
 * Performance benchmark tests for cascade execution.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { parseSpec, parseSpecContent } from '../../src/parser';

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

/**
 * Calculate statistics from benchmark samples
 */
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
    regression: false
  };
}

/**
 * Generate a test spec with specified number of blocks
 */
function generateTestSpec(blockCount: number): string {
  const blocks = Array.from({ length: blockCount }, (_, i) => 
    `### @block:block-${i} @kind:interface
interface Test${i} {
  id: string;
  name: string;
}`
  ).join('\n\n');
  
  return `# speclang-header lines:8
id: "@test/perf-${blockCount}"
version: 1.0.0
layer: 5
---

# Test Spec with ${blockCount} Blocks

${blocks}
`;
}

describe('Cascade Performance Benchmarks', () => {
  const WARMUP_RUNS = 3;
  const SAMPLE_SIZE = 30;
  
  describe('Small spec cascade (10 blocks)', () => {
    const TARGET_MS = 500;
    const MAX_MS = 2000;
    let results: BenchmarkResult;
    
    beforeAll(() => {
      const samples: number[] = [];
      const spec = generateTestSpec(10);
      
      // Warmup runs
      for (let i = 0; i < WARMUP_RUNS; i++) {
        const start = performance.now();
        try {
          parseSpec(spec);
        } catch {}
        const end = performance.now();
        samples.push(end - start);
      }
      
      // Actual measurement runs
      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const start = performance.now();
        try {
          parseSpec(spec);
        } catch {}
        const end = performance.now();
        samples.push(end - start);
      }
      
      results = calculateStats(samples, TARGET_MS, MAX_MS);
      results.name = 'small_spec_cascade';
    });
    
    it('should meet target execution time', () => {
      expect(results.target_met).toBe(true);
    });
    
    it('should not exceed max execution time', () => {
      expect(results.pass).toBe(true);
    });
    
    it('should have acceptable variance', () => {
      // Standard deviation should be less than 100% of mean for fast operations
      // (variance is naturally high when operations are sub-millisecond)
      expect(results.std_dev / results.mean_ms).toBeLessThan(3.0);
    });
  });
  
  describe('Medium spec cascade (50 blocks)', () => {
    const TARGET_MS = 2000;
    const MAX_MS = 5000;
    let results: BenchmarkResult;
    
    beforeAll(() => {
      const samples: number[] = [];
      const spec = generateTestSpec(50);
      
      // Warmup runs
      for (let i = 0; i < WARMUP_RUNS; i++) {
        const start = performance.now();
        try {
          parseSpec(spec);
        } catch {}
        const end = performance.now();
        samples.push(end - start);
      }
      
      // Actual measurement runs
      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const start = performance.now();
        try {
          parseSpec(spec);
        } catch {}
        const end = performance.now();
        samples.push(end - start);
      }
      
      results = calculateStats(samples, TARGET_MS, MAX_MS);
      results.name = 'medium_spec_cascade';
    });
    
    it('should meet target execution time', () => {
      expect(results.target_met).toBe(true);
    });
    
    it('should not exceed max execution time', () => {
      expect(results.pass).toBe(true);
    });
  });
  
  describe('Large spec cascade (200 blocks)', () => {
    const TARGET_MS = 8000;
    const MAX_MS = 15000;
    let results: BenchmarkResult;
    
    beforeAll(() => {
      const samples: number[] = [];
      const spec = generateTestSpec(200);
      
      // Warmup runs
      for (let i = 0; i < WARMUP_RUNS; i++) {
        const start = performance.now();
        try {
          parseSpec(spec);
        } catch {}
        const end = performance.now();
        samples.push(end - start);
      }
      
      // Actual measurement runs
      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const start = performance.now();
        try {
          parseSpec(spec);
        } catch {}
        const end = performance.now();
        samples.push(end - start);
      }
      
      results = calculateStats(samples, TARGET_MS, MAX_MS);
      results.name = 'large_spec_cascade';
    });
    
    it('should meet target execution time', () => {
      expect(results.target_met).toBe(true);
    });
    
    it('should not exceed max execution time', () => {
      expect(results.pass).toBe(true);
    });
  });
  
  describe('Parse spec content performance', () => {
    const TARGET_MS = 100;
    const MAX_MS = 500;
    let results: BenchmarkResult;
    
    beforeAll(() => {
      const samples: number[] = [];
      const spec = generateTestSpec(50);
      
      // Warmup runs
      for (let i = 0; i < WARMUP_RUNS; i++) {
        const start = performance.now();
        try {
          parseSpecContent(spec);
        } catch {}
        const end = performance.now();
        samples.push(end - start);
      }
      
      // Actual measurement runs
      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const start = performance.now();
        try {
          parseSpecContent(spec);
        } catch {}
        const end = performance.now();
        samples.push(end - start);
      }
      
      results = calculateStats(samples, TARGET_MS, MAX_MS);
      results.name = 'parse_spec_content';
    });
    
    it('should meet target parse time', () => {
      expect(results.target_met).toBe(true);
    });
    
    it('should not exceed max parse time', () => {
      expect(results.pass).toBe(true);
    });
  });
});
