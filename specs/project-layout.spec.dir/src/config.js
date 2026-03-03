"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/project-layout.spec.md
 * Blocks: @block:layout/config
 * Generated: 2026-02-22
 *
 * Edit the spec, not this file.
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
exports.findProjectRoot = findProjectRoot;
exports.loadSpeclangRc = loadSpeclangRc;
exports.buildProjectStructure = buildProjectStructure;
exports.loadProjectLayoutConfig = loadProjectLayoutConfig;
exports.getProjectStructure = getProjectStructure;
exports.isSpeclangProject = isSpeclangProject;
/**
 * Configuration loading for project layout
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const loader_js_1 = require("../config/loader.js");
/**
 * Find project root by looking for project.scl or .speclangrc
 */
function findProjectRoot(startDir = process.cwd()) {
    let current = startDir;
    // Check if the starting directory exists
    if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) {
        return null;
    }
    // Limit search depth to avoid infinite loops
    const maxDepth = 20;
    let depth = 0;
    while (depth < maxDepth) {
        // Check for marker files
        const hasNorthStar = fs.existsSync(path.join(current, 'project.scl'));
        const hasSpeclangrc = fs.existsSync(path.join(current, '.speclangrc'));
        const hasSpecs = fs.existsSync(path.join(current, 'specs'));
        if (hasNorthStar || (hasSpeclangrc && hasSpecs)) {
            return current;
        }
        const parent = path.dirname(current);
        if (parent === current) {
            // Reached filesystem root
            break;
        }
        current = parent;
        depth++;
    }
    return null;
}
/**
 * Load .speclangrc configuration
 */
function loadSpeclangRc(projectRoot) {
    const configPath = path.join(projectRoot, '.speclangrc');
    if (!fs.existsSync(configPath)) {
        return null;
    }
    try {
        const content = fs.readFileSync(configPath, 'utf-8');
        const config = parseYamlLike(content);
        return config;
    }
    catch (error) {
        console.warn(`Warning: Failed to parse .speclangrc: ${error}`);
        return null;
    }
}
/**
 * Simple YAML-like parser for .speclangrc
 */
function parseYamlLike(content) {
    const result = {};
    const lines = content.split('\n');
    let currentKey = '';
    let currentArray = [];
    let inArray = false;
    let inObject = false;
    let daemonObj = {};
    for (const rawLine of lines) {
        const line = rawLine.trim();
        // Skip comments and empty lines
        if (!line || line.startsWith('#')) {
            continue;
        }
        // Check for array item
        if (line.startsWith('- ')) {
            const value = line.slice(2).trim();
            if (inArray) {
                currentArray.push(value);
            }
            else {
                currentArray = [value];
                inArray = true;
            }
            continue;
        }
        // Check for key: value
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            // Save previous array/object
            if (inArray && currentKey) {
                result[currentKey] = currentArray;
                currentArray = [];
                inArray = false;
            }
            if (inObject && currentKey && currentKey !== 'daemon') {
                result[currentKey] = { ...daemonObj };
                daemonObj = {};
                inObject = false;
            }
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();
            if (value === '' || value === 'true' || value === 'false') {
                // Boolean or empty (start of object/array)
                if (value === 'true') {
                    result[key] = true;
                }
                else if (value === 'false') {
                    result[key] = false;
                }
                else {
                    // Start of nested object
                    currentKey = key;
                    if (key === 'daemon') {
                        inObject = true;
                    }
                }
            }
            else if (value.startsWith('"') || value.startsWith("'")) {
                // String
                result[key] = value.slice(1, -1);
            }
            else if (!isNaN(Number(value))) {
                // Number
                result[key] = Number(value);
            }
            else {
                // String
                result[key] = value;
            }
        }
    }
    // Save final array/object
    if (inArray && currentKey) {
        result[currentKey] = currentArray;
    }
    if (inObject) {
        result[currentKey] = daemonObj;
    }
    return result;
}
/**
 * Build project structure from project root
 */
function buildProjectStructure(projectRoot) {
    return {
        root: projectRoot,
        specs: path.join(projectRoot, 'specs'),
        tests: path.join(projectRoot, 'tests'),
        generated: path.join(projectRoot, 'generated'),
        speclang: path.join(projectRoot, '.speclang'),
        northStar: path.join(projectRoot, 'project.scl'),
        config: path.join(projectRoot, '.speclangrc'),
        gitignore: path.join(projectRoot, '.gitignore')
    };
}
/**
 * Load full project layout configuration
 */
function loadProjectLayoutConfig(projectRoot) {
    // If projectRoot is explicitly provided, validate it exists
    // If not provided, search for it
    let root;
    if (projectRoot) {
        root = fs.existsSync(projectRoot) ? projectRoot : null;
    }
    else {
        root = findProjectRoot();
    }
    if (!root) {
        return null;
    }
    const structure = buildProjectStructure(root);
    const speclangrc = loadSpeclangRc(root);
    const baseConfig = (0, loader_js_1.getDefaultConfig)();
    // Override with .speclangrc values if present
    if (speclangrc) {
        baseConfig.metadata.name = path.basename(root);
    }
    return {
        ...baseConfig,
        projectRoot: root,
        layout: structure,
        speclangrc: speclangrc || {
            version: 1,
            project_root: '.',
            spec_dirs: ['specs/', 'tests/'],
            generated_dir: 'generated/',
            daemon: {
                enabled: true,
                quiet_period: '30s'
            }
        }
    };
}
/**
 * Get project structure from current working directory
 */
function getProjectStructure() {
    const root = findProjectRoot();
    if (!root) {
        return null;
    }
    return buildProjectStructure(root);
}
/**
 * Check if a directory is a speclang project
 */
function isSpeclangProject(dir = process.cwd()) {
    const root = findProjectRoot(dir);
    return root !== null;
}
//# sourceMappingURL=config.js.map