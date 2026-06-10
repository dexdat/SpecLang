import { createAgentSession } from '@earendil-works/pi-coding-agent';
import { SpeclangDaemon, FileChangeEvent, ConvergenceEvent, parseHeader } from './daemon.spec';

// ---- Types ----

interface CascadeItem {
  specPath: string;
  timestamp: number;
  cascadeId: string;
  depth: number;
  header?: Record<string, unknown>;
}

export interface CascadeEvent {
  type: 'started' | 'completed' | 'error';
  cascadeId: string;
  specPath: string;
  timestamp: number;
  error?: string;
}

// ---- Cascade ID Generator ----

export class CascadeIdGenerator {
  private sequence = 0;
  private today: string;

  constructor() {
    this.today = new Date().toISOString().slice(0, 10);
  }

  next(): string {
    this.sequence++;
    return `cascade-${this.today}-${String(this.sequence).padStart(3, '0')}`;
  }
}

// ---- Squash (Debounce) ----

export class SquashBuffer {
  private buffer = new Map<string, { item: CascadeItem; timer: ReturnType<typeof setTimeout> }>();
  private readonly windowMs: number;

  constructor(windowMs: number = 100) {
    this.windowMs = windowMs;
  }

  push(item: CascadeItem, onFlush: (item: CascadeItem) => void): void {
    const existing = this.buffer.get(item.specPath);
    if (existing) {
      clearTimeout(existing.timer);
      existing.item = item; // Keep latest
      existing.timer = setTimeout(() => {
        this.buffer.delete(item.specPath);
        onFlush(existing.item);
      }, this.windowMs);
    } else {
      const timer = setTimeout(() => {
        this.buffer.delete(item.specPath);
        onFlush(item);
      }, this.windowMs);
      this.buffer.set(item.specPath, { item, timer });
    }
  }

  flushAll(): CascadeItem[] {
    const items: CascadeItem[] = [];
    for (const [path, entry] of this.buffer) {
      clearTimeout(entry.timer);
      items.push(entry.item);
    }
    this.buffer.clear();
    return items;
  }
}

// ---- Throttle (Fairness Queue with Deferral) ----

export class ThrottleController {
  private queueCount = new Map<string, number[]>();
  private deferralCount = new Map<string, number>();
  private readonly hotThreshold: number;
  private readonly windowSeconds: number;

  constructor(hotThreshold: number = 5, windowSeconds: number = 60) {
    this.hotThreshold = hotThreshold;
    this.windowSeconds = windowSeconds;
  }

  isHot(specPath: string): boolean {
    this.prune(specPath);
    const count = this.queueCount.get(specPath)?.length || 0;
    return count >= this.hotThreshold;
  }

  recordQueue(specPath: string): void {
    const now = Date.now();
    const entries = this.queueCount.get(specPath) || [];
    entries.push(now);
    this.queueCount.set(specPath, entries);
  }

  recordDeferral(specPath: string): number {
    const count = (this.deferralCount.get(specPath) || 0) + 1;
    this.deferralCount.set(specPath, count);
    return count;
  }

  getDeferralCount(specPath: string): number {
    return this.deferralCount.get(specPath) || 0;
  }

  getBackoffMs(specPath: string): number {
    const deferrals = this.getDeferralCount(specPath);
    return Math.min(1000 * Math.pow(2, deferrals), 60000); // 2s, 4s, 8s, max 60s
  }

  private prune(specPath: string): void {
    const now = Date.now();
    const entries = this.queueCount.get(specPath) || [];
    const cutoff = now - this.windowSeconds * 1000;
    this.queueCount.set(specPath, entries.filter((t) => t > cutoff));
  }
}

// ---- Model Pool Resolver ----

export class ModelPoolResolver {
  resolve(header: Record<string, unknown>): { model?: string; pool?: string } {
    // Layer 1: explicit model
    if (header.model) return { model: header.model as string };

    // Layer 2: model pool
    if (header.modelPool) return { pool: header.modelPool as string };

    // Layer 3: file pattern default — resolved by caller
    return {};
  }

  checkRateLimit(
    header: Record<string, unknown>,
    poolConfig: { maxConcurrent?: number }
  ): boolean {
    const specMax = (header.maxConcurrent as number) || Infinity;
    const poolMax = poolConfig.maxConcurrent || Infinity;
    return true; // Actual check depends on running session counts
  }
}

// ---- Cascade Router ----

export class CascadeRouter {
  private daemon: SpeclangDaemon;
  private squash: SquashBuffer;
  private throttle: ThrottleController;
  private idGen: CascadeIdGenerator;
  private runningSessions = 0;
  private listeners: Array<(event: CascadeEvent) => void> = [];

  constructor(daemon: SpeclangDaemon) {
    this.daemon = daemon;
    this.squash = new SquashBuffer();
    this.throttle = new ThrottleController();
    this.idGen = new CascadeIdGenerator();
    this.modelResolver = new ModelPoolResolver();

    daemon.on('file_change', (event: FileChangeEvent) => {
      for (const spec of event.dependentSpecs) {
        this.squash.push(
          {
            specPath: spec,
            timestamp: event.timestamp,
            cascadeId: this.idGen.next(),
            depth: 0,
          },
          (item) => this.processItem(item)
        );
      }
    });
  }

  private modelResolver: ModelPoolResolver;

  on(event: 'cascade', listener: (event: CascadeEvent) => void): void {
    this.listeners.push(listener);
  }

  private emit(event: CascadeEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  private async processItem(item: CascadeItem): Promise<void> {
    // Throttle check
    this.throttle.recordQueue(item.specPath);
    if (this.throttle.isHot(item.specPath)) {
      const deferrals = this.throttle.recordDeferral(item.specPath);
      const backoff = this.throttle.getBackoffMs(item.specPath);
      if (deferrals >= 3) {
        this.emit({
          type: 'error',
          cascadeId: item.cascadeId,
          specPath: item.specPath,
          timestamp: Date.now(),
          error: `File deferred ${deferrals}x. Possible circular dependency.`,
        });
      }
      setTimeout(() => this.processItem(item), backoff);
      return;
    }

    // Resolve model
    const header = await parseHeader(item.specPath);
    const resolved = this.modelResolver.resolve(header || {});

    this.emit({
      type: 'started',
      cascadeId: item.cascadeId,
      specPath: item.specPath,
      timestamp: Date.now(),
    });

    try {
      // Spawn Pi agent session
      const { session } = await createAgentSession({
        model: resolved.model || undefined,
        tools: ['read', 'edit', 'bash', 'glob'],
      });

      await session.prompt(
        `You are the ${header?.ownedBy || 'codegen'} agent. ` +
        `Read the spec at ${item.specPath} and assemble the output. ` +
        `Cascade: ${item.cascadeId}`
      );

      session.dispose();
      this.runningSessions--;

      this.emit({
        type: 'completed',
        cascadeId: item.cascadeId,
        specPath: item.specPath,
        timestamp: Date.now(),
      });
    } catch (err) {
      this.runningSessions--;
      this.emit({
        type: 'error',
        cascadeId: item.cascadeId,
        specPath: item.specPath,
        timestamp: Date.now(),
        error: String(err),
      });
    }
  }
}