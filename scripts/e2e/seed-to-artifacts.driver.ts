// The standing seed test driver: ONE seed file -> daemon + coordinator -> every
// artifact generated. Invoked by scripts/e2e/seed-to-artifacts.sh.
//
// Run: npx tsx scripts/e2e/seed-to-artifacts.driver.ts /path/to/project/
import { Daemon } from '../../src/daemon/daemon.js';
import { CascadeCoordinator } from '../../src/cascade/coordinator/index.js';

const watchPath = process.argv[2] || '.';

async function main() {
  const daemon: any = new Daemon(watchPath);
  const coordinator: any = new CascadeCoordinator(daemon as any, { verbose: true });

  daemon.on('task', (t: any) => {
    console.log(`[${new Date().toISOString()}] [daemon] TASK ROUTED: ${JSON.stringify(t).slice(0, 200)}`);
  });
  daemon.on('error', (e: any) => console.error('[daemon] error:', e));

  // Routed tasks dispatch real agent sessions (DF-SPECLANG-015).
  coordinator.watchDaemon(daemon, { verbose: true });

  await daemon.start();
  console.log(`[main] SEED TEST running on ${watchPath} — pid ${process.pid}`);
}

main().catch(err => {
  console.error('[main] fatal:', err);
  process.exit(1);
});
