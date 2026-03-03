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

// ============================================
// Event Definitions
// ============================================

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
  'reset': { timestamp: number };
  
  /** Max depth exceeded */
  'max-depth': { depth: number; timestamp: number };
  
  /** Timeout exceeded */
  'timeout': { duration: number; timestamp: number };
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
  'started': { timestamp: number; pid: number };
  
  /** Daemon stopped */
  'stopped': { timestamp: number; uptime: number };
  
  /** Cascade started */
  'cascade-start': { timestamp: number; cascadeId: number };
  
  /** Cascade complete */
  'cascade-complete': ConvergenceEvent;
  
  /** Error occurred */
  'error': POCError;
  
  /** Stats updated */
  'stats': DaemonStats;
}

// ============================================
// TypedEventEmitter Implementation
// ============================================

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
export class TypedEventEmitter<T extends Record<string, unknown>> 
  extends NodeEventEmitter {
  // Map from original handlers to wrapped handlers for proper cleanup
  private handlerMap = new Map<Function, Function>();
  
  /**
   * Register event handler with type safety
   */
  on<K extends string>(event: K, handler: (data: T[K] extends undefined ? void : T[K]) => void): this {
    // Wrap handler with error catching
    const wrappedHandler = (data: T[K] extends undefined ? void : T[K]) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[TypedEventEmitter] Uncaught error in handler for event "${event}":`, error);
        this.emit('error', error);
      }
    };
    
    // Store reference to wrapped handler for off() removal
    this.handlerMap.set(handler, wrappedHandler);
    return super.on(event, wrappedHandler as (...args: unknown[]) => void);
  }
  
  /**
   * Remove event handler with type safety
   */
  off<K extends string>(event: K, handler: (data: T[K] extends undefined ? void : T[K]) => void): this {
    // Remove the wrapped handler if it exists
    const wrappedHandler = this.handlerMap.get(handler) || handler;
    this.handlerMap.delete(handler);
    return super.off(event, wrappedHandler as (...args: unknown[]) => void);
  }
  
  /**
   * Emit event with type safety
   */
  emit<K extends string>(event: K, data: T[K] extends undefined ? void : T[K]): boolean {
    // For 'error' event, emit directly without wrapping
    if (event === 'error') {
      return super.emit(event, data as unknown);
    }
    
    // For other events, emit safely
    try {
      return super.emit(event, data);
    } catch (error) {
      console.error(`[TypedEventEmitter] Error emitting event "${event}":`, error);
      super.emit('error', error);
      return false;
    }
  }
  
  /**
   * Register one-time handler with type safety
   */
  once<K extends string>(event: K, handler: (data: T[K] extends undefined ? void : T[K]) => void): this {
    // Wrap handler with error catching
    const wrappedHandler = (data: T[K] extends undefined ? void : T[K]) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[TypedEventEmitter] Uncaught error in once handler for event "${event}":`, error);
        this.emit('error', error);
      }
    };
    
    this.handlerMap.set(handler, wrappedHandler);
    return super.once(event, wrappedHandler as (...args: unknown[]) => void);
  }
  
  /**
   * Get listener count for an event
   */
  listenerCount<K extends string>(event: K): number {
    return super.listenerCount(event);
  }
  
  /**
   * Remove all listeners and clean up resources
   */
  dispose(): void {
    this.removeAllListeners();
    this.handlerMap.clear();
  }
}
