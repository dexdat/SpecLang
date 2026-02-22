/**
 * Speclang Daemon - TypeScript Simulation
 * 
 * This module simulates the Rust speclangd daemon behavior for bootstrap purposes.
 * Implements file watching, event routing, and convergence detection.
 * 
 * Generated from: @speclang/daemon (Phase 1.1 Bootstrap)
 */

export * from './types';
export * from './config';
export * from './watcher';
export * from './router';
export * from './convergence';
export * from './state';
export * from './ipc';
export { Daemon, createDaemon, getDaemon } from './daemon';
