"use strict";
/**
 * SPECLANG-GENERATED: CLI utilities
 * Source: @speclang/mcp.cli
 *
 * Common utilities for CLI commands
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
exports.setSuppressOutput = setSuppressOutput;
exports.isSuppressOutput = isSuppressOutput;
exports.log = log;
exports.error = error;
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
exports.getSpecsDir = getSpecsDir;
exports.loadIndex = loadIndex;
exports.refreshIndex = refreshIndex;
exports.findSpecFile = findSpecFile;
exports.readSpecContent = readSpecContent;
exports.outputResults = outputResults;
exports.formatSpec = formatSpec;
exports.getDbPath = getDbPath;
exports.ensureSpeclangDir = ensureSpeclangDir;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const index_js_1 = require("../../sqlite.spec.dir/src/index.js");
const index_js_2 = require("../../indexer.spec.dir/src/index.js");
/**
 * Whether to suppress console output (for JSON mode)
 */
let suppressOutput = false;
/**
 * Set suppress output mode
 */
function setSuppressOutput(suppress) {
    suppressOutput = suppress;
}
/**
 * Get suppress output state
 */
function isSuppressOutput() {
    return suppressOutput;
}
/**
 * Console.log wrapper that respects suppress mode
 */
function log(...args) {
    if (!suppressOutput) {
        console.log(...args);
    }
}
/**
 * Console.error wrapper that respects suppress mode
 */
function error(...args) {
    if (!suppressOutput) {
        console.error(...args);
    }
}
/**
 * Database instance (singleton)
 */
let dbInstance = null;
/**
 * Get database instance
 */
function getDatabase(config) {
    if (!dbInstance) {
        const dbPath = config?.path || process.env.SPECLANG_DB || '.speclang/speclang.db';
        dbInstance = (0, index_js_1.createDatabase)({ path: dbPath });
    }
    return dbInstance;
}
/**
 * Close database connection
 */
function closeDatabase() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}
/**
 * Get specs directory
 */
function getSpecsDir() {
    return process.env.SPECLANG_DIR || 'specs';
}
/**
 * Load spec index
 */
function loadIndex() {
    const indexPath = '.speclang/_index.json';
    if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf-8');
        return JSON.parse(content);
    }
    // Generate if not exists
    return (0, index_js_2.generateIndex)({ rootDir: getSpecsDir() });
}
/**
 * Refresh spec index
 */
function refreshIndex() {
    const db = getDatabase();
    const index = (0, index_js_2.generateIndex)({
        rootDir: getSpecsDir(),
        outputPath: '.speclang/_index.json'
    });
    // Populate database
    const { populateDatabase } = require('../indexer/index.js');
    populateDatabase(index, db);
    return index;
}
/**
 * Find spec file by ID
 */
function findSpecFile(specId) {
    const index = loadIndex();
    const entry = index.specs[specId];
    if (entry) {
        return entry.file;
    }
    return null;
}
/**
 * Read spec content from file
 */
function readSpecContent(filePath) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(getSpecsDir(), filePath);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`Spec file not found: ${fullPath}`);
    }
    return fs.readFileSync(fullPath, 'utf-8');
}
function outputResults(results, options, formatFn) {
    if (options.json) {
        console.log(JSON.stringify(results, null, 2));
    }
    else if (options.quiet) {
        results.forEach(r => {
            if (formatFn) {
                console.log(formatFn(r));
            }
            else {
                console.log(JSON.stringify(r));
            }
        });
    }
    else {
        results.forEach(r => {
            if (formatFn) {
                console.log(formatFn(r));
            }
            else {
                console.log(JSON.stringify(r, null, 2));
            }
        });
    }
}
/**
 * Format spec for display
 */
function formatSpec(item) {
    return `  ${item.id} (layer ${item.layer}) - ${item.short || ''}`;
}
/**
 * Get database path
 */
function getDbPath() {
    return process.env.SPECLANG_DB || '.speclang/speclang.db';
}
/**
 * Ensure .speclang directory exists
 */
function ensureSpeclangDir() {
    const dir = '.speclang';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
//# sourceMappingURL=utils.js.map