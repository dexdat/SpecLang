/**
 * SPECLANG-GENERATED: Step detection types
 * Source: @specs/validation-tool/implementation#step-detection
 */

export interface StepDetectionCriteria {
  /** Minimum coverage percentage (0-1) */
  minCoverage: number;
  /** Minimum number of steps per block */
  minStepsPerBlock: number;
  /** Whether to require imperative sentences */
  requireImperative: boolean;
}

export interface StepDetectionResult {
  /** Spec ID being analyzed */
  specId: string;
  /** Overall passed */
  passed: boolean;
  /** Confidence score (0-1) */
  confidence: number;
  /** Coverage percentage (steps / sentences) */
  coverage: number;
  /** Total sentences counted */
  totalSentences: number;
  /** Total steps detected */
  totalSteps: number;
  /** Per-block results */
  blocks: StepBlockResult[];
  /** Missing step descriptions */
  missing: string[];
  /** Suggestions for improvement */
  suggestions: string[];
}

export interface StepBlockResult {
  /** Block ID */
  blockId: string;
  /** Block kind */
  kind: string;
  /** Whether block has sufficient steps */
  passed: boolean;
  /** Sentences in block */
  sentences: number;
  /** Steps detected */
  steps: number;
  /** Coverage for this block */
  coverage: number;
  /** Detected step patterns */
  patterns: StepPatternMatch[];
}

export interface StepPatternMatch {
  /** Pattern type: numbered_list, bulleted_list, imperative, sequence */
  type: string;
  /** Matched text */
  text: string;
  /** Line number (1-indexed) */
  line: number;
}

export interface StepPattern {
  /** Regex pattern */
  pattern: RegExp;
  /** Weight for scoring */
  weight: number;
  /** Description */
  description: string;
}