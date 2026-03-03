"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var promises_1 = require("fs/promises");
var path_1 = require("path");
var poc_1 = require("../types/poc");
var header_parser_1 = require("./header-parser");
/**
 * Parser for spec markdown files
 * Extracts @block: definitions and spec headers
 */
var BlockParser = /** @class */ (function () {
    function BlockParser() {
        // Block ID allows: letters, numbers, underscores, hyphens
        this.blockPattern = /^###\s+@block:([a-zA-Z0-9_-]+)\s+@kind:(\w+)/gm;
        // Parameter: name (optional ?), type (complex types allowed), description
        // Supports: string, string[], Promise<string>, Array<T>, string | number, { a: string }
        // Pattern captures everything up to " - " as type, allowing complex TypeScript types
        this.paramPattern = /^-\s+(\w+\??):\s*(.+?)\s+-\s*(.+)$/gm;
        // Return type: captures complex types including generics, unions, intersections
        // Supports: string, Promise<string>, string | number, Array<T>, { [key: string]: any }
        this.returnPattern = /\*\*Returns:\*\*\s*([^\n]+?)(?:\s+-\s*(.+))?$/m;
        // Code examples
        this.examplePattern = /```(\w+)\n([\s\S]*?)```/g;
        /**
         * Allowed spec root directory
         */
        this.specRoot = (0, path_1.resolve)(process.cwd(), 'specs');
        this.headerParser = new header_parser_1.HeaderParser();
    }
    /**
     * Parse a spec file with path traversal protection
     * @param filePath - Path to the spec file (must be within specs/)
     * @returns Complete parsed spec with header and blocks
     * @throws {POCError} If file cannot be read, is outside specs/, or parsing fails
     */
    BlockParser.prototype.parseFile = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var validatedPath, content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.validateFilePath(filePath)];
                    case 1:
                        validatedPath = _a.sent();
                        return [4 /*yield*/, (0, promises_1.readFile)(validatedPath, 'utf-8')];
                    case 2:
                        content = _a.sent();
                        return [2 /*return*/, this.parse(content, validatedPath)];
                }
            });
        });
    };
    /**
     * Validate file path for security
     * - Resolves symlinks with realpath
     * - Checks path is within specRoot
     * - Normalizes path separators
     * - Verifies file exists and is readable
     */
    BlockParser.prototype.validateFilePath = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var normalized, absolutePath, realPath, relativeToRoot, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        normalized = (0, path_1.normalize)(filePath);
                        // SECURITY: Reject paths with traversal sequences before resolution
                        // Check for any attempt to escape directory (including encoded forms)
                        if (normalized.includes('..') || normalized.includes('~')) {
                            throw new poc_1.POCError('PARSE_ERROR', "Invalid path: \"".concat(filePath, "\" contains traversal sequences"), filePath);
                        }
                        absolutePath = (0, path_1.resolve)(normalized);
                        return [4 /*yield*/, (0, promises_1.realpath)(absolutePath).catch(function () { return absolutePath; })];
                    case 1:
                        realPath = _b.sent();
                        relativeToRoot = (0, path_1.relative)(this.specRoot, realPath);
                        if (relativeToRoot.startsWith('..') || relativeToRoot.includes(':')) {
                            // ':' catches Windows absolute paths with drive letter
                            throw new poc_1.POCError('PARSE_ERROR', "Access denied: Path \"".concat(filePath, "\" resolves to \"").concat(realPath, "\" which is outside allowed spec directory"), filePath);
                        }
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, (0, promises_1.access)(realPath, promises_1.constants.R_OK)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _a = _b.sent();
                        throw new poc_1.POCError('PARSE_ERROR', "Cannot read file: \"".concat(filePath, "\" does not exist or is not readable"), filePath);
                    case 5: return [2 /*return*/, realPath];
                }
            });
        });
    };
    /**
     * Parse spec content
     * @param content - Raw markdown content
     * @param filePath - Source file path (for metadata)
     * @returns Complete parsed spec
     */
    BlockParser.prototype.parse = function (content, filePath) {
        // Parse header
        var header = this.headerParser.parse(content);
        // Parse blocks with filePath for error reporting
        var blocks = this.parseBlocks(content, filePath);
        return {
            id: header.id,
            version: header.version,
            short: header.short,
            filePath: filePath,
            blocks: blocks,
            headerLines: header.rawHeader.split('\n'),
            parsedAt: Date.now()
        };
    };
    /**
     * Parse all blocks from content
     * @param content - Markdown content
     * @param filePath - Source file path (for error reporting)
     * @returns Array of parsed blocks
     */
    BlockParser.prototype.parseBlocks = function (content, filePath) {
        var blocks = [];
        var matches = content.matchAll(this.blockPattern);
        for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
            var match = matches_1[_i];
            var block = this.parseBlock(match, content, filePath);
            blocks.push(block);
        }
        return blocks;
    };
    /**
     * Parse a single block
     * @param match - RegExp match array from block pattern
     * @param fullContent - Full file content
     * @returns Parsed block
     */
    BlockParser.prototype.parseBlock = function (match, fullContent, filePath) {
        var id = match[1];
        var rawKind = match[2];
        var section = this.extractSection(match.index, fullContent);
        // SECURITY: Validate block kind
        if (!(0, poc_1.isValidBlockKind)(rawKind)) {
            throw new poc_1.POCError('PARSE_ERROR', "Invalid block kind \"".concat(rawKind, "\" for block \"").concat(id, "\". Valid kinds: ").concat(poc_1.VALID_BLOCK_KINDS.join(', ')), filePath);
        }
        var kind = rawKind;
        return {
            id: id,
            kind: kind,
            description: this.parseDescription(section),
            parameters: this.parseParameters(section),
            properties: this.parseProperties(section),
            returns: this.parseReturns(section),
            examples: this.parseExamples(section),
            rawContent: section
        };
    };
    /**
     * Extract section content until next block or EOF
     */
    BlockParser.prototype.extractSection = function (startIndex, content) {
        var endPattern = /^###\s+@block:/m;
        var remaining = content.slice(startIndex);
        var match = remaining.match(endPattern);
        if (match && match.index !== undefined) {
            return remaining.slice(0, match.index).trim();
        }
        return remaining.trim();
    };
    /**
     * Parse block description (text after header, before params)
     */
    BlockParser.prototype.parseDescription = function (section) {
        var lines = section.split('\n');
        var descriptionLines = [];
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            var trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('**') && !trimmed.startsWith('-')) {
                descriptionLines.push(trimmed);
            }
            else if (trimmed.startsWith('**')) {
                break;
            }
        }
        return descriptionLines.join(' ').trim();
    };
    /**
     * Parse parameters section
     * Handles: "name: string - description", "name?: string - optional param"
     */
    BlockParser.prototype.parseParameters = function (section) {
        var params = [];
        var paramSection = section.match(/\*\*Parameters:\*\*([\s\S]*?)(?=\*\*|$)/);
        if (!paramSection)
            return params;
        // Reset regex lastIndex
        this.paramPattern.lastIndex = 0;
        var match;
        while ((match = this.paramPattern.exec(paramSection[1])) !== null) {
            var rawName = match[1];
            var isOptional = rawName.endsWith('?');
            var name_1 = isOptional ? rawName.slice(0, -1) : rawName;
            params.push({
                name: name_1,
                type: match[2].trim(),
                description: match[3].trim(),
                optional: isOptional
            });
        }
        return params;
    };
    /**
     * Parse properties section (for classes/interfaces)
     * Handles: "name: type - description"
     */
    BlockParser.prototype.parseProperties = function (section) {
        var properties = [];
        var propSection = section.match(/\*\*Properties:\*\*([\s\S]*?)(?=\*\*|$)/);
        if (!propSection)
            return properties;
        var lines = propSection[1].split('\n');
        for (var _i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
            var line = lines_2[_i];
            var match = line.match(/^-\s+(\w+\??):\s*(.+?)\s+-\s*(.+)$/);
            if (match) {
                var rawName = match[1];
                var isOptional = rawName.endsWith('?');
                var name_2 = isOptional ? rawName.slice(0, -1) : rawName;
                properties.push({
                    name: name_2,
                    type: match[2].trim(),
                    description: match[3].trim(),
                    optional: isOptional
                });
            }
        }
        return properties;
    };
    /**
     * Parse return type
     */
    BlockParser.prototype.parseReturns = function (section) {
        var _a;
        // Reset regex lastIndex to prevent state pollution
        this.returnPattern.lastIndex = 0;
        var match = this.returnPattern.exec(section);
        if (match) {
            return {
                type: match[1],
                description: ((_a = match[2]) === null || _a === void 0 ? void 0 : _a.trim()) || ''
            };
        }
        return undefined;
    };
    /**
     * Parse code examples
     */
    BlockParser.prototype.parseExamples = function (section) {
        var examples = [];
        var matches = section.matchAll(this.examplePattern);
        for (var _i = 0, matches_2 = matches; _i < matches_2.length; _i++) {
            var match = matches_2[_i];
            examples.push({
                language: match[1] || 'typescript',
                code: match[2].trim(),
                description: '' // Could parse from preceding text
            });
        }
        return examples;
    };
    return BlockParser;
}());
exports.BlockParser = BlockParser;
