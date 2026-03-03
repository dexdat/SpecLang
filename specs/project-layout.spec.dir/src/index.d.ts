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
export * from './types.js';
export { generateProjectScl, generateSpeclangRc, generateGitignore, generateInitialSpec, generateInitialTestSpec, getDefaultProjectSclVars, getDefaultSpeclangRcVars } from './templates.js';
export { findProjectRoot, loadSpeclangRc, buildProjectStructure, loadProjectLayoutConfig, getProjectStructure, isSpeclangProject } from './config.js';
export { validateProject, isProjectValid, getValidationSummary } from './validator.js';
export { initProject, formatInitResult } from './init.js';
export { DEFAULT_PROJECT_STRUCTURE } from './types.js';
export type { InitOptions, InitResult, ValidationResult, ValidationIssue, ValidationChecks, ProjectStructure, ProjectLayoutConfig, SpeclangRcConfig } from './types.ts';
//# sourceMappingURL=index.d.ts.map