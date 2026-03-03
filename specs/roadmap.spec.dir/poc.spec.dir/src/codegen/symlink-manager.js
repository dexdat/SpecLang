"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/code-generation.spec.md
 * Generated: 2026-03-03T05:30:00.000Z
 *
 * Edit the spec, not this file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mkdir = void 0;
exports.createSpecSymlink = createSpecSymlink;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const os_1 = require("os");
const crypto_1 = require("crypto");
const poc_1 = require("../types/poc");
const path_utils_1 = require("../utils/path-utils");
/**
 * Create or update symlink for a spec
 * @param specId - Full spec ID
 * @param outputDir - Output directory (default './src')
 */
async function createSpecSymlink(specId, outputDir = './src') {
    const slug = (0, path_utils_1.slugifySpecId)(specId);
    const linkPath = (0, path_1.join)(outputDir, slug);
    const sourceDir = (0, path_1.join)('specs', `${slug}.spec.dir`, 'src');
    await validateSymlinkTarget(linkPath, sourceDir, outputDir);
    const targetPath = (0, path_1.relative)((0, path_1.dirname)(linkPath), sourceDir);
    // Remove existing symlink if present
    try {
        await (0, promises_1.unlink)(linkPath);
    }
    catch {
        // File might not exist
    }
    const isWindows = (0, os_1.platform)() === 'win32';
    if (isWindows) {
        try {
            await (0, promises_1.symlink)(targetPath, linkPath, 'junction');
        }
        catch (error) {
            console.log(`[SymlinkManager] Symlink failed on Windows, using directory sync`);
            await syncDirectory(sourceDir, linkPath);
        }
    }
    else {
        await (0, promises_1.symlink)(targetPath, linkPath);
    }
}
/**
 * Validate symlink target for security
 */
async function validateSymlinkTarget(linkPath, sourceDir, outputDir) {
    const absLinkPath = (0, path_1.resolve)(linkPath);
    const absSourceDir = (0, path_1.resolve)(sourceDir);
    const realSourceDir = await (0, promises_1.realpath)(absSourceDir).catch(() => absSourceDir);
    const projectRoot = (0, path_1.resolve)(process.cwd());
    const sourceRelative = (0, path_1.relative)(projectRoot, realSourceDir);
    if (sourceRelative.startsWith('..') || sourceRelative.includes(':')) {
        throw new poc_1.POCError('SYMLINK_ERROR', `Symlink source "${sourceDir}" is outside project directory`, linkPath);
    }
    const linkRelative = (0, path_1.relative)((0, path_1.resolve)(outputDir), absLinkPath);
    if (linkRelative.startsWith('..') || linkRelative.includes(':')) {
        throw new poc_1.POCError('SYMLINK_ERROR', `Symlink path "${linkPath}" is outside output directory`, linkPath);
    }
    try {
        await (0, promises_1.access)(realSourceDir, promises_1.constants.R_OK);
    }
    catch {
        throw new poc_1.POCError('SYMLINK_ERROR', `Source directory "${sourceDir}" does not exist or is not readable`, linkPath);
    }
}
/**
 * Sync directory contents (Windows fallback)
 */
async function syncDirectory(source, dest) {
    const tempDir = (0, path_1.join)((0, path_1.dirname)(dest), `.tmp-${(0, crypto_1.randomBytes)(8).toString('hex')}`);
    try {
        await (0, promises_2.mkdir)(tempDir, { recursive: true });
        const sourceFiles = await (0, promises_1.readdir)(source);
        for (const file of sourceFiles) {
            const srcPath = (0, path_1.join)(source, file);
            const destPath = (0, path_1.join)(tempDir, file);
            await (0, promises_1.copyFile)(srcPath, destPath);
        }
        try {
            await (0, promises_1.rm)(dest, { recursive: true, force: true });
        }
        catch {
            // dest may not exist
        }
        await (0, promises_1.rename)(tempDir, dest);
    }
    finally {
        try {
            await (0, promises_1.rm)(tempDir, { recursive: true, force: true });
        }
        catch {
            // ignore cleanup errors
        }
    }
}
// Re-export mkdir for use
const promises_2 = require("fs/promises");
Object.defineProperty(exports, "mkdir", { enumerable: true, get: function () { return promises_2.mkdir; } });
//# sourceMappingURL=symlink-manager.js.map