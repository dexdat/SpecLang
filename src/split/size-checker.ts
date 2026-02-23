/**
 * SPECLANG-GENERATED: Size checker implementation
 * Source: @speclang/dynamic-split/strategy @block:split/logic
 */

import type { SplitConfig, SplitDecision, SizeCheckResult, SpecSize } from './types';
import { DEFAULT_SPLIT_CONFIG } from './types';
import { TokenCounter } from './token-counter';

/**
 * Size checker for determining if a spec needs to be split
 */
export class SizeChecker {
  private config: SplitConfig;
  private counter: TokenCounter;

  constructor(config: Partial<SplitConfig> = {}) {
    this.config = { ...DEFAULT_SPLIT_CONFIG, ...config };
    this.counter = new TokenCounter();
  }

  /**
   * Update configuration
   */
  public setConfig(config: Partial<SplitConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current config
   */
  public getConfig(): SplitConfig {
    return { ...this.config };
  }

  /**
   * Check if a spec needs to be split
   * Returns a SizeCheckResult with detailed information
   */
  public check(content: string): SizeCheckResult {
    const size = this.counter.getSize(content);
    const userLimit = this.config.max_tokens;
    const budgetLimit = this.config.max_tokens + this.config.budget_overhead;

    // Determine threshold
    let threshold: 'safe' | 'warning' | 'critical';
    let needsSplit: boolean;

    if (size.tokens <= userLimit) {
      // Safe zone - no split needed
      threshold = 'safe';
      needsSplit = false;
    } else if (size.tokens <= budgetLimit) {
      // Warning zone - split optional, try optimization first
      threshold = 'warning';
      needsSplit = true; // Recommend split but allow optimization
    } else {
      // Critical zone - must split
      threshold = 'critical';
      needsSplit = true;
    }

    return {
      needsSplit,
      size,
      threshold,
      userLimit,
      budgetLimit,
    };
  }

  /**
   * Get a simple split decision
   */
  public getDecision(content: string): SplitDecision {
    const result = this.check(content);

    if (!result.needsSplit) {
      return 'no-split';
    }

    if (result.threshold === 'warning') {
      return 'try-optimize';
    }

    return 'must-split';
  }

  /**
   * Check size against a specific limit
   */
  public checkLimit(content: string, limitType: 'tokens' | 'lines' | 'chars'): boolean {
    const size = this.counter.getSize(content);

    switch (limitType) {
      case 'tokens':
        return size.tokens > this.config.max_tokens;
      case 'lines':
        return size.lines > this.config.max_lines;
      case 'chars':
        return size.chars > this.config.max_chars;
    }
  }

  /**
   * Get remaining budget
   */
  public getRemainingBudget(content: string): number {
    const size = this.counter.getSize(content);
    return Math.max(0, this.config.max_tokens - size.tokens);
  }

  /**
   * Calculate how much over budget
   */
  public getOverBudget(content: string): number {
    const size = this.counter.getSize(content);
    return Math.max(0, size.tokens - this.config.max_tokens);
  }
}

/**
 * Create a size checker with default config
 */
export function createSizeChecker(config?: Partial<SplitConfig>): SizeChecker {
  return new SizeChecker(config);
}
