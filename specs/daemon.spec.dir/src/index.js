"use strict";
/**
 * Speclang Daemon - TypeScript Implementation
 *
 * This module implements the daemon for file watching, event routing,
 * and convergence detection.
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
exports.getDaemon = exports.createDaemon = exports.Daemon = void 0;
exports.startDaemon = startDaemon;
__exportStar(require("./types"), exports);
__exportStar(require("./config"), exports);
__exportStar(require("./watcher"), exports);
__exportStar(require("./router"), exports);
__exportStar(require("./convergence"), exports);
__exportStar(require("./state"), exports);
__exportStar(require("./ipc"), exports);
__exportStar(require("./locks"), exports);
__exportStar(require("./deadlock"), exports);
__exportStar(require("./lock_client"), exports);
var daemon_1 = require("./daemon");
Object.defineProperty(exports, "Daemon", { enumerable: true, get: function () { return daemon_1.Daemon; } });
Object.defineProperty(exports, "createDaemon", { enumerable: true, get: function () { return daemon_1.createDaemon; } });
Object.defineProperty(exports, "getDaemon", { enumerable: true, get: function () { return daemon_1.getDaemon; } });
/**
 * Start the daemon with the given options
 * This is the main entry point for the CLI
 */
async function startDaemon(options) {
    const { Daemon } = await Promise.resolve().then(() => __importStar(require('./daemon')));
    const fs = await Promise.resolve().then(() => __importStar(require('fs')));
    const path = await Promise.resolve().then(() => __importStar(require('path')));
    const { projectDir, port, dashboard } = options;
    console.log('\n🚀 SpecLang Daemon Starting...\n');
    console.log(`   Project: ${projectDir}`);
    console.log(`   Port: ${port}`);
    // Create .speclang directory if needed
    const speclangDir = path.join(projectDir, '.speclang');
    if (!fs.existsSync(speclangDir)) {
        fs.mkdirSync(speclangDir, { recursive: true });
    }
    // Write PID file
    const pidFile = path.join(speclangDir, 'daemon.pid');
    fs.writeFileSync(pidFile, process.pid.toString());
    // Create and start daemon
    const daemon = new Daemon();
    // Handle graceful shutdown
    const shutdown = async () => {
        console.log('\n\n🛑 Shutting down...');
        await daemon.stop();
        fs.unlinkSync(pidFile);
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    // Start daemon
    await daemon.start();
    // Start dashboard if enabled
    if (dashboard) {
        const express = (await Promise.resolve().then(() => __importStar(require('express')))).default;
        const app = express();
        // Health check endpoint
        app.get('/health', (_req, res) => {
            res.json({ status: 'ok', pid: process.pid });
        });
        // Status endpoint
        app.get('/api/status', (_req, res) => {
            res.json(daemon.getStatus());
        });
        // Simple dashboard
        app.get('/', (_req, res) => {
            res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>SpecLang Dashboard</title>
          <style>
            body { font-family: system-ui; max-width: 800px; margin: 50px auto; padding: 20px; }
            .status { padding: 20px; background: #f5f5f5; border-radius: 8px; }
            .running { color: #22c55e; }
            pre { background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 4px; overflow: auto; }
          </style>
        </head>
        <body>
          <h1>🔮 SpecLang Dashboard</h1>
          <div class="status">
            <h2 class="running">● Running</h2>
            <p>PID: ${process.pid}</p>
            <p>Project: ${projectDir}</p>
          </div>
          <h2>Status</h2>
          <pre id="status">Loading...</pre>
          <script>
            setInterval(async () => {
              const res = await fetch('/api/status');
              const data = await res.json();
              document.getElementById('status').textContent = JSON.stringify(data, null, 2);
            }, 1000);
          </script>
        </body>
        </html>
      `);
        });
        app.listen(port, () => {
            console.log(`\n📊 Dashboard: http://localhost:${port}\n`);
        });
    }
    console.log('\n✅ SpecLang Daemon Started');
    console.log('   Press Ctrl+C to stop\n');
    // Keep process alive
    return new Promise(() => { }); // Never resolves, keeps process running
}
//# sourceMappingURL=index.js.map