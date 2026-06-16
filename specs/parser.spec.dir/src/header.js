"use strict";
/**
 * SPECLANG-GENERATED: Header parsing implementation
 * Source: @speclang/headers @block:headers/parsing
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
exports.parseHeader = parseHeader;
exports.extractBlocks = extractBlocks;
exports.extractReferences = extractReferences;
exports.extractMetadataReferences = extractMetadataReferences;
exports.parseSpec = parseSpec;
exports.parseSpecContent = parseSpecContent;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml_1 = require("yaml");
// ============================================================================
// HEADER PARSING
// ============================================================================
/** Header line regex patterns */
const HEADER_LINE_PATTERN = /^# speclang-header(?:\s+lines:(\d+))?/i;
const FRONTMATTER_START = /^---$/;
const FRONTMATTER_END = /^---$/;
const BLOCK_PATTERN = /^#+\s+@block:(\S+)\s+@kind:(\S+)(.*)$/;
const REF_PATTERN = /@ref:([^\s\]]+)/g;
/**
 * Parse the header of a spec file
 * Supports both formats:
 * - Efficient: "# speclang-header lines:N" + N lines of YAML
 * - Flexible: "# speclang-header" + scan for "---" terminator
 */
function parseHeader(content) {
    const lines = content.split('\n');
    // Skip frontmatter start if present
    let startIndex = 0;
    if (FRONTMATTER_START.test(lines[0]?.trim())) {
        startIndex = 1;
    }
    // Check for speclang-header declaration
    const headerLineMatch = lines[startIndex]?.match(HEADER_LINE_PATTERN);
    if (!headerLineMatch) {
        throw new Error('No speclang-header declaration found');
    }
    let headerLineCount;
    let yamlLines;
    if (headerLineMatch[1]) {
        // Efficient format: lines:N specified
        headerLineCount = parseInt(headerLineMatch[1], 10);
        // Start from line after header declaration (startIndex + 1)
        // Read exactly headerLineCount - 1 more lines (we're already on line 1)
        // And exclude the trailing "---" from YAML by taking headerLineCount - 2
        yamlLines = lines.slice(startIndex + 1, startIndex + headerLineCount - 1);
        // But remove the trailing "---" if present
        const lastYamlLine = yamlLines[yamlLines.length - 1];
        if (lastYamlLine && FRONTMATTER_END.test(lastYamlLine.trim())) {
            yamlLines = yamlLines.slice(0, -1);
        }
    }
    else {
        // Flexible format: scan for terminator
        yamlLines = [];
        for (let i = startIndex + 1; i < lines.length; i++) {
            if (FRONTMATTER_END.test(lines[i].trim())) {
                headerLineCount = i + 1; // Include the terminator line
                break;
            }
            yamlLines.push(lines[i]);
        }
        if (!headerLineCount) {
            throw new Error('No header terminator "---" found');
        }
    }
    // Parse YAML from header lines
    // Remove trailing empty lines and the terminator "---" before parsing
    const yamlText = yamlLines.join('\n').trim();
    let metadata;
    try {
        const parsed = (0, yaml_1.parse)(yamlText);
        metadata = (parsed || {});
    }
    catch (e) {
        throw new Error(`Failed to parse header YAML: ${e instanceof Error ? e.message : String(e)}`);
    }
    // Validate required fields
    if (!metadata.id) {
        throw new Error('Missing required field: id');
    }
    if (!metadata.version) {
        throw new Error('Missing required field: version');
    }
    // Get content after header
    const contentStartLine = startIndex + headerLineCount;
    const fileContent = lines.slice(contentStartLine).join('\n');
    return {
        metadata,
        headerLines: startIndex + headerLineCount,
        headerRaw: lines.slice(0, startIndex + headerLineCount).join('\n'),
        content: fileContent,
    };
}
// ============================================================================
// BLOCK EXTRACTION
// ============================================================================
/**
 * Extract blocks from spec content
 * Syntax: "# @block:{id} @kind:{kind} @{attr}:{value}*"
 */
function extractBlocks(content, sourceFile) {
    const lines = content.split('\n');
    const blocks = [];
    let currentBlock = null;
    let currentContent = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;
        // Check for block start
        const blockMatch = line.match(BLOCK_PATTERN);
        if (blockMatch) {
            // Save previous block
            if (currentBlock) {
                currentBlock.content = currentContent.join('\n').trim();
                blocks.push(currentBlock);
            }
            // Parse block attributes
            const attrs = {};
            const attrMatchArray = line.matchAll(/@(\w+):(\S+)/g);
            const attrMatches = Array.from(attrMatchArray);
            for (const match of attrMatches) {
                const [, key, value] = match;
                if (key !== 'block' && key !== 'kind') {
                    attrs[key] = value;
                }
            }
            // Create new block
            currentBlock = {
                id: blockMatch[1],
                kind: blockMatch[2],
                content: '',
                line: lineNumber,
                attrs: Object.keys(attrs).length > 0 ? attrs : undefined,
            };
            currentContent = [];
        }
        else if (currentBlock) {
            // Add to current block content
            currentContent.push(line);
        }
    }
    // Save last block
    if (currentBlock) {
        currentBlock.content = currentContent.join('\n').trim();
        blocks.push(currentBlock);
    }
    return blocks;
}
// ============================================================================
// REFERENCE EXTRACTION
// ============================================================================
/**
 * Extract all @ref: references from content
 */
function extractReferences(content, sourceFile) {
    const lines = content.split('\n');
    const references = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;
        // Find all @ref: patterns in the line
        let match;
        const refPattern = new RegExp(REF_PATTERN);
        while ((match = refPattern.exec(line)) !== null) {
            const ref = match[1];
            // Parse reference
            const [specRef, blockRef] = ref.split('#');
            references.push({
                ref: `@ref:${ref}`,
                sourceFile,
                targetFile: specRef,
                targetBlock: blockRef,
                line: lineNumber,
            });
        }
    }
    return references;
}
/**
 * Extract references from metadata (depends_on, refs, children, parent)
 */
function extractMetadataReferences(metadata, sourceFile, baseLine = 1) {
    const references = [];
    // Process depends_on
    if (metadata.depends_on) {
        for (const dep of metadata.depends_on) {
            if (typeof dep === 'string') {
                const cleanRef = dep.replace('@ref:', '');
                const [specRef = cleanRef, blockRef] = cleanRef.split('#');
                references.push({
                    ref: dep.startsWith('@ref:') ? dep : `@ref:${cleanRef}`,
                    sourceFile,
                    targetFile: specRef,
                    targetBlock: blockRef,
                    line: baseLine,
                });
            }
            else if (dep && typeof dep === 'object' && 'ref' in dep) {
                const ref = dep;
                const cleanRef = ref.ref.replace('@ref:', '');
                const [specRef = cleanRef, blockRef] = cleanRef.split('#');
                references.push({
                    ref: ref.ref.startsWith('@ref:') ? ref.ref : `@ref:${cleanRef}`,
                    sourceFile,
                    targetFile: specRef,
                    targetBlock: blockRef,
                    line: baseLine,
                });
            }
        }
    }
    // Process refs
    if (metadata.refs) {
        for (const ref of metadata.refs) {
            if (typeof ref === 'string') {
                const cleanRef = ref.replace('@ref:', '');
                const [specRef = cleanRef, blockRef] = cleanRef.split('#');
                references.push({
                    ref: ref.startsWith('@ref:') ? ref : `@ref:${cleanRef}`,
                    sourceFile,
                    targetFile: specRef,
                    targetBlock: blockRef,
                    line: baseLine,
                });
            }
        }
    }
    // Process children
    if (metadata.children) {
        for (const child of metadata.children) {
            if (typeof child === 'string') {
                const cleanRef = child.replace('@ref:', '');
                const [specRef = cleanRef, blockRef] = cleanRef.split('#');
                references.push({
                    ref: child.startsWith('@ref:') ? child : `@ref:${cleanRef}`,
                    sourceFile,
                    targetFile: specRef,
                    targetBlock: blockRef,
                    line: baseLine,
                });
            }
        }
    }
    // Process parent
    if (metadata.parent) {
        if (typeof metadata.parent === 'string') {
            const cleanRef = metadata.parent.replace('@ref:', '');
            const [specRef = cleanRef, blockRef] = cleanRef.split('#');
            references.push({
                ref: metadata.parent.startsWith('@ref:') ? metadata.parent : `@ref:${cleanRef}`,
                sourceFile,
                targetFile: specRef,
                targetBlock: blockRef,
                line: baseLine,
            });
        }
        else if (typeof metadata.parent === 'object' && 'ref' in metadata.parent) {
            const parent = metadata.parent;
            const cleanRef = parent.ref.replace('@ref:', '');
            const [specRef = cleanRef, blockRef] = cleanRef.split('#');
            references.push({
                ref: parent.ref.startsWith('@ref:') ? parent.ref : `@ref:${cleanRef}`,
                sourceFile,
                targetFile: specRef,
                targetBlock: blockRef,
                line: baseLine,
            });
        }
    }
    return references;
}
// ============================================================================
// MAIN PARSE FUNCTION
// ============================================================================
/**
 * Parse a spec file
 */
function parseSpec(filepath) {
    // Read file
    const fullPath = path.resolve(filepath);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${fullPath}`);
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    // Parse header
    const { metadata, headerLines, headerRaw, content: specContent } = parseHeader(content);
    // Extract blocks
    const blocks = extractBlocks(specContent, filepath);
    // Extract references from content
    const contentReferences = extractReferences(specContent, filepath);
    // Extract references from metadata
    const metadataReferences = extractMetadataReferences(metadata, filepath, 1);
    // Combine references
    const references = [...metadataReferences, ...contentReferences];
    return {
        filepath,
        metadata,
        headerLines,
        content: specContent,
        blocks,
        references,
        headerRaw,
    };
}
/**
 * Parse spec from string content
 */
function parseSpecContent(content, filepath = 'unknown') {
    // Parse header
    const { metadata, headerLines, headerRaw, content: specContent } = parseHeader(content);
    // Extract blocks
    const blocks = extractBlocks(specContent, filepath);
    // Extract references from content
    const contentReferences = extractReferences(specContent, filepath);
    // Extract references from metadata
    const metadataReferences = extractMetadataReferences(metadata, filepath, 1);
    // Combine references
    const references = [...metadataReferences, ...contentReferences];
    return {
        filepath,
        metadata,
        headerLines,
        content: specContent,
        blocks,
        references,
        headerRaw,
    };
}
//# sourceMappingURL=header.js.map