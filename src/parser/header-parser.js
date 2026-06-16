"use strict";
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
var poc_1 = require("../types/poc");
var js_yaml_1 = require("js-yaml");
var HeaderParser = /** @class */ (function () {
    function HeaderParser() {
    }
    /**
     * Parse header from content
     * @param content - Full file content
     * @returns Parsed header
     * @throws {POCError} If header is invalid
     */
    HeaderParser.prototype.parse = function (content) {
        var _a, _b;
        var lines = content.split('\n');
        // Validate header marker
        if (!((_a = lines[0]) === null || _a === void 0 ? void 0 : _a.startsWith('# speclang-header'))) {
            throw new poc_1.POCError('HEADER_ERROR', 'Missing # speclang-header marker');
        }
        // Extract line count
        var lineCountMatch = lines[0].match(/lines:(\d+)/);
        if (!lineCountMatch) {
            throw new poc_1.POCError('HEADER_ERROR', 'Missing lines:N in header marker');
        }
        var lineCount = parseInt(lineCountMatch[1], 10);
        // SECURITY: Validate line count is within bounds
        if (lineCount <= 0 || lineCount > lines.length) {
            throw new poc_1.POCError('HEADER_ERROR', "Invalid header line count: ".concat(lineCount, " (must be 1-").concat(lines.length, ")"), undefined);
        }
        var headerLines = lines.slice(1, lineCount);
        // SECURITY: Validate header ends with '---' separator
        if (!((_b = headerLines[headerLines.length - 1]) === null || _b === void 0 ? void 0 : _b.trim().startsWith('---'))) {
            throw new poc_1.POCError('HEADER_ERROR', 'Header must end with --- separator', undefined);
        }
        // Parse YAML content
        var header = this.parseYaml(headerLines.join('\n'));
        // Validate required fields
        this.validateHeader(header);
        return {
            id: header.id,
            version: header.version,
            layer: header.layer,
            short: header.short || '',
            tags: header.tags || [],
            lineCount: lineCount,
            rawHeader: lines.slice(0, lineCount).join('\n')
        };
    };
    /**
     * Validate a parsed header
     */
    HeaderParser.prototype.validateHeader = function (data) {
        if (typeof data !== 'object' || data === null) {
            throw new poc_1.POCError('HEADER_ERROR', 'Header data must be an object');
        }
        var header = data;
        // Required: id
        var id = header.id;
        if (!id) {
            throw new poc_1.POCError('HEADER_ERROR', 'Missing required field: id');
        }
        if (!id.startsWith('@')) {
            throw new poc_1.POCError('HEADER_ERROR', 'Spec ID must start with @');
        }
        // Required: version
        var version = header.version;
        if (!version) {
            throw new poc_1.POCError('HEADER_ERROR', 'Missing required field: version');
        }
        if (!/^\d+\.\d+\.\d+/.test(version)) {
            throw new poc_1.POCError('HEADER_ERROR', 'Version must be semantic (e.g., 1.0.0)');
        }
        // Required: layer
        var layer = header.layer;
        if (layer === undefined) {
            throw new poc_1.POCError('HEADER_ERROR', 'Missing required field: layer');
        }
        if (typeof layer !== 'number' || layer < 0 || layer > 10) {
            throw new poc_1.POCError('HEADER_ERROR', 'Layer must be number 0-10');
        }
        // Optional: tags
        var tags = header.tags;
        if (tags && !Array.isArray(tags)) {
            throw new poc_1.POCError('HEADER_ERROR', 'Tags must be an array');
        }
    };
    /**
     * Parse YAML content using js-yaml library
     * Supports full YAML spec needed for headers
     */
    HeaderParser.prototype.parseYaml = function (yamlContent) {
        try {
            var parsed = js_yaml_1.default.load(yamlContent);
            return parsed || {};
        }
        catch (error) {
            throw new poc_1.POCError('HEADER_ERROR', "Failed to parse YAML header: ".concat(error.message), undefined, error);
        }
    };
    return HeaderParser;
}());
exports.HeaderParser = HeaderParser;
