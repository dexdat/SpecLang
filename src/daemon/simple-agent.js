"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/simple-agent.spec.md
 * Generated: 2026-03-03T05:35:00.000Z
 *
 * Edit the spec, not this file.
 */
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
exports.SimpleAgent = void 0;
var block_parser_1 = require("../parser/block-parser");
var generator_1 = require("../codegen/generator");
var path_utils_1 = require("../utils/path-utils");
var promises_1 = require("fs/promises");
var os_1 = require("os");
var template_registry_1 = require("../codegen/template-registry");
/**
 * Simple Agent for POC
 * Single agent that converts spec changes to code
 * Simplified for POC - no multi-agent coordination needed
 */
var SimpleAgent = /** @class */ (function () {
    function SimpleAgent() {
        this.parser = new block_parser_1.BlockParser();
        // Initialize code generator with default registry
        var registry = new template_registry_1.TemplateRegistry();
        this.generator = new generator_1.CodeGenerator({ registry: registry });
    }
    /**
     * Handle file change event
     * Processes spec file and generates code
     * @param event - File change event
     */
    SimpleAgent.prototype.onFileChanged = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var spec, error_1, specSlug, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[SimpleAgent] Processing: ".concat(event.path));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.parser.parseFile(event.path)];
                    case 2:
                        spec = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error("[SimpleAgent] Failed to parse ".concat(event.path, ":"), error_1);
                        throw error_1;
                    case 4:
                        specSlug = (0, path_utils_1.slugifySpecId)(spec.id);
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.processSpec(spec, specSlug, event.path)];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        error_2 = _a.sent();
                        console.error("[SimpleAgent] Error processing ".concat(event.path, ":"), error_2);
                        throw error_2;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process a spec
     * @param spec - Parsed spec
     * @param specSlug - Filesystem-safe slug
     * @param filePath - Original file path
     */
    SimpleAgent.prototype.processSpec = function (spec, specSlug, filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var generatedFiles, errors, header, _i, _a, block, blockData, generatedFile, error_3, errorMessages, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 8, , 9]);
                        generatedFiles = [];
                        errors = [];
                        header = {
                            id: spec.id,
                            version: spec.version,
                            layer: 0, // Default layer
                            short: spec.short || '',
                            tags: [],
                            lineCount: spec.headerLines.length,
                            rawHeader: spec.headerLines.join('\n')
                        };
                        _i = 0, _a = spec.blocks;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        block = _a[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        blockData = {
                            id: block.id,
                            kind: block.kind,
                            description: block.description,
                            parameters: block.parameters,
                            properties: block.properties,
                            returns: block.returns,
                            examples: block.examples,
                            rawContent: block.rawContent
                        };
                        return [4 /*yield*/, this.generator.generate(spec.id, header, blockData)];
                    case 3:
                        generatedFile = _b.sent();
                        generatedFiles.push(generatedFile.path);
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _b.sent();
                        console.error("[SimpleAgent] Failed to generate ".concat(block.id, ":"), error_3);
                        errors.push({ blockId: block.id, error: error_3 });
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: 
                    // 2. Create/update symlinks
                    return [4 /*yield*/, this.updateSymlinks(specSlug)];
                    case 7:
                        // 2. Create/update symlinks
                        _b.sent();
                        // 3. Report results
                        if (errors.length > 0) {
                            console.warn("\u26A0\uFE0F  Generated ".concat(generatedFiles.length, " files, ").concat(errors.length, " failed for ").concat(spec.id));
                            errorMessages = errors.map(function (e) { return "".concat(e.blockId, ": ").concat(e.error.message); }).join(', ');
                            throw new Error("Failed to generate ".concat(errors.length, " blocks: ").concat(errorMessages));
                        }
                        else {
                            console.log("\u2705 Generated ".concat(generatedFiles.length, " files for ").concat(spec.id));
                        }
                        return [3 /*break*/, 9];
                    case 8:
                        error_4 = _b.sent();
                        console.error("[SimpleAgent] Error processing ".concat(filePath, ":"), error_4);
                        throw error_4;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create or update symlinks
     * Falls back to copy on Windows if symlinks fail
     * @param specSlug - Filesystem-safe slug
     */
    SimpleAgent.prototype.updateSymlinks = function (specSlug) {
        return __awaiter(this, void 0, void 0, function () {
            var srcPath, targetPath, _a, isWindows, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        srcPath = "src/".concat(specSlug);
                        targetPath = "../specs/".concat(specSlug, ".spec.dir/src");
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, promises_1.unlink)(srcPath)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 4:
                        isWindows = (0, os_1.platform)() === 'win32';
                        if (!isWindows) return [3 /*break*/, 10];
                        _b.label = 5;
                    case 5:
                        _b.trys.push([5, 7, , 9]);
                        return [4 /*yield*/, (0, promises_1.symlink)(targetPath, srcPath, 'junction')];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 7:
                        error_5 = _b.sent();
                        console.log("[SimpleAgent] Symlink failed on Windows, using copy instead");
                        // Windows fallback: copy files instead of symlink
                        return [4 /*yield*/, this.copyDirectory("specs/".concat(specSlug, ".spec.dir/src"), srcPath)];
                    case 8:
                        // Windows fallback: copy files instead of symlink
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 9: return [3 /*break*/, 12];
                    case 10: 
                    // Unix/Mac: standard symlink
                    return [4 /*yield*/, (0, promises_1.symlink)(targetPath, srcPath)];
                    case 11:
                        // Unix/Mac: standard symlink
                        _b.sent();
                        _b.label = 12;
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Copy directory contents recursively (Windows fallback)
     * @param source - Source directory path
     * @param destination - Destination directory path
     */
    SimpleAgent.prototype.copyDirectory = function (source, destination) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Use recursive copy (Node 16+)
                    return [4 /*yield*/, (0, promises_1.cp)(source, destination, { recursive: true, force: true })];
                    case 1:
                        // Use recursive copy (Node 16+)
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return SimpleAgent;
}());
exports.SimpleAgent = SimpleAgent;
