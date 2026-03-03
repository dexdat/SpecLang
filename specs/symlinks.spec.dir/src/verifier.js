"use strict";
/**
 * SPECLANG-GENERATED: Symlink verifier
 * Source: @speclang/symlinks/verification
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
exports.verifySymlinks = verifySymlinks;
exports.verifySymlink = verifySymlink;
exports.scanSymlinks = scanSymlinks;
exports.repairSymlinks = repairSymlinks;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * Verify all symlinks are valid
 *
 * @block:symlinks/verification @kind:operation
 */
async function verifySymlinks(symlinks) {
    const result = {
        valid: [],
        broken: [],
        missing: [],
    };
    for (const link of symlinks) {
        const verification = await verifySymlink(link.logicalPath, link.physicalPath);
        if (verification.isValid) {
            result.valid.push(link.logicalPath);
        }
        else if (verification.exists) {
            result.broken.push(link);
        }
        else {
            result.missing.push(link);
        }
    }
    return result;
}
/**
 * Verify a single symlink
 */
async function verifySymlink(logicalPath, expectedPhysicalPath) {
    try {
        const stats = await fs.lstat(logicalPath);
        if (!stats.isSymbolicLink()) {
            return { isValid: false, exists: true };
        }
        // Read the symlink target
        const actualTarget = await fs.readlink(logicalPath);
        // Resolve to absolute path for comparison
        const dir = path.dirname(logicalPath);
        const resolvedTarget = path.resolve(dir, actualTarget);
        const resolvedExpected = expectedPhysicalPath
            ? path.resolve(expectedPhysicalPath)
            : null;
        // Check if it points to expected location
        if (resolvedExpected && resolvedTarget !== resolvedExpected) {
            return { isValid: false, exists: true, actualTarget: resolvedTarget };
        }
        // Check if target actually exists
        try {
            await fs.access(resolvedTarget);
            return { isValid: true, exists: true, actualTarget: resolvedTarget };
        }
        catch {
            return { isValid: false, exists: true, actualTarget: resolvedTarget };
        }
    }
    catch (error) {
        const err = error;
        if (err.code === 'ENOENT') {
            return { isValid: false, exists: false };
        }
        throw error;
    }
}
/**
 * Scan directory for symlinks
 */
async function scanSymlinks(dirPath) {
    const symlinks = [];
    async function scan(dir) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isSymbolicLink()) {
                    const target = await fs.readlink(fullPath);
                    const resolvedTarget = path.resolve(dir, target);
                    symlinks.push({
                        logicalPath: fullPath,
                        physicalPath: resolvedTarget,
                        isValid: false, // Will be verified separately
                    });
                }
                else if (entry.isDirectory()) {
                    await scan(fullPath);
                }
            }
        }
        catch (error) {
            // Ignore permission errors
        }
    }
    await scan(dirPath);
    return symlinks;
}
/**
 * Repair broken symlinks
 */
async function repairSymlinks(symlinks) {
    const result = {
        repaired: [],
        failed: [],
    };
    for (const link of symlinks) {
        try {
            const verification = await verifySymlink(link.logicalPath, link.physicalPath);
            if (!verification.isValid && verification.exists) {
                // Broken symlink - remove and recreate
                await fs.unlink(link.logicalPath);
                const dir = path.dirname(link.logicalPath);
                const relativePath = path.relative(dir, link.physicalPath);
                await fs.symlink(relativePath, link.logicalPath);
                result.repaired.push(link.logicalPath);
            }
        }
        catch (error) {
            result.failed.push(link.logicalPath);
        }
    }
    return result;
}
//# sourceMappingURL=verifier.js.map