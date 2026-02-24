/**
 * SPECLANG-GENERATED: Symlinks types
 * Source: @speclang/symlinks
 */

import type { SpecMetadata } from '../parser/types';

// ============================================================================
// DUAL VIEW TYPES
// ============================================================================

/** Represents the dual-view system (physical vs logical) */
export interface DualView {
  physical: PhysicalView;
  logical: LogicalView;
  mapping: HeaderMapping;
}

/** Physical view - the source of truth in specs/ */
export interface PhysicalView {
  location: string;
  structure: 'hierarchical with .spec.dir/';
  contents: string[];
}

/** Logical view - conventional project layout via symlinks */
export interface LogicalView {
  location: string[];
  structure: string;
  contents: string[];
}

/** How specs map to targets via headers */
export interface HeaderMapping {
  requiredField: 'target' | 'output_path';
  format: string;
}

// ============================================================================
// SYMLINK TYPES
// ============================================================================

/** A symlink entry */
export interface SymlinkEntry {
  /** Logical path (where symlink should be created) */
  logicalPath: string;
  /** Physical path (where the real file is in specs/) */
  physicalPath: string;
  /** Whether symlink exists and is valid */
  isValid: boolean;
}

/** Result of symlink operations */
export interface SymlinkResult {
  created: string[];
  skipped: string[];
  errors: SymlinkError[];
}

/** Symlink error details */
export interface SymlinkError {
  path: string;
  code: SymlinkErrorCode;
  message: string;
}

/** Error codes for symlink operations */
export type SymlinkErrorCode =
  | 'TARGET_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'ALREADY_EXISTS'
  | 'INVALID_PATH'
  | 'BROKEN_SYMLINK'
  | 'PLATFORM_UNSUPPORTED';

/** Platform-specific symlink type */
export type SymlinkType = 'symbolic' | 'junction' | 'hard';

/** Platform info for symlinks */
export interface SymlinkPlatform {
  type: SymlinkType;
  command: string;
  requires?: string;
  hasFallback: boolean;
}

// ============================================================================
// VERIFICATION TYPES
// ============================================================================

/** Verification result */
export interface VerifyResult {
  valid: string[];
  broken: SymlinkEntry[];
  missing: SymlinkEntry[];
}

/** Git configuration for symlinks */
export interface GitSymlinksConfig {
  tracked: string[];
  gitignore: string[];
  gitConfig: Record<string, string>;
}

// ============================================================================
// REBUILD TYPES
// ============================================================================

/** Rebuild options */
export interface RebuildOptions {
  clean?: boolean;
  regenerate?: boolean;
  verify?: boolean;
}

/** Rebuild result */
export interface RebuildResult {
  generated: string[];
  symlinked: string[];
  errors: SymlinkError[];
}

// ============================================================================
// TOOL RESULT TYPES
// ============================================================================

/** Result for create-symlinks tool */
export interface CreateSymlinksResult {
  created: string[];
  skipped: string[];
  errors: string[];
}

/** Result for verify-symlinks tool */
export interface VerifySymlinksResult {
  valid: string[];
  broken: string[];
  missing: string[];
}

/** Result for rebuild tool */
export interface RebuildToolResult {
  generated: string[];
  symlinked: string[];
  errors: string[];
}

/** Result for get-physical-path tool */
export interface GetPhysicalPathResult {
  physicalPath: string | null;
}

// ============================================================================
// SPEC HEADER TYPES
// ============================================================================

/** Spec header with symlink information */
export interface SpecWithTarget {
  filePath: string;
  metadata: SpecMetadata;
  target: string;
  outputPath?: string;
  language?: string;
}

// ============================================================================
// CROSS-PLATFORM SUPPORT
// ============================================================================

/** Platform detection */
export type Platform = 'unix' | 'windows';

/** Fallback strategy when symlinks unavailable */
export interface FallbackConfig {
  enabled: boolean;
  strategy: 'copy' | 'warn';
  copiesFile: string;
}

/** Get platform-specific symlink config */
export function getPlatformConfig(): SymlinkPlatform {
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    return {
      type: 'junction',
      command: 'mklink /J',
      requires: 'Developer mode or admin',
      hasFallback: true,
    };
  }
  
  return {
    type: 'symbolic',
    command: 'ln -s',
    hasFallback: true,
  };
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

/** Default paths for dual-view system */
export const DEFAULT_DUAL_VIEW_CONFIG: DualView = {
  physical: {
    location: 'specs/',
    structure: 'hierarchical with .spec.dir/',
    contents: [],
  },
  logical: {
    location: ['src/', 'tests/', 'docs/', 'generated/'],
    structure: 'conventional project layout',
    contents: [],
  },
  mapping: {
    requiredField: 'target',
    format: 'target: src/auth/login.go',
  },
};

/** Default git config for symlinks */
export const DEFAULT_GIT_SYMLINKS_CONFIG: GitSymlinksConfig = {
  tracked: ['specs/', '.symlinks/'],
  gitignore: [],
  gitConfig: { 'core.symlinks': 'true' },
};

/** Default fallback config */
export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  enabled: true,
  strategy: 'copy',
  copiesFile: '.speclang/copies.json',
};
