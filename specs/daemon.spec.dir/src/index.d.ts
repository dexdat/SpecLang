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
export declare function startDaemon(options: {
    projectDir: string;
    port: number;
    dashboard: boolean;
}): Promise<void>;
//# sourceMappingURL=index.d.ts.map