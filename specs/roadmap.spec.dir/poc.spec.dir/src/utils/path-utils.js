"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/path-utils.spec.md
 * Generated: 2026-03-03T04:00:00.000Z
 *
 * Edit the spec, not this file.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugifySpecId = slugifySpecId;
exports.unslugifySpecId = unslugifySpecId;
exports.resolveSpecPaths = resolveSpecPaths;
exports.resolveBlockOutputPath = resolveBlockOutputPath;
exports.getSpecIdFromPath = getSpecIdFromPath;
exports.isSpecPath = isSpecPath;
exports.isGeneratedPath = isGeneratedPath;
exports.getSymlinkTarget = getSymlinkTarget;
exports.resolveBlockPaths = resolveBlockPaths;
exports.ensureSpecDirectories = ensureSpecDirectories;
const path_1 = require("path");
/**
 * Windows reserved filenames that cannot be used
 */
const WINDOWS_RESERVED_NAMES = new Set([
    'con', 'prn', 'aux', 'nul',
    'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
    'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'
]);
/**
 * Slugify a spec ID for filesystem use with reversible encoding
 * @param specId - Full spec ID (e.g., "@examples/greeting")
 * @returns Filesystem-safe slug (e.g., "examples-SLASH-greeting")
 */
function slugifySpecId(specId) {
    // Use '-SLASH-' to encode / for unambiguous reversibility
    // @examples/greeting → examples-SLASH-greeting
    // @my-spec/auth → my-spec-SLASH-auth
    let slug = specId
        .replace(/^@/, '') // Remove leading @
        .replace(/\//g, '-SLASH-') // Replace / with -SLASH- (reversible, unique)
        .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace other special chars
        .toLowerCase();
    // Handle Windows reserved names by prefixing with underscore
    const baseName = slug.split('-SLASH-').pop() || slug;
    if (WINDOWS_RESERVED_NAMES.has(baseName)) {
        slug = slug.replace(baseName, '_' + baseName);
    }
    return slug;
}
/**
 * Reverse slugification (recover original spec ID)
 * @param slug - Filesystem slug
 * @returns Original spec ID (e.g., "@examples/greeting")
 */
function unslugifySpecId(slug) {
    // Remove Windows reserved name prefix if present
    let cleaned = slug;
    for (const reserved of WINDOWS_RESERVED_NAMES) {
        if (slug.includes('_' + reserved)) {
            cleaned = slug.replace('_' + reserved, reserved);
            break;
        }
    }
    // Reverse: replace -SLASH- with /
    return '@' + cleaned.replace(/-SLASH-/g, '/');
}
/**
 * Resolve paths for a spec ID
 * @param specId - Full spec ID
 * @returns Resolved path information
 */
function resolveSpecPaths(specId) {
    const slug = slugifySpecId(specId);
    return {
        slug,
        specPath: (0, path_1.join)('specs', `${slug}.spec.md`),
        specDir: (0, path_1.join)('specs', `${slug}.spec.dir`),
        srcDir: (0, path_1.join)('specs', `${slug}.spec.dir`, 'src'),
        symlinkPath: (0, path_1.join)('src', slug)
    };
}
/**
 * Resolve output path for a block
 * @param specId - Full spec ID
 * @param blockId - Block ID
 * @returns Full output file path
 */
function resolveBlockOutputPath(specId, blockId) {
    const { srcDir } = resolveSpecPaths(specId);
    return (0, path_1.join)(srcDir, `${blockId}.ts`);
}
/**
 * Get spec ID from file path (reverse lookup)
 * @param filePath - Absolute or relative file path
 * @returns Spec ID or null if not a spec file
 */
function getSpecIdFromPath(filePath) {
    // Check if it's a spec file
    if (filePath.endsWith('.spec.md')) {
        const slug = (0, path_1.basename)(filePath, '.spec.md');
        return unslugifySpecId(slug);
    }
    // Check if it's in a spec.dir
    const specDirMatch = filePath.match(/specs\/([^/]+)\.spec\.dir/);
    if (specDirMatch) {
        return unslugifySpecId(specDirMatch[1]);
    }
    return null;
}
/**
 * Check if a path is within the specs directory
 * @param filePath - File path to check
 * @returns True if path is in specs/
 */
function isSpecPath(filePath) {
    return filePath.includes('/specs/') || filePath.startsWith('specs/');
}
/**
 * Check if a path is a generated source file
 * @param filePath - File path to check
 * @returns True if path is in a .spec.dir/src/
 */
function isGeneratedPath(filePath) {
    return filePath.includes('.spec.dir/src/');
}
/**
 * Get relative path from symlink to source
 * @param specId - Full spec ID
 * @returns Relative path for symlink target
 */
function getSymlinkTarget(specId) {
    const slug = slugifySpecId(specId);
    return (0, path_1.join)('..', 'specs', `${slug}.spec.dir`, 'src');
}
/**
 * Resolve all paths for a block
 * @param specId - Full spec ID
 * @param blockId - Block ID
 * @returns Complete path information
 */
function resolveBlockPaths(specId, blockId) {
    const base = resolveSpecPaths(specId);
    return {
        specId,
        blockId,
        slug: base.slug,
        specPath: base.specPath,
        specDir: base.specDir,
        srcDir: base.srcDir,
        blockPath: (0, path_1.join)(base.srcDir, `${blockId}.ts`),
        indexPath: (0, path_1.join)(base.srcDir, 'index.ts'),
        symlinkPath: base.symlinkPath,
        symlinkTarget: getSymlinkTarget(specId)
    };
}
/**
 * Ensure all directories exist for a spec
 * @param specId - Full spec ID
 * @returns Promise that resolves when directories are created
 */
async function ensureSpecDirectories(specId) {
    const { mkdir } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
    const paths = resolveSpecPaths(specId);
    await mkdir(paths.specDir, { recursive: true });
    await mkdir(paths.srcDir, { recursive: true });
}
//# sourceMappingURL=path-utils.js.map