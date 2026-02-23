/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/project-layout.spec.md
 * Blocks: @block:layout/types, @block:layout/structure
 * Generated: 2026-02-22
 * 
 * Edit the spec, not this file.
 */

/**
 * Type definitions for Project Layout system
 */

import type { ProjectConfig } from '../config/schema.js';

// ============================================================================
// Directory Structure Types
// ============================================================================

/**
 * Standard directory structure for a speclang project
 */
export interface ProjectStructure {
  root: string;
  specs: string;
  tests: string;
  generated: string;
  speclang: string;
  northStar: string;
  config: string;
  gitignore: string;
}

/**
 * Default project structure (relative paths)
 */
export const DEFAULT_PROJECT_STRUCTURE: ProjectStructure = {
  root: '.',
  specs: 'specs',
  tests: 'tests',
  generated: 'generated',
  speclang: '.speclang',
  northStar: 'project.scl',
  config: '.speclangrc',
  gitignore: '.gitignore'
};

// ============================================================================
// Init Command Types
// ============================================================================

/**
 * Options for initializing a new project
 */
export interface InitOptions {
  /** Project name (directory name) */
  name: string;
  /** Target directory (defaults to current directory if '.') */
  targetDir?: string;
  /** Initialize git repository */
  initGit?: boolean;
  /** Overwrite existing files */
  force?: boolean;
  /** Language targets */
  targets?: string[];
  /** Project description */
  description?: string;
  /** Project version */
  version?: string;
  /** JSON output */
  json?: boolean;
}

/**
 * Result of project initialization
 */
export interface InitResult {
  success: boolean;
  projectRoot: string;
  structure: ProjectStructure;
  filesCreated: string[];
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation severity levels
 */
export enum ValidationSeverity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info'
}

/**
 * A single validation issue
 */
export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  path?: string;
  suggestion?: string;
}

/**
 * Project validation result
 */
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  structure?: ProjectStructure;
}

/**
 * Validation check functions
 */
export interface ValidationChecks {
  hasNorthStar: boolean;
  hasSpecsDir: boolean;
  hasTestsDir: boolean;
  hasGeneratedDir: boolean;
  hasSpeclangDir: boolean;
  hasConfig: boolean;
  hasGitignore: boolean;
  configValid: boolean;
  specFiles: string[];
  testFiles: string[];
}

// ============================================================================
// Reference Path Types
// ============================================================================

/**
 * Reference path types supported by speclang
 */
export enum RefType {
  Spec = 'spec',
  Test = 'test',
  NorthStar = 'northstar',
  Generated = 'generated'
}

/**
 * Parsed reference path
 */
export interface ParsedRef {
  type: RefType;
  path: string;
  block?: string;
  fullRef: string;
}

/**
 * Reference resolution result
 */
export interface RefResolution {
  resolved: boolean;
  absolutePath?: string;
  ref: ParsedRef;
  error?: string;
}

// ============================================================================
// Config Loading Types
// ============================================================================

/**
 * .speclangrc configuration format
 */
export interface SpeclangRcConfig {
  version: number;
  project_root: string;
  spec_dirs: string[];
  generated_dir: string;
  daemon: {
    enabled: boolean;
    quiet_period: string;
  };
}

/**
 * Extended project config including layout info
 */
export interface ProjectLayoutConfig extends ProjectConfig {
  projectRoot: string;
  layout: ProjectStructure;
  speclangrc: SpeclangRcConfig;
}

// ============================================================================
// Template Types
// ============================================================================

/**
 * Template variables for project.scl
 */
export interface ProjectSclTemplateVars {
  name: string;
  version: string;
  description: string;
  targets: string[];
  watcherPatterns: string[];
  watcherIgnore: string[];
  debounce: number;
  splitMaxTokens: number;
  splitMaxLines: number;
  splitStrategy: string;
  embeddingsEnabled: boolean;
  embeddingsModel: string;
  databaseMode: string;
  cascadeQuietPeriod: number;
  cascadeMaxDepth: number;
}

/**
 * Template variables for .speclangrc
 */
export interface SpeclangRcTemplateVars {
  projectRoot: string;
  specDirs: string[];
  generatedDir: string;
  daemonEnabled: boolean;
  daemonQuietPeriod: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Supported language targets
 */
export const SUPPORTED_LANGUAGES = ['typescript', 'python', 'go', 'rust', 'java', 'javascript'] as const;

/**
 * Standard subdirectories for generated code
 */
export const GENERATED_SUBDIRS = ['ts', 'go', 'py', 'rs', 'java', 'js'] as const;

/**
 * .speclang internal directories
 */
export const SPECLANG_SUBDIRS = ['locks', 'cache', 'daemon.pid'] as const;

/**
 * Required files for valid project
 */
export const REQUIRED_FILES = [
  'project.scl',
  'specs',
  'tests',
  'generated',
  '.speclang',
  '.speclangrc',
  '.gitignore'
] as const;
