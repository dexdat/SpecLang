"use strict";
/**
 * SPECLANG-GENERATED: Symlink creator
 * Source: @speclang/symlinks/creation
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
exports.createSymlinks = createSymlinks;
exports.createSymlink = createSymlink;
exports.removeSymlink = removeSymlink;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const types_js_1 = require("./types.js");
/**
 * Create all symlinks from specs with target headers
 *
 * @block:symlinks/creation @kind:operation
 */
async function createSymlinks(specs) {
    const result = {
        created: [],
        skipped: [],
        errors: [],
    };
    const platform = (0, types_js_1.getPlatformConfig)();
    for (const spec of specs) {
        try {
            // Check if target file exists in specs/
            const physicalPath = spec.filePath;
            const targetPath = spec.target;
            // Check if source exists
            await fs.access(physicalPath);
            // Ensure target directory exists
            const targetDir = path.dirname(targetPath);
            await fs.mkdir(targetDir, { recursive: true });
            // Check if target already exists
            try {
                const stats = await fs.lstat(targetPath);
                if (stats.isSymbolicLink()) {
                    // Check if symlink already points to correct location
                    const existingTarget = await fs.readlink(targetPath);
                    if (existingTarget === physicalPath ||
                        existingTarget === path.relative(targetDir, physicalPath)) {
                        result.skipped.push(targetPath);
                        continue;
                    }
                    // Remove old symlink
                    await fs.unlink(targetPath);
                }
                else if (stats.isFile()) {
                    // Real file exists - skip or error
                    result.errors.push({
                        path: targetPath,
                        code: 'ALREADY_EXISTS',
                        message: 'Real file exists at target path, cannot create symlink',
                    });
                    continue;
                }
            }
            catch {
                // Target doesn't exist, which is fine
            }
            // Create symlink
            const relativePath = path.relative(targetDir, physicalPath);
            await fs.symlink(relativePath, targetPath);
            result.created.push(targetPath);
        }
        catch (error) {
            const err = error;
            let code = 'INVALID_PATH';
            if (err.code === 'ENOENT') {
                code = 'TARGET_NOT_FOUND';
            }
            else if (err.code === 'EACCES' || err.code === 'EPERM') {
                code = 'PERMISSION_DENIED';
            }
            else if (err.code === 'EEXIST') {
                code = 'ALREADY_EXISTS';
            }
            result.errors.push({
                path: spec.target,
                code,
                message: err.message,
            });
        }
    }
    return result;
}
/**
 * Create a single symlink
 */
async function createSymlink(logicalPath, physicalPath) {
    const entry = {
        logicalPath,
        physicalPath,
        isValid: false,
    };
    try {
        // Ensure parent directory exists
        const dir = path.dirname(logicalPath);
        await fs.mkdir(dir, { recursive: true });
        // Create relative symlink
        const relativePath = path.relative(dir, physicalPath);
        // Remove existing if present
        try {
            await fs.unlink(logicalPath);
        }
        catch {
            // Ignore if doesn't exist
        }
        await fs.symlink(relativePath, logicalPath);
        entry.isValid = true;
    }
    catch (error) {
        entry.isValid = false;
    }
    return entry;
}
/**
 * Remove a symlink
 */
async function removeSymlink(logicalPath) {
    try {
        const stats = await fs.lstat(logicalPath);
        if (stats.isSymbolicLink()) {
            await fs.unlink(logicalPath);
            return true;
        }
        return false;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=creator.js.map