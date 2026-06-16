/**
 * Integration test: Start daemon, touch files, observe events
 * Run: npx tsx .speclang/test-daemon-integration.ts
 */
import { SpeclangDaemon, FileChangeEvent, ConvergenceEvent } from './daemon.spec.ts';
import * as fs from 'fs/promises';
import * as path from 'path';

const TEST_SPEC_DIR = path.join(__dirname, 'tmp-int-specs');

async function main() {
  console.log('=== Daemon Integration Test ===\n');

  // Create test specs directory with a spec file
  await fs.mkdir(TEST_SPEC_DIR, { recursive: true });
  
  const testSpec = `---
id: "test-integration"
version: 1.0.0
depends_on:
  - "@ref:other-spec"
status: draft
---
# Integration Test Spec
`;
  await fs.writeFile(path.join(TEST_SPEC_DIR, 'integration.spec.md'), testSpec, 'utf-8');
  await fs.writeFile(path.join(TEST_SPEC_DIR, 'other.spec.md'), '---\nid: "other-spec"\nversion: 1.0.0\n---\n', 'utf-8');

  const daemon = new SpeclangDaemon(TEST_SPEC_DIR, 500); // 500ms quiet period

  daemon.on('started', () => {
    console.log('[test] Daemon started');
  });

  daemon.on('file_change', (e: FileChangeEvent) => {
    console.log(`[test] File change: ${e.kind} ${path.basename(e.path)} (${e.dependentSpecs.length} dependents)`);
  });

  daemon.on('convergence', (e: ConvergenceEvent) => {
    console.log(`[test] Convergence: ${e.queueDepth} items`);
  });

  console.log('Starting daemon...');
  // Override indexExistingSpecs to avoid fast-glob complexity in CI
  await daemon.start();
  
  // Wait for initial indexing
  await new Promise(r => setTimeout(r, 1000));
  console.log(`Graph size: ${daemon.getGraphSize()}`);

  // Touch a spec file to trigger a change
  console.log('\nTouching integration.spec.md...');
  const specPath = path.join(TEST_SPEC_DIR, 'integration.spec.md');
  const content = await fs.readFile(specPath, 'utf-8');
  await fs.writeFile(specPath, content, 'utf-8'); // re-write to trigger chokidar
  
  // Wait for events
  await new Promise(r => setTimeout(r, 1500));
  
  console.log('\nCreating new spec file...');
  await fs.writeFile(path.join(TEST_SPEC_DIR, 'new.spec.md'), '---\nid: "new-spec"\nversion: 1.0.0\ndepends_on:\n  - "@ref:test-integration"\n---\n# New\n', 'utf-8');
  
  // Wait for events + convergence
  await new Promise(r => setTimeout(r, 1500));

  daemon.stop();
  console.log('\n[test] Daemon stopped');

  // Cleanup
  await fs.rm(TEST_SPEC_DIR, { recursive: true, force: true });
  console.log('=== Integration test complete ===');
}

main().catch(err => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
