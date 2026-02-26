/**
speclang-header lines:5
id: @specs/cascade
version: 1.0.0
layer: 5
 */

// SPECLANG-GENERATED: @speclang/cascade/triggers
// File watcher integration for cascade triggers

import { 
  Trigger, 
  FileEvent, 
  WatchConfig, 
  FileChangeKind,
  TriggerSource 
} from './types';
import { TriggerHandler } from './handlers';
import { 
  shouldWatch, 
  shouldIgnore, 
  getTriggerSourceType,
  WATCH_PATTERNS,
  IGNORE_PATTERNS 
} from './sources';

/**
 * Default watch configuration
 */
export const DEFAULT_WATCH_CONFIG: WatchConfig = {
  watch_patterns: WATCH_PATTERNS,
  ignore_patterns: IGNORE_PATTERNS,
  debounce_ms: 100
};

/**
 * File watcher that processes file changes into triggers
 */
export class TriggerWatcher {
  private config: WatchConfig;
  private handlers: TriggerHandler[];
  private pending: Map<string, NodeJS.Timeout>;
  private onTrigger?: (trigger: Trigger) => void;
  
  constructor(
    config: Partial<WatchConfig> = {},
    handlers: TriggerHandler[] = []
  ) {
    this.config = { ...DEFAULT_WATCH_CONFIG, ...config };
    this.handlers = handlers;
    this.pending = new Map();
  }
  
  /**
   * Set callback for processed triggers
   */
  setTriggerCallback(callback: (trigger: Trigger) => void): void {
    this.onTrigger = callback;
  }
  
  /**
   * Add a handler
   */
  addHandler(handler: TriggerHandler): void {
    this.handlers.push(handler);
  }
  
  /**
   * Handle a file change event
   */
  onFileChange(event: FileEvent): void {
    const filePath = event.path;
    
    // Check ignore patterns
    if (shouldIgnore(filePath)) {
      return;
    }
    
    // Check watch patterns
    if (!shouldWatch(filePath)) {
      return;
    }
    
    // Debounce to prevent rapid-fire triggers
    this.debounce(filePath, () => {
      this.processTrigger({
        id: `trigger-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        source: getTriggerSourceType(filePath),
        file: filePath,
        kind: event.kind,
        timestamp: event.timestamp,
        priority: 'normal'
      });
    });
  }
  
  /**
   * Process a trigger through handlers
   */
  private async processTrigger(trigger: Trigger): Promise<void> {
    console.log(`[TriggerWatcher] Processing trigger: ${trigger.file} (${trigger.kind})`);
    
    for (const handler of this.handlers) {
      if (handler.canHandle(trigger)) {
        try {
          const result = await handler.handle(trigger);
          
          if (result.handled) {
            console.log(`[TriggerWatcher] Handled by ${handler.constructor.name}`, {
              cascade: result.cascadeStarted,
              agents: result.agentsInvoked
            });
            
            // Notify callback if set
            if (this.onTrigger) {
              this.onTrigger(trigger);
            }
            
            break;
          }
        } catch (error) {
          console.error(`[TriggerWatcher] Handler error:`, error);
        }
      }
    }
  }
  
  /**
   * Debounce file changes
   */
  private debounce(filePath: string, fn: () => void): void {
    if (this.pending.has(filePath)) {
      clearTimeout(this.pending.get(filePath)!);
    }
    
    this.pending.set(
      filePath,
      setTimeout(() => {
        this.pending.delete(filePath);
        fn();
      }, this.config.debounce_ms)
    );
  }
  
  /**
   * Clear all pending debounces
   */
  clearPending(): void {
    this.pending.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.pending.clear();
  }
  
  /**
   * Get current configuration
   */
  getConfig(): WatchConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<WatchConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Simulated file watcher for testing
 */
export class MockFileWatcher {
  private watcher: TriggerWatcher;
  
  constructor(watcher: TriggerWatcher) {
    this.watcher = watcher;
  }
  
  /**
   * Simulate a file change
   */
  simulateChange(path: string, kind: FileChangeKind = 'modify'): void {
    const event: FileEvent = {
      path,
      kind,
      timestamp: new Date()
    };
    
    this.watcher.onFileChange(event);
  }
  
  /**
   * Simulate multiple file changes
   */
  simulateChanges(events: Array<{ path: string; kind?: FileChangeKind }>): void {
    for (const event of events) {
      this.simulateChange(event.path, event.kind || 'modify');
    }
  }
}

/**
 * Create a watcher with default handlers
 */
export function createWatcher(
  handlers: TriggerHandler[],
  config?: Partial<WatchConfig>
): TriggerWatcher {
  return new TriggerWatcher(config, handlers);
}
