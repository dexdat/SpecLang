/**
 * Integration wiring test: Daemon + CascadeRouter end-to-end
 * Verifies: file change → squash → throttle → model resolution flow
 * Run: npx tsx .speclang/test-integration.ts
 */
import { SpeclangDaemon, FileChangeEvent, ConvergenceEvent } from './daemon.spec';
import { CascadeRouter, CascadeEvent } from './cascade-router.spec';
import * as fs from 'fs/promises';
import * as path from 'path';

// ---- Test Harness ----

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.log(`  ✗ ${message}`);
    failed++;
  }
}

// ---- Temp Directory ----

const TMP_DIR = path.join(__dirname, 'tmp-int-specs');
const MAIN_SPEC = path.join(TMP_DIR, 'main.spec.md');
const DEP_SPEC = path.join(TMP_DIR, 'lib.spec.md');

// Helper: wait ms
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function setup(): Promise<void> {
  await fs.mkdir(TMP_DIR, { recursive: true });

  // Main spec that depends on lib
  await fs.writeFile(
    MAIN_SPEC,
    `---
id: "@specs/main"
version: 1.0.0
layer: 2
owned_by: pipeline
model: deepseek/deepseek-v4-flash
dependsOn:
  - "lib.spec.md"
status: draft
---
# Main Spec
The main integration spec.
`,
    'utf-8'
  );

  // Lib spec
  await fs.writeFile(
    DEP_SPEC,
    `---
id: "@specs/lib"
version: 1.0.0
layer: 1
owned_by: spec-writer
model: deepseek/deepseek-v4-flash
watch:
  files:
    - "specs/**/*.yaml"
dependsOn:
  - "@ref:specs/main"
status: draft
---
# Lib Spec
Supporting library.
`,
    'utf-8'
  );
}

async function cleanup(): Promise<void> {
  try {
    await fs.rm(TMP_DIR, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

// ========================================================================
// Integration Test
// ========================================================================

async function test_integration(): Promise<void> {
  console.log('\n--- test_integration: Daemon → CascadeRouter wiring ---');

  // Track cascade events
  const events: CascadeEvent[] = [];
  let fileChangeCount = 0;

  // Start daemon with short convergence period
  const daemon = new SpeclangDaemon(TMP_DIR, 1000);

  daemon.on('file_change', (e: FileChangeEvent) => {
    fileChangeCount++;
    console.log(`  [daemon] file_change: ${e.kind} ${path.basename(e.path)} → dependents: [${e.dependentSpecs.map((s) => path.basename(s)).join(', ')}]`);
  });

  daemon.on('started', () => {
    console.log('  [daemon] started');
  });

  // Create CascadeRouter wired to daemon
  const router = new CascadeRouter(daemon);

  router.on('cascade', (event: CascadeEvent) => {
    events.push(event);
    console.log(`  [cascade] ${event.type}: ${event.specPath} (id=${event.cascadeId})`);
  });

  // Start daemon
  await daemon.start();
  console.log('  Daemon started, waiting for indexing...');
  await wait(500);

  // Check graph has edges from indexing
  const graphSize = daemon.getGraphSize();
  console.log(`  Graph edges: ${graphSize}`);
  assert(graphSize > 0, `notification graph has ${graphSize} edges after indexing`);
  // Should be 3: main.dependsOn(1) + lib.dependsOn(1) + lib.watch(1)
  console.log(`  (Expected ~3 edges: main.dependsOn + lib.dependsOn + lib.watch)`);

  // ---- Trigger: touch lib.spec.md (the dependency) ----
  console.log('\n  Touching lib.spec.md to trigger cascade...');
  const depContent = await fs.readFile(DEP_SPEC, 'utf-8');
  await fs.writeFile(DEP_SPEC, depContent, 'utf-8');

  // Wait for squash buffer (100ms default) + processing
  console.log('  Waiting for squash → throttle → model resolution...');
  await wait(800);

  // Check that daemon detected the change
  assert(fileChangeCount >= 1, `daemon fired at least 1 file_change event (got ${fileChangeCount})`);

  // Check that cascade router processed it
  assert(events.length > 0, `cascade router emitted at least 1 event (got ${events.length})`);

  // The first event should be 'started' or 'completed' or 'error'
  const firstEvent = events[0];
  assert(
    firstEvent.type === 'started' || firstEvent.type === 'completed',
    `first cascade event type is 'started' or 'completed' (got '${firstEvent.type}')`
  );
  assert(typeof firstEvent.cascadeId === 'string' && firstEvent.cascadeId.startsWith('cascade-'), 'event has valid cascadeId');
  assert(typeof firstEvent.timestamp === 'number', 'event has timestamp');
  assert(firstEvent.cascadeId.startsWith('cascade-'), `cascadeId format: "${firstEvent.cascadeId}"`);

  console.log(`  Events received: ${events.map((e) => `${e.type}[${path.basename(e.specPath)}]`).join(', ')}`);

  // ---- Trigger: modify main.spec.md directly ----
  console.log('\n  Modifying main.spec.md to trigger second cascade...');
  const mainContent = await fs.readFile(MAIN_SPEC, 'utf-8');
  await fs.writeFile(MAIN_SPEC, mainContent.replace('status: draft', 'status: review'), 'utf-8');

  // Wait for processing
  await wait(800);

  assert(events.length >= 2, `cascade router emitted at least 2 events total (got ${events.length})`);
  console.log(`  Total events after second trigger: ${events.length}`);

  // Stop daemon
  daemon.stop();
  console.log('  [daemon] stopped');

  assert(fileChangeCount >= 2, `daemon fired at least 2 file_change events total (got ${fileChangeCount})`);
}

// ========================================================================
// Main
// ========================================================================

async function main(): Promise<void> {
  console.log('=== SpecLang Cascade Integration Test (MVP Wiring) ===\n');

  try {
    await cleanup();
    await setup();
    await test_integration();

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  } finally {
    await cleanup();
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
