"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/project-layout.spec.md
 * Blocks: @block:layout/init
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
exports.initProject = initProject;
exports.formatInitResult = formatInitResult;
/**
 * Init command implementation for project layout
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const types_js_1 = require("./types.js");
const templates_js_1 = require("./templates.js");
const config_js_1 = require("./config.js");
const validator_js_1 = require("./validator.js");
/**
 * Initialize a new speclang project
 */
async function initProject(options) {
    const { name, targetDir, initGit = true, force = false, targets = ['typescript'], description = `Project created with speclang init`, version = '0.1.0', json = false } = options;
    const result = {
        success: false,
        projectRoot: '',
        structure: { ...types_js_1.DEFAULT_PROJECT_STRUCTURE },
        filesCreated: [],
        errors: [],
        warnings: []
    };
    // Determine target directory
    let projectRoot;
    if (name === '.') {
        // Special case: init in current directory
        projectRoot = targetDir ? path.resolve(targetDir) : process.cwd();
    }
    else if (targetDir && targetDir !== '.') {
        // When targetDir is explicitly provided, create project there
        projectRoot = path.join(path.resolve(targetDir), name);
    }
    else {
        // Default: create in current directory with project name
        projectRoot = path.resolve(name);
    }
    result.projectRoot = projectRoot;
    // Check if already a speclang project
    if (!force && (0, config_js_1.isSpeclangProject)(projectRoot)) {
        result.errors.push(`Directory ${projectRoot} is already a speclang project. Use --force to overwrite.`);
        return result;
    }
    // Create directory if it doesn't exist
    if (!fs.existsSync(projectRoot)) {
        try {
            fs.mkdirSync(projectRoot, { recursive: true });
        }
        catch (error) {
            result.errors.push(`Failed to create directory: ${error}`);
            return result;
        }
    }
    // Check for existing files
    const existingFiles = [];
    if (fs.existsSync(path.join(projectRoot, 'project.scl'))) {
        existingFiles.push('project.scl');
    }
    if (fs.existsSync(path.join(projectRoot, '.speclangrc'))) {
        existingFiles.push('.speclangrc');
    }
    if (fs.existsSync(path.join(projectRoot, '.gitignore'))) {
        existingFiles.push('.gitignore');
    }
    if (fs.existsSync(path.join(projectRoot, 'specs'))) {
        existingFiles.push('specs/');
    }
    if (existingFiles.length > 0 && !force) {
        result.errors.push(`Directory already contains files: ${existingFiles.join(', ')}. Use --force to overwrite.`);
        return result;
    }
    // Validate targets
    const invalidTargets = targets.filter(t => !types_js_1.SUPPORTED_LANGUAGES.includes(t));
    if (invalidTargets.length > 0) {
        result.warnings.push(`Unknown targets (will use defaults): ${invalidTargets.join(', ')}`);
    }
    const validTargets = targets.filter(t => types_js_1.SUPPORTED_LANGUAGES.includes(t));
    if (validTargets.length === 0) {
        validTargets.push('typescript');
    }
    try {
        // Create directory structure
        await createDirectoryStructure(projectRoot);
        // Generate and write files
        const files = await createProjectFiles(projectRoot, name, validTargets, description, version);
        result.filesCreated = files;
        // Initialize git if requested and not in a git repo
        if (initGit) {
            await initializeGit(projectRoot, result);
        }
        // Validate the created project
        const validation = (0, validator_js_1.validateProject)(projectRoot);
        if (!validation.valid) {
            const errors = validation.issues
                .filter(i => i.severity === 'error')
                .map(i => i.message);
            result.errors.push(...errors);
        }
        else {
            result.structure = validation.structure;
        }
        result.success = result.errors.length === 0;
    }
    catch (error) {
        result.errors.push(`Initialization failed: ${error}`);
    }
    return result;
}
/**
 * Create directory structure for project
 */
async function createDirectoryStructure(projectRoot) {
    const dirs = [
        'specs',
        'tests',
        'generated',
        'generated/ts',
        'generated/go',
        'generated/py',
        '.speclang',
        '.speclang/locks',
        '.speclang/cache'
    ];
    for (const dir of dirs) {
        const dirPath = path.join(projectRoot, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
}
/**
 * Create all project files from templates
 */
async function createProjectFiles(projectRoot, name, targets, description, version) {
    const filesCreated = [];
    // 1. Create project.scl (north star)
    const projectSclVars = (0, templates_js_1.getDefaultProjectSclVars)(name);
    projectSclVars.description = description;
    projectSclVars.version = version;
    projectSclVars.targets = targets;
    const projectSclContent = (0, templates_js_1.generateProjectScl)(projectSclVars);
    const projectSclPath = path.join(projectRoot, 'project.scl');
    fs.writeFileSync(projectSclPath, projectSclContent);
    filesCreated.push('project.scl');
    // 2. Create .speclangrc
    const speclangRcVars = (0, templates_js_1.getDefaultSpeclangRcVars)('.');
    const speclangRcContent = (0, templates_js_1.generateSpeclangRc)(speclangRcVars);
    const speclangRcPath = path.join(projectRoot, '.speclangrc');
    fs.writeFileSync(speclangRcPath, speclangRcContent);
    filesCreated.push('.speclangrc');
    // 3. Create .gitignore
    const gitignoreContent = (0, templates_js_1.generateGitignore)();
    const gitignorePath = path.join(projectRoot, '.gitignore');
    fs.writeFileSync(gitignorePath, gitignoreContent);
    filesCreated.push('.gitignore');
    // 4. Create initial spec file
    const initialSpec = (0, templates_js_1.generateInitialSpec)(name);
    const specPath = path.join(projectRoot, 'specs', `${sanitizeFileName(name)}.scl`);
    fs.writeFileSync(specPath, initialSpec);
    filesCreated.push(`specs/${sanitizeFileName(name)}.scl`);
    // 5. Create initial test spec
    const initialTest = (0, templates_js_1.generateInitialTestSpec)(name);
    const testPath = path.join(projectRoot, 'tests', `${sanitizeFileName(name)}.test.spec.scl`);
    fs.writeFileSync(testPath, initialTest);
    filesCreated.push(`tests/${sanitizeFileName(name)}.test.spec.scl`);
    return filesCreated;
}
/**
 * Initialize git repository if not already in one
 */
async function initializeGit(projectRoot, result) {
    const gitDir = path.join(projectRoot, '.git');
    if (fs.existsSync(gitDir)) {
        result.warnings.push('Git repository already exists');
        return;
    }
    // Check if we're inside a git repo
    const currentRoot = (0, config_js_1.findProjectRoot)();
    const parentGit = path.join(currentRoot || '', '.git');
    if (currentRoot && fs.existsSync(parentGit)) {
        result.warnings.push('Already in a git repository, skipping init');
        return;
    }
    try {
        (0, child_process_1.execSync)('git init', { cwd: projectRoot, stdio: 'ignore' });
        result.filesCreated.push('.git/');
    }
    catch (error) {
        result.warnings.push('Failed to initialize git repository');
    }
}
/**
 * Sanitize filename for spec/test files
 */
function sanitizeFileName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
/**
 * Format init result for console output
 */
function formatInitResult(result, jsonOutput = false) {
    if (jsonOutput) {
        return JSON.stringify({
            success: result.success,
            projectRoot: result.projectRoot,
            filesCreated: result.filesCreated,
            errors: result.errors,
            warnings: result.warnings
        }, null, 2);
    }
    const lines = [];
    if (result.success) {
        lines.push(`✅ Successfully initialized speclang project: ${result.projectRoot}`);
        lines.push('\nCreated files:');
        result.filesCreated.forEach(f => lines.push(`  - ${f}`));
        if (result.warnings.length > 0) {
            lines.push('\nWarnings:');
            result.warnings.forEach(w => lines.push(`  - ${w}`));
        }
        lines.push('\nNext steps:');
        lines.push(`  cd ${path.basename(result.projectRoot)}`);
        lines.push('  speclang validate');
    }
    else {
        lines.push('❌ Failed to initialize project');
        if (result.errors.length > 0) {
            lines.push('\nErrors:');
            result.errors.forEach(e => lines.push(`  - ${e}`));
        }
    }
    return lines.join('\n');
}
//# sourceMappingURL=init.js.map