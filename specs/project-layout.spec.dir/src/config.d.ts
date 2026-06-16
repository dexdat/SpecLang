/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/project-layout.spec.md
 * Blocks: @block:layout/config
 * Generated: 2026-02-22
 *
 * Edit the spec, not this file.
 */
import type { ProjectLayoutConfig, SpeclangRcConfig, ProjectStructure } from './types.js';
/**
 * Find project root by looking for project.scl or .speclangrc
 */
export declare function findProjectRoot(startDir?: string): string | null;
/**
 * Load .speclangrc configuration
 */
export declare function loadSpeclangRc(projectRoot: string): SpeclangRcConfig | null;
/**
 * Build project structure from project root
 */
export declare function buildProjectStructure(projectRoot: string): ProjectStructure;
/**
 * Load full project layout configuration
 */
export declare function loadProjectLayoutConfig(projectRoot?: string): ProjectLayoutConfig | null;
/**
 * Get project structure from current working directory
 */
export declare function getProjectStructure(): ProjectStructure | null;
/**
 * Check if a directory is a speclang project
 */
export declare function isSpeclangProject(dir?: string): boolean;
//# sourceMappingURL=config.d.ts.map