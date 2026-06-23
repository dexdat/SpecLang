#!/usr/bin/env node
/**
 * totalstack-cascade.ts — TotalStack ↔ SpecLang bridge daemon
 *
 * Watches TotalStack's specs/aws/ directory and triggers
 * SpecLang cascades on spec changes.
 */

import { watch } from 'fs';
import { resolve } from 'path';
import { SpeclangDaemon } from './.speclang/daemon.spec.ts';
import { CascadeRouter } from './.speclang/cascade-router.spec.ts';

const WATCH_DIR = resolve('/home/kara/totalstack/specs/aws/');
const POLL_INTERVAL = 2000;

let cascadeCount = 0;

const daemon = new SpeclangDaemon(WATCH_DIR);
const router = new CascadeRouter(daemon);

console.log('[totalstack-cascade] Starting...');
console.log(`[totalstack-cascade] Model: ${process.env.CASCADE_DEFAULT_MODEL || process.env.SPECLANG_MODEL || 'gpt-4'}`);
const hasKey = !!(process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.SPECLANG_API_KEY);
console.log(`[totalstack-cascade] API key: ${hasKey ? 'PRESENT' : 'MISSING'}`);

router.on('cascade', (event) => {
  if (event.type === 'started') {
    // Cascade started — no action needed
  } else if (event.type === 'completed') {
    cascadeCount++;
    console.log(`[totalstack-cascade] ✅ Cascade ${cascadeCount} completed: ${event.specPath} (stage: ${event.stage || 'default'})`);
  } else if (event.type === 'error') {
    console.error(`[totalstack-cascade] ❌ Cascade error: ${event.error}`);
  }
});

watch(WATCH_DIR, { persistent: true, interval: POLL_INTERVAL }, (eventType, filename) => {
  if (filename && filename.endsWith('.spec.md')) {
    console.log(`[totalstack-cascade] 📝 Spec changed: ${filename}`);
    daemon.emit('file_change', {
      path: resolve(WATCH_DIR, filename),
      kind: 'modify',
      dependentSpecs: [],
      timestamp: Date.now(),
    });
  }
});

console.log('[totalstack-cascade] Polling: ON');
console.log(`[totalstack-cascade] Watching: ${WATCH_DIR}`);
console.log('[totalstack-cascade] ✅ Daemon started. Watching for spec changes...');
