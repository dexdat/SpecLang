/**
 * Unit tests for SpecLang Cascade Router components
 * Tests: CascadeIdGenerator, SquashBuffer, ThrottleController, ModelPoolResolver
 * Run: npx tsx .speclang/test-cascade-router.ts
 *
 * NOTE: These tests import only the utility classes from cascade-router.spec.ts.
 * CascadeRouter itself (which requires createAgentSession) is tested in test-integration.ts.
 */
import {
  CascadeIdGenerator,
  SquashBuffer,
  ThrottleController,
  ModelPoolResolver,
} from './cascade-router.spec';

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

// ========================================================================
// CascadeIdGenerator
// ========================================================================

function test_CascadeIdGenerator(): void {
  console.log('\n--- test_CascadeIdGenerator ---');

  const gen = new CascadeIdGenerator();

  const id1 = gen.next();
  const id2 = gen.next();
  const id3 = gen.next();

  // Format check: cascade-YYYY-MM-DD-NNN
  const pattern = /^cascade-\d{4}-\d{2}-\d{2}-\d{3}$/;
  assert(pattern.test(id1), `id1 "${id1}" matches cascade-YYYY-MM-DD-NNN format`);
  assert(pattern.test(id2), `id2 "${id2}" matches cascade-YYYY-MM-DD-NNN format`);
  assert(pattern.test(id3), `id3 "${id3}" matches cascade-YYYY-MM-DD-NNN format`);

  // Uniqueness
  assert(id1 !== id2, 'id1 and id2 are different');
  assert(id2 !== id3, 'id2 and id3 are different');

  // Sequential numbering
  const seq1 = parseInt(id1.split('-').pop()!, 10);
  const seq2 = parseInt(id2.split('-').pop()!, 10);
  const seq3 = parseInt(id3.split('-').pop()!, 10);
  assert(seq1 === 1, `first sequence number is 1 (got ${seq1})`);
  assert(seq2 === 2, `second sequence number is 2 (got ${seq2})`);
  assert(seq3 === 3, `third sequence number is 3 (got ${seq3})`);

  // Today's date in the ID
  const today = new Date().toISOString().slice(0, 10);
  assert(id1.startsWith(`cascade-${today}`), `id1 starts with today's date (${today})`);
}

// ========================================================================
// SquashBuffer
// ========================================================================

function test_SquashBuffer_pushOnce(): Promise<void> {
  console.log('\n--- test_SquashBuffer_pushOnce: single push fires after window ---');

  return new Promise<void>((resolve) => {
    const buffer = new SquashBuffer(50); // 50ms window
    let flushCount = 0;
    let flushedItem: any = null;

    buffer.push(
      { specPath: '/specs/test.spec.md', timestamp: 1000, cascadeId: 'c1', depth: 0 },
      (item) => {
        flushCount++;
        flushedItem = item;
      }
    );

    // After 100ms (double the window), flush should have fired once
    setTimeout(() => {
      assert(flushCount === 1, `flush fired ${flushCount} time(s) (expected 1)`);
      assert(flushedItem?.specPath === '/specs/test.spec.md', 'flushed item has correct specPath');
      assert(flushedItem?.cascadeId === 'c1', 'flushed item has correct cascadeId');
      resolve();
    }, 150);
  });
}

function test_SquashBuffer_pushSameTwice(): Promise<void> {
  console.log('\n--- test_SquashBuffer_pushSameTwice: same item within 100ms → only 1 flush ---');

  return new Promise<void>((resolve) => {
    const buffer = new SquashBuffer(100); // 100ms window
    let flushCount = 0;
    let flushedItems: any[] = [];

    buffer.push(
      { specPath: '/specs/auth.spec.md', timestamp: 2000, cascadeId: 'c2', depth: 0 },
      (item) => {
        flushCount++;
        flushedItems.push(item);
      }
    );

    // Push again for the same path after 30ms (within the window)
    setTimeout(() => {
      buffer.push(
        { specPath: '/specs/auth.spec.md', timestamp: 2030, cascadeId: 'c3', depth: 1 },
        (item) => {
          flushCount++;
          flushedItems.push(item);
        }
      );
    }, 30);

    // Wait for both windows to expire — only the second timer should fire
    setTimeout(() => {
      assert(flushCount === 1, `flush fired ${flushCount} time(s) (expected 1 — second push reset the timer)`);
      assert(flushedItems.length === 1, `${flushedItems.length} item(s) flushed (expected 1)`);
      // The latest version should be the one pushed second
      assert(flushedItems[0]?.cascadeId === 'c3', 'flushed item is the latest version (c3)');
      resolve();
    }, 300);
  });
}

function test_SquashBuffer_flushAll(): Promise<void> {
  console.log('\n--- test_SquashBuffer_flushAll: returns all buffered items immediately ---');

  return new Promise<void>((resolve) => {
    const buffer = new SquashBuffer(500); // Long window — won't auto-flush during test
    let flushCount = 0;

    buffer.push(
      { specPath: '/specs/a.spec.md', timestamp: 100, cascadeId: 'c1', depth: 0 },
      () => { flushCount++; }
    );
    buffer.push(
      { specPath: '/specs/b.spec.md', timestamp: 200, cascadeId: 'c2', depth: 0 },
      () => { flushCount++; }
    );
    buffer.push(
      { specPath: '/specs/c.spec.md', timestamp: 300, cascadeId: 'c3', depth: 0 },
      () => { flushCount++; }
    );

    // flushAll before any timer fires
    const items = buffer.flushAll();
    assert(items.length === 3, `flushAll returned ${items.length} items (expected 3)`);
    assert(items[0].specPath === '/specs/a.spec.md', 'first item is a.spec.md');
    assert(items[1].specPath === '/specs/b.spec.md', 'second item is b.spec.md');
    assert(items[2].specPath === '/specs/c.spec.md', 'third item is c.spec.md');
    assert(flushCount === 0, 'no auto-flush callbacks fired (timers were cancelled)');

    // After flushAll, pending timers are cancelled
    setTimeout(() => {
      assert(flushCount === 0, 'still no auto-flush callbacks after timeout');
      resolve();
    }, 100);
  });
}

// ========================================================================
// ThrottleController
// ========================================================================

function test_ThrottleController_hot(): void {
  console.log('\n--- test_ThrottleController: 3 entries → isHot returns true (threshold=3) ---');

  const throttle = new ThrottleController(3, 60); // threshold=3, window=60s

  assert(throttle.isHot('/specs/hot.spec.md') === false, 'isHot is false before any entries');

  throttle.recordQueue('/specs/hot.spec.md');
  assert(throttle.isHot('/specs/hot.spec.md') === false, 'isHot false after 1 entry (need 3)');

  throttle.recordQueue('/specs/hot.spec.md');
  assert(throttle.isHot('/specs/hot.spec.md') === false, 'isHot false after 2 entries (need 3)');

  throttle.recordQueue('/specs/hot.spec.md');
  assert(throttle.isHot('/specs/hot.spec.md') === true, 'isHot true after 3 entries (threshold reached)');
}

function test_ThrottleController_notHot(): void {
  console.log('\n--- test_ThrottleController: 2 entries → isHot returns false (threshold=3) ---');

  const throttle = new ThrottleController(3, 60); // threshold=3

  throttle.recordQueue('/specs/cool.spec.md');
  throttle.recordQueue('/specs/cool.spec.md');

  assert(throttle.isHot('/specs/cool.spec.md') === false, 'isHot false after 2 entries (threshold is 3)');
}

function test_ThrottleController_backoff(): void {
  console.log('\n--- test_ThrottleController: deferral count gives exponential backoff ---');

  const throttle = new ThrottleController(3, 60);

  // getBackoffMs formula: 1000 * Math.pow(2, deferralCount)
  // 0 deferrals → 1000ms (base; 2^0 = 1)
  const b1 = throttle.getBackoffMs('/specs/backoff.spec.md');
  assert(b1 === 1000, `backoff after 0 deferrals: ${b1}ms (expected 1000ms base)`);

  // Record 1st deferral → count=1 → 2000ms (2^1 * 1000)
  throttle.recordDeferral('/specs/backoff.spec.md');
  const b2 = throttle.getBackoffMs('/specs/backoff.spec.md');
  assert(b2 === 2000, `backoff after 1 deferral: ${b2}ms (expected 2000ms)`);

  // Record 2nd deferral → count=2 → 4000ms
  throttle.recordDeferral('/specs/backoff.spec.md');
  const b3 = throttle.getBackoffMs('/specs/backoff.spec.md');
  assert(b3 === 4000, `backoff after 2 deferrals: ${b3}ms (expected 4000ms)`);

  // Record 3rd deferral → count=3 → 8000ms
  throttle.recordDeferral('/specs/backoff.spec.md');
  const b4 = throttle.getBackoffMs('/specs/backoff.spec.md');
  assert(b4 === 8000, `backoff after 3 deferrals: ${b4}ms (expected 8000ms)`);

  // Record 3 more deferrals → count=6 → still 60000 (cap)
  throttle.recordDeferral('/specs/backoff.spec.md');
  throttle.recordDeferral('/specs/backoff.spec.md');
  throttle.recordDeferral('/specs/backoff.spec.md');
  const b5 = throttle.getBackoffMs('/specs/backoff.spec.md');
  assert(b5 === 60000, `backoff after 6 deferrals: ${b5}ms (expected 60000ms cap)`);

  // Verify deferral count = 6
  const count = throttle.getDeferralCount('/specs/backoff.spec.md');
  assert(count === 6, `deferral count: ${count} (expected 6)`);
}

// ========================================================================
// ModelPoolResolver
// ========================================================================

function test_ModelPoolResolver(): void {
  console.log('\n--- test_ModelPoolResolver: resolve based on header fields ---');

  const resolver = new ModelPoolResolver();

  // Layer 1: explicit model
  const r1 = resolver.resolve({ model: 'gpt-4', ownedBy: 'test' });
  assert(r1.model === 'gpt-4', 'resolve returns model="gpt-4" when header.model is set');
  assert(r1.pool === undefined, 'resolve does not return pool when model is set');

  // Layer 2: modelPool
  const r2 = resolver.resolve({ modelPool: 'fast-agents', ownedBy: 'test' });
  assert(r2.pool === 'fast-agents', 'resolve returns pool="fast-agents" when header.modelPool is set');
  assert(r2.model === undefined, 'resolve does not return model when only pool is set');

  // Layer 3: empty header
  const r3 = resolver.resolve({});
  assert(r3.model === undefined, 'resolve returns no model for empty header');
  assert(r3.pool === undefined, 'resolve returns no pool for empty header');

  // Model takes precedence over pool
  const r4 = resolver.resolve({ model: 'claude-opus', modelPool: 'fast-agents' });
  assert(r4.model === 'claude-opus', 'model takes precedence over modelPool');
  assert(r4.pool === undefined, 'pool is undefined when model is present');
}

// ========================================================================
// checkRateLimit
// ========================================================================

function test_ModelPoolResolver_rateLimit(): void {
  console.log('\n--- test_ModelPoolResolver: checkRateLimit returns true (stub) ---');

  const resolver = new ModelPoolResolver();

  const r1 = resolver.checkRateLimit({ maxConcurrent: 5 }, { maxConcurrent: 10 });
  assert(r1 === true, 'checkRateLimit returns true (stub implementation)');

  const r2 = resolver.checkRateLimit({}, {});
  assert(r2 === true, 'checkRateLimit returns true with empty config');
}

// ========================================================================
// Main
// ========================================================================

async function main(): Promise<void> {
  console.log('=== Cascade Router Unit Tests ===\n');

  // Synchronous tests
  test_CascadeIdGenerator();
  test_ThrottleController_hot();
  test_ThrottleController_notHot();
  test_ThrottleController_backoff();
  test_ModelPoolResolver();
  test_ModelPoolResolver_rateLimit();

  // Asynchronous tests (need timers)
  await test_SquashBuffer_pushOnce();
  await test_SquashBuffer_pushSameTwice();
  await test_SquashBuffer_flushAll();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
