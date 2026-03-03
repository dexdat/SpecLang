"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/path-utils.spec.md
 * Generated: 2026-03-03T04:00:00.000Z
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
exports.slugifySpecId = slugifySpecId;
exports.unslugifySpecId = unslugifySpecId;
exports.resolveSpecPaths = resolveSpecPaths;
exports.resolveBlockOutputPath = resolveBlockOutputPath;
exports.getSpecIdFromPath = getSpecIdFromPath;
exports.isSpecPath = isSpecPath;
exports.isGeneratedPath = isGeneratedPath;
exports.getSymlinkTarget = getSymlinkTarget;
exports.resolveBlockPaths = resolveBlockPaths;
exports.ensureSpecDirectories = ensureSpecDirectories;
var path_1 = require("path");
/**
 * Windows reserved filenames that cannot be used
 */
var WINDOWS_RESERVED_NAMES = new Set([
    'con', 'prn', 'aux', 'nul',
    'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
    'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'
]);
/**
 * Slugify a spec ID for filesystem use with reversible encoding
 * @param specId - Full spec ID (e.g., "@examples/greeting")
 * @returns Filesystem-safe slug (e.g., "examples-SLASH-greeting")
 */
function slugifySpecId(specId) {
    // Use '-SLASH-' to encode / for unambiguous reversibility
    // @examples/greeting → examples-SLASH-greeting
    // @my-spec/auth → my-spec-SLASH-auth
    var slug = specId
        .replace(/^@/, '') // Remove leading @
        .replace(/\//g, '-SLASH-') // Replace / with -SLASH- (reversible, unique)
        .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace other special chars
        .toLowerCase();
    // Handle Windows reserved names by prefixing with underscore
    var baseName = slug.split('-SLASH-').pop() || slug;
    if (WINDOWS_RESERVED_NAMES.has(baseName)) {
        slug = slug.replace(baseName, '_' + baseName);
    }
    return slug;
}
/**
 * Reverse slugification (recover original spec ID)
 * @param slug - Filesystem slug
 * @returns Original spec ID (e.g., "@examples/greeting")
 */
function unslugifySpecId(slug) {
    // Remove Windows reserved name prefix if present
    var cleaned = slug;
    for (var _i = 0, WINDOWS_RESERVED_NAMES_1 = WINDOWS_RESERVED_NAMES; _i < WINDOWS_RESERVED_NAMES_1.length; _i++) {
        var reserved = WINDOWS_RESERVED_NAMES_1[_i];
        if (slug.includes('_' + reserved)) {
            cleaned = slug.replace('_' + reserved, reserved);
            break;
        }
    }
    // Reverse: replace -SLASH- with /
    return '@' + cleaned.replace(/-SLASH-/g, '/');
}
/**
 * Resolve paths for a spec ID
 * @param specId - Full spec ID
 * @returns Resolved path information
 */
function resolveSpecPaths(specId) {
    var slug = slugifySpecId(specId);
    return {
        slug: slug,
        specPath: (0, path_1.join)('specs', "".concat(slug, ".spec.md")),
        specDir: (0, path_1.join)('specs', "".concat(slug, ".spec.dir")),
        srcDir: (0, path_1.join)('specs', "".concat(slug, ".spec.dir"), 'src'),
        symlinkPath: (0, path_1.join)('src', slug)
    };
}
/**
 * Resolve output path for a block
 * @param specId - Full spec ID
 * @param blockId - Block ID
 * @returns Full output file path
 */
function resolveBlockOutputPath(specId, blockId) {
    var srcDir = resolveSpecPaths(specId).srcDir;
    return (0, path_1.join)(srcDir, "".concat(blockId, ".ts"));
}
/**
 * Get spec ID from file path (reverse lookup)
 * @param filePath - Absolute or relative file path
 * @returns Spec ID or null if not a spec file
 */
function getSpecIdFromPath(filePath) {
    // Check if it's a spec file
    if (filePath.endsWith('.spec.md')) {
        var slug = (0, path_1.basename)(filePath, '.spec.md');
        return unslugifySpecId(slug);
    }
    // Check if it's in a spec.dir
    var specDirMatch = filePath.match(/specs\/([^/]+)\.spec\.dir/);
    if (specDirMatch) {
        return unslugifySpecId(specDirMatch[1]);
    }
    return null;
}
/**
 * Check if a path is within the specs directory
 * @param filePath - File path to check
 * @returns True if path is in specs/
 */
function isSpecPath(filePath) {
    return filePath.includes('/specs/') || filePath.startsWith('specs/');
}
/**
 * Check if a path is a generated source file
 * @param filePath - File path to check
 * @returns True if path is in a .spec.dir/src/
 */
function isGeneratedPath(filePath) {
    return filePath.includes('.spec.dir/src/');
}
/**
 * Get relative path from symlink to source
 * @param specId - Full spec ID
 * @returns Relative path for symlink target
 */
function getSymlinkTarget(specId) {
    var slug = slugifySpecId(specId);
    return (0, path_1.join)('..', 'specs', "".concat(slug, ".spec.dir"), 'src');
}
/**
 * Resolve all paths for a block
 * @param specId - Full spec ID
 * @param blockId - Block ID
 * @returns Complete path information
 */
function resolveBlockPaths(specId, blockId) {
    var base = resolveSpecPaths(specId);
    return {
        specId: specId,
        blockId: blockId,
        slug: base.slug,
        specPath: base.specPath,
        specDir: base.specDir,
        srcDir: base.srcDir,
        blockPath: (0, path_1.join)(base.srcDir, "".concat(blockId, ".ts")),
        indexPath: (0, path_1.join)(base.srcDir, 'index.ts'),
        symlinkPath: base.symlinkPath,
        symlinkTarget: getSymlinkTarget(specId)
    };
}
/**
 * Ensure all directories exist for a spec
 * @param specId - Full spec ID
 * @returns Promise that resolves when directories are created
 */
function ensureSpecDirectories(specId) {
    return __awaiter(this, void 0, void 0, function () {
        var mkdir, paths;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('fs/promises'); })];
                case 1:
                    mkdir = (_a.sent()).mkdir;
                    paths = resolveSpecPaths(specId);
                    return [4 /*yield*/, mkdir(paths.specDir, { recursive: true })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, mkdir(paths.srcDir, { recursive: true })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
