"use strict";
/**
 * SPECLANG-GENERATED: Index updater for parent spec
 * Source: @speclang/dynamic-split/strategy @block:split/result
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
exports.IndexUpdater = void 0;
const fs = __importStar(require("fs"));
/**
 * Update the parent index file after splitting
 */
class IndexUpdater {
    /**
     * Update parent spec to be an index file
     */
    static updateParent(result) {
        // Write parent file
        fs.writeFileSync(result.parent.path, result.parent.content, 'utf-8');
    }
    /**
     * Create index content for parent
     */
    static createIndexContent(parentPath, children, metadata) {
        const parentId = metadata.id || this.pathToId(parentPath);
        const version = metadata.version || '1.0.0';
        // Generate children references
        const childrenRefs = children.map(child => {
            const childId = this.pathToId(child.path);
            return `  - @ref:${childId}`;
        }).join('\n');
        const childCount = children.length;
        const short = metadata.short ||
            `${parentId.split('/').pop()} (${childCount} sub-specs)`;
        const headerLines = 10;
        return `# speclang-header lines:${headerLines}
id: ${parentId}
version: ${version}
children:
${childrenRefs}
short: "${short}"
---

This spec has been split. See ${this.getDirName(parentPath)}/ for details.
`;
    }
    /**
     * Convert path to spec ID
     */
    static pathToId(filePath) {
        const normalized = filePath
            .replace(/^specs\//, '')
            .replace(/\.spec\.(yaml|md|ts)$/, '')
            .replace(/\.dir\//, '.dir/');
        return `@${normalized}`;
    }
    /**
     * Get directory name from path
     */
    static getDirName(filePath) {
        return filePath.replace(/\.spec\.(yaml|md|ts)$/, '').split('/').pop() || '';
    }
    /**
     * Read current parent content
     */
    static readParent(parentPath) {
        if (!fs.existsSync(parentPath)) {
            throw new Error(`Parent file not found: ${parentPath}`);
        }
        return fs.readFileSync(parentPath, 'utf-8');
    }
    /**
     * Extract metadata from parent
     */
    static extractParentMetadata(content) {
        const metadata = {};
        // Extract id
        const idMatch = content.match(/^id:\s*(.+)$/m);
        if (idMatch) {
            metadata.id = idMatch[1].trim();
        }
        // Extract version
        const versionMatch = content.match(/^version:\s*(.+)$/m);
        if (versionMatch) {
            metadata.version = versionMatch[1].trim();
        }
        // Extract short
        const shortMatch = content.match(/^short:\s*(.+)$/m);
        if (shortMatch) {
            metadata.short = shortMatch[1].trim();
        }
        // Extract children
        const childrenMatch = content.match(/children:\s*([\s\S]*?)(?:^---)/m);
        if (childrenMatch) {
            const children = [];
            const refMatches = Array.from(childrenMatch[1].matchAll(/@ref:([^\s]+)/g));
            for (const match of refMatches) {
                children.push(match[1]);
            }
            metadata.children = children;
        }
        return metadata;
    }
    /**
     * Check if parent is an index file
     */
    static isIndexFile(parentPath) {
        if (!fs.existsSync(parentPath)) {
            return false;
        }
        const content = fs.readFileSync(parentPath, 'utf-8');
        return content.includes('children:') && content.includes('This spec has been split');
    }
    /**
     * Get all index files in specs directory
     */
    static findIndexFiles(specsDir) {
        if (!fs.existsSync(specsDir)) {
            return [];
        }
        const indexFiles = [];
        const entries = fs.readdirSync(specsDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.spec.yaml')) {
                const filePath = `${specsDir}/${entry.name}`;
                if (this.isIndexFile(filePath)) {
                    indexFiles.push(filePath);
                }
            }
            else if (entry.isDirectory() && entry.name.endsWith('.spec.dir')) {
                // Check parent
                const parentPath = filePathToSpecPath(`${specsDir}/${entry.name}`);
                if (parentPath && this.isIndexFile(parentPath)) {
                    indexFiles.push(parentPath);
                }
            }
        }
        return indexFiles;
    }
}
exports.IndexUpdater = IndexUpdater;
/**
 * Convert directory path to spec path
 */
function filePathToSpecPath(dirPath) {
    return dirPath.replace(/\.spec\.dir$/, '.spec.yaml');
}
//# sourceMappingURL=index-updater.js.map