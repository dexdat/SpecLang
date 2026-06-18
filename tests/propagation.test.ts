import { describe, test, expect, beforeEach, vi } from 'vitest';
import { PropagationEngine } from '../src/cascade/propagation';
import type { TreeNode } from '../src/cascade/coordinator/dependency';

function makeNode(id: string, filePath: string, layer = 0): TreeNode {
  return { id, layer, type: 'spec', filePath, dependencies: [], children: [] };
}

describe('PropagationEngine', () => {
  let mockTracker: any;
  let mockQueue: any;
  let engine: PropagationEngine;

  beforeEach(() => {
    mockTracker = {
      loadIndex: vi.fn(),
      getNode: vi.fn(),
      getDependents: vi.fn(),
      getTree: vi.fn().mockReturnValue([]),
    };
    mockQueue = {
      enqueue: vi.fn(),
      getStatus: vi.fn(),
    };
    engine = new PropagationEngine(mockTracker, mockQueue);
  });

  test('single dependent: A has 1 dependent B', async () => {
    const a = makeNode('A', 'specs/a.spec.md');
    const b = makeNode('B', 'specs/b.spec.md');
    mockTracker.getNode.mockReturnValue(a);
    mockTracker.getDependents.mockImplementation((id: string) => {
      if (id === 'A') return [b];
      return [];
    });

    const result = await engine.propagate('specs/a.spec.md');

    expect(result.queued).toBe(1);
    expect(result.dependents).toEqual(['specs/b.spec.md']);
    expect(mockQueue.enqueue).toHaveBeenCalledTimes(1);
  });

  test('transitive chain: A→B→C transitively resolves all dependents', async () => {
    const a = makeNode('A', 'specs/a.spec.md');
    const b = makeNode('B', 'specs/b.spec.md');
    const c = makeNode('C', 'specs/c.spec.md');
    mockTracker.getNode.mockReturnValue(a);
    mockTracker.getDependents.mockImplementation((id: string) => {
      if (id === 'A') return [b];
      if (id === 'B') return [c];
      return [];
    });

    const result = await engine.propagate('specs/a.spec.md');

    expect(result.queued).toBe(2);
    expect(result.dependents).toEqual([
      'specs/b.spec.md',
      'specs/c.spec.md',
    ]);
    expect(mockQueue.enqueue).toHaveBeenCalledTimes(2);
  });

  test('file not in graph returns empty with no crash', async () => {
    mockTracker.getNode.mockReturnValue(undefined);

    const result = await engine.propagate('specs/missing.spec.md');

    expect(result.queued).toBe(0);
    expect(result.dependents).toEqual([]);
    expect(mockQueue.enqueue).not.toHaveBeenCalled();
  });

  test('no dependents returns empty result', async () => {
    const a = makeNode('A', 'specs/a.spec.md');
    mockTracker.getNode.mockReturnValue(a);
    mockTracker.getDependents.mockReturnValue([]);

    const result = await engine.propagate('specs/a.spec.md');

    expect(result.queued).toBe(0);
    expect(result.dependents).toEqual([]);
    expect(mockQueue.enqueue).not.toHaveBeenCalled();
  });

  test('depth-limited propagation stops at maxDepth', async () => {
    const a = makeNode('A', 'specs/a.spec.md');
    const b = makeNode('B', 'specs/b.spec.md');
    const c = makeNode('C', 'specs/c.spec.md');
    const d = makeNode('D', 'specs/d.spec.md');
    mockTracker.getNode.mockReturnValue(a);
    mockTracker.getDependents.mockImplementation((id: string) => {
      if (id === 'A') return [b];
      if (id === 'B') return [c];
      if (id === 'C') return [d];
      return [];
    });

    const result = await engine.propagate('specs/a.spec.md', { maxDepth: 2 });

    expect(result.queued).toBe(2);
    expect(result.dependents).toEqual([
      'specs/b.spec.md',
      'specs/c.spec.md',
    ]);
  });

  test('cycle handling does not loop infinitely', async () => {
    const a = makeNode('A', 'specs/a.spec.md');
    const b = makeNode('B', 'specs/b.spec.md');
    mockTracker.getNode.mockReturnValue(a);
    mockTracker.getDependents.mockImplementation((id: string) => {
      if (id === 'A') return [b];
      if (id === 'B') return [a];
      return [];
    });

    const result = await engine.propagate('specs/a.spec.md');

    expect(result.queued).toBe(1);
    expect(result.dependents).toEqual(['specs/b.spec.md']);
    expect(mockQueue.enqueue).toHaveBeenCalledTimes(1);
  });
});
