"use strict";
/**
 * SPECLANG-GENERATED: Directory builder for .spec.dir/ structure
 * Source: @speclang/dynamic-split/strategy @block:split/dir-structure
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
exports.DirectoryBuilder = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Build and manage .spec.dir/ directory structure
 */
class DirectoryBuilder {
    /**
     * Create the directory structure for split specs
     */
    static createDirStructure(parentPath) {
        const dirPath = this.getDirPath(parentPath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        return dirPath;
    }
    /**
     * Get the .spec.dir/ path from a parent spec path
     */
    static getDirPath(parentPath) {
        return parentPath.replace(/\.spec\.(yaml|md|ts)$/, '.spec.dir');
    }
    /**
     * Check if a directory is a spec split directory
     */
    static isSpecDir(dirPath) {
        return dirPath.endsWith('.spec.dir');
    }
    /**
     * Get parent spec path from a directory or child file path
     */
    static getParentPath(inputPath) {
        // Check if it's already a directory path
        let dirPath = inputPath;
        // If it's a file inside .spec.dir/, get the directory
        if (inputPath.includes('.spec.dir/')) {
            const match = inputPath.match(/(.+)\.spec\.dir\//);
            if (match) {
                dirPath = match[1] + '.spec.dir';
            }
        }
        else if (!inputPath.endsWith('.spec.dir')) {
            return null;
        }
        if (!this.isSpecDir(dirPath)) {
            return null;
        }
        const parentPath = dirPath.replace(/\.spec\.dir$/, '.spec.yaml');
        // Check if parent exists
        if (fs.existsSync(parentPath)) {
            return parentPath;
        }
        // Try .spec.md
        const parentPathMd = dirPath.replace(/\.spec\.dir$/, '.spec.md');
        if (fs.existsSync(parentPathMd)) {
            return parentPathMd;
        }
        // Return expected path even if it doesn't exist
        return parentPath;
    }
    /**
     * List all child specs in a directory
     */
    static listChildren(dirPath) {
        if (!fs.existsSync(dirPath)) {
            return [];
        }
        const files = fs.readdirSync(dirPath);
        const specFiles = files
            .filter(f => f.match(/\.spec\.(yaml|md|ts)$/))
            .map(f => path.join(dirPath, f))
            .sort();
        return specFiles;
    }
    /**
     * Get all spec paths in a split directory (parent + children)
     */
    static getAllSpecPaths(parentPath) {
        const paths = [parentPath];
        const dirPath = this.getDirPath(parentPath);
        if (fs.existsSync(dirPath)) {
            const children = this.listChildren(dirPath);
            paths.push(...children);
        }
        return paths;
    }
    /**
     * Write a split file to disk
     */
    static writeSplitFile(file) {
        const dir = path.dirname(file.path);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(file.path, file.content, 'utf-8');
    }
    /**
     * Write multiple split files
     */
    static writeSplitFiles(files) {
        for (const file of files) {
            this.writeSplitFile(file);
        }
    }
    /**
     * Delete a split directory (for merging)
     */
    static deleteDir(parentPath) {
        const dirPath = this.getDirPath(parentPath);
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
        }
    }
    /**
     * Check if split directory exists
     */
    static dirExists(parentPath) {
        const dirPath = this.getDirPath(parentPath);
        return fs.existsSync(dirPath);
    }
    /**
     * Get directory info
     */
    static getDirInfo(parentPath) {
        const dirPath = this.getDirPath(parentPath);
        const exists = fs.existsSync(dirPath);
        if (!exists) {
            return {
                exists: false,
                path: dirPath,
                childCount: 0,
                children: [],
            };
        }
        const children = this.listChildren(dirPath);
        return {
            exists: true,
            path: dirPath,
            childCount: children.length,
            children,
        };
    }
}
exports.DirectoryBuilder = DirectoryBuilder;
//# sourceMappingURL=directory-builder.js.map