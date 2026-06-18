import { DependencyTracker, TreeNode } from './coordinator/dependency.js';
import { QueueSystem, QueueContext } from '../swarm/queue.js';

export interface PropagationResult {
  queued: number;
  dependents: string[];
}

export interface PropagationOptions {
  maxDepth?: number;
}

export class PropagationEngine {
  private tracker: DependencyTracker;
  private queue: QueueSystem;

  constructor(tracker: DependencyTracker, queue: QueueSystem) {
    this.tracker = tracker;
    this.queue = queue;
  }

  async propagate(
    changedFile: string,
    options?: PropagationOptions
  ): Promise<PropagationResult> {
    const maxDepth = options?.maxDepth ?? Infinity;

    try {
      this.tracker.loadIndex();
    } catch {
      return { queued: 0, dependents: [] };
    }

    const node = this.resolveNode(changedFile);
    if (!node) {
      return { queued: 0, dependents: [] };
    }

    const dependents = this.collectDependents(node.id, maxDepth);

    for (const dep of dependents) {
      this.queue.enqueue(
        { filePath: dep.filePath, timestamp: Date.now() },
        {
          depends_on: [changedFile],
          priority: dep.layer,
        }
      );
    }

    return {
      queued: dependents.length,
      dependents: dependents.map(d => d.filePath),
    };
  }

  private resolveNode(filePath: string): TreeNode | undefined {
    const node = this.tracker.getNode(filePath);
    if (node) return node;

    for (const type of ['spec', 'code', 'test', 'doc'] as const) {
      const tree = this.tracker.getTree(type);
      const found = tree.find(n => n.filePath === filePath);
      if (found) return found;
    }

    return undefined;
  }

  private collectDependents(nodeId: string, maxDepth: number): TreeNode[] {
    const visited = new Set<string>();
    const result: TreeNode[] = [];
    const queue: Array<{ id: string; depth: number }> = [
      { id: nodeId, depth: 0 },
    ];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;

      if (depth >= maxDepth) continue;
      if (visited.has(id)) continue;
      visited.add(id);

      const directDependents = this.tracker.getDependents(id);

      for (const dep of directDependents) {
        if (!visited.has(dep.id)) {
          result.push(dep);
          queue.push({ id: dep.id, depth: depth + 1 });
        }
      }
    }

    return result;
  }
}
