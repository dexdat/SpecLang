/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/symlinks.spec.md, specs/symlinks.spec.dir/creation.spec.md, specs/symlinks.spec.dir/verification.spec.md
 * Blocks: @block:symlinks/overview, @block:symlinks/dual-view, @block:symlinks/tools
 * Generated: 2026-02-23
 * 
 * Edit the spec, not this file.
 */

export * from './types.js';
export * from './creator.js';
export * from './verifier.js';
export * from './rebuilder.js';

// Re-export tool result types for convenience
export type {
  CreateSymlinksResult,
  VerifySymlinksResult,
  RebuildToolResult,
  GetPhysicalPathResult,
} from './types.js';

// Default configuration exports
export {
  DEFAULT_DUAL_VIEW_CONFIG,
  DEFAULT_GIT_SYMLINKS_CONFIG,
  DEFAULT_FALLBACK_CONFIG,
  getPlatformConfig,
} from './types.js';
