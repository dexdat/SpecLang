/**
 * Debounce utility for batching rapid file events
 * 
 * Generated from: @speclang/daemon/events
 * 
 * Batches rapid file changes within a time window to prevent
 * overwhelming the system with too many events.
 */

import { EventEmitter } from 'events';
import { FileEvent, FileEventKind } from './types';

export interface DebounceOptions {
  /** Time window in milliseconds (default: 100ms) */
  windowMs: number;
  /** Maximum events to batch (default: 50) */
  maxBatchSize: number;
}

export interface BatchEvent {
  events: FileEvent[];
  timestamp: number;
}

export class Debouncer extends EventEmitter {
  private events: FileEvent[];
  private timer?: NodeJS.Timeout;
  private windowMs: number;
  private maxBatchSize: number;
  private pending: boolean;

  constructor(options: Partial<DebounceOptions> = {}) {
    super();
    this.events = [];
    this.windowMs = options.windowMs ?? 100;
    this.maxBatchSize = options.maxBatchSize ?? 50;
    this.pending = false;
  }

  /**
   * Add an event to the batch
   */
  add(event: FileEvent): void {
    // Merge events for same file (keep latest)
    const existingIndex = this.events.findIndex(e => e.path === event.path);
    if (existingIndex >= 0) {
      // Update existing event (merge create/modify/delete logic)
      const existing = this.events[existingIndex];
      
      if (event.kind === FileEventKind.Delete) {
        // If delete, mark as deleted (or remove if was create)
        if (existing.kind === FileEventKind.Create) {
          this.events.splice(existingIndex, 1);
        } else {
          this.events[existingIndex] = event;
        }
      } else {
        // Modify or Create - just update
        this.events[existingIndex] = event;
      }
    } else {
      this.events.push(event);
    }

    // Check if we should flush immediately
    if (this.events.length >= this.maxBatchSize) {
      this.flush();
    } else if (!this.pending) {
      this.pending = true;
      this.timer = setTimeout(() => this.flush(), this.windowMs);
    }
  }

  /**
   * Flush all pending events
   */
  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    if (this.events.length === 0) {
      this.pending = false;
      return;
    }

    const events = [...this.events];
    this.events = [];
    this.pending = false;

    const batchEvent: BatchEvent = {
      events,
      timestamp: Date.now(),
    };

    this.emit('batch', batchEvent);
  }

  /**
   * Get current batch size
   */
  get pendingCount(): number {
    return this.events.length;
  }

  /**
   * Check if there are pending events
   */
  get isPending(): boolean {
    return this.pending;
  }

  /**
   * Clear all pending events without emitting
   */
  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.events = [];
    this.pending = false;
  }
}
