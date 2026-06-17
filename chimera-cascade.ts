// Chimera cascade runner — wires CascadeRouter to daemon
// Run: npx tsx chimera-cascade.ts (from SpecLang dir)
import { SpeclangDaemon } from '/home/kara/SpecLang/.speclang/daemon.spec';
import { CascadeRouter } from '/home/kara/SpecLang/.speclang/cascade-router.spec';

const watchPath = '/home/kara/chimera/specs/';

async function main() {
  const daemon = new SpeclangDaemon(watchPath);
  const router = new CascadeRouter(daemon);

  router.on('cascade', (event: any) => {
    console.log('[cascade]', event.type, event.specPath || '');
  });

  daemon.on('file_change', (e: any) => {
    console.log('[daemon] change:', e.path, 'dependents:', e.dependentSpecs?.length || 0);
  });

  daemon.on('error', (e: any) => console.error('[daemon] error:', e));

  await daemon.start();
  console.log(`[main] cascade wired on ${watchPath}`);
}

main().catch(err => {
  console.error('[main] fatal:', err);
  process.exit(1);
});
