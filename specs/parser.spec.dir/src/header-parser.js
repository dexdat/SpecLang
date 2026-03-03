"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderParser = void 0;
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/header-parser.spec.md
 * Generated: 2026-03-03T04:16:52.903044
 *
 * Edit the spec, not this file.
 */
const types_1 = require("./types");
const js_yaml_1 = __importDefault(require("js-yaml"));
class HeaderParser {
    /**
     * Parse header from content
     * @param content - Full file content
     * @returns Parsed header
     * @throws {POCError} If header is invalid
     */
    parse(content) {
        const lines = content.split('\n');
        // Validate header marker
        if (!lines[0]?.startsWith('# speclang-header')) {
            throw new types_1.POCError('HEADER_ERROR', 'Missing # speclang-header marker');
        }
        // Extract line count
        const lineCountMatch = lines[0].match(/lines:(\d+)/);
        if (!lineCountMatch) {
            throw new types_1.POCError('HEADER_ERROR', 'Missing lines:N in header marker');
        }
        const lineCount = parseInt(lineCountMatch[1], 10);
        // SECURITY: Validate line count is within bounds
        if (lineCount <= 0 || lineCount > lines.length) {
            throw new types_1.POCError('HEADER_ERROR', `Invalid header line count: ${lineCount} (must be 1-${lines.length})`, undefined);
        }
        const headerLines = lines.slice(1, lineCount);
        // SECURITY: Validate header ends with '---' separator
        if (!headerLines[headerLines.length - 1]?.trim().startsWith('---')) {
            throw new types_1.POCError('HEADER_ERROR', 'Header must end with --- separator', undefined);
        }
        // Parse YAML content
        const header = this.parseYaml(headerLines.join('\n'));
        // Validate required fields
        this.validateHeader(header);
        return {
            id: header.id,
            version: header.version,
            layer: header.layer,
            short: header.short || '',
            tags: header.tags || [],
            lineCount,
            rawHeader: lines.slice(0, lineCount).join('\n')
        };
    }
    /**
     * Validate a parsed header
     */
    validateHeader(data) {
        if (typeof data !== 'object' || data === null) {
            throw new types_1.POCError('HEADER_ERROR', 'Header data must be an object');
        }
        const header = data;
        // Required: id
        if (!data.id) {
            throw new types_1.POCError('HEADER_ERROR', 'Missing required field: id');
        }
        if (!data.id.startsWith('@')) {
            throw new types_1.POCError('HEADER_ERROR', 'Spec ID must start with @');
        }
        // Required: version
        if (!data.version) {
            throw new types_1.POCError('HEADER_ERROR', 'Missing required field: version');
        }
        if (!/^\d+\.\d+\.\d+/.test(data.version)) {
            throw new types_1.POCError('HEADER_ERROR', 'Version must be semantic (e.g., 1.0.0)');
        }
        // Required: layer
        if (data.layer === undefined) {
            throw new types_1.POCError('HEADER_ERROR', 'Missing required field: layer');
        }
        if (typeof data.layer !== 'number' || data.layer < 0 || data.layer > 10) {
            throw new types_1.POCError('HEADER_ERROR', 'Layer must be number 0-10');
        }
        // Optional: tags
        if (data.tags && !Array.isArray(data.tags)) {
            throw new types_1.POCError('HEADER_ERROR', 'Tags must be an array');
        }
    }
    /**
     * Parse YAML content using js-yaml library
     * Supports full YAML spec needed for headers
     */
    parseYaml(yamlContent) {
        try {
            const parsed = js_yaml_1.default.load(yamlContent);
            return parsed || {};
        }
        catch (error) {
            throw new types_1.POCError('HEADER_ERROR', `Failed to parse YAML header: ${error.message}`, undefined, error);
        }
    }
}
exports.HeaderParser = HeaderParser;
//# sourceMappingURL=header-parser.js.map