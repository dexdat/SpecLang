import { EventEmitter } from 'events';

export interface AffectedFile {
  file_path: string;
  owning_agent: string;
  priority: number;
  dependencies: string[];
}

export interface QueueItem {
  trigger_file: string;
  timestamp: number;
  affected_files: AffectedFile[];
  depth: number;
  cascade_id: string;
}

export interface QueueContext {
  depends_on?: string[];
  children?: string[];
  imports?: string[];
  owning_agent_pattern?: (filePath: string) => string;
  priority?: number;
}

export interface QueueSystemOptions {
  max_concurrent_agents?: number;
  max_queue_depth?: number;
  default_priority?: number;
}

export interface QueueStatus {
  pending: number;
  active: number;
  completed: number;
  locked_files: string[];
  is_paused: boolean;
  max_concurrent: number;
  max_depth: number;
}

export interface ItemStartedEvent {
  cascade_id: string;
  trigger_file: string;
  affected_files: AffectedFile[];
  agent_index: number;
}

export interface ItemCompletedEvent {
  cascade_id: string;
  trigger_file: string;
  affected_files: AffectedFile[];
}

let cascadeIdCounter = 0;

function generateCascadeId(): string {
  cascadeIdCounter++;
  const date = new Date().toISOString().slice(0, 10);
  return `cascade-${date}-${String(cascadeIdCounter).padStart(3, '0')}`;
}

export function resolveTransitiveClosure(
  filePath: string,
  context: QueueContext
): AffectedFile[] {
  const affected: AffectedFile[] = [];
  const visited = new Set<string>();
  const toProcess: string[] = [filePath];

  while (toProcess.length > 0) {
    const current = toProcess.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const agent = context.owning_agent_pattern
      ? context.owning_agent_pattern(current)
      : 'default';

    const dependencies: string[] = [];
    if (context.depends_on) {
      for (const dep of context.depends_on) {
        if (!visited.has(dep)) {
          dependencies.push(dep);
          toProcess.push(dep);
        }
      }
    }
    if (context.children) {
      for (const child of context.children) {
        if (!visited.has(child)) {
          toProcess.push(child);
        }
      }
    }
    if (context.imports) {
      for (const imp of context.imports) {
        if (!visited.has(imp)) {
          toProcess.push(imp);
        }
      }
    }

    affected.push({
      file_path: current,
      owning_agent: agent,
      priority: context.priority ?? 3,
      dependencies,
    });
  }

  return affected;
}

export class QueueSystem extends EventEmitter {
  private queue: QueueItem[] = [];
  private activeCount = 0;
  private completedCount = 0;
  private fileLocks = new Set<string>();
  private activeItems = new Map<string, QueueItem>();
  private paused = false;
  private processing = false;
  private maxConcurrent: number;
  private maxDepth: number;
  private defaultPriority: number;

  constructor(options?: QueueSystemOptions) {
    super();
    this.maxConcurrent = options?.max_concurrent_agents ?? 5;
    this.maxDepth = options?.max_queue_depth ?? 100;
    this.defaultPriority = options?.default_priority ?? 3;
  }

  enqueue(
    event: { filePath: string; timestamp: number; changeType?: string },
    context: QueueContext
  ): void {
    if (this.paused) {
      this.queue.push(this.createItem(event, context));
      this.sortQueue();
      return;
    }

    if (this.queue.length >= this.maxDepth) {
      return;
    }

    const depth = (event as any).depth ?? 0;
    if (depth > this.maxDepth) {
      return;
    }

    const item = this.createItem(event, context);
    this.queue.push(item);
    this.sortQueue();

    this.scheduleProcess();
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.scheduleProcess();
  }

  getStatus(): QueueStatus {
    return {
      pending: this.queue.length,
      active: this.activeCount,
      completed: this.completedCount,
      locked_files: Array.from(this.fileLocks),
      is_paused: this.paused,
      max_concurrent: this.maxConcurrent,
      max_depth: this.maxDepth,
    };
  }

  completeItem(cascadeId: string): void {
    const item = this.activeItems.get(cascadeId);
    if (!item) return;

    this.activeItems.delete(cascadeId);
    this.activeCount--;
    this.completedCount++;

    for (const af of item.affected_files) {
      this.fileLocks.delete(af.file_path);
    }

    this.emit('item_completed', {
      cascade_id: item.cascade_id,
      trigger_file: item.trigger_file,
      affected_files: item.affected_files,
    });

    this.scheduleProcess();
  }

  private createItem(
    event: { filePath: string; timestamp: number },
    context: QueueContext
  ): QueueItem {
    const depth = (event as any).depth ?? 0;
    const affectedFiles = resolveTransitiveClosure(event.filePath, context);

    return {
      trigger_file: event.filePath,
      timestamp: event.timestamp,
      affected_files: affectedFiles,
      depth,
      cascade_id: generateCascadeId(),
    };
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      const aMaxPrio = Math.max(...a.affected_files.map(f => f.priority));
      const bMaxPrio = Math.max(...b.affected_files.map(f => f.priority));
      if (aMaxPrio !== bMaxPrio) return bMaxPrio - aMaxPrio;
      return a.timestamp - b.timestamp;
    });
  }

  private scheduleProcess(): void {
    if (this.processing) return;
    this.processing = true;
    Promise.resolve().then(() => {
      this.processing = false;
      this.processNext();
    });
  }

  private processNext(): void {
    if (this.paused) return;

    while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const idx = this.findNextAvailableItem();
      if (idx === -1) break;

      const item = this.queue.splice(idx, 1)[0];
      this.activeCount++;
      this.activeItems.set(item.cascade_id, item);

      for (const af of item.affected_files) {
        this.fileLocks.add(af.file_path);
      }

      const agentIndex = this.activeCount;

      this.emit('item_started', {
        cascade_id: item.cascade_id,
        trigger_file: item.trigger_file,
        affected_files: item.affected_files,
        agent_index: agentIndex,
      });
    }

    if (this.queue.length === 0 && this.activeCount === 0) {
      this.emit('queue_drained', { timestamp: Date.now() });
    }
  }

  private findNextAvailableItem(): number {
    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];
      const anyLocked = item.affected_files.some(
        af => this.fileLocks.has(af.file_path)
      );
      if (!anyLocked) return i;
    }
    return -1;
  }
}
