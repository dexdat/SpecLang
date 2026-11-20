/**
 * Speclang Daemon - TypeScript Implementation
 * 
 * This module implements the daemon for file watching, event routing, 
 * and convergence detection.
 * 
 * Generated from: @speclang/daemon
 */

import { listenDashboard, probeDashboard, type DashboardBinding } from './dashboard';

export * from './types';
export * from './config';
export * from './watcher';
export * from './router';
export * from './convergence';
export * from './state';
export * from './ipc';
export * from './locks';
export * from './deadlock';
export * from './lock_client';
export * from './session-store';
export { configureDaemonCommand } from './daemon-cli';
export { Daemon, createDaemon, getDaemon } from './daemon';
export {
  listenDashboard,
  probeDashboard,
  type DashboardBinding,
  type DashboardProbeResult,
} from './dashboard';

/**
 * Start the daemon with the given options
 * This is the main entry point for the CLI
 */
export async function startDaemon(options: {
  projectDir: string;
  port: number;
  dashboard: boolean;
}): Promise<void> {
  const { Daemon } = await import('./daemon.js');
  const fs = await import('fs');
  const path = await import('path');
  
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
  
  // Handle graceful shutdown (idempotent: SIGINT+SIGTERM or a repeated signal
  // must not run stop()/unlink twice).
  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('\n\n🛑 Shutting down...');
    try {
      await daemon.stop();
    } finally {
      // DF-SPECLANG-6: `speclang stop` unlinks this same pid file right after
      // sending SIGTERM, so whoever unlinks second must not throw ENOENT.
      try {
        fs.unlinkSync(pidFile);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      }
    }
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // DF-SPECLANG-022: every early-exit path must release the daemon and the PID
  // file, otherwise `status` keeps reporting a daemon that is already gone.
  // The dashboard is bound before `daemon.start()`, so most aborts happen with
  // the daemon not running at all — stop() must only be called once it has.
  let daemonStarted = false;
  const abortStart = async () => {
    if (daemonStarted) {
      try {
        await daemon.stop();
      } catch (err) {
        console.error('[Daemon] stop during abort failed:', err);
      }
      daemonStarted = false;
    }
    try {
      fs.unlinkSync(pidFile);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  };

  // DF-SPECLANG-022: bind and verify the dashboard BEFORE the watcher starts, so
  // an occupied port fails fast and never leaves a half-started daemon (or a
  // banner) behind. `dashboardPort` is only set once the announced endpoint is
  // proven to be this process.
  let dashboardPort: number | null = null;

  // Start dashboard if enabled
  if (dashboard) {
    const express = (await import('express')).default;
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
    
    // DF-SPECLANG-022: await the bind. `app.listen(port, cb)` used to swallow
    // EADDRINUSE, so the daemon printed "Started" and a dashboard URL while the
    // port belonged to somebody else.
    let binding: DashboardBinding;
    try {
      binding = await listenDashboard(app, port);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      await abortStart();
      console.error(
        `\n❌ Dashboard port ${port} could not be bound (${code || 'error'}: ${(err as Error).message})`,
      );
      if (code === 'EADDRINUSE') {
        console.error(`   Port ${port} is already in use by another process (EADDRINUSE).`);
      }
      console.error('   Refusing to announce a dashboard this process does not serve.');
      process.exit(1);
    }

    // A successful bind is not proof the ANNOUNCED url reaches us: on Linux a
    // wildcard bind can succeed while another process holds 127.0.0.1:<port>,
    // so ask the announced endpoint who it is before printing anything.
    const announcePort = binding.port;
    const probe = await probeDashboard(announcePort);
    if (!probe.ok) {
      await abortStart();
      console.error(
        `\n❌ Dashboard port ${announcePort} is already in use by another process (EADDRINUSE)`,
      );
      console.error(`   ${probe.detail}`);
      console.error('   Refusing to announce a dashboard this process does not serve.');
      process.exit(1);
    }

    dashboardPort = announcePort;
  }

  // Start daemon
  try {
    await daemon.start();
  } catch (err) {
    await abortStart();
    console.error(`\n❌ Daemon failed to start: ${(err as Error).message}`);
    process.exit(1);
  }
  daemonStarted = true;

  if (dashboardPort !== null) {
    console.log(`\n📊 Dashboard: http://localhost:${dashboardPort}`);
  }

  console.log('\n✅ SpecLang Daemon Started');
  console.log('   Press Ctrl+C to stop');
  // DF-SPECLANG-022: `start` runs the watcher (+ dashboard); it does not start
  // the MCP server, which is `speclang mcp start`. Say so instead of letting
  // `mcp status` contradict the banner.
  console.log('   MCP: not started — run `speclang mcp start` for the MCP server\n');
  
  // Keep process alive
  return new Promise(() => {}); // Never resolves, keeps process running
}
