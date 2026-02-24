/**
 * SPECLANG-GENERATED: Types for dynamic splitting
 * Source: @speclang/dynamic-split/strategy @block:split/config
 */

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/** Split strategy types */
export type SplitStrategy = 'smart' | 'by-section' | 'by-token';

/** Configuration for splitting behavior */
export interface SplitConfig {
  /** Maximum tokens before considering split */
  max_tokens: number;
  /** Maximum lines before considering split */
  max_lines: number;
  /** Maximum characters before considering split */
  max_chars: number;
  /** Extra budget for headers and references */
  budget_overhead: number;
  /** Splitting strategy to use */
  strategy: SplitStrategy;
}

/** Default split configuration */
export const DEFAULT_SPLIT_CONFIG: SplitConfig = {
  max_tokens: 10000,
  max_lines: 800,
  max_chars: 60000,
  budget_overhead: 500,
  strategy: 'smart',
};

/** Per-agent configuration override */
export interface AgentSplitConfig {
  max_tokens?: number;
  max_lines?: number;
  max_chars?: number;
  budget_overhead?: number;
  strategy?: SplitStrategy;
}

/** Full project configuration with splitting */
export interface ProjectSplitConfig {
  split: SplitConfig;
  agents?: Record<string, AgentSplitConfig>;
}

// ============================================================================
// SIZE METRICS
// ============================================================================

/** Size metrics for a spec */
export interface SpecSize {
  /** Token count */
  tokens: number;
  /** Line count */
  lines: number;
  /** Character count */
  chars: number;
}

/** Split thresholds */
export type SplitThreshold = 'safe' | 'warning' | 'critical';

/** Size check result */
export interface SizeCheckResult {
  /** Whether split is needed */
  needsSplit: boolean;
  /** Current size metrics */
  size: SpecSize;
  /** Which threshold was triggered */
  threshold: SplitThreshold;
  /** User limit */
  userLimit: number;
  /** Budget limit (user limit + overhead) */
  budgetLimit: number;
}

// ============================================================================
// SPLIT RESULT TYPES
// ============================================================================

/** Result of splitting a spec */
export interface SplitResult {
  /** Whether a split occurred */
  split: boolean;
  /** Original file path */
  originalPath: string;
  /** Parent spec content */
  parent: SplitFile;
  /** Child specs */
  children: SplitFile[];
  /** Strategy used */
  strategy: SplitStrategy;
}

/** A file to be written after split */
export interface SplitFile {
  /** File path */
  path: string;
  /** File content */
  content: string;
  /** Part number (1-based) */
  part: number;
  /** Total parts */
  totalParts: number;
}

// ============================================================================
// SPLIT DECISION
// ============================================================================

/** Decision from split checker */
export type SplitDecision = 
  | 'no-split'      // Spec is under limit
  | 'try-optimize'  // In warning zone, try optimization first
  | 'must-split';   // In critical zone, must split

// ============================================================================
// BLOCK TYPES (for splitting)
// ============================================================================

/** A block for splitting purposes */
export interface SplitBlock {
  /** Block ID */
  id: string;
  /** Block kind */
  kind: string;
  /** Raw content */
  content: string;
  /** Line number */
  line: number;
}

// ============================================================================
// MERGE TYPES
// ============================================================================

/** Merge threshold config */
export interface MergeConfig {
  /** Threshold as percentage of max_tokens (e.g., 0.5 = 50%) */
  threshold: number;
}

/** Default merge configuration */
export const DEFAULT_MERGE_CONFIG: MergeConfig = {
  threshold: 0.5,
};

// ============================================================================
// SPLIT OPTIONS
// ============================================================================

/** Options for split operation */
export interface SplitOptions {
  /** Override strategy */
  strategy?: SplitStrategy;
  /** Custom config */
  config?: Partial<SplitConfig>;
  /** Whether to perform merge check */
  checkMerge?: boolean;
}
