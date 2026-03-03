"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/workflow.dir/setup.spec.md
 * Blocks: @workflow/start, @workflow/init-creates
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
exports.validateProject = validateProject;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Default project structure content
 */
const defaultFiles = {
    'project.scl': `# speclang-header lines:8
id: @northstar
version: 0.1.0
layer: 0
project_level: Alpha
agent_support: agent_assisted
short: Project North Star
---

# North Star

Write your project vision here. Examples:
- "Build a Go REST API for a todo app with auth"
- "Create a TypeScript web app with React"
- "Add rate limiting to the API"

The cascade will expand this into specs and generate code.

## Commands (type in this file)
- /finalize → force convergence + commit
- /pause → pause cascade
- /resume → resume cascade
- /status → show cascade state
- /rollback → undo last changes
- /build → run pipeline manually
`,
    '.speclangrc': `{
  "version": "0.1.0",
  "mode": "light",
  "cascade": {
    "quietTimeout": 30,
    "maxDepth": 10
  },
  "daemon": {
    "enabled": true,
    "autoStart": true
  }
}
`,
    'build.yaml': `# Build pipeline configuration
version: "0.1.0"

stages:
  - name: validate
    enabled: true
  - name: generate
    enabled: true
  - name: test
    enabled: true
  - name: build
    enabled: false

defaults:
  testFramework: vitest
  outputDir: generated
`,
    '.gitignore': `# Dependencies
node_modules/
venv/
.env

# Generated code
generated/
*.generated.*

# Build outputs
dist/
build/
*.bundle.js

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Speclang
.speclang/*.lock
.speclang/*.pid
`
};
/**
 * Create directory structure
 */
function createStructure(basePath, files, dryRun) {
    for (const [filePath, content] of Object.entries(files)) {
        const fullPath = path.join(basePath, filePath);
        const dir = path.dirname(fullPath);
        if (dryRun) {
            console.log(`[DRY-RUN] Would create: ${filePath}`);
            continue;
        }
        // Create directory if needed
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // Create file with content
        fs.writeFileSync(fullPath, content);
        console.log(`Created: ${filePath}`);
    }
}
/**
 * Create .speclang directory structure
 */
function createSpeclangDir(basePath, dryRun) {
    const configPath = path.join(basePath, '.speclang/config.json');
    const locksPath = path.join(basePath, '.speclang/locks');
    if (dryRun) {
        console.log('[DRY-RUN] Would create: .speclang/config.json');
        console.log('[DRY-RUN] Would create: .speclang/locks/');
        return;
    }
    // Create .speclang directory
    if (!fs.existsSync(path.join(basePath, '.speclang'))) {
        fs.mkdirSync(path.join(basePath, '.speclang'), { recursive: true });
    }
    // Create config
    const config = {
        projectId: path.basename(basePath),
        initializedAt: new Date().toISOString(),
        version: '0.1.0',
        locks: {}
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    // Create locks directory
    if (!fs.existsSync(locksPath)) {
        fs.mkdirSync(locksPath, { recursive: true });
    }
    console.log('Created: .speclang/config.json');
    console.log('Created: .speclang/locks/');
}
/**
 * Initialize a new Speclang project
 *
 * @block:workflow/start @kind:operation
 */
async function initProject(options) {
    const { mode, dryRun, path: projectPath } = options;
    console.log(`\n=== Speclang Project Initialization ===`);
    console.log(`Mode: ${mode}`);
    console.log(`Path: ${projectPath}`);
    console.log(`Dry run: ${dryRun}`);
    console.log('');
    // Resolve absolute path
    const basePath = path.resolve(projectPath);
    // Check if directory exists
    if (!fs.existsSync(basePath)) {
        if (dryRun) {
            console.log(`[DRY-RUN] Would create directory: ${basePath}`);
        }
        else {
            fs.mkdirSync(basePath, { recursive: true });
            console.log(`Created directory: ${basePath}`);
        }
    }
    // Check if already initialized
    const existingFiles = ['project.scl', '.speclangrc', 'build.yaml'];
    const alreadyInitialized = existingFiles.some(f => fs.existsSync(path.join(basePath, f)));
    if (alreadyInitialized && !dryRun) {
        console.log('Warning: Project already initialized.');
        console.log('Files may be overwritten. Use --overwrite to force.');
        return;
    }
    // Create project files based on mode
    const files = { ...defaultFiles };
    if (mode === 'enterprise') {
        // Enterprise mode adds more configuration
        files['.speclangrc'] = `{
  "version": "0.1.0",
  "mode": "enterprise",
  "cascade": {
    "quietTimeout": 30,
    "maxDepth": 10,
    "parallelAgents": 4
  },
  "daemon": {
    "enabled": true,
    "autoStart": true,
    "port": 3142
  },
  "pipeline": {
    "stages": ["validate", "generate", "test", "build", "deploy"]
  },
  "enterprise": {
    "teamMode": true,
    "gitWorkflow": "pr"
  }
}`;
    }
    // Create main files
    createStructure(basePath, files, dryRun);
    // Create speclang directory
    createSpeclangDir(basePath, dryRun);
    console.log('');
    console.log('=== Initialization Complete ===');
    console.log('');
    console.log('Next steps:');
    console.log('  1. cd ' + projectPath);
    console.log('  2. speclangd start  (to start the daemon)');
    console.log('  3. speclang status (to check status)');
    console.log('  4. Open your AI editor with Speclang skills');
    console.log('  5. Start building!');
}
/**
 * Validate project structure
 */
function validateProject(projectPath) {
    const issues = [];
    const basePath = path.resolve(projectPath);
    const requiredFiles = [
        'project.scl',
        '.speclangrc',
        'build.yaml'
    ];
    const requiredDirs = [
        'specs',
        'tests',
        'generated',
        '.speclang'
    ];
    for (const file of requiredFiles) {
        if (!fs.existsSync(path.join(basePath, file))) {
            issues.push(`Missing file: ${file}`);
        }
    }
    for (const dir of requiredDirs) {
        if (!fs.existsSync(path.join(basePath, dir))) {
            issues.push(`Missing directory: ${dir}`);
        }
    }
    return {
        valid: issues.length === 0,
        issues
    };
}
//# sourceMappingURL=setup.js.map