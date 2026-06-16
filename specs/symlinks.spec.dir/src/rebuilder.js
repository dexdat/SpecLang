"use strict";
/**
 * SPECLANG-GENERATED: Symlink rebuilder
 * Source: @speclang/symlinks/creation @speclang/symlinks/verification
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
exports.rebuild = rebuild;
exports.quickRebuild = quickRebuild;
exports.fullRebuild = fullRebuild;
exports.getPhysicalPath = getPhysicalPath;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const creator_js_1 = require("./creator.js");
const verifier_js_1 = require("./verifier.js");
/**
 * Rebuild entire project from specs/
 *
 * @block:symlinks/rebuild @kind:operation
 *
 * Scenario: rm -rf src/ tests/ generated/
 *
 * Steps:
 * 1. Scan specs/ for all files
 * 2. Parse headers, find targets
 * 3. Regenerate code if needed
 * 4. Create all symlinks
 * 5. Verify symlinks valid
 * 6. Done
 */
async function rebuild(specs, options = {}) {
    const result = {
        generated: [],
        symlinked: [],
        errors: [],
    };
    const { clean = false, regenerate = true, verify = true, } = options;
    // Step 1: Clean if requested
    if (clean) {
        const logicalDirs = ['src/', 'tests/', 'generated/', 'docs/'];
        for (const dir of logicalDirs) {
            try {
                await fs.rm(dir, { recursive: true, force: true });
            }
            catch {
                // Ignore errors during clean
            }
        }
    }
    // Step 2 & 3: Generate code (placeholder - actual generation would happen here)
    if (regenerate) {
        // In a real implementation, this would call the code generator
        // For now, we just track which specs would be regenerated
        result.generated = specs.map(s => s.filePath);
    }
    // Step 4: Create symlinks
    const symlinkResult = await (0, creator_js_1.createSymlinks)(specs);
    result.symlinked = symlinkResult.created;
    result.errors.push(...symlinkResult.errors.map(err => ({
        path: err.path,
        code: err.code,
        message: err.message,
    })));
    // Step 5: Verify symlinks
    if (verify) {
        const symlinkEntries = await (0, verifier_js_1.scanSymlinks)('.');
        const verification = await (0, verifier_js_1.verifySymlinks)(symlinkEntries);
        // Log broken symlinks as warnings
        for (const broken of verification.broken) {
            result.errors.push({
                path: broken.logicalPath,
                code: 'BROKEN_SYMLINK',
                message: `Broken symlink: ${broken.logicalPath}`,
            });
        }
    }
    return result;
}
/**
 * Quick rebuild - just recreate symlinks without regeneration
 */
async function quickRebuild(specs) {
    return rebuild(specs, { clean: false, regenerate: false, verify: true });
}
/**
 * Full rebuild - clean, regenerate, recreate symlinks
 */
async function fullRebuild(specs) {
    return rebuild(specs, { clean: true, regenerate: true, verify: true });
}
/**
 * Get physical path from logical path (resolve symlink)
 *
 * Tool: speclang_get_physical_path
 */
async function getPhysicalPath(logicalPath) {
    try {
        const stats = await fs.lstat(logicalPath);
        if (stats.isSymbolicLink()) {
            const target = await fs.readlink(logicalPath);
            const dir = path.dirname(logicalPath);
            return path.resolve(dir, target);
        }
        // Not a symlink, return the path itself
        return path.resolve(logicalPath);
    }
    catch (error) {
        const err = error;
        if (err.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}
//# sourceMappingURL=rebuilder.js.map