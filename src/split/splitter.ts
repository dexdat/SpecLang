/**
 * SPECLANG-GENERATED: Splitter - main split logic
 * Source: @speclang/dynamic-split/strategy @block:split/logic
 */

import * as fs from 'fs';
import * as path from 'path';
import type { SplitResult, SplitConfig, SplitOptions, SplitDecision } from './types';
import { DEFAULT_SPLIT_CONFIG } from './types';
import { SizeChecker } from './size-checker';
import { createStrategy, SplitStrategyBase } from './strategy';

/**
 * Main splitter class
 * Coordinates size checking, strategy selection, and execution
 */
export class Splitter {
  private config: SplitConfig;
  private sizeChecker: SizeChecker;
  private defaultStrategy: SplitStrategyBase;

  constructor(config: Partial<SplitConfig> = {}) {
    this.config = { ...DEFAULT_SPLIT_CONFIG, ...config };
    this.sizeChecker = new SizeChecker(this.config);
    this.defaultStrategy = createStrategy(this.config.strategy, this.config);
  }

  /**
   * Update configuration
   */
  public setConfig(config: Partial<SplitConfig>): void {
    this.config = { ...this.config, ...config };
    this.sizeChecker.setConfig(this.config);
    this.defaultStrategy = createStrategy(this.config.strategy, this.config);
  }

  /**
   * Get current config
   */
  public getConfig(): SplitConfig {
    return { ...this.config };
  }

  /**
   * Check if content needs splitting
   */
  public needsSplit(content: string): boolean {
    return this.sizeChecker.getDecision(content) !== 'no-split';
  }

  /**
   * Get split decision
   */
  public getDecision(content: string): SplitDecision {
    return this.sizeChecker.getDecision(content);
  }

  /**
   * Split spec content
   * Returns SplitResult with parent and children
   */
  public split(
    specPath: string,
    content: string,
    metadata: Record<string, unknown>,
    options: SplitOptions = {}
  ): SplitResult {
    // Select strategy - from options or default config
    const strategyName = options.strategy || this.config.strategy;
    
    // Check if split is needed
    const decision = this.sizeChecker.getDecision(content);

    if (decision === 'no-split') {
      return {
        split: false,
        originalPath: specPath,
        parent: {
          path: specPath,
          content,
          part: 1,
          totalParts: 1,
        },
        children: [],
        strategy: strategyName,
      };
    }

    // Create strategy with options config
    const strategy = createStrategy(strategyName, options.config || this.config);

    // Execute split
    return strategy.split(specPath, content, metadata);
  }

  /**
   * Split spec from file
   */
  public splitFile(
    specPath: string,
    options: SplitOptions = {}
  ): SplitResult {
    // Read file
    if (!fs.existsSync(specPath)) {
      throw new Error(`File not found: ${specPath}`);
    }

    const content = fs.readFileSync(specPath, 'utf-8');

    // Extract metadata (simple extraction)
    const metadata = this.extractMetadata(content);

    // Perform split
    return this.split(specPath, content, metadata, options);
  }

  /**
   * Extract basic metadata from content
   */
  private extractMetadata(content: string): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    // Extract id from header
    const idMatch = content.match(/^id:\s*(.+)$/m);
    if (idMatch) {
      metadata.id = idMatch[1].trim();
    }

    // Extract version
    const versionMatch = content.match(/^version:\s*(.+)$/m);
    if (versionMatch) {
      metadata.version = versionMatch[1].trim();
    }

    // Extract short
    const shortMatch = content.match(/^short:\s*(.+)$/m);
    if (shortMatch) {
      metadata.short = shortMatch[1].trim();
    }

    return metadata;
  }

  /**
   * Execute split and write files
   * Returns the split result
   */
  public splitAndWrite(
    specPath: string,
    options: SplitOptions = {}
  ): SplitResult {
    // Perform split
    const result = this.splitFile(specPath, options);

    if (!result.split) {
      return result;
    }

    // Write parent file
    const parentDir = path.dirname(result.parent.path);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(result.parent.path, result.parent.content, 'utf-8');

    // Write children
    for (const child of result.children) {
      const childDir = path.dirname(child.path);
      if (!fs.existsSync(childDir)) {
        fs.mkdirSync(childDir, { recursive: true });
      }
      fs.writeFileSync(child.path, child.content, 'utf-8');
    }

    return result;
  }

  /**
   * Check if a path is a split spec directory
   */
  public static isSplitDir(specPath: string): boolean {
    return specPath.includes('.spec.dir/');
  }

  /**
   * Get parent path from split child path
   */
  public static getParentPath(childPath: string): string | null {
    const match = childPath.match(/(.+)\.spec\.dir\/.+/);
    if (match) {
      return match[1] + '.spec.yaml';
    }
    return null;
  }
}

/**
 * Create a splitter with default config
 */
export function createSplitter(config?: Partial<SplitConfig>): Splitter {
  return new Splitter(config);
}

/**
 * Utility function to check if content needs splitting
 */
export function checkSplitNeeded(
  content: string,
  config?: Partial<SplitConfig>
): boolean {
  const splitter = new Splitter(config);
  return splitter.needsSplit(content);
}

/**
 * Utility function to split content
 */
export function splitContent(
  specPath: string,
  content: string,
  metadata: Record<string, unknown>,
  options?: SplitOptions
): SplitResult {
  const splitter = new Splitter(options?.config);
  return splitter.split(specPath, content, metadata, options);
}
