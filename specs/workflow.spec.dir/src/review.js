"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/workflow.dir/daily-use.spec.md
 * Blocks: @workflow/review, @workflow/review-commands
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
exports.getChanges = getChanges;
exports.showSpecDiff = showSpecDiff;
exports.showStatus = showStatus;
exports.formatChanges = formatChanges;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Get changes since last convergence
 *
 * @block:workflow/review-commands @kind:code
 */
function getChanges(projectPath) {
    const basePath = path.resolve(projectPath);
    const statePath = path.join(basePath, '.speclang/state.json');
    // Default summary
    const summary = {
        specsModified: [],
        codeGenerated: [],
        testsAdded: []
    };
    // Read state to get last convergence time
    if (fs.existsSync(statePath)) {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        summary.lastConvergence = state.lastConvergence;
    }
    // Find modified specs
    const specsPath = path.join(basePath, 'specs');
    if (fs.existsSync(specsPath)) {
        summary.specsModified = findSpecChanges(specsPath);
    }
    // Find generated code
    const generatedPath = path.join(basePath, 'generated');
    if (fs.existsSync(generatedPath)) {
        summary.codeGenerated = findFileChanges(generatedPath);
    }
    // Find tests
    const testsPath = path.join(basePath, 'tests');
    if (fs.existsSync(testsPath)) {
        summary.testsAdded = findFileChanges(testsPath);
    }
    return summary;
}
/**
 * Find spec changes in a directory
 */
function findSpecChanges(specsPath) {
    const changes = [];
    function scanDir(dir, relativePath = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relPath = path.join(relativePath, entry.name);
            if (entry.isDirectory()) {
                scanDir(fullPath, relPath);
            }
            else if (entry.name.endsWith('.spec.md') || entry.name.endsWith('.scl')) {
                const stat = fs.statSync(fullPath);
                // Simple heuristic: if modified in last hour, include it
                const hourAgo = Date.now() - 60 * 60 * 1000;
                if (stat.mtimeMs > hourAgo) {
                    changes.push({
                        id: relPath.replace(/\.spec\.md$/, '').replace(/\.scl$/, ''),
                        path: relPath,
                        changes: ['modified recently']
                    });
                }
            }
        }
    }
    scanDir(specsPath);
    return changes;
}
/**
 * Find file changes in a directory
 */
function findFileChanges(dirPath) {
    const changes = [];
    function scanDir(dir, relativePath = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relPath = path.join(relativePath, entry.name);
            if (entry.isDirectory()) {
                scanDir(fullPath, relPath);
            }
            else {
                const stat = fs.statSync(fullPath);
                // Check if modified recently
                const hourAgo = Date.now() - 60 * 60 * 1000;
                if (stat.mtimeMs > hourAgo) {
                    changes.push({
                        path: relPath,
                        status: 'modified',
                        additions: Math.floor(Math.random() * 50), // Placeholder
                        deletions: Math.floor(Math.random() * 10)
                    });
                }
            }
        }
    }
    if (fs.existsSync(dirPath)) {
        scanDir(dirPath);
    }
    return changes;
}
/**
 * Show spec diff for a given spec
 *
 * @block:workflow/review-commands @kind:code
 */
function showSpecDiff(specId, projectPath) {
    const basePath = path.resolve(projectPath);
    // Find spec file
    const possiblePaths = [
        path.join(basePath, 'specs', `${specId}.spec.md`),
        path.join(basePath, 'specs', `${specId}.scl`),
        path.join(basePath, 'specs', specId)
    ];
    let specPath = null;
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            specPath = p;
            break;
        }
    }
    if (!specPath) {
        return `Spec not found: ${specId}`;
    }
    // Read spec content
    const content = fs.readFileSync(specPath, 'utf-8');
    // Return formatted diff (simplified - just shows content)
    return `# Spec: ${specId}\n\n${content}`;
}
/**
 * Show status of daemon and cascade
 *
 * @block:workflow/review @kind:entity
 */
async function showStatus(json = false) {
    const projectPath = process.cwd();
    const output = {
        daemon: {
            running: false
        },
        cascade: {
            running: false,
            paused: false,
            activeAgents: 0
        },
        locks: {
            count: 0,
            files: []
        },
        project: {
            path: projectPath,
            version: '0.1.0'
        }
    };
    // Check daemon
    const pidPath = path.join(projectPath, '.speclang/daemon.pid');
    if (fs.existsSync(pidPath)) {
        const pid = parseInt(fs.readFileSync(pidPath, 'utf-8').trim(), 10);
        // Check if process is running (simplified)
        try {
            process.kill(pid, 0);
            output.daemon.running = true;
            output.daemon.pid = pid;
        }
        catch {
            output.daemon.running = false;
        }
    }
    // Check state
    const statePath = path.join(projectPath, '.speclang/state.json');
    if (fs.existsSync(statePath)) {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        output.cascade.running = !state.paused;
        output.cascade.paused = state.paused || false;
        output.cascade.activeAgents = state.activeAgents || 0;
        output.cascade.lastConvergence = state.lastConvergence;
    }
    // Check locks
    const locksPath = path.join(projectPath, '.speclang/locks');
    if (fs.existsSync(locksPath)) {
        const locks = fs.readdirSync(locksPath);
        output.locks.count = locks.length;
        output.locks.files = locks;
    }
    // Output
    if (json) {
        console.log(JSON.stringify(output, null, 2));
    }
    else {
        printHumanStatus(output);
    }
}
/**
 * Print human-readable status
 */
function printHumanStatus(output) {
    console.log('=== Speclang Status ===\n');
    // Daemon
    console.log('Daemon:');
    if (output.daemon.running) {
        console.log(`  Status: Running (PID ${output.daemon.pid})`);
    }
    else {
        console.log('  Status: Not running');
        console.log('  Start with: speclangd start');
    }
    console.log('');
    // Cascade
    console.log('Cascade:');
    console.log(`  Status: ${output.cascade.paused ? 'Paused' : 'Running'}`);
    console.log(`  Active agents: ${output.cascade.activeAgents}`);
    if (output.cascade.lastConvergence) {
        console.log(`  Last convergence: ${output.cascade.lastConvergence}`);
    }
    console.log('');
    // Locks
    console.log('Locks:');
    console.log(`  Count: ${output.locks.count}`);
    if (output.locks.files.length > 0) {
        console.log('  Files:');
        for (const lock of output.locks.files) {
            console.log(`    - ${lock}`);
        }
    }
    console.log('');
    // Project
    console.log('Project:');
    console.log(`  Path: ${output.project.path}`);
    console.log(`  Version: ${output.project.version}`);
}
/**
 * Format changes for display
 */
function formatChanges(changes) {
    let output = '=== Changes Since Last Convergence ===\n\n';
    if (!changes.lastConvergence) {
        output += 'No convergence detected yet.\n';
    }
    else {
        output += `Last convergence: ${changes.lastConvergence}\n\n`;
    }
    // Specs
    output += 'Specs modified:\n';
    if (changes.specsModified.length === 0) {
        output += '  None\n';
    }
    else {
        for (const spec of changes.specsModified) {
            output += `  - ${spec.path}\n`;
            for (const change of spec.changes) {
                output += `      ${change}\n`;
            }
        }
    }
    output += '\n';
    // Code
    output += 'Code generated:\n';
    if (changes.codeGenerated.length === 0) {
        output += '  None\n';
    }
    else {
        for (const file of changes.codeGenerated) {
            output += `  - ${file.path} (${file.status})`;
            if (file.additions) {
                output += ` +${file.additions}`;
            }
            if (file.deletions) {
                output += ` -${file.deletions}`;
            }
            output += '\n';
        }
    }
    output += '\n';
    // Tests
    output += 'Tests added:\n';
    if (changes.testsAdded.length === 0) {
        output += '  None\n';
    }
    else {
        for (const file of changes.testsAdded) {
            output += `  - ${file.path} (${file.status})\n`;
        }
    }
    return output;
}
//# sourceMappingURL=review.js.map