# speclang-header lines:8
id: "@speclang/roadmap/poc/events"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
layer: 2
short: "Event system for POC components"
tags: [poc, events, eventemitter, communication]
---

# POC: Event System

Typed event system for component communication.

## Purpose

Provide type-safe event handling across POC components:
- FileWatcher emits file changes
- ConvergenceDetector emits convergence events
- SimpleAgent emits task completion

## EventEmitter Interface

### @poc/events/emitter

```typescript
/**
 * Generic event emitter with typed events
 */
export interface EventEmitter<T extends Record<string, unknown>> {
  /** Register event handler */
  on<K extends keyof T>(event: K, handler: (data: T[K]) => void): void;
  
  /** Remove event handler */
  off<K extends keyof T>(event: K, handler: (data: T[K]) => void): void;
  
  /** Emit event */
  emit<K extends keyof T>(event: K, data: T[K]): void;
  
  /** Register one-time handler */
  once<K extends keyof T>(event: K, handler: (data: T[K]) => void): void;
  
  /** Remove all handlers for event */
  removeAllListeners<K extends keyof T>(event?: K): void;
  
  /** Get listener count */
  listenerCount<K extends keyof T>(event: K): number;
}

/**
 * Base implementation using Node.js EventEmitter
 */
import { EventEmitter as NodeEventEmitter } from 'events';

export class TypedEventEmitter<T extends Record<string, unknown>> 
  extends NodeEventEmitter 
  implements EventEmitter<T> {
  // Map from original handlers to wrapped handlers for proper cleanup
  private handlerMap = new WeakMap<Function, Function>();
  
  on<K extends keyof T>(event: K, handler: (data: T[K]) => void): this {
    // Wrap handler with error catching
    const wrappedHandler = (data: T[K]) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[TypedEventEmitter] Uncaught error in handler for event "${String(event)}":`, error);
        // Emit error event without crashing
        super.emit('error', error);
      }
    };
    
    // Store reference to wrapped handler for off() removal
    this.handlerMap.set(handler, wrappedHandler);
    return super.on(event as string, wrappedHandler);
  }
  
  off<K extends keyof T>(event: K, handler: (data: T[K]) => void): this {
    // Remove the wrapped handler if it exists
    const wrappedHandler = this.handlerMap.get(handler) || handler;
    this.handlerMap.delete(handler);
    return super.off(event as string, wrappedHandler);
  }
  
  emit<K extends keyof T>(event: K, data: T[K]): boolean {
    // For 'error' event, emit directly without wrapping
    if (event === 'error') {
      return super.emit(event as string, data);
    }
    
    // For other events, emit safely
    try {
      return super.emit(event as string, data);
    } catch (error) {
      console.error(`[TypedEventEmitter] Error emitting event "${String(event)}":`, error);
      // Emit error event
      super.emit('error', error);
      return false;
    }
  }
  
  once<K extends keyof T>(event: K, handler: (data: T[K]) => void): this {
    // Wrap handler with error catching
    const wrappedHandler = (data: T[K]) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[TypedEventEmitter] Uncaught error in once handler for event "${String(event)}":`, error);
        super.emit('error', error);
      }
    };
    
    this.handlerMap.set(handler, wrappedHandler);
    return super.once(event as string, wrappedHandler);
  }
  
  /**
   * Remove all listeners and clean up resources
   */
  dispose(): void {
    this.removeAllListeners();
    this.handlerMap = new WeakMap();
  }
}
```

## Event Definitions

### @poc/events/file-watcher

```typescript
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
 * Usage:
 * const watcher = new FileWatcher();
 * watcher.on('change', (event) => console.log(event.path));
 * watcher.on('ready', () => console.log('Ready!'));
 */
```

### @poc/events/convergence

```typescript
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
 * Usage:
 * const detector = new ConvergenceDetector();
 * detector.on('converged', (event) => {
 *   console.log(`Converged after ${event.duration}ms`);
 * });
 */
```

### @poc/events/agent

```typescript
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
 * Usage:
 * const agent = new SimpleAgent();
 * agent.on('task-complete', (result) => {
 *   if (result.success) {
 *     console.log(`Generated: ${result.generatedFiles?.join(', ')}`);
 *   }
 * });
 */
```

### @poc/events/daemon

```typescript
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
```

## Usage Examples

### @poc/events/examples

**Basic Event Handling:**
```typescript
import { TypedEventEmitter } from './events';
import { FileWatcherEvents } from './types';

class FileWatcher extends TypedEventEmitter<FileWatcherEvents> {
  constructor() {
    super();
  }
  
  private onFileChanged(path: string) {
    this.emit('change', {
      type: 'modified',
      path,
      timestamp: Date.now()
    });
  }
  
  private onError(error: Error) {
    this.emit('error', {
      code: 'WATCH_ERROR',
      message: error.message,
      timestamp: Date.now()
    });
  }
}
```

**Chaining Events:**
```typescript
const watcher = new FileWatcher();
const agent = new SimpleAgent();
const convergence = new ConvergenceDetector();

// File change → Agent
watcher.on('change', (event) => {
  agent.process(event);
});

// File change → Convergence
watcher.on('change', (event) => {
  convergence.onFileChange(event.path);
});

// Convergence → Log
convergence.on('converged', (event) => {
  console.log(`✅ Cascade complete: ${event.duration}ms`);
});

// Agent complete → Log
agent.on('file-complete', (event) => {
  console.log(`✅ Generated: ${event.generatedFiles.length} files`);
});
```

**One-Time Handlers:**
```typescript
// Wait for ready event once
watcher.once('ready', () => {
  console.log('Watcher ready, starting processing');
  startProcessing();
});
```

**Error Handling:**
```typescript
// Global error handler
const handleError = (error: POCError) => {
  console.error(`[${error.code}] ${error.message}`);
  if (error.filePath) {
    console.error(`  File: ${error.filePath}`);
  }
};

watcher.on('error', handleError);
agent.on('task-error', (error) => {
  handleError({
    code: 'AGENT_ERROR',
    message: error.error,
    filePath: error.filePath,
    timestamp: Date.now()
  });
});
```

## Event Flow

### @poc/events/flow

```
User edits file
    ↓
[FileWatcher] detects change
    ↓
    ├─→ 'change' event → [SimpleAgent]
    │                    └─→ 'task-start'
    │                    └─→ 'task-complete'
    │                    └─→ 'file-complete'
    │
    └─→ 'change' event → [ConvergenceDetector]
                         └─→ (reset timer)
                         └─→ 'converged' (after 5s quiet)
                                   ↓
                         [Daemon] logs completion
```

## Testing

### @poc/events/testing

```typescript
import { TypedEventEmitter } from './events';

describe('Event System', () => {
  it('should emit and receive events', () => {
    const emitter = new TypedEventEmitter<{ test: string }>();
    const handler = jest.fn();
    
    emitter.on('test', handler);
    emitter.emit('test', 'hello');
    
    expect(handler).toHaveBeenCalledWith('hello');
  });
  
  it('should remove listeners', () => {
    const emitter = new TypedEventEmitter<{ test: string }>();
    const handler = jest.fn();
    
    emitter.on('test', handler);
    emitter.off('test', handler);
    emitter.emit('test', 'hello');
    
    expect(handler).not.toHaveBeenCalled();
  });
  
  it('should call once handlers only once', () => {
    const emitter = new TypedEventEmitter<{ test: string }>();
    const handler = jest.fn();
    
    emitter.once('test', handler);
    emitter.emit('test', 'first');
    emitter.emit('test', 'second');
    
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('first');
  });
  
  it('should count listeners', () => {
    const emitter = new TypedEventEmitter<{ test: string }>();
    
    expect(emitter.listenerCount('test')).toBe(0);
    
    emitter.on('test', () => {});
    expect(emitter.listenerCount('test')).toBe(1);
    
    emitter.on('test', () => {});
    expect(emitter.listenerCount('test')).toBe(2);
  });
});
```

## Implementation Details

### @poc/events/implementation

**Memory Management:**
- Always remove listeners when components unmount
- Use `once()` for one-time events to auto-cleanup
- Avoid memory leaks in long-running daemons

**Async Handlers:**
```typescript
// Async event handlers
watcher.on('change', async (event) => {
  try {
    await processFile(event.path);
  } catch (error) {
    console.error('Processing failed:', error);
  }
});
```

**Error Propagation:**
```typescript
// Errors in handlers don't stop other handlers
emitter.on('event', () => { throw new Error('Oops'); });
emitter.on('event', () => { console.log('Still runs'); });

emitter.emit('event', data); // Second handler still executes
```

**Performance:**
- Events are synchronous by default
- Use `setImmediate` for heavy processing:
```typescript
emitter.on('change', (event) => {
  setImmediate(() => {
    // Heavy processing here
  });
});
```
