/**
 * Speclang Daemon - TypeScript Implementation
 * 
 * This module implements the daemon for file watching, event routing, 
 * and convergence detection.
 * 
 * Generated from: @speclang/daemon
 */

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
export { Daemon, createDaemon, getDaemon } from './daemon';

/**
 * Start the daemon with the given options
 * This is the main entry point for the CLI
 */
export async function startDaemon(options: {
  projectDir: string;
  port: number;
  dashboard: boolean;
}): Promise<void> {
  const { Daemon } = await import('./daemon');
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
    
    app.listen(port, () => {
      console.log(`\n📊 Dashboard: http://localhost:${port}\n`);
    });
  }
  
  console.log('\n✅ SpecLang Daemon Started');
  console.log('   Press Ctrl+C to stop\n');
  
  // Keep process alive
  return new Promise(() => {}); // Never resolves, keeps process running
}
