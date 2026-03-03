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
/**
 * Wire all POC components together.
 * Returns the connected components for integration testing.
 */
export declare function wireComponents(): {
    watcher: FileWatcher;
    router: EventRouter;
    agent: SimpleAgent;
    convergence: ConvergenceDetector;
};
/**
 * Create a configured daemon instance.
 * For integration tests that need a full daemon.
 */
export declare function createDaemon(): {
    watcher: FileWatcher;
    router: EventRouter;
    agent: SimpleAgent;
    convergence: ConvergenceDetector;
};
//# sourceMappingURL=wire.d.ts.map