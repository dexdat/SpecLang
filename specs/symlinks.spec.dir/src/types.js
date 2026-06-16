"use strict";
/**
 * SPECLANG-GENERATED: Symlinks types
 * Source: @speclang/symlinks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FALLBACK_CONFIG = exports.DEFAULT_GIT_SYMLINKS_CONFIG = exports.DEFAULT_DUAL_VIEW_CONFIG = void 0;
exports.getPlatformConfig = getPlatformConfig;
/** Get platform-specific symlink config */
function getPlatformConfig() {
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
exports.DEFAULT_DUAL_VIEW_CONFIG = {
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
exports.DEFAULT_GIT_SYMLINKS_CONFIG = {
    tracked: ['specs/', '.symlinks/'],
    gitignore: [],
    gitConfig: { 'core.symlinks': 'true' },
};
/** Default fallback config */
exports.DEFAULT_FALLBACK_CONFIG = {
    enabled: true,
    strategy: 'copy',
    copiesFile: '.speclang/copies.json',
};
//# sourceMappingURL=types.js.map