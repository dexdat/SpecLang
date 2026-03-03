/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/integration.spec.md
 * Generated: 2026-03-03T10:54:00.000Z
 *
 * Edit the spec, not this file.
 */

import { FileWatcher } from '../daemon/poc-file-watcher';
import { EventRouter } from '../daemon/event-router';
import { SimpleAgent } from '../daemon/simple-agent';
import { ConvergenceDetector } from '../daemon/poc-convergence';
import type { FileEvent, ConvergenceEvent } from '../types/poc';

/**
 * Wire all POC components together.
 * Returns the connected components for integration testing.
 */
export function wireComponents(): {
  watcher: FileWatcher;
  router: EventRouter;
  agent: SimpleAgent;
  convergence: ConvergenceDetector;
} {
  // Create components
  const agent = new SimpleAgent();
  const router = new EventRouter(agent);
  const watcher = new FileWatcher({
    watchDir: './specs',
    ignorePatterns: ['*.tmp', '*~', '.git/**', 'node_modules/**']
  });
  const convergence = new ConvergenceDetector({
    quietPeriodMs: 5000
  });

  // Wire events
  watcher.on('change', (event: FileEvent) => {
    router.route(event).catch((error) => {
      console.error('[Wire] Failed to route event:', error);
    });
  });

  watcher.on('change', (event: FileEvent) => {
    convergence.onFileChange(event.path);
  });

  convergence.on('converged', (event: ConvergenceEvent) => {
    console.log(`✅ Cascade converged (${event.duration}ms)`);
    console.log(`   Files changed: ${event.filesChanged.length}`);
  });

  watcher.on('error', (error: Error) => {
    console.error('[Watcher Error]', error);
  });

  return { watcher, router, agent, convergence };
}

/**
 * Create a configured daemon instance.
 * For integration tests that need a full daemon.
 */
export function createDaemon() {
  const { watcher, router, agent, convergence } = wireComponents();
  return { watcher, router, agent, convergence };
}