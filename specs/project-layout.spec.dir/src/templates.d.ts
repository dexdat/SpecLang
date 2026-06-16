/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/project-layout.spec.md
 * Blocks: @block:layout/templates
 * Generated: 2026-02-22
 *
 * Edit the spec, not this file.
 */
/**
 * Template generation for project layout files
 */
import type { ProjectSclTemplateVars, SpeclangRcTemplateVars } from './types.js';
/**
 * Generate project.scl content from template variables
 */
export declare function generateProjectScl(vars: ProjectSclTemplateVars): string;
/**
 * Generate .speclangrc content from template variables
 */
export declare function generateSpeclangRc(vars: SpeclangRcTemplateVars): string;
/**
 * Generate .gitignore content
 */
export declare function generateGitignore(): string;
/**
 * Generate initial spec file for a new project
 */
export declare function generateInitialSpec(name: string): string;
/**
 * Generate initial test spec file
 */
export declare function generateInitialTestSpec(name: string): string;
/**
 * Get default template variables for project.scl
 */
export declare function getDefaultProjectSclVars(name: string): ProjectSclTemplateVars;
/**
 * Get default template variables for .speclangrc
 */
export declare function getDefaultSpeclangRcVars(projectRoot?: string): SpeclangRcTemplateVars;
//# sourceMappingURL=templates.d.ts.map