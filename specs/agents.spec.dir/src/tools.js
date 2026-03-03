"use strict";
/**
 * Agent tools implementation
 *
 * Generated from: @speclang/agent-protocol
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
exports.commitHandler = exports.createSpecFileHandler = exports.cascadeStatusHandler = exports.triggerCascadeHandler = exports.impactAnalysisHandler = exports.getDependentsHandler = exports.getDependenciesHandler = exports.listFilesHandler = exports.writeFileHandler = exports.readFileHandler = exports.searchSpecsHandler = exports.writeSpecHandler = exports.readSpecHandler = exports.SimpleToolRegistry = void 0;
exports.getStandardTools = getStandardTools;
exports.createToolRegistry = createToolRegistry;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const crypto = __importStar(require("crypto"));
/**
 * Simple tool registry implementation
 */
class SimpleToolRegistry {
    tools;
    constructor() {
        this.tools = new Map();
    }
    get(name) {
        return this.tools.get(name);
    }
    list() {
        return Array.from(this.tools.values());
    }
    register(tool) {
        this.tools.set(tool.name, tool);
        console.log(`[Tools] Registered: ${tool.name}`);
    }
}
exports.SimpleToolRegistry = SimpleToolRegistry;
// ============================================================================
// TOOL HANDLERS
// ============================================================================
/**
 * Read a spec file by ID
 */
const readSpecHandler = async (input, context) => {
    const { session, index } = context;
    console.log(`[Tools] read_spec: ${input.id}`);
    // Look up spec in index
    let filepath = input.id;
    if (index?.specs?.[input.id]) {
        filepath = index.specs[input.id].path;
    }
    else if (!input.id.startsWith('specs/')) {
        filepath = `specs/${input.id}`;
    }
    // Check read permission (anyone can read)
    const canRead = context.ownership.canRead(session.agent.id, filepath);
    if (!canRead.allowed) {
        throw new Error(`Cannot read: ${canRead.reason}`);
    }
    // Read file
    try {
        const content = await fs.readFile(filepath, 'utf-8');
        return { success: true, content, path: filepath };
    }
    catch (error) {
        throw new Error(`Failed to read spec: ${error.message}`);
    }
};
exports.readSpecHandler = readSpecHandler;
/**
 * Write a spec file
 */
const writeSpecHandler = async (input, context) => {
    const { session, ownership } = context;
    console.log(`[Tools] write_spec: ${input.id}`);
    // Determine filepath
    let filepath = input.id;
    if (!input.id.startsWith('specs/') && !input.id.startsWith('src/')) {
        filepath = `specs/${input.id}`;
    }
    // Check write permission
    const canWrite = ownership.canWrite(session.agent.id, session.agent.role, filepath);
    if (!canWrite.allowed) {
        throw new Error(`Cannot write: ${canWrite.reason}`);
    }
    // Ensure directory exists
    await fs.ensureDir(path.dirname(filepath));
    // Write file
    try {
        await fs.writeFile(filepath, input.content, 'utf-8');
        console.log(`[Tools] Wrote: ${filepath}`);
        return { success: true, path: filepath, message: input.message || 'Written successfully' };
    }
    catch (error) {
        throw new Error(`Failed to write spec: ${error.message}`);
    }
};
exports.writeSpecHandler = writeSpecHandler;
/**
 * Search specs using FTS
 */
const searchSpecsHandler = async (input, context) => {
    const { index } = context;
    console.log(`[Tools] search_specs: ${input.query}`);
    if (!index?.specs) {
        throw new Error('Index not available');
    }
    const results = Object.values(index.specs)
        .filter((spec) => {
        // Filter by query in short description or tags
        if (input.query) {
            const queryLower = input.query.toLowerCase();
            const matchShort = spec.short?.toLowerCase().includes(queryLower);
            const matchTags = spec.tags?.some((t) => t.toLowerCase().includes(queryLower));
            if (!matchShort && !matchTags)
                return false;
        }
        // Filter by tags
        if (input.tags?.length) {
            const hasTags = input.tags.some((t) => spec.tags?.includes(t));
            if (!hasTags)
                return false;
        }
        // Filter by layer
        if (input.layer !== undefined && spec.layer !== input.layer) {
            return false;
        }
        return true;
    })
        .map((spec) => ({
        id: spec.id,
        path: spec.path,
        short: spec.short,
        layer: spec.layer,
        tags: spec.tags,
    }));
    return { success: true, count: results.length, results };
};
exports.searchSpecsHandler = searchSpecsHandler;
/**
 * Read a file
 */
const readFileHandler = async (input, context) => {
    const { ownership } = context;
    console.log(`[Tools] read_file: ${input.path}`);
    // Check read permission
    const canRead = ownership.canRead('', input.path);
    if (!canRead.allowed) {
        throw new Error(`Cannot read: ${canRead.reason}`);
    }
    try {
        const content = await fs.readFile(input.path, 'utf-8');
        return { success: true, content, path: input.path };
    }
    catch (error) {
        throw new Error(`Failed to read file: ${error.message}`);
    }
};
exports.readFileHandler = readFileHandler;
/**
 * Write a file
 */
const writeFileHandler = async (input, context) => {
    const { session, ownership } = context;
    console.log(`[Tools] write_file: ${input.path}`);
    // Check write permission
    const canWrite = ownership.canWrite(session.agent.id, session.agent.role, input.path);
    if (!canWrite.allowed) {
        throw new Error(`Cannot write: ${canWrite.reason}`);
    }
    // Ensure directory exists
    await fs.ensureDir(path.dirname(input.path));
    try {
        await fs.writeFile(input.path, input.content, 'utf-8');
        return { success: true, path: input.path };
    }
    catch (error) {
        throw new Error(`Failed to write file: ${error.message}`);
    }
};
exports.writeFileHandler = writeFileHandler;
/**
 * List files in a directory
 */
const listFilesHandler = async (input, context) => {
    const searchPath = input.path || 'specs';
    console.log(`[Tools] list_files: ${searchPath}`);
    try {
        const files = await fs.readdir(searchPath, { withFileTypes: true });
        const results = files
            .filter(f => {
            if (input.pattern) {
                return f.name.match(new RegExp(input.pattern));
            }
            return true;
        })
            .map(f => ({
            name: f.name,
            isDirectory: f.isDirectory(),
            path: path.join(searchPath, f.name),
        }));
        return { success: true, count: results.length, files: results };
    }
    catch (error) {
        throw new Error(`Failed to list files: ${error.message}`);
    }
};
exports.listFilesHandler = listFilesHandler;
/**
 * Get dependencies for a spec
 */
const getDependenciesHandler = async (input, context) => {
    const { index } = context;
    console.log(`[Tools] get_dependencies: ${input.id}`);
    if (!index?.graph?.dependencies) {
        throw new Error('Index not available');
    }
    const deps = index.graph.dependencies[input.id] || [];
    return { success: true, id: input.id, dependencies: deps };
};
exports.getDependenciesHandler = getDependenciesHandler;
/**
 * Get dependents for a spec
 */
const getDependentsHandler = async (input, context) => {
    const { index } = context;
    console.log(`[Tools] get_dependents: ${input.id}`);
    if (!index?.graph?.dependents) {
        throw new Error('Index not available');
    }
    const dependents = index.graph.dependents[input.id] || [];
    return { success: true, id: input.id, dependents };
};
exports.getDependentsHandler = getDependentsHandler;
/**
 * Get impact analysis for a spec
 */
const impactAnalysisHandler = async (input, context) => {
    const { index } = context;
    console.log(`[Tools] impact_analysis: ${input.id}`);
    if (!index) {
        throw new Error('Index not available');
    }
    const dependents = index.graph?.dependents?.[input.id] || [];
    const transitive = [];
    // Simple transitive lookup (depth 2)
    for (const dep of dependents) {
        transitive.push(dep);
        const subDeps = index.graph?.dependents?.[dep] || [];
        transitive.push(...subDeps);
    }
    return {
        success: true,
        id: input.id,
        direct: dependents,
        transitive: Array.from(new Set(transitive)),
    };
};
exports.impactAnalysisHandler = impactAnalysisHandler;
/**
 * Trigger cascade (placeholder - would integrate with daemon)
 */
const triggerCascadeHandler = async (input, context) => {
    console.log(`[Tools] trigger_cascade: ${input.path || 'all'}`);
    // This would integrate with the daemon in production
    return {
        success: true,
        message: 'Cascade triggered (simulated)',
        path: input.path,
    };
};
exports.triggerCascadeHandler = triggerCascadeHandler;
/**
 * Get cascade status
 */
const cascadeStatusHandler = async (_input, _context) => {
    console.log(`[Tools] cascade_status`);
    // This would integrate with the daemon in production
    return {
        success: true,
        status: 'idle',
        lastCascade: null,
    };
};
exports.cascadeStatusHandler = cascadeStatusHandler;
const createSpecFileHandler = async (input, context) => {
    const { session, ownership } = context;
    const { file_path, headers, content = '' } = input;
    console.log(`[Tools] create_spec_file: ${file_path}`);
    // Check if file already exists
    if (await fs.pathExists(file_path)) {
        throw new Error(`File already exists: ${file_path}`);
    }
    // Check write permission
    const canWrite = ownership.canWrite(session.agent.id, session.agent.role, file_path);
    if (!canWrite.allowed) {
        throw new Error(`Cannot create file: ${canWrite.reason}`);
    }
    // Build header YAML
    const headerLines = [
        '# speclang-header lines:10',
        `id: "${headers.id || '@specs/placeholder'}"`,
        `version: "${headers.version || '0.1.0'}"`,
        `layer: ${headers.layer || 5}`,
        `agent_support: "${headers.agent_support || 'agent_autonomous'}"`,
        `short: "${headers.short || 'Auto-generated spec'}"`,
        '---',
        '',
    ];
    const fullContent = headerLines.join('\n') + (content || '');
    // Ensure directory exists
    await fs.ensureDir(path.dirname(file_path));
    // Write file
    try {
        await fs.writeFile(file_path, fullContent, 'utf-8');
        console.log(`[Tools] Created: ${file_path}`);
        return { success: true, path: file_path };
    }
    catch (error) {
        throw new Error(`Failed to create file: ${error.message}`);
    }
};
exports.createSpecFileHandler = createSpecFileHandler;
function generateUUID() {
    return crypto.randomUUID();
}
const commitHandler = async (input, context) => {
    const { file_path, summary, change_id, parent_id } = input;
    console.log(`[Tools] commit: ${file_path}`);
    const uuid = change_id || generateUUID();
    const parentPart = parent_id ? ` parent:${parent_id}` : '';
    const commitMsg = `speclang: ${summary} [change_id:${uuid}${parentPart}]`;
    try {
        // Stage the file
        (0, child_process_1.execSync)(`git add "${file_path}"`, { encoding: 'utf-8' });
        // Commit with message
        (0, child_process_1.execSync)(`git commit --only "${file_path}" -m "${commitMsg}"`, { encoding: 'utf-8' });
        console.log(`[Tools] Committed: ${file_path}`);
        return {
            success: true,
            path: file_path,
            change_id: uuid,
            commit_message: commitMsg,
        };
    }
    catch (error) {
        throw new Error(`Failed to commit: ${error.message}`);
    }
};
exports.commitHandler = commitHandler;
// ============================================================================
// TOOL DEFINITIONS
// ============================================================================
/**
 * Get all standard agent tools
 */
function getStandardTools() {
    return [
        {
            name: 'read_spec',
            description: 'Read a spec file by ID or path',
            input_schema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Spec ID or path' },
                },
                required: ['id'],
            },
            handler: exports.readSpecHandler,
        },
        {
            name: 'write_spec',
            description: 'Write a spec file (requires ownership)',
            input_schema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Spec ID or path' },
                    content: { type: 'string', description: 'Spec content' },
                    message: { type: 'string', description: 'Commit message' },
                },
                required: ['id', 'content'],
            },
            handler: exports.writeSpecHandler,
        },
        {
            name: 'search_specs',
            description: 'Search specs using full-text search',
            input_schema: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search query' },
                    tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
                    layer: { type: 'number', description: 'Filter by layer' },
                },
                required: ['query'],
            },
            handler: exports.searchSpecsHandler,
        },
        {
            name: 'read_file',
            description: 'Read any file',
            input_schema: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'File path' },
                },
                required: ['path'],
            },
            handler: exports.readFileHandler,
        },
        {
            name: 'write_file',
            description: 'Write a file (requires ownership)',
            input_schema: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'File path' },
                    content: { type: 'string', description: 'File content' },
                },
                required: ['path', 'content'],
            },
            handler: exports.writeFileHandler,
        },
        {
            name: 'list_files',
            description: 'List files in a directory',
            input_schema: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Directory path' },
                    pattern: { type: 'string', description: 'Filter pattern' },
                },
            },
            handler: exports.listFilesHandler,
        },
        {
            name: 'get_dependencies',
            description: 'Get dependencies of a spec',
            input_schema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Spec ID' },
                },
                required: ['id'],
            },
            handler: exports.getDependenciesHandler,
        },
        {
            name: 'get_dependents',
            description: 'Get specs that depend on this spec',
            input_schema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Spec ID' },
                },
                required: ['id'],
            },
            handler: exports.getDependentsHandler,
        },
        {
            name: 'impact_analysis',
            description: 'Analyze impact of changing a spec',
            input_schema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Spec ID' },
                },
                required: ['id'],
            },
            handler: exports.impactAnalysisHandler,
        },
        {
            name: 'trigger_cascade',
            description: 'Trigger a cascade manually',
            input_schema: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'File path to trigger' },
                },
            },
            handler: exports.triggerCascadeHandler,
        },
        {
            name: 'cascade_status',
            description: 'Get current cascade status',
            input_schema: {
                type: 'object',
                properties: {},
            },
            handler: exports.cascadeStatusHandler,
        },
        {
            name: 'create_spec_file',
            description: 'Create new spec file with proper headers',
            input_schema: {
                type: 'object',
                properties: {
                    file_path: { type: 'string', description: 'Full path to new file' },
                    headers: {
                        type: 'object',
                        description: 'YAML header content',
                        properties: {
                            id: { type: 'string', pattern: '^@[a-zA-Z0-9/-]+$' },
                            version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
                            layer: { type: 'number', minimum: 0, maximum: 100 },
                            agent_support: { type: 'string', enum: ['human_only', 'agent_assisted', 'agent_autonomous'] },
                            short: { type: 'string', maxLength: 100 },
                        },
                    },
                    content: { type: 'string', description: 'Initial file content' },
                },
                required: ['file_path', 'headers'],
            },
            handler: exports.createSpecFileHandler,
        },
        {
            name: 'commit',
            description: 'Commit a file with change tracking (per CommitProtocol)',
            input_schema: {
                type: 'object',
                properties: {
                    file_path: { type: 'string', description: 'File to commit' },
                    summary: { type: 'string', description: 'Brief summary of changes' },
                    change_id: { type: 'string', description: 'UUID for this change (auto-generated if not provided)' },
                    parent_id: { type: 'string', description: 'Parent UUID from trigger context' },
                },
                required: ['file_path', 'summary'],
            },
            handler: exports.commitHandler,
        },
    ];
}
/**
 * Create a tool registry with all standard tools
 */
function createToolRegistry() {
    const registry = new SimpleToolRegistry();
    for (const tool of getStandardTools()) {
        registry.register(tool);
    }
    return registry;
}
//# sourceMappingURL=tools.js.map