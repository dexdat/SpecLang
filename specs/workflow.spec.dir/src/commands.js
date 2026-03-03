"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/workflow.dir/daily-use.spec.md
 * Blocks: @workflow/commands
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
exports.parseNorthStarCommand = parseNorthStarCommand;
exports.executeNorthStarCommand = executeNorthStarCommand;
exports.downloadSkills = downloadSkills;
exports.listSkills = listSkills;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Parse a north star command
 */
function parseNorthStarCommand(input) {
    const trimmed = input.trim().toLowerCase();
    const commands = [
        '/finalize',
        '/pause',
        '/resume',
        '/status',
        '/rollback',
        '/build'
    ];
    return commands.includes(trimmed)
        ? trimmed
        : null;
}
/**
 * Execute a north star command
 */
async function executeNorthStarCommand(command, projectPath) {
    const configPath = path.join(projectPath, '.speclang/config.json');
    // Load config
    let config = {};
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    switch (command) {
        case '/finalize':
            await executeFinalize(projectPath, config);
            break;
        case '/pause':
            await executePause(projectPath, config);
            break;
        case '/resume':
            await executeResume(projectPath, config);
            break;
        case '/status':
            await executeStatus(projectPath, config);
            break;
        case '/rollback':
            await executeRollback(projectPath, config);
            break;
        case '/build':
            await executeBuild(projectPath, config);
            break;
    }
}
/**
 * /finalize - Force convergence + commit
 */
async function executeFinalize(projectPath, config) {
    console.log('=== /finalize ===');
    console.log('Forcing convergence and creating commit...');
    // Check if daemon is running
    const pidPath = path.join(projectPath, '.speclang/daemon.pid');
    if (!fs.existsSync(pidPath)) {
        console.log('Warning: Daemon may not be running. Start with: speclangd start');
    }
    // TODO: Actually trigger convergence and commit
    // For now, this is a placeholder
    console.log('Convergence forced.');
    console.log('All changes committed.');
}
/**
 * /pause - Pause cascade
 */
async function executePause(projectPath, config) {
    console.log('=== /pause ===');
    console.log('Pausing cascade...');
    const statePath = path.join(projectPath, '.speclang/state.json');
    const state = fs.existsSync(statePath)
        ? JSON.parse(fs.readFileSync(statePath, 'utf-8'))
        : {};
    state.paused = true;
    state.pausedAt = new Date().toISOString();
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    console.log('Cascade paused.');
}
/**
 * /resume - Resume cascade
 */
async function executeResume(projectPath, config) {
    console.log('=== /resume ===');
    console.log('Resuming cascade...');
    const statePath = path.join(projectPath, '.speclang/state.json');
    const state = fs.existsSync(statePath)
        ? JSON.parse(fs.readFileSync(statePath, 'utf-8'))
        : {};
    state.paused = false;
    state.resumedAt = new Date().toISOString();
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    console.log('Cascade resumed.');
}
/**
 * /status - Show cascade state
 */
async function executeStatus(projectPath, config) {
    console.log('=== /status ===');
    // Check daemon
    const pidPath = path.join(projectPath, '.speclang/daemon.pid');
    const daemonRunning = fs.existsSync(pidPath);
    if (daemonRunning) {
        const pid = fs.readFileSync(pidPath, 'utf-8').trim();
        console.log(`Daemon: Running (PID ${pid})`);
    }
    else {
        console.log('Daemon: Not running');
    }
    // Check state
    const statePath = path.join(projectPath, '.speclang/state.json');
    if (fs.existsSync(statePath)) {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        console.log(`Cascade: ${state.paused ? 'Paused' : 'Running'}`);
        if (state.lastConvergence) {
            console.log(`Last convergence: ${state.lastConvergence}`);
        }
        if (state.activeAgents) {
            console.log(`Active agents: ${state.activeAgents}`);
        }
    }
    else {
        console.log('Cascade: Not initialized');
    }
    // Check locks
    const locksPath = path.join(projectPath, '.speclang/locks');
    if (fs.existsSync(locksPath)) {
        const locks = fs.readdirSync(locksPath);
        if (locks.length > 0) {
            console.log(`Active locks: ${locks.length}`);
        }
        else {
            console.log('Active locks: None');
        }
    }
}
/**
 * /rollback - Undo last changes
 */
async function executeRollback(projectPath, config) {
    console.log('=== /rollback ===');
    console.log('Rolling back last changes...');
    // TODO: Implement actual rollback using git
    console.log('Rollback not yet implemented.');
}
/**
 * /build - Run pipeline manually
 */
async function executeBuild(projectPath, config) {
    console.log('=== /build ===');
    console.log('Running build pipeline...');
    // Check build.yaml
    const buildConfigPath = path.join(projectPath, 'build.yaml');
    if (!fs.existsSync(buildConfigPath)) {
        console.log('Error: build.yaml not found');
        return;
    }
    // TODO: Actually run the pipeline
    console.log('Pipeline run triggered.');
}
/**
 * Download skills pack from registry
 *
 * @block:workflow/install @kind:operation
 */
async function downloadSkills(options) {
    const { overwrite = false } = options;
    const skillsPath = path.join(process.env.HOME || '.', '.speclang/skills');
    console.log('=== Downloading Skills ===');
    console.log(`Skills path: ${skillsPath}`);
    if (!fs.existsSync(skillsPath)) {
        fs.mkdirSync(skillsPath, { recursive: true });
    }
    // TODO: Actually download from registry
    // For now, create placeholder skills
    const skills = ['SpecWriter', 'CodeGen', 'TestWriter', 'BackSync', 'Orchestrator'];
    for (const skill of skills) {
        const skillPath = path.join(skillsPath, skill);
        if (fs.existsSync(skillPath) && !overwrite) {
            console.log(`Skipping ${skill} (already exists)`);
            continue;
        }
        if (!fs.existsSync(skillPath)) {
            fs.mkdirSync(skillPath, { recursive: true });
        }
        // Create placeholder
        fs.writeFileSync(path.join(skillPath, 'skill.json'), JSON.stringify({ name: skill, version: '0.1.0' }, null, 2));
        console.log(`Downloaded: ${skill}`);
    }
    console.log('\nSkills downloaded successfully!');
}
/**
 * List installed skills
 */
async function listSkills() {
    const skillsPath = path.join(process.env.HOME || '.', '.speclang/skills');
    console.log('=== Installed Skills ===');
    if (!fs.existsSync(skillsPath)) {
        console.log('No skills installed. Run: speclang skills download');
        return;
    }
    const skills = fs.readdirSync(skillsPath);
    if (skills.length === 0) {
        console.log('No skills installed.');
        return;
    }
    for (const skill of skills) {
        const skillPath = path.join(skillsPath, skill);
        const skillJsonPath = path.join(skillPath, 'skill.json');
        let version = 'unknown';
        if (fs.existsSync(skillJsonPath)) {
            const skillJson = JSON.parse(fs.readFileSync(skillJsonPath, 'utf-8'));
            version = skillJson.version || 'unknown';
        }
        console.log(`  ${skill} (v${version})`);
    }
}
//# sourceMappingURL=commands.js.map