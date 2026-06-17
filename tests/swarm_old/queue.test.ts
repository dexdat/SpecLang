import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  QueueSystem,
  AffectedFile,
  QueueItem,
  QueueContext,
  QueueStatus,
  resolveTransitiveClosure,
} from '../../src/swarm/queue';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForEvent(
  emitter: QueueSystem,
  event: string,
  timeoutMs: number = 1000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      emitter.removeAllListeners(event);
      reject(new Error(`Timed out waiting for event "${event}"`));
    }, timeoutMs);
    emitter.once(event, (data: any) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

describe('QueueSystem', () => {
  let queue: QueueSystem;

  beforeEach(() => {
    queue = new QueueSystem();
  });

  afterEach(() => {
    queue.removeAllListeners();
  });

  describe('throttling', () => {
    it('should throttle to max_concurrent (default 5)', async () => {
      const started: string[] = [];
      queue.on('item_started', (event: any) => {
        started.push(event.cascade_id);
      });

      for (let i = 0; i < 10; i++) {
        queue.enqueue(
          { filePath: `/tmp/test-${i}.spec.md`, timestamp: Date.now() + i },
          {}
        );
      }

      await delay(50);
      expect(started.length).toBe(5);

      for (const id of started) {
        queue.completeItem(id);
      }

      await delay(50);
      expect(started.length).toBe(10);
    });

    it('should respect custom max_concurrent option', async () => {
      const queue2 = new QueueSystem({ max_concurrent_agents: 2 });
      const started: string[] = [];
      queue2.on('item_started', (event: any) => {
        started.push(event.cascade_id);
      });

      for (let i = 0; i < 6; i++) {
        queue2.enqueue(
          { filePath: `/tmp/test-${i}.spec.md`, timestamp: Date.now() + i },
          {}
        );
      }

      await delay(50);
      expect(started.length).toBe(2);

      queue2.removeAllListeners();
    });
  });

  describe('priority ordering', () => {
    it('should process high priority items first', async () => {
      const started: string[] = [];
      queue.on('item_started', (event: any) => {
        started.push(event.trigger_file);
      });

      queue.enqueue(
        { filePath: 'low.spec.md', timestamp: 100 },
        { priority: 1 }
      );
      queue.enqueue(
        { filePath: 'high.spec.md', timestamp: 200 },
        { priority: 5 }
      );
      queue.enqueue(
        { filePath: 'medium.spec.md', timestamp: 150 },
        { priority: 3 }
      );

      await delay(50);

      expect(started.length).toBe(3);
      expect(started[0]).toBe('high.spec.md');
      expect(started[1]).toBe('medium.spec.md');
      expect(started[2]).toBe('low.spec.md');
    });

    it('should use FIFO ordering for same-priority items', async () => {
      const started: string[] = [];
      queue.on('item_started', (event: any) => {
        started.push(event.trigger_file);
      });

      queue.enqueue(
        { filePath: 'first.spec.md', timestamp: 100 },
        { priority: 3 }
      );
      queue.enqueue(
        { filePath: 'second.spec.md', timestamp: 200 },
        { priority: 3 }
      );
      queue.enqueue(
        { filePath: 'third.spec.md', timestamp: 300 },
        { priority: 3 }
      );

      await delay(50);

      expect(started.length).toBe(3);
      expect(started[0]).toBe('first.spec.md');
      expect(started[1]).toBe('second.spec.md');
      expect(started[2]).toBe('third.spec.md');
    });
  });

  describe('file locks', () => {
    it('should prevent concurrent edits on the same file', async () => {
      const activeFiles: Set<string>[] = [];
      queue.on('item_started', (event: any) => {
        const files = new Set(event.affected_files.map((af: AffectedFile) => af.file_path));
        activeFiles.push(files);
      });

      queue.enqueue(
        { filePath: 'shared.spec.md', timestamp: 100 },
        { children: ['dep-a.spec.md', 'dep-b.spec.md'] }
      );

      queue.enqueue(
        { filePath: 'other.spec.md', timestamp: 200 },
        { children: ['shared.spec.md'] }
      );

      await delay(50);

      // Only 1 item starts (second blocked: shared.spec.md is locked by first)
      expect(activeFiles.length).toBe(1);
      expect(queue.getStatus().pending).toBe(1);
      expect(queue.getStatus().locked_files).toContain('shared.spec.md');
    });
  });

  describe('max depth limit', () => {
    it('should reject items beyond max depth', async () => {
      const started: string[] = [];
      queue.on('item_started', (event: any) => {
        started.push(event.cascade_id);
      });

      queue.enqueue(
        { filePath: 'deep.spec.md', timestamp: Date.now(), depth: 101 } as any,
        {}
      );

      await delay(50);
      expect(started.length).toBe(0);
      expect(queue.getStatus().pending).toBe(0);
    });

    it('should accept items within max depth', async () => {
      const started: string[] = [];
      queue.on('item_started', (event: any) => {
        started.push(event.cascade_id);
      });

      queue.enqueue(
        { filePath: 'shallow.spec.md', timestamp: Date.now(), depth: 50 } as any,
        {}
      );

      await delay(50);
      expect(started.length).toBe(1);
    });
  });

  describe('enqueue/dequeue lifecycle', () => {
    it('should enqueue and complete items correctly', async () => {
      const started: string[] = [];
      const completed: string[] = [];
      queue.on('item_started', (event: any) => started.push(event.cascade_id));
      queue.on('item_completed', (event: any) => completed.push(event.cascade_id));

      queue.enqueue(
        { filePath: 'lifecycle.spec.md', timestamp: Date.now() },
        {}
      );

      await delay(50);
      expect(started.length).toBe(1);
      expect(completed.length).toBe(0);
      expect(queue.getStatus().active).toBe(1);
      expect(queue.getStatus().pending).toBe(0);

      queue.completeItem(started[0]);

      await delay(50);
      expect(completed.length).toBe(1);
      expect(queue.getStatus().active).toBe(0);
      expect(queue.getStatus().completed).toBe(1);
    });

    it('should report status correctly', () => {
      const status = queue.getStatus();
      expect(status.max_concurrent).toBe(5);
      expect(status.max_depth).toBe(100);
      expect(status.pending).toBe(0);
      expect(status.active).toBe(0);
      expect(status.completed).toBe(0);
      expect(status.is_paused).toBe(false);
      expect(Array.isArray(status.locked_files)).toBe(true);
    });
  });

  describe('pause/resume', () => {
    it('should not process items while paused', async () => {
      const started: string[] = [];
      queue.on('item_started', (event: any) => started.push(event.cascade_id));

      queue.pause();
      expect(queue.getStatus().is_paused).toBe(true);

      queue.enqueue({ filePath: 'paused.spec.md', timestamp: Date.now() }, {});
      await delay(50);
      expect(started.length).toBe(0);
      expect(queue.getStatus().pending).toBe(1);

      queue.resume();
      expect(queue.getStatus().is_paused).toBe(false);

      await delay(50);
      expect(started.length).toBe(1);
      expect(queue.getStatus().pending).toBe(0);
    });

    it('should resume processing after pause', async () => {
      const started: string[] = [];
      queue.on('item_started', (event: any) => started.push(event.cascade_id));

      queue.pause();
      queue.enqueue({ filePath: 'resume-test.spec.md', timestamp: Date.now() }, {});
      queue.enqueue({ filePath: 'resume-test-2.spec.md', timestamp: Date.now() + 1 }, {});

      await delay(50);
      expect(started.length).toBe(0);

      queue.resume();
      await delay(50);
      // 2 items were queued while paused, both start after resume
      expect(started.length).toBe(2);
    });
  });

  describe('events', () => {
    it('should fire item_started event', async () => {
      const promise = waitForEvent(queue, 'item_started');
      queue.enqueue({ filePath: 'event-test.spec.md', timestamp: Date.now() }, {});
      const event = await promise;

      expect(event).toBeDefined();
      expect(event.cascade_id).toMatch(/^cascade-/);
      expect(event.trigger_file).toBe('event-test.spec.md');
      expect(event.agent_index).toBe(1);
    });

    it('should fire item_completed event', async () => {
      const startedPromise = waitForEvent(queue, 'item_started');
      queue.enqueue({ filePath: 'complete-test.spec.md', timestamp: Date.now() }, {});
      const startedEvent = await startedPromise;

      const completedPromise = waitForEvent(queue, 'item_completed');
      queue.completeItem(startedEvent.cascade_id);
      const completedEvent = await completedPromise;

      expect(completedEvent).toBeDefined();
      expect(completedEvent.cascade_id).toBe(startedEvent.cascade_id);
      expect(completedEvent.trigger_file).toBe('complete-test.spec.md');
    });

    it('should fire queue_drained event', async () => {
      const drainPromise = waitForEvent(queue, 'queue_drained');
      queue.enqueue({ filePath: 'drain-test.spec.md', timestamp: Date.now() }, {});

      const startPromise = waitForEvent(queue, 'item_started');
      const started = await startPromise;
      queue.completeItem(started.cascade_id);

      const drainEvent = await drainPromise;
      expect(drainEvent).toBeDefined();
    });
  });

  describe('resolveTransitiveClosure', () => {
    it('should include trigger file with default agent', () => {
      const result = resolveTransitiveClosure('test.spec.md', {});
      expect(result.length).toBe(1);
      expect(result[0].file_path).toBe('test.spec.md');
      expect(result[0].owning_agent).toBe('default');
      expect(result[0].priority).toBe(3);
    });

    it('should follow depends_on chain', () => {
      const result = resolveTransitiveClosure('main.spec.md', {
        depends_on: ['dep-a.spec.md', 'dep-b.spec.md'],
        children: ['child.spec.md'],
      });

      expect(result.length).toBe(4);
      const paths = result.map(r => r.file_path);
      expect(paths).toContain('main.spec.md');
      expect(paths).toContain('dep-a.spec.md');
      expect(paths).toContain('dep-b.spec.md');
      expect(paths).toContain('child.spec.md');
    });

    it('should assign owning agents via pattern function', () => {
      const result = resolveTransitiveClosure('parser.spec.md', {
        owning_agent_pattern: (fp) => {
          if (fp.includes('parser')) return 'parser-agent';
          if (fp.includes('codegen')) return 'codegen-agent';
          return 'default';
        },
        children: ['codegen.spec.md'],
      });

      expect(result.length).toBe(2);
      expect(result.find(r => r.file_path === 'parser.spec.md')?.owning_agent).toBe('parser-agent');
      expect(result.find(r => r.file_path === 'codegen.spec.md')?.owning_agent).toBe('codegen-agent');
    });

    it('should avoid duplicate entries via visited set', () => {
      const result = resolveTransitiveClosure('root.spec.md', {
        depends_on: ['shared.spec.md'],
        children: ['shared.spec.md'],
      });

      const rootCount = result.filter(r => r.file_path === 'root.spec.md').length;
      const sharedCount = result.filter(r => r.file_path === 'shared.spec.md').length;

      expect(rootCount).toBe(1);
      expect(sharedCount).toBe(1);
    });
  });
});
