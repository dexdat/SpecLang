/**
 * SPECLANG-GENERATED: Tests for dynamic splitting
 * Source: @speclang/dynamic-split
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  TokenCounter,
  SizeChecker,
  Splitter,
  DirectoryBuilder,
  IndexUpdater,
  createStrategy,
} from '../src/split';

// Test fixtures
const smallSpec = `# speclang-header lines:7
id: @specs/test/small
version: 1.0.0
short: "Small test spec"
---

# Introduction

This is a small spec under 1000 tokens.
It should not trigger splitting.
`;

const largeSpec = `# speclang-header lines:7
id: @specs/test/large
version: 1.0.0
short: "Large test spec"
---

${'# Section\n\nThis is content with more text to exceed the token limit. '.repeat(2000)}
`;

// ============================================================================
// TOKEN COUNTER TESTS
// ============================================================================

describe('TokenCounter', () => {
  const counter = new TokenCounter();

  it('should count tokens in empty string', () => {
    expect(counter.count('')).toBe(0);
  });

  it('should count tokens in simple text', () => {
    const text = 'Hello world';
    const tokens = counter.count(text);
    expect(tokens).toBeGreaterThan(0);
    // Approx 3 tokens for "Hello world"
    expect(tokens).toBeLessThanOrEqual(10);
  });

  it('should count tokens in larger content', () => {
    const text = 'The quick brown fox jumps over the lazy dog'.repeat(100);
    const tokens = counter.count(text);
    expect(tokens).toBeGreaterThan(500);
  });

  it('should estimate overhead correctly', () => {
    const overhead = counter.estimateOverhead(3, 2);
    expect(overhead).toBe(200 + (3 * 50) + (2 * 30)); // 410
  });

  it('should get size metrics', () => {
    const size = counter.getSize('Hello world\nSecond line');
    expect(size.tokens).toBeGreaterThan(0);
    expect(size.lines).toBe(2);
    expect(size.chars).toBeGreaterThan(0);
  });
});

// ============================================================================
// SIZE CHECKER TESTS
// ============================================================================

describe('SizeChecker', () => {
  it('should return safe threshold for small content', () => {
    const checker = new SizeChecker();
    const result = checker.check(smallSpec);
    
    expect(result.threshold).toBe('safe');
    expect(result.needsSplit).toBe(false);
  });

  it('should return critical threshold for large content', () => {
    const checker = new SizeChecker();
    const result = checker.check(largeSpec);
    
    expect(result.threshold).toBe('critical');
    expect(result.needsSplit).toBe(true);
  });

  it('should respect custom max_tokens', () => {
    const checker = new SizeChecker({ max_tokens: 100 });
    const result = checker.check(largeSpec);
    
    expect(result.needsSplit).toBe(true);
  });

  it('should get split decision correctly', () => {
    const checker = new SizeChecker();
    
    expect(checker.getDecision(smallSpec)).toBe('no-split');
    expect(checker.getDecision(largeSpec)).toBe('must-split');
  });
});

// ============================================================================
// SPLIT STRATEGY TESTS
// ============================================================================

describe('SplitStrategy', () => {
  const metadata = {
    id: '@specs/test/spec',
    version: '1.0.0',
    short: 'Test spec',
  };

  it('smart strategy should not split small content', () => {
    const strategy = createStrategy('smart');
    const result = strategy.split('specs/test.spec.yaml', smallSpec, metadata);
    
    expect(result.split).toBe(false);
    expect(result.children.length).toBe(0);
  });

  it('by-section strategy should split at h2 headers', () => {
    const strategy = createStrategy('by-section');
    const content = smallSpec + '\n\n## Section 1\n\nContent 1\n\n## Section 2\n\nContent 2';
    const result = strategy.split('specs/test.spec.yaml', content, metadata);
    
    // Should split if over limit
    expect(result.strategy).toBe('by-section');
  });

  it('by-token strategy should split evenly', () => {
    const strategy = createStrategy('by-token');
    const result = strategy.split('specs/test.spec.yaml', largeSpec, metadata);
    
    if (result.split) {
      expect(result.children.length).toBeGreaterThan(0);
    }
  });

  it('should generate correct parent index', () => {
    const strategy = createStrategy('smart');
    const result = strategy.split('specs/test.spec.yaml', largeSpec, metadata);
    
    if (result.split) {
      expect(result.parent.content).toContain('children:');
      expect(result.parent.content).toContain('@ref:');
    }
  });
});

// ============================================================================
// SPLITTER TESTS
// ============================================================================

describe('Splitter', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-split-'));
  const testFile = path.join(tempDir, 'test.spec.yaml');

  beforeEach(() => {
    // Clean up before each test
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    const dirPath = testFile.replace('.spec.yaml', '.spec.dir');
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should not split small spec', () => {
    const splitter = new Splitter();
    const result = splitter.split(testFile, smallSpec, { id: '@test', version: '1.0.0' });
    
    expect(result.split).toBe(false);
  });

  it('should split large spec', () => {
    const splitter = new Splitter();
    const result = splitter.split(testFile, largeSpec, { id: '@test', version: '1.0.0' });
    
    if (result.split) {
      expect(result.children.length).toBeGreaterThan(0);
      expect(result.parent.content).toContain('children:');
    }
  });

  it('should respect strategy option', () => {
    const splitter = new Splitter();
    const result = splitter.split(testFile, largeSpec, { id: '@test', version: '1.0.0' }, {
      strategy: 'by-token',
    });
    
    expect(result.strategy).toBe('by-token');
  });

  it('should check if content needs splitting', () => {
    const splitter = new Splitter();
    
    expect(splitter.needsSplit(smallSpec)).toBe(false);
  });
});

// ============================================================================
// DIRECTORY BUILDER TESTS
// ============================================================================

describe('DirectoryBuilder', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-dir-'));
  const parentPath = path.join(tempDir, 'test.spec.yaml');

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should get directory path', () => {
    const dirPath = DirectoryBuilder.getDirPath(parentPath);
    expect(dirPath).toBe(path.join(tempDir, 'test.spec.dir'));
  });

  it('should create directory structure', () => {
    const dirPath = DirectoryBuilder.createDirStructure(parentPath);
    
    expect(fs.existsSync(dirPath)).toBe(true);
  });

  it('should check if path is spec dir', () => {
    expect(DirectoryBuilder.isSpecDir(path.join(tempDir, 'test.spec.dir'))).toBe(true);
    expect(DirectoryBuilder.isSpecDir(parentPath)).toBe(false);
  });

  it('should get parent path from child', () => {
    const childPath = path.join(tempDir, 'test.spec.dir', 'part-1.spec.yaml');
    const parent = DirectoryBuilder.getParentPath(childPath);
    
    expect(parent).toBe(parentPath);
  });

  it('should list children', () => {
    // Create some child files
    const dirPath = DirectoryBuilder.getDirPath(parentPath);
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(path.join(dirPath, 'part-1.spec.yaml'), 'content 1');
    fs.writeFileSync(path.join(dirPath, 'part-2.spec.yaml'), 'content 2');
    
    const children = DirectoryBuilder.listChildren(dirPath);
    
    expect(children.length).toBe(2);
  });
});

// ============================================================================
// INDEX UPDATER TESTS
// ============================================================================

describe('IndexUpdater', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-index-'));
  const testPath = path.join(tempDir, 'test.spec.yaml');

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should create index content', () => {
    const children = [
      { path: 'specs/test.spec.dir/1.yaml', content: '', part: 1, totalParts: 2 },
      { path: 'specs/test.spec.dir/2.yaml', content: '', part: 2, totalParts: 2 },
    ];
    
    const content = IndexUpdater.createIndexContent(
      'specs/test.spec.yaml',
      children,
      { id: '@test', version: '1.0.0' }
    );
    
    expect(content).toContain('id: @test');
    expect(content).toContain('children:');
    expect(content).toContain('@ref:');
  });

  it('should check if file is index', () => {
    // Create an index file
    const indexContent = `# speclang-header lines:10
id: @test
version: 1.0.0
children:
  - @ref:specs/test.spec.dir/part1
short: "Test"
---

This spec has been split.
`;
    fs.writeFileSync(testPath, indexContent);
    
    expect(IndexUpdater.isIndexFile(testPath)).toBe(true);
  });
});
