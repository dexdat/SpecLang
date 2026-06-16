/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/events.spec.md
 * Generated: 2026-03-03T04:20:00.000Z
 *
 * Edit the spec, not this file.
 */
import { EventEmitter as NodeEventEmitter } from 'events';
import { FileEvent, POCError, ConvergenceEvent, TaskResult, DaemonStats } from '../types/poc.js';
/**
 * File watcher events
 */
export interface FileWatcherEvents {
    /** File changed (created/modified/deleted) */
    'change': FileEvent;
    /** File watcher error */
    'error': POCError;
    /** Watcher ready */
    'ready': void;
    /** Watcher stopped */
    'stopped': void;
}
/**
 * Convergence detector events
 */
export interface ConvergenceEvents {
    /** Cascade converged */
    'converged': ConvergenceEvent;
    /** Cascade reset (new change detected) */
    'reset': {
        timestamp: number;
    };
    /** Max depth exceeded */
    'max-depth': {
        depth: number;
        timestamp: number;
    };
    /** Timeout exceeded */
    'timeout': {
        duration: number;
        timestamp: number;
    };
}
/**
 * Agent events
 */
export interface AgentEvents {
    /** Task started */
    'task-start': {
        taskId: string;
        specId: string;
        blockId: string;
        timestamp: number;
    };
    /** Task completed */
    'task-complete': TaskResult;
    /** Task error */
    'task-error': {
        taskId: string;
        error: string;
        filePath: string;
    };
    /** All tasks complete for file */
    'file-complete': {
        filePath: string;
        generatedFiles: string[];
        timestamp: number;
    };
}
/**
 * Daemon events
 */
export interface DaemonEvents {
    /** Daemon started */
    'started': {
        timestamp: number;
        pid: number;
    };
    /** Daemon stopped */
    'stopped': {
        timestamp: number;
        uptime: number;
    };
    /** Cascade started */
    'cascade-start': {
        timestamp: number;
        cascadeId: number;
    };
    /** Cascade complete */
    'cascade-complete': ConvergenceEvent;
    /** Error occurred */
    'error': POCError;
    /** Stats updated */
    'stats': DaemonStats;
}
/**
 * Generic event emitter with typed events
 * Extends Node.js EventEmitter with type safety
 *
 * @example
 * ```typescript
 * const emitter = new TypedEventEmitter<FileWatcherEvents>();
 * emitter.on('change', (event) => console.log(event.path));
 * emitter.emit('change', { type: 'modified', path: '/test.txt', timestamp: Date.now() });
 * ```
 */
export declare class TypedEventEmitter<T extends Record<string, unknown>> extends NodeEventEmitter {
    private handlerMap;
    /**
     * Register event handler with type safety
     */
    on<K extends string>(event: K, handler: (data: T[K] extends undefined ? void : T[K]) => void): this;
    /**
     * Remove event handler with type safety
     */
    off<K extends string>(event: K, handler: (data: T[K] extends undefined ? void : T[K]) => void): this;
    /**
     * Emit event with type safety
     */
    emit<K extends string>(event: K, data: T[K] extends undefined ? void : T[K]): boolean;
    /**
     * Register one-time handler with type safety
     */
    once<K extends string>(event: K, handler: (data: T[K] extends undefined ? void : T[K]) => void): this;
    /**
     * Get listener count for an event
     */
    listenerCount<K extends string>(event: K): number;
    /**
     * Remove all listeners and clean up resources
     */
    dispose(): void;
}
//# sourceMappingURL=typed-emitter.d.ts.map