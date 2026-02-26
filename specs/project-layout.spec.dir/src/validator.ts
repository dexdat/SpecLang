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
 * Blocks: @block:layout/validator
 * Generated: 2026-02-22
 * 
 * Edit the spec, not this file.
 */

/**
 * Project validation for project layout
 */

import * as fs from 'fs';
import * as path from 'path';

import type {
  ValidationResult,
  ValidationIssue,
  ValidationChecks,
  ValidationSeverity,
  ProjectStructure
} from './types.js';
import { REQUIRED_FILES, ValidationSeverity as VS } from './types.js';
import { findProjectRoot, buildProjectStructure } from './config.js';

/**
 * Validate project structure
 */
export function validateProject(projectRoot?: string): ValidationResult {
  // If projectRoot is explicitly provided, validate it exists
  // If not provided, search for it
  let root: string | null;
  if (projectRoot) {
    root = fs.existsSync(projectRoot) ? projectRoot : null;
  } else {
    root = findProjectRoot();
  }
  
  if (!root) {
    return {
      valid: false,
      issues: [{
        severity: VS.Error,
        code: 'NO_PROJECT_ROOT',
        message: 'No speclang project found. Run `speclang init` to create one.',
        suggestion: 'Initialize a new project with `speclang init <project-name>`'
      }]
    };
  }
  
  const checks = performValidationChecks(root);
  const issues = collectIssues(checks);
  
  // Get structure if valid
  const structure = issues.filter(i => i.severity === VS.Error).length === 0
    ? buildProjectStructure(root)
    : undefined;
  
  return {
    valid: issues.filter(i => i.severity === VS.Error).length === 0,
    issues,
    structure
  };
}

/**
 * Perform all validation checks on a project
 */
function performValidationChecks(projectRoot: string): ValidationChecks {
  return {
    hasNorthStar: fs.existsSync(path.join(projectRoot, 'project.scl')),
    hasSpecsDir: fs.existsSync(path.join(projectRoot, 'specs')) && 
                 fs.statSync(path.join(projectRoot, 'specs')).isDirectory(),
    hasTestsDir: fs.existsSync(path.join(projectRoot, 'tests')) && 
                 fs.statSync(path.join(projectRoot, 'tests')).isDirectory(),
    hasGeneratedDir: fs.existsSync(path.join(projectRoot, 'generated')) && 
                     fs.statSync(path.join(projectRoot, 'generated')).isDirectory(),
    hasSpeclangDir: fs.existsSync(path.join(projectRoot, '.speclang')) && 
                    fs.statSync(path.join(projectRoot, '.speclang')).isDirectory(),
    hasConfig: fs.existsSync(path.join(projectRoot, '.speclangrc')),
    hasGitignore: fs.existsSync(path.join(projectRoot, '.gitignore')),
    configValid: validateConfigFile(projectRoot),
    specFiles: getSpecFiles(projectRoot),
    testFiles: getTestFiles(projectRoot)
  };
}

/**
 * Collect validation issues from checks
 */
function collectIssues(checks: ValidationChecks): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Critical checks - errors
  if (!checks.hasNorthStar) {
    issues.push({
      severity: VS.Error,
      code: 'MISSING_NORTH_STAR',
      message: 'Missing project.scl (north star file)',
      path: 'project.scl',
      suggestion: 'Create a project.scl file at the project root'
    });
  }
  
  if (!checks.hasSpecsDir) {
    issues.push({
      severity: VS.Error,
      code: 'MISSING_SPECS_DIR',
      message: 'Missing specs/ directory',
      path: 'specs/',
      suggestion: 'Create a specs/ directory for feature specifications'
    });
  }
  
  if (!checks.hasTestsDir) {
    issues.push({
      severity: VS.Error,
      code: 'MISSING_TESTS_DIR',
      message: 'Missing tests/ directory',
      path: 'tests/',
      suggestion: 'Create a tests/ directory for test specifications'
    });
  }
  
  if (!checks.hasConfig) {
    issues.push({
      severity: VS.Error,
      code: 'MISSING_CONFIG',
      message: 'Missing .speclangrc configuration file',
      path: '.speclangrc',
      suggestion: 'Create a .speclangrc file with project configuration'
    });
  }
  
  // Warnings
  if (!checks.hasGeneratedDir) {
    issues.push({
      severity: VS.Warning,
      code: 'MISSING_GENERATED_DIR',
      message: 'Missing generated/ directory',
      path: 'generated/',
      suggestion: 'Create a generated/ directory for output code'
    });
  }
  
  if (!checks.hasSpeclangDir) {
    issues.push({
      severity: VS.Warning,
      code: 'MISSING_SPECLANG_DIR',
      message: 'Missing .speclang/ internal directory',
      path: '.speclang/',
      suggestion: 'Create a .speclang/ directory for internal state'
    });
  }
  
  if (!checks.hasGitignore) {
    issues.push({
      severity: VS.Warning,
      code: 'MISSING_GITIGNORE',
      message: 'Missing .gitignore file',
      path: '.gitignore',
      suggestion: 'Create a .gitignore to exclude generated files'
    });
  }
  
  if (!checks.configValid) {
    issues.push({
      severity: VS.Warning,
      code: 'INVALID_CONFIG',
      message: 'Configuration file has invalid format',
      path: '.speclangrc',
      suggestion: 'Check .speclangrc syntax'
    });
  }
  
  // Info checks
  if (checks.specFiles.length === 0) {
    issues.push({
      severity: VS.Info,
      code: 'NO_SPEC_FILES',
      message: 'No spec files found in specs/ directory',
      path: 'specs/',
      suggestion: 'Add spec files like specs/auth.scl, specs/users.scl'
    });
  }
  
  if (checks.testFiles.length === 0) {
    issues.push({
      severity: VS.Info,
      code: 'NO_TEST_FILES',
      message: 'No test spec files found in tests/ directory',
      path: 'tests/',
      suggestion: 'Add test specs like tests/auth.test.spec.scl'
    });
  }
  
  return issues;
}

/**
 * Validate .speclangrc configuration file
 */
function validateConfigFile(projectRoot: string): boolean {
  const configPath = path.join(projectRoot, '.speclangrc');
  
  if (!fs.existsSync(configPath)) {
    return false;
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    
    // Basic validation: check for required fields
    const hasVersion = content.includes('version:');
    const hasSpecDirs = content.includes('spec_dirs:');
    const hasGeneratedDir = content.includes('generated_dir:');
    
    return hasVersion && hasSpecDirs && hasGeneratedDir;
  } catch {
    return false;
  }
}

/**
 * Get list of spec files in project
 */
function getSpecFiles(projectRoot: string): string[] {
  const specsDir = path.join(projectRoot, 'specs');
  
  if (!fs.existsSync(specsDir)) {
    return [];
  }
  
  try {
    const files = fs.readdirSync(specsDir);
    return files.filter(f => 
      f.endsWith('.scl') || 
      f.endsWith('.spec.md') || 
      f.endsWith('.spec.yaml') ||
      f.endsWith('.spec.yml')
    );
  } catch {
    return [];
  }
}

/**
 * Get list of test spec files in project
 */
function getTestFiles(projectRoot: string): string[] {
  const testsDir = path.join(projectRoot, 'tests');
  
  if (!fs.existsSync(testsDir)) {
    return [];
  }
  
  try {
    const files = fs.readdirSync(testsDir);
    return files.filter(f => 
      f.includes('.test.') || 
      f.includes('.spec.')
    );
  } catch {
    return [];
  }
}

/**
 * Quick check if project is valid (for programmatic use)
 */
export function isProjectValid(projectRoot?: string): boolean {
  const result = validateProject(projectRoot);
  return result.valid;
}

/**
 * Get validation summary
 */
export function getValidationSummary(result: ValidationResult): string {
  const errors = result.issues.filter(i => i.severity === VS.Error);
  const warnings = result.issues.filter(i => i.severity === VS.Warning);
  const infos = result.issues.filter(i => i.severity === VS.Info);
  
  const lines: string[] = [];
  
  if (result.valid) {
    lines.push('✅ Project structure is valid');
  } else {
    lines.push('❌ Project has validation errors');
  }
  
  if (errors.length > 0) {
    lines.push(`\nErrors (${errors.length}):`);
    errors.forEach(e => lines.push(`  - ${e.message}`));
  }
  
  if (warnings.length > 0) {
    lines.push(`\nWarnings (${warnings.length}):`);
    warnings.forEach(w => lines.push(`  - ${w.message}`));
  }
  
  if (infos.length > 0) {
    lines.push(`\nInfo (${infos.length}):`);
    infos.forEach(i => lines.push(`  - ${i.message}`));
  }
  
  return lines.join('\n');
}
