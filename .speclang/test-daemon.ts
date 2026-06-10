/**
 * Tests for speclangd daemon
 * Run: npx tsx .speclang/test-daemon.ts
 */
import { parseHeader, NotificationGraph, ConvergenceDetector, SpeclangDaemon, ConvergenceEvent } from './daemon.spec.ts';
import * as fs from 'fs/promises';
import * as path from 'path';

const TMP_DIR = path.join(__dirname, 'tmp-test-daemon');
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

async function test_parseHeader(): Promise<void> {
  console.log('\n--- test_parseHeader ---');
  // Create a temporary spec file
  await fs.mkdir(TMP_DIR, { recursive: true });
  const specContent = `---
id: "test-spec"
version: 1.0.0
layer: 2
depends_on:
  - "@ref:other-spec"
status: draft
---
# Test Spec
Some content here
`;
  const specPath = path.join(TMP_DIR, 'test.spec.md');
  await fs.writeFile(specPath, specContent, 'utf-8');

  const header = await parseHeader(specPath);
  assert(header !== null, 'parseHeader returns a header object');
  assert(header!.id === 'test-spec', 'header.id is "test-spec"');
  assert(header!.version === '1.0.0', 'header.version is "1.0.0"');
  assert(header!.layer === 2, 'header.layer is 2');
  // YAML uses depends_on (snake_case); interface uses dependsOn (camelCase) — no auto-conversion
  assert((header as any)['depends_on'] !== undefined, 'header.depends_on exists in raw YAML');
  assert(Array.isArray((header as any)['depends_on']), 'header.depends_on is an array');
  assert((header as any)['depends_on'][0] === '@ref:other-spec', 'depends_on[0] matches');

  // Test no front matter
  const noSpecPath = path.join(TMP_DIR, 'no-header.md');
  await fs.writeFile(noSpecPath, 'Just plain text\n', 'utf-8');
  const noHeader = await parseHeader(noSpecPath);
  assert(noHeader === null, 'parseHeader returns null for file without front matter');

  // Cleanup
  await fs.rm(specPath);
  await fs.rm(noSpecPath);
}

async function test_NotificationGraph_addSpec(): Promise<void> {
  console.log('\n--- test_NotificationGraph_addSpec ---');
  const graph = new NotificationGraph();

  // Add a spec with depends_on
  graph.addSpec('/specs/auth.spec.md', {
    id: '@speclang/auth',
    dependsOn: ['@ref:specs/base', 'specs/shared/types.spec.md'],
    watch: { files: ['specs/**/*.yaml'] },
  });

  assert(graph.getSize() === 3, 'graph has 3 edges (2 depends_on + 1 watch)');

  // Add another spec
  graph.addSpec('/specs/main.spec.md', {
    id: '@speclang/main',
    dependsOn: ['@ref:specs/auth'],
  });

  assert(graph.getSize() === 4, 'graph has 4 edges after adding second spec');

  // Replace same spec (should remove old edges first)
  graph.addSpec('/specs/auth.spec.md', {
    id: '@speclang/auth',
    dependsOn: ['@ref:specs/base'],
  });

  assert(graph.getSize() === 2, 'graph has 2 edges after replacing auth spec');
}

async function test_NotificationGraph_getDependents(): Promise<void> {
  console.log('\n--- test_NotificationGraph_getDependents ---');
  const graph = new NotificationGraph();

  graph.addSpec('/specs/main.spec.md', {
    id: '@speclang/main',
    dependsOn: ['@ref:specs/auth', '@ref:specs/shared'],
  });

  graph.addSpec('/specs/dashboard.spec.md', {
    id: '@speclang/dashboard',
    watch: { files: ['specs/**/*.yaml'] },
  });

  // Changed file is a literal match to a depends_on ref pattern
  const deps = graph.getDependents('/specs/auth.spec.md');
  assert(deps.length === 1, 'getDependents returns 1 dependent for auth');
  assert(deps[0] === '@speclang/main', 'dependent is @speclang/main');

  // Changed file that doesn't match anything
  const noDeps = graph.getDependents('/specs/unknown.md');
  // dashboard.watch.files = 'specs/**/*.yaml' — unknown.md isn't .yaml
  assert(noDeps.length === 0, 'getDependents returns 0 for non-matching file');
}

async function test_ConvergenceDetector(): Promise<void> {
  console.log('\n--- test_ConvergenceDetector ---');
  return new Promise<void>((resolve) => {
    let convergenceCount = 0;
    const detector = new ConvergenceDetector(200, (event: ConvergenceEvent) => {
      convergenceCount++;
      assert(event.queueDepth >= 0, 'convergence event has queueDepth');
      assert(event.quietPeriodMs === 200, 'convergence event has quietPeriodMs=200');
      assert(typeof event.lastChange === 'number', 'convergence event has lastChange timestamp');
    });

    // Notify with activity
    detector.notifyActivity(3);

    // Notify again before timeout (should reset timer)
    setTimeout(() => {
      detector.notifyActivity(5);
    }, 50);

    // Wait for convergence to fire
    setTimeout(() => {
      assert(convergenceCount === 1, 'convergence fired exactly once (second notify reset the timer)');
      detector.stop();
      resolve();
    }, 500);
  });
}

async function main(): Promise<void> {
  console.log('=== Speclangd Daemon Tests ===');

  try {
    await test_parseHeader();
    await test_NotificationGraph_addSpec();
    await test_NotificationGraph_getDependents();
    await test_ConvergenceDetector();

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  } finally {
    // Cleanup
    try { await fs.rm(TMP_DIR, { recursive: true, force: true }); } catch {}
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
