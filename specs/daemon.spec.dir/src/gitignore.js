"use strict";
/**
 * Gitignore pattern matching for file watching
 *
 * Generated from: @speclang/daemon/events
 *
 * Supports:
 * - Standard .gitignore patterns
 * - Negation patterns (!prefix)
 * - Directory patterns (ending with /)
 * - Wildcard patterns (* and **)
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
exports.Gitignore = void 0;
const fs = __importStar(require("fs-extra"));
class Gitignore {
    patterns;
    negatedPatterns;
    constructor() {
        this.patterns = [];
        this.negatedPatterns = [];
    }
    /**
     * Create Gitignore from file path
     */
    static async fromFile(filePath) {
        const gitignore = new Gitignore();
        try {
            const exists = await fs.pathExists(filePath);
            if (!exists) {
                return gitignore;
            }
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    gitignore.add(trimmed);
                }
            }
        }
        catch (error) {
            // Ignore errors, return empty gitignore
        }
        return gitignore;
    }
    /**
     * Create Gitignore from string content
     */
    static fromContent(content) {
        const gitignore = new Gitignore();
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                gitignore.add(trimmed);
            }
        }
        return gitignore;
    }
    /**
     * Add a pattern
     */
    add(pattern) {
        const isNegated = pattern.startsWith('!');
        const cleanPattern = isNegated ? pattern.slice(1) : pattern;
        const isDir = cleanPattern.endsWith('/');
        const patternStr = isDir ? cleanPattern.slice(0, -1) : cleanPattern;
        const regex = this.patternToRegex(patternStr);
        if (isNegated) {
            this.negatedPatterns.push({ pattern: regex, isDir });
        }
        else {
            this.patterns.push({ pattern: regex, negated: false, isDir });
        }
        return this;
    }
    /**
     * Check if a path should be ignored
     */
    isIgnored(filePath) {
        const normalizedPath = filePath.replace(/\\/g, '/');
        const parts = normalizedPath.split('/');
        // Check each part of the path
        for (let i = 0; i < parts.length; i++) {
            const partialPath = parts.slice(0, i + 1).join('/');
            // Check positive patterns
            for (const { pattern, isDir } of this.patterns) {
                if (isDir) {
                    // Directory pattern - check if any parent matches
                    if (pattern.test(partialPath + '/') || pattern.test(partialPath)) {
                        // Check if negated by a later pattern
                        if (!this.isNegated(partialPath)) {
                            return true;
                        }
                    }
                }
                else {
                    if (pattern.test(partialPath)) {
                        if (!this.isNegated(partialPath)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
    /**
     * Check if path is explicitly negated
     */
    isNegated(filePath) {
        const normalizedPath = filePath.replace(/\\/g, '/');
        for (const { pattern, isDir } of this.negatedPatterns) {
            if (isDir) {
                if (pattern.test(normalizedPath + '/') || pattern.test(normalizedPath)) {
                    return true;
                }
            }
            else {
                if (pattern.test(normalizedPath)) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Convert gitignore pattern to regex
     */
    patternToRegex(pattern) {
        let regexStr = pattern
            .replace(/\./g, '\\.')
            .replace(/\*\*/g, '{{GLOBSTAR}}')
            .replace(/\*/g, '[^/]*')
            .replace(/{{GLOBSTAR}}/g, '.*')
            .replace(/\?/g, '[^/]');
        // Handle **/ prefix (matches anything before)
        if (regexStr.startsWith('.*/')) {
            regexStr = '.*/' + regexStr.slice(3);
        }
        // Handle /** suffix (matches anything after)
        if (regexStr.endsWith('/.*')) {
            regexStr = regexStr.slice(0, -3) + '(/.*)?';
        }
        return new RegExp(`^${regexStr}$`);
    }
}
exports.Gitignore = Gitignore;
//# sourceMappingURL=gitignore.js.map