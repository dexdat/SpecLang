"use strict";
// Generated from specs/directory-structure.spec.md
// DO NOT EDIT MANUALLY
// Source: @block:dir/* @kind:entity
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanDirectory = scanDirectory;
exports.getSpecTree = getSpecTree;
exports.validateSpecPath = validateSpecPath;
const promises_1 = require("fs/promises");
const path_1 = require("path");
/**
 * Scan a directory for spec files and directories
 */
async function scanDirectory(rootPath, maxDepth = 10) {
    const result = {
        specFiles: [],
        specDirs: [],
        nestingDepth: 0,
        maxDepth: 0,
    };
    await scanRecursive(rootPath, 0, result, maxDepth);
    result.maxDepth = result.nestingDepth;
    return result;
}
async function scanRecursive(currentPath, depth, result, maxDepth) {
    if (depth > maxDepth) {
        return;
    }
    try {
        const entries = await (0, promises_1.readdir)(currentPath);
        for (const entry of entries) {
            const fullPath = (0, path_1.join)(currentPath, entry);
            const stats = await (0, promises_1.stat)(fullPath);
            if (stats.isDirectory()) {
                if (entry.endsWith('.dir')) {
                    // Found a spec directory
                    const info = {
                        path: fullPath,
                        name: entry,
                        type: 'dir',
                        depth,
                        parent: currentPath,
                    };
                    result.specDirs.push(info);
                    result.nestingDepth = Math.max(result.nestingDepth, depth + 1);
                    // Recursively scan the directory
                    await scanRecursive(fullPath, depth + 1, result, maxDepth);
                }
                else {
                    // Regular directory, scan it too
                    await scanRecursive(fullPath, depth + 1, result, maxDepth);
                }
            }
            else if (stats.isFile()) {
                // Check if it's a spec file
                if (isSpecFile(entry)) {
                    const info = {
                        path: fullPath,
                        name: entry,
                        type: getFileType(entry),
                        depth,
                        parent: currentPath,
                    };
                    result.specFiles.push(info);
                }
            }
        }
    }
    catch (error) {
        // Skip directories we can't read
        console.warn(`Could not scan directory ${currentPath}:`, error);
    }
}
function isSpecFile(filename) {
    const specPatterns = [
        /\.spec\.md$/,
        /\.spec\.yaml$/,
        /\.spec\.yml$/,
        /\.scl$/,
        /\.go\.spec$/,
        /\.ts\.spec$/,
        /\.py\.spec$/,
        /\.rs\.spec$/,
        /\.js\.spec$/,
    ];
    return specPatterns.some(pattern => pattern.test(filename));
}
function getFileType(filename) {
    if (filename.endsWith('.dir')) {
        return 'dir';
    }
    else if (filename.includes('.dir/')) {
        return 'subspec';
    }
    else if (filename.endsWith('.go.spec') || filename.endsWith('.ts.spec') ||
        filename.endsWith('.py.spec') || filename.endsWith('.rs.spec')) {
        return 'code';
    }
    else {
        return 'spec';
    }
}
/**
 * Get all spec files in a tree structure
 */
async function getSpecTree(rootPath) {
    const result = await scanDirectory(rootPath);
    const tree = new Map();
    // Group by parent
    for (const file of [...result.specFiles, ...result.specDirs]) {
        const parent = file.parent || 'root';
        if (!tree.has(parent)) {
            tree.set(parent, []);
        }
        tree.get(parent).push(file);
    }
    return tree;
}
/**
 * Check if a path follows spec directory conventions
 */
function validateSpecPath(path) {
    const issues = [];
    // Check for correct extensions
    if (!isSpecFile(path) && !path.endsWith('.dir/') && !path.endsWith('.dir')) {
        issues.push('Path does not match spec file or directory pattern');
    }
    // Check naming conventions (lowercase with hyphens)
    const filename = path.split('/').pop() || '';
    if (filename.includes('_')) {
        issues.push('Filename should use hyphens instead of underscores');
    }
    if (/[A-Z]/.test(filename)) {
        issues.push('Filename should be lowercase');
    }
    return {
        valid: issues.length === 0,
        issues,
    };
}
//# sourceMappingURL=scanner.js.map