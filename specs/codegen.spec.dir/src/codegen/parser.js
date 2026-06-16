"use strict";
/**
 * SPECLANG-GENERATED: Spec parser for codegen
 * Source: @speclang/codegen @block:parser
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
exports.parseCodeSpec = parseCodeSpec;
exports.parseCodeSpecContent = parseCodeSpecContent;
exports.findCodeSpecFiles = findCodeSpecFiles;
exports.specHasCodeBlocks = specHasCodeBlocks;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const header_js_1 = require("../../../parser.spec.dir/src/header.js");
const types_1 = require("./types");
// ============================================================================
// PARSING
// ============================================================================
/** Parse a spec file for code generation */
function parseCodeSpec(filepath, options) {
    const opts = { ...types_1.DEFAULT_CODE_PARSER_OPTIONS, ...options };
    // Parse using existing parser
    const parsed = (0, header_js_1.parseSpec)(filepath);
    // Extract target config
    const target = parseTargetConfig(parsed.metadata, filepath);
    // Extract code blocks
    const blocks = extractCodeBlocks(parsed.blocks, parsed.content);
    // Extract imports
    const imports = extractImports(parsed.content);
    return {
        header: parsed.metadata,
        target,
        blocks,
        imports,
        sourceFile: filepath,
    };
}
/** Parse spec content string for code generation */
function parseCodeSpecContent(content, filepath = 'unknown') {
    const parsed = (0, header_js_1.parseSpecContent)(content, filepath);
    const target = parseTargetConfig(parsed.metadata, filepath);
    const blocks = extractCodeBlocks(parsed.blocks, parsed.content);
    const imports = extractImports(parsed.content);
    return {
        header: parsed.metadata,
        target,
        blocks,
        imports,
        sourceFile: filepath,
    };
}
/** Parse target configuration from metadata */
function parseTargetConfig(metadata, sourceFile) {
    const targetLang = metadata.target || 'typescript';
    // Default output path based on spec ID
    let outputPath = 'src/generated';
    // Try to determine from depends_on or default
    if (metadata.depends_on && metadata.depends_on.length > 0) {
        const firstDep = metadata.depends_on[0];
        if (typeof firstDep === 'string') {
            outputPath = `src/${firstDep.replace(/[@/]/g, '-')}`;
        }
    }
    return {
        language: targetLang,
        outputPath,
    };
}
// ============================================================================
// BLOCK EXTRACTION
// ============================================================================
/** Extract code blocks from parsed blocks */
function extractCodeBlocks(blocks, content) {
    return blocks
        .filter(block => isCodeBlockKind(block.kind))
        .map(block => ({
        id: block.id,
        kind: mapKind(block.kind),
        language: detectLanguage(block.content, block.kind),
        content: extractCodeContent(block.content),
        refs: extractRefsFromBlock(content, block.id),
        line: block.line,
    }));
}
/** Check if block kind is a code type */
function isCodeBlockKind(kind) {
    const codeKinds = ['code', 'interface', 'function', 'class', 'type', 'struct', 'entity', 'operation', 'implementation'];
    return codeKinds.includes(kind.toLowerCase());
}
/** Map block kind to codegen kind */
function mapKind(kind) {
    const kindMap = {
        code: 'code',
        interface: 'interface',
        function: 'function',
        class: 'class',
        type: 'type',
        struct: 'struct',
        entity: 'entity',
        operation: 'operation',
        impl: 'impl',
        enum: 'enum',
        implementation: 'code',
    };
    return kindMap[kind.toLowerCase()] || 'code';
}
/** Detect language from code content */
function detectLanguage(content, kind) {
    // Check for language hints in content
    if (content.includes('function ') || content.includes('export ') || content.includes('interface ')) {
        return 'typescript';
    }
    if (content.includes('func ') && content.includes('package ')) {
        return 'go';
    }
    if (content.includes('def ') && content.includes(':')) {
        return 'python';
    }
    if (content.includes('fn ') && content.includes('->')) {
        return 'rust';
    }
    // Default based on kind
    if (kind === 'struct')
        return 'go';
    return 'typescript';
}
/** Extract code content from block (remove code fence markers) */
function extractCodeContent(content) {
    // Remove markdown code fence markers
    const lines = content.split('\n');
    const codeLines = [];
    let inCodeFence = false;
    for (const line of lines) {
        if (line.trim().startsWith('```')) {
            inCodeFence = !inCodeFence;
            continue;
        }
        if (inCodeFence || line.trim()) {
            codeLines.push(line);
        }
    }
    return codeLines.join('\n').trim();
}
/** Extract @ref: references from block content */
function extractRefsFromBlock(content, blockId) {
    const refs = [];
    const refPattern = /@ref:([^\s\]]+)/g;
    let match;
    while ((match = refPattern.exec(content)) !== null) {
        refs.push(match[1]);
    }
    return refs;
}
// ============================================================================
// IMPORT EXTRACTION
// ============================================================================
/** Extract import statements from content */
function extractImports(content) {
    const imports = [];
    const importPatterns = [
        /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g,
        /import\s+['"]([^'"]+)['"]/g,
    ];
    for (const pattern of importPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            imports.push(match[1]);
        }
    }
    return [...new Set(imports)];
}
// ============================================================================
// SPEC FILE FINDING
// ============================================================================
/** Find all spec files with code blocks in a directory */
function findCodeSpecFiles(dir, recursive = true) {
    const files = [];
    if (!fs.existsSync(dir)) {
        return files;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && recursive) {
            files.push(...findCodeSpecFiles(fullPath, recursive));
        }
        else if (entry.isFile() && (entry.name.endsWith('.spec') || entry.name.endsWith('.md'))) {
            files.push(fullPath);
        }
    }
    return files;
}
/** Check if a spec file has code blocks */
function specHasCodeBlocks(filepath) {
    try {
        const content = fs.readFileSync(filepath, 'utf-8');
        return content.includes('@block:') && content.includes('```');
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=parser.js.map