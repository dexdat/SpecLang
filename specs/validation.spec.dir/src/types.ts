/**
 * SPECLANG-GENERATED: Validation types
 * Source: @speclang/validation/rules
 */

import type { ParsedSpec, SpecMetadata, Block, Reference } from '../parser/types';

// ============================================================================
// VALIDATION RULE TYPES
// ============================================================================

/** A validation rule that can check specs */
export interface ValidationRule {
  /** Unique rule identifier */
  id: string;
  /** Human-readable rule name */
  name: string;
  /** Severity level */
  level: 'error' | 'warning';
  /** Function to check a spec */
  check: (spec: ParsedSpec, context?: ValidationContext) => ValidationResult[];
  /** Optional setup function */
  setup?: () => Promise<void>;
  /** Optional teardown function */
  teardown?: () => Promise<void>;
}

/** Result of a single validation check */
export interface ValidationResult {
  /** Rule that generated this result */
  rule: string;
  /** Severity level */
  level: 'error' | 'warning';
  /** Location of the issue */
  location: {
    file: string;
    line: number | 'header' | 'content' | 'metadata';
    column?: number;
  };
  /** Human-readable message */
  message: string;
  /** Suggested fix */
  suggestion?: string;
}

// ============================================================================
// VALIDATION REPORT TYPES
// ============================================================================

/** Complete validation report for a single spec */
export interface ValidationReport {
  /** File path */
  file: string;
  /** Errors found */
  errors: ValidationResult[];
  /** Warnings found */
  warnings: ValidationResult[];
  /** Whether validation passed */
  passed: boolean;
  /** Timestamp */
  timestamp: Date;
}

/** Report for multiple specs */
export interface ValidationReportBatch {
  /** All reports */
  reports: ValidationReport[];
  /** Summary statistics */
  summary: {
    total: number;
    passed: number;
    failed: number;
    errors: number;
    warnings: number;
  };
}

// ============================================================================
// VALIDATION CONTEXT
// ============================================================================

/** Context passed to validation rules */
export interface ValidationContext {
  /** Base directory for specs */
  baseDir: string;
  /** All specs in the project (for reference resolution) */
  allSpecs: Map<string, ParsedSpec>;
  /** Dependency graph */
  dependencyGraph: Map<string, string[]>;
  /** Custom configuration */
  config: ValidationConfig;
  /** File system operations */
  fs: ValidationFileSystem;
}

/** File system abstraction for validation */
export interface ValidationFileSystem {
  /** Check if file exists */
  exists: (path: string) => Promise<boolean>;
  /** Read file contents */
  readFile: (path: string) => Promise<string>;
  /** List files in directory */
  readDir: (path: string) => Promise<string[]>;
}

/** Validation configuration */
export interface ValidationConfig {
  /** Enable all rules */
  enabled?: boolean;
  /** Treat warnings as errors */
  strict?: boolean;
  /** Custom rules paths */
  customRules?: CustomRuleConfig[];
  /** Rule settings */
  rules?: Record<string, RuleSetting>;
}

/** Custom rule configuration */
export interface CustomRuleConfig {
  /** Path to custom rule module */
  path: string;
  /** Whether rule is enabled */
  enabled: boolean;
}

/** Individual rule setting */
export interface RuleSetting {
  /** Whether to run this rule */
  enabled: boolean;
  /** Override severity level */
  level?: 'error' | 'warning';
}

// ============================================================================
// REFERENCE RESOLUTION TYPES
// ============================================================================

/** Parsed reference with resolved target */
export interface ResolvedReference {
  /** Original reference string */
  ref: string;
  /** Target spec file path */
  targetPath?: string;
  /** Target block ID */
  targetBlock?: string;
  /** Whether target exists */
  exists: boolean;
  /** Resolution error if any */
  error?: string;
}

// ============================================================================
// VALIDATION ERROR CREATION HELPERS
// ============================================================================

/** Create an error result */
export function createError(
  rule: string,
  location: ValidationResult['location'],
  message: string,
  suggestion?: string
): ValidationResult {
  return {
    rule,
    level: 'error',
    location,
    message,
    suggestion,
  };
}

/** Create a warning result */
export function createWarning(
  rule: string,
  location: ValidationResult['location'],
  message: string,
  suggestion?: string
): ValidationResult {
  return {
    rule,
    level: 'warning',
    location,
    message,
    suggestion,
  };
}

// ============================================================================
// DEFAULT VALIDATION CONFIG
// ============================================================================

/** Default validation configuration */
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  enabled: true,
  strict: false,
  customRules: [],
  rules: {},
};

// ============================================================================
// RE-EXPORT PARSER TYPES FOR CONVENIENCE
// ============================================================================

export type { ParsedSpec, SpecMetadata, Block, Reference } from '../parser/types';
