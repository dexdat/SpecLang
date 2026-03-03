"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockParser = void 0;
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/block-parser.spec.md
 * Generated: 2026-03-03T04:15:26.938565
 *
 * Edit the spec, not this file.
 */
const promises_1 = require("fs/promises");
const path_1 = require("path");
const poc_1 = require("../types/poc");
const header_parser_1 = require("./header-parser");
/**
 * Parser for spec markdown files
 * Extracts @block: definitions and spec headers
 */
class BlockParser {
    // Block ID allows: letters, numbers, underscores, hyphens
    blockPattern = /^###\s+@block:([a-zA-Z0-9_-]+)\s+@kind:(\w+)/gm;
    // Parameter: name (optional ?), type (complex types allowed), description
    // Supports: string, string[], Promise<string>, Array<T>, string | number, { a: string }
    // Pattern captures everything up to " - " as type, allowing complex TypeScript types
    paramPattern = /^-\s+(\w+\??):\s*(.+?)\s+-\s*(.+)$/gm;
    // Return type: captures complex types including generics, unions, intersections
    // Supports: string, Promise<string>, string | number, Array<T>, { [key: string]: any }
    returnPattern = /\*\*Returns:\*\*\s*([^\n]+?)(?:\s+-\s*(.+))?$/m;
    // Code examples
    examplePattern = /```(\w+)\n([\s\S]*?)```/g;
    headerParser;
    constructor() {
        this.headerParser = new header_parser_1.HeaderParser();
    }
    /**
     * Allowed spec root directory
     */
    specRoot = (0, path_1.resolve)(process.cwd(), 'specs');
    /**
     * Parse a spec file with path traversal protection
     * @param filePath - Path to the spec file (must be within specs/)
     * @returns Complete parsed spec with header and blocks
     * @throws {POCError} If file cannot be read, is outside specs/, or parsing fails
     */
    async parseFile(filePath) {
        // SECURITY: Validate file path before any operations
        const validatedPath = await this.validateFilePath(filePath);
        const content = await (0, promises_1.readFile)(validatedPath, 'utf-8');
        return this.parse(content, validatedPath);
    }
    /**
     * Validate file path for security
     * - Resolves symlinks with realpath
     * - Checks path is within specRoot
     * - Normalizes path separators
     * - Verifies file exists and is readable
     */
    async validateFilePath(filePath) {
        // Normalize path separators and resolve relative paths
        const normalized = (0, path_1.normalize)(filePath);
        // SECURITY: Reject paths with traversal sequences before resolution
        // Check for any attempt to escape directory (including encoded forms)
        if (normalized.includes('..') || normalized.includes('~')) {
            throw new poc_1.POCError('PARSE_ERROR', `Invalid path: "${filePath}" contains traversal sequences`, filePath);
        }
        // Resolve to absolute path
        const absolutePath = (0, path_1.resolve)(normalized);
        // SECURITY: Resolve symlinks to prevent symlink attacks
        const realPath = await (0, promises_1.realpath)(absolutePath).catch(() => absolutePath);
        // SECURITY: Verify path is within allowed spec directory
        // Use relative path to check containment (more robust than startsWith)
        const relativeToRoot = (0, path_1.relative)(this.specRoot, realPath);
        if (relativeToRoot.startsWith('..') || relativeToRoot.includes(':')) {
            // ':' catches Windows absolute paths with drive letter
            throw new poc_1.POCError('PARSE_ERROR', `Access denied: Path "${filePath}" resolves to "${realPath}" which is outside allowed spec directory`, filePath);
        }
        // Verify file exists and is readable
        try {
            await (0, promises_1.access)(realPath, promises_1.constants.R_OK);
        }
        catch {
            throw new poc_1.POCError('PARSE_ERROR', `Cannot read file: "${filePath}" does not exist or is not readable`, filePath);
        }
        return realPath;
    }
    /**
     * Parse spec content
     * @param content - Raw markdown content
     * @param filePath - Source file path (for metadata)
     * @returns Complete parsed spec
     */
    parse(content, filePath) {
        // Parse header
        const header = this.headerParser.parse(content);
        // Parse blocks with filePath for error reporting
        const blocks = this.parseBlocks(content, filePath);
        return {
            id: header.id,
            version: header.version,
            short: header.short,
            filePath,
            blocks,
            headerLines: header.rawHeader.split('\n'),
            parsedAt: Date.now()
        };
    }
    /**
     * Parse all blocks from content
     * @param content - Markdown content
     * @param filePath - Source file path (for error reporting)
     * @returns Array of parsed blocks
     */
    parseBlocks(content, filePath) {
        const blocks = [];
        const matches = content.matchAll(this.blockPattern);
        for (const match of matches) {
            const block = this.parseBlock(match, content, filePath);
            blocks.push(block);
        }
        return blocks;
    }
    /**
     * Parse a single block
     * @param match - RegExp match array from block pattern
     * @param fullContent - Full file content
     * @returns Parsed block
     */
    parseBlock(match, fullContent, filePath) {
        const id = match[1];
        const rawKind = match[2];
        const section = this.extractSection(match.index, fullContent);
        // SECURITY: Validate block kind
        if (!(0, poc_1.isValidBlockKind)(rawKind)) {
            throw new poc_1.POCError('PARSE_ERROR', `Invalid block kind "${rawKind}" for block "${id}". Valid kinds: ${poc_1.VALID_BLOCK_KINDS.join(', ')}`, filePath);
        }
        const kind = rawKind;
        return {
            id,
            kind,
            description: this.parseDescription(section),
            parameters: this.parseParameters(section),
            properties: this.parseProperties(section),
            returns: this.parseReturns(section),
            examples: this.parseExamples(section),
            rawContent: section
        };
    }
    /**
     * Extract section content until next block or EOF
     */
    extractSection(startIndex, content) {
        const endPattern = /^###\s+@block:/m;
        const remaining = content.slice(startIndex);
        const match = remaining.match(endPattern);
        if (match && match.index !== undefined) {
            return remaining.slice(0, match.index).trim();
        }
        return remaining.trim();
    }
    /**
     * Parse block description (text after header, before params)
     */
    parseDescription(section) {
        const lines = section.split('\n');
        const descriptionLines = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('**') && !trimmed.startsWith('-')) {
                descriptionLines.push(trimmed);
            }
            else if (trimmed.startsWith('**')) {
                break;
            }
        }
        return descriptionLines.join(' ').trim();
    }
    /**
     * Parse parameters section
     * Handles: "name: string - description", "name?: string - optional param"
     */
    parseParameters(section) {
        const params = [];
        const paramSection = section.match(/\*\*Parameters:\*\*([\s\S]*?)(?=\*\*|$)/);
        if (!paramSection)
            return params;
        // Reset regex lastIndex
        this.paramPattern.lastIndex = 0;
        let match;
        while ((match = this.paramPattern.exec(paramSection[1])) !== null) {
            const rawName = match[1];
            const isOptional = rawName.endsWith('?');
            const name = isOptional ? rawName.slice(0, -1) : rawName;
            params.push({
                name,
                type: match[2].trim(),
                description: match[3].trim(),
                optional: isOptional
            });
        }
        return params;
    }
    /**
     * Parse properties section (for classes/interfaces)
     * Handles: "name: type - description"
     */
    parseProperties(section) {
        const properties = [];
        const propSection = section.match(/\*\*Properties:\*\*([\s\S]*?)(?=\*\*|$)/);
        if (!propSection)
            return properties;
        const lines = propSection[1].split('\n');
        for (const line of lines) {
            const match = line.match(/^-\s+(\w+\??):\s*(.+?)\s+-\s*(.+)$/);
            if (match) {
                const rawName = match[1];
                const isOptional = rawName.endsWith('?');
                const name = isOptional ? rawName.slice(0, -1) : rawName;
                properties.push({
                    name,
                    type: match[2].trim(),
                    description: match[3].trim(),
                    optional: isOptional
                });
            }
        }
        return properties;
    }
    /**
     * Parse return type
     */
    parseReturns(section) {
        // Reset regex lastIndex to prevent state pollution
        this.returnPattern.lastIndex = 0;
        const match = this.returnPattern.exec(section);
        if (match) {
            return {
                type: match[1],
                description: match[2]?.trim() || ''
            };
        }
        return undefined;
    }
    /**
     * Parse code examples
     */
    parseExamples(section) {
        const examples = [];
        const matches = section.matchAll(this.examplePattern);
        for (const match of matches) {
            examples.push({
                language: match[1] || 'typescript',
                code: match[2].trim(),
                description: '' // Could parse from preceding text
            });
        }
        return examples;
    }
}
exports.BlockParser = BlockParser;
//# sourceMappingURL=block-parser.js.map