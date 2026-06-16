"use strict";
/**
 * SPECLANG-GENERATED: Splitter - main split logic
 * Source: @speclang/dynamic-split/strategy @block:split/logic
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
exports.Splitter = void 0;
exports.createSplitter = createSplitter;
exports.checkSplitNeeded = checkSplitNeeded;
exports.splitContent = splitContent;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("./types");
const size_checker_1 = require("./size-checker");
const strategy_1 = require("./strategy");
/**
 * Main splitter class
 * Coordinates size checking, strategy selection, and execution
 */
class Splitter {
    config;
    sizeChecker;
    defaultStrategy;
    constructor(config = {}) {
        this.config = { ...types_1.DEFAULT_SPLIT_CONFIG, ...config };
        this.sizeChecker = new size_checker_1.SizeChecker(this.config);
        this.defaultStrategy = (0, strategy_1.createStrategy)(this.config.strategy, this.config);
    }
    /**
     * Update configuration
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
        this.sizeChecker.setConfig(this.config);
        this.defaultStrategy = (0, strategy_1.createStrategy)(this.config.strategy, this.config);
    }
    /**
     * Get current config
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Check if content needs splitting
     */
    needsSplit(content) {
        return this.sizeChecker.getDecision(content) !== 'no-split';
    }
    /**
     * Get split decision
     */
    getDecision(content) {
        return this.sizeChecker.getDecision(content);
    }
    /**
     * Split spec content
     * Returns SplitResult with parent and children
     */
    split(specPath, content, metadata, options = {}) {
        // Select strategy - from options or default config
        const strategyName = options.strategy || this.config.strategy;
        // Check if split is needed
        const decision = this.sizeChecker.getDecision(content);
        if (decision === 'no-split') {
            return {
                split: false,
                originalPath: specPath,
                parent: {
                    path: specPath,
                    content,
                    part: 1,
                    totalParts: 1,
                },
                children: [],
                strategy: strategyName,
            };
        }
        // Create strategy with options config
        const strategy = (0, strategy_1.createStrategy)(strategyName, options.config || this.config);
        // Execute split
        return strategy.split(specPath, content, metadata);
    }
    /**
     * Split spec from file
     */
    splitFile(specPath, options = {}) {
        // Read file
        if (!fs.existsSync(specPath)) {
            throw new Error(`File not found: ${specPath}`);
        }
        const content = fs.readFileSync(specPath, 'utf-8');
        // Extract metadata (simple extraction)
        const metadata = this.extractMetadata(content);
        // Perform split
        return this.split(specPath, content, metadata, options);
    }
    /**
     * Extract basic metadata from content
     */
    extractMetadata(content) {
        const metadata = {};
        // Extract id from header
        const idMatch = content.match(/^id:\s*(.+)$/m);
        if (idMatch) {
            metadata.id = idMatch[1].trim();
        }
        // Extract version
        const versionMatch = content.match(/^version:\s*(.+)$/m);
        if (versionMatch) {
            metadata.version = versionMatch[1].trim();
        }
        // Extract short
        const shortMatch = content.match(/^short:\s*(.+)$/m);
        if (shortMatch) {
            metadata.short = shortMatch[1].trim();
        }
        return metadata;
    }
    /**
     * Execute split and write files
     * Returns the split result
     */
    splitAndWrite(specPath, options = {}) {
        // Perform split
        const result = this.splitFile(specPath, options);
        if (!result.split) {
            return result;
        }
        // Write parent file
        const parentDir = path.dirname(result.parent.path);
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.writeFileSync(result.parent.path, result.parent.content, 'utf-8');
        // Write children
        for (const child of result.children) {
            const childDir = path.dirname(child.path);
            if (!fs.existsSync(childDir)) {
                fs.mkdirSync(childDir, { recursive: true });
            }
            fs.writeFileSync(child.path, child.content, 'utf-8');
        }
        return result;
    }
    /**
     * Check if a path is a split spec directory
     */
    static isSplitDir(specPath) {
        return specPath.includes('.spec.dir/');
    }
    /**
     * Get parent path from split child path
     */
    static getParentPath(childPath) {
        const match = childPath.match(/(.+)\.spec\.dir\/.+/);
        if (match) {
            return match[1] + '.spec.yaml';
        }
        return null;
    }
}
exports.Splitter = Splitter;
/**
 * Create a splitter with default config
 */
function createSplitter(config) {
    return new Splitter(config);
}
/**
 * Utility function to check if content needs splitting
 */
function checkSplitNeeded(content, config) {
    const splitter = new Splitter(config);
    return splitter.needsSplit(content);
}
/**
 * Utility function to split content
 */
function splitContent(specPath, content, metadata, options) {
    const splitter = new Splitter(options?.config);
    return splitter.split(specPath, content, metadata, options);
}
//# sourceMappingURL=splitter.js.map