"use strict";
/**
 * Daemon CLI commands
 *
 * Generated from: @speclang/daemon
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
exports.daemonStartCommand = daemonStartCommand;
exports.daemonStopCommand = daemonStopCommand;
exports.daemonStatusCommand = daemonStatusCommand;
exports.configureDaemonCommand = configureDaemonCommand;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
/**
 * Start the daemon
 */
async function daemonStartCommand(options) {
    const projectDir = options.projectDir || process.cwd();
    const port = options.port || 3000;
    console.log('\n🚀 Starting SpecLang Daemon...\n');
    console.log(`   Project: ${projectDir}`);
    console.log(`   Port: ${port}`);
    // Check if already running
    const pidFile = path.join(projectDir, '.speclang', 'daemon.pid');
    if (await fs.pathExists(pidFile)) {
        const pid = parseInt(await fs.readFile(pidFile, 'utf-8'));
        try {
            process.kill(pid, 0);
            console.error(`\n❌ Daemon already running (PID: ${pid})`);
            console.error(`   Use 'speclang daemon stop' to stop it first\n`);
            process.exit(1);
        }
        catch {
            // Process not running, remove stale PID file
            await fs.remove(pidFile);
        }
    }
    // Dynamic import to avoid issues
    const { startDaemon } = await import('./index.js');
    await startDaemon({ projectDir, port, dashboard: options.dashboard ?? false });
}
/**
 * Stop the daemon
 */
async function daemonStopCommand(options) {
    const projectDir = process.cwd();
    const pidFile = path.join(projectDir, '.speclang', 'daemon.pid');
    let pid;
    if (options.pid) {
        pid = options.pid;
    }
    else if (await fs.pathExists(pidFile)) {
        pid = parseInt(await fs.readFile(pidFile, 'utf-8'));
    }
    if (!pid) {
        console.log('\n⚠️  Daemon not running\n');
        return;
    }
    try {
        process.kill(pid, 'SIGTERM');
        console.log(`\n✅ Sent stop signal to daemon (PID: ${pid})\n`);
        // Wait for process to stop
        let attempts = 0;
        while (attempts < 10) {
            try {
                process.kill(pid, 0);
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
            catch {
                // Process stopped
                await fs.remove(pidFile);
                console.log('✅ Daemon stopped\n');
                return;
            }
        }
        // Force kill if still running
        try {
            process.kill(pid, 'SIGKILL');
            await fs.remove(pidFile);
            console.log('✅ Daemon force stopped\n');
        }
        catch {
            console.log('⚠️  Could not force stop daemon\n');
        }
    }
    catch (error) {
        console.error(`\n❌ Failed to stop daemon: ${error}\n`);
        process.exit(1);
    }
}
/**
 * Get daemon status
 */
async function daemonStatusCommand(options) {
    const projectDir = process.cwd();
    const pidFile = path.join(projectDir, '.speclang', 'daemon.pid');
    const stateFile = path.join(projectDir, '.speclang', 'daemon-state.json');
    // Check if running
    let isRunning = false;
    let pid;
    if (await fs.pathExists(pidFile)) {
        pid = parseInt(await fs.readFile(pidFile, 'utf-8'));
        try {
            process.kill(pid, 0);
            isRunning = true;
        }
        catch {
            // Process not running, stale PID file
            await fs.remove(pidFile);
        }
    }
    if (!isRunning) {
        if (options.json) {
            console.log(JSON.stringify({ running: false, pid: null, status: 'stopped' }));
        }
        else {
            console.log('\n🔴 Daemon: Stopped\n');
        }
        return;
    }
    // Get state
    let state = null;
    if (await fs.pathExists(stateFile)) {
        try {
            state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
        }
        catch {
            // Ignore state read errors
        }
    }
    if (options.json) {
        console.log(JSON.stringify({
            running: true,
            pid,
            status: state?.status || 'unknown',
            cascadeDepth: state?.cascadeDepth || 0,
            filesChanged: (state?.filesChanged?.length) || 0,
            startedAt: state?.startedAt || null
        }));
    }
    else {
        console.log('\n🟢 Daemon: Running');
        console.log(`   PID: ${pid}`);
        console.log(`   Status: ${state?.status || 'unknown'}`);
        console.log(`   Cascade Depth: ${state?.cascadeDepth || 0}`);
        console.log(`   Files Changed: ${(state?.filesChanged?.length) || 0}`);
        console.log('');
    }
}
/**
 * Configure daemon command
 */
function configureDaemonCommand(program) {
    const daemon = program
        .command('daemon')
        .description('Manage SpecLang daemon');
    daemon
        .command('start')
        .description('Start the daemon')
        .option('-p, --project-dir <dir>', 'Project directory', process.cwd())
        .option('--port <n>', 'Port for dashboard', (val) => parseInt(val, 10), 3000)
        .option('--dashboard', 'Enable dashboard')
        .option('-f, --foreground', 'Run in foreground')
        .action(async (options) => {
        await daemonStartCommand(options);
    });
    daemon
        .command('stop')
        .description('Stop the daemon')
        .option('--pid <n>', 'PID to stop', (val) => parseInt(val, 10))
        .action(async (options) => {
        await daemonStopCommand(options);
    });
    daemon
        .command('status')
        .description('Show daemon status')
        .option('--json', 'JSON output')
        .action(async (options) => {
        await daemonStatusCommand(options);
    });
    daemon
        .command('restart')
        .description('Restart the daemon')
        .action(async () => {
        await daemonStopCommand({});
        await daemonStartCommand({});
    });
}
//# sourceMappingURL=daemon-cli.js.map