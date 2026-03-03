"use strict";
/**
 * SPECLANG-GENERATED: File Tools
 * Source: @speclang/tools
 *
 * File operations with ownership enforcement
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
exports.listFilesTool = exports.deleteSpecTool = exports.updateSpecTool = exports.readHeaderTool = exports.readFileTool = exports.createSpecTool = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Parse header from spec content
 */
async function parseHeaderFromFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        // Find header section
        let headerStart = -1;
        let headerEnd = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === '---') {
                if (headerStart === -1) {
                    headerStart = i;
                }
                else {
                    headerEnd = i;
                    break;
                }
            }
        }
        if (headerStart === -1 || headerEnd === -1) {
            return null;
        }
        // Parse YAML header
        const headerLines = lines.slice(headerStart + 1, headerEnd);
        const headerText = headerLines.join('\n');
        // Simple YAML parser for our headers
        const header = {};
        let currentKey = '';
        let currentValue = '';
        let inArray = false;
        let arrayValues = [];
        for (const line of headerLines) {
            const trimmed = line.trim();
            // Check for array start
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                // Parse inline array
                const arrayContent = trimmed.slice(1, -1);
                if (arrayContent.trim()) {
                    header[currentKey] = arrayContent.split(',').map((s) => s.trim());
                }
                continue;
            }
            // Check for key-value
            const colonIndex = trimmed.indexOf(':');
            if (colonIndex > 0) {
                // Save previous key-value if any
                if (currentKey) {
                    header[currentKey] = currentValue.trim();
                }
                currentKey = trimmed.substring(0, colonIndex).trim();
                currentValue = trimmed.substring(colonIndex + 1).trim();
            }
            else if (trimmed === '' && currentValue) {
                // Continuation line
                currentValue += '\n' + trimmed;
            }
        }
        // Save last key-value
        if (currentKey) {
            header[currentKey] = currentValue.trim();
        }
        return {
            header,
            headerLines: headerEnd + 1,
        };
    }
    catch (error) {
        return null;
    }
}
/**
 * Format header for writing
 */
function formatHeader(header) {
    const lines = ['---'];
    for (const [key, value] of Object.entries(header)) {
        if (Array.isArray(value)) {
            lines.push(`${key}: [${value.join(', ')}]`);
        }
        else if (typeof value === 'string' && value.includes('\n')) {
            lines.push(`${key}: |`);
            for (const line of value.split('\n')) {
                lines.push(`  ${line}`);
            }
        }
        else {
            lines.push(`${key}: ${value}`);
        }
    }
    lines.push('---');
    return lines.join('\n');
}
// ============================================================================
// FILE TOOLS
// ============================================================================
/**
 * Create spec tool - creates a new spec file
 */
exports.createSpecTool = {
    name: 'speclang_create_spec',
    description: 'Create a new spec file',
    category: 'file',
    requiresOwnership: true,
    auditLog: true,
    inputSchema: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'Where to create the spec file' },
            header: {
                type: 'object',
                description: 'Header fields (id, version, layer, etc.)',
            },
            content: { type: 'string', description: 'Spec content' },
        },
        required: ['path', 'header', 'content'],
    },
    handler: async (input, context) => {
        const { path: filePath, header, content } = input;
        console.log(`[FileTools] Creating spec: ${filePath}`);
        try {
            // Check ownership
            if (context.ownership) {
                const ownership = context.ownership.canWrite(context.sessionId, context.agentRole, filePath);
                if (!ownership.allowed) {
                    return { success: false, error: ownership.reason };
                }
            }
            // Ensure directory exists
            await fs.ensureDir(path.dirname(filePath));
            // Format header and write file
            const headerStr = formatHeader(header);
            const fullContent = `${headerStr}\n\n${content}`;
            await fs.writeFile(filePath, fullContent, 'utf-8');
            console.log(`[FileTools] Created: ${filePath}`);
            return {
                success: true,
                data: { path: filePath },
                sideEffects: ['file_written'],
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Read file tool - reads full file content
 */
exports.readFileTool = {
    name: 'speclang_read_file',
    description: 'Read full file content',
    category: 'file',
    requiresOwnership: false,
    auditLog: true,
    inputSchema: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'File path to read' },
        },
        required: ['path'],
    },
    handler: async (input, context) => {
        const { path: filePath } = input;
        console.log(`[FileTools] Reading file: ${filePath}`);
        try {
            // Check read permission
            if (context.ownership) {
                const ownership = context.ownership.canRead(context.sessionId, filePath);
                if (!ownership.allowed) {
                    return { success: false, error: ownership.reason };
                }
            }
            const content = await fs.readFile(filePath, 'utf-8');
            // Try to parse header
            let header;
            if (filePath.endsWith('.spec') || filePath.endsWith('.scl')) {
                const headerData = await parseHeaderFromFile(filePath);
                header = headerData?.header;
            }
            return { success: true, data: { content, header } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Read header tool - reads only the header (efficient)
 */
exports.readHeaderTool = {
    name: 'speclang_read_header',
    description: 'Read only header (efficient)',
    category: 'file',
    requiresOwnership: false,
    auditLog: false,
    inputSchema: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'File path to read header from' },
        },
        required: ['path'],
    },
    handler: async (input, context) => {
        const { path: filePath } = input;
        console.log(`[FileTools] Reading header: ${filePath}`);
        try {
            // Read only first N lines
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            // Find header section
            let headerStart = -1;
            let headerEnd = -1;
            for (let i = 0; i < Math.min(lines.length, 50); i++) {
                if (lines[i].trim() === '---') {
                    if (headerStart === -1) {
                        headerStart = i;
                    }
                    else {
                        headerEnd = i;
                        break;
                    }
                }
            }
            if (headerStart === -1 || headerEnd === -1) {
                return { success: true, data: { header: {}, headerLines: 0 } };
            }
            // Parse header
            const headerLinesArr = lines.slice(headerStart + 1, headerEnd);
            const headerText = headerLinesArr.join('\n');
            // Simple YAML parser
            const header = {};
            let currentKey = '';
            for (const line of headerLinesArr) {
                const trimmed = line.trim();
                const colonIndex = trimmed.indexOf(':');
                if (colonIndex > 0) {
                    currentKey = trimmed.substring(0, colonIndex).trim();
                    let value = trimmed.substring(colonIndex + 1).trim();
                    // Handle array
                    if (value.startsWith('[') && value.endsWith(']')) {
                        value = value.slice(1, -1);
                        header[currentKey] = value.split(',').map((s) => s.trim());
                    }
                    else {
                        header[currentKey] = value;
                    }
                }
            }
            return {
                success: true,
                data: { header, headerLines: headerEnd + 1 },
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Update spec tool - updates existing spec
 */
exports.updateSpecTool = {
    name: 'speclang_update_spec',
    description: 'Update existing spec',
    category: 'file',
    requiresOwnership: true,
    auditLog: true,
    inputSchema: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'Path to spec file' },
            header: {
                type: 'object',
                description: 'Updated header fields',
            },
            content: { type: 'string', description: 'Updated content' },
            append: {
                type: 'boolean',
                description: 'Append to content instead of replacing',
                default: false,
            },
        },
        required: ['path'],
    },
    handler: async (input, context) => {
        const { path: filePath, header, content, append = false } = input;
        console.log(`[FileTools] Updating spec: ${filePath}`);
        try {
            // Check ownership
            if (context.ownership) {
                const ownership = context.ownership.canWrite(context.sessionId, context.agentRole, filePath);
                if (!ownership.allowed) {
                    return { success: false, error: ownership.reason };
                }
            }
            // Check if file exists
            const exists = await fs.pathExists(filePath);
            if (!exists) {
                return { success: false, error: 'File does not exist' };
            }
            if (append) {
                // Append mode
                const separator = '\n\n';
                let existingContent = await fs.readFile(filePath, 'utf-8');
                existingContent += separator + (content || '');
                await fs.writeFile(filePath, existingContent, 'utf-8');
            }
            else {
                // Replace mode - need to rebuild file
                const headerData = await parseHeaderFromFile(filePath);
                const existingHeader = headerData?.header || {};
                const newHeader = { ...existingHeader, ...header };
                // Read body content
                const fullContent = await fs.readFile(filePath, 'utf-8');
                const bodyStart = headerData?.headerLines || 0;
                const existingBody = bodyStart > 0 ? fullContent.split('\n').slice(bodyStart).join('\n').trim() : '';
                const newContent = content || existingBody;
                // Write back
                const headerStr = formatHeader(newHeader);
                await fs.writeFile(filePath, `${headerStr}\n\n${newContent}`, 'utf-8');
            }
            console.log(`[FileTools] Updated: ${filePath}`);
            return {
                success: true,
                data: { path: filePath },
                sideEffects: ['file_updated'],
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * Delete spec tool - deletes a spec file
 */
exports.deleteSpecTool = {
    name: 'speclang_delete_spec',
    description: 'Delete a spec file',
    category: 'file',
    requiresOwnership: true,
    auditLog: true,
    inputSchema: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'Path to spec file to delete' },
        },
        required: ['path'],
    },
    handler: async (input, context) => {
        const { path: filePath } = input;
        console.log(`[FileTools] Deleting spec: ${filePath}`);
        try {
            // Check ownership
            if (context.ownership) {
                const ownership = context.ownership.canWrite(context.sessionId, context.agentRole, filePath);
                if (!ownership.allowed) {
                    return { success: false, error: ownership.reason };
                }
            }
            // Check if file exists
            const exists = await fs.pathExists(filePath);
            if (!exists) {
                return { success: false, error: 'File does not exist' };
            }
            // Check for dependents using index
            const dependents = [];
            if (context.index?.graph?.dependents) {
                // Get spec ID from file path
                const specId = filePath.replace('specs/', '').replace('.spec', '');
                const foundDependents = context.index.graph.dependents[specId] || [];
                dependents.push(...foundDependents);
            }
            if (dependents.length > 0) {
                return {
                    success: false,
                    error: 'Cannot delete: has dependents',
                    data: { dependents },
                };
            }
            // Delete file
            await fs.unlink(filePath);
            console.log(`[FileTools] Deleted: ${filePath}`);
            return {
                success: true,
                data: { dependents: [] },
                sideEffects: ['file_deleted'],
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
/**
 * List files tool - lists files in a directory
 */
exports.listFilesTool = {
    name: 'speclang_list_files',
    description: 'List files in a directory',
    category: 'file',
    requiresOwnership: false,
    auditLog: false,
    inputSchema: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'Directory to list', default: 'specs' },
            pattern: { type: 'string', description: 'Filter pattern' },
        },
    },
    handler: async (input, context) => {
        const searchPath = input.path || 'specs';
        console.log(`[FileTools] Listing files: ${searchPath}`);
        try {
            const exists = await fs.pathExists(searchPath);
            if (!exists) {
                return { success: true, data: { files: [], count: 0 } };
            }
            const entries = await fs.readdir(searchPath, { withFileTypes: true });
            let files = entries
                .filter((f) => !f.isDirectory())
                .map((f) => path.join(searchPath, f.name));
            if (input.pattern) {
                const regex = new RegExp(input.pattern);
                files = files.filter((f) => regex.test(f));
            }
            return { success: true, data: { files, count: files.length } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
};
//# sourceMappingURL=file-tools.js.map