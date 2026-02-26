/**
speclang-header lines:5
id: @specs/project-layout
version: 1.0.0
layer: 5
 */

/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/project-layout.spec.md
 * Blocks: @block:layout/index
 * Generated: 2026-02-22
 * 
 * Edit the spec, not this file.
 */

/**
 * Project Layout Module
 * 
 * Provides project initialization, validation, and configuration
 * for the speclang project structure.
 */

// Types
export * from './types.js';

// Templates
export {
  generateProjectScl,
  generateSpeclangRc,
  generateGitignore,
  generateInitialSpec,
  generateInitialTestSpec,
  getDefaultProjectSclVars,
  getDefaultSpeclangRcVars
} from './templates.js';

// Config
export {
  findProjectRoot,
  loadSpeclangRc,
  buildProjectStructure,
  loadProjectLayoutConfig,
  getProjectStructure,
  isSpeclangProject
} from './config.js';

// Validator
export {
  validateProject,
  isProjectValid,
  getValidationSummary
} from './validator.js';

// Init
export {
  initProject,
  formatInitResult
} from './init.js';

// Default structure constant
export { DEFAULT_PROJECT_STRUCTURE } from './types.js';

// Validation types re-export
export type {
  InitOptions,
  InitResult,
  ValidationResult,
  ValidationIssue,
  ValidationChecks,
  ProjectStructure,
  ProjectLayoutConfig,
  SpeclangRcConfig
} from './types.js';
