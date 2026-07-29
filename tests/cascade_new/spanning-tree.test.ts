import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";
import { DepthTracker } from "../../src/cascade/depth/tracker.js";
import { CascadeDepthManager } from "../../src/cascade/depth/index.js";
import type { TreeNode } from "../../src/cascade/coordinator/dependency.js";
import path from "path";
import os from "os";

interface DependencyEdge {
  from: string;
  to: string;
}

interface SpanningTreeNode {
  id: string;
  filePath: string;
  depth: number;
  children: SpanningTreeNode[];
}

function hasGraphCycle(edges: DependencyEdge[]): boolean {
  const adjacency = new Map<string, string[]>();
  for (const e of edges) {
    if (!adjacency.has(e.from)) adjacency.set(e.from, []);
    adjacency.get(e.from)!.push(e.to);
  }

  const allNodes = new Set<string>();
  for (const e of edges) {
    allNodes.add(e.from);
    allNodes.add(e.to);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(id: string): boolean {
    if (inStack.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    inStack.add(id);
    const neighbors = adjacency.get(id) || [];
    for (const n of neighbors) {
      if (dfs(n)) return true;
    }
    inStack.delete(id);
    return false;
  }

  for (const node of allNodes) {
    if (!visited.has(node)) {
      if (dfs(node)) return true;
    }
  }
  return false;
}

function buildSpanningTree(
  rootId: string,
  edges: DependencyEdge[],
  allNodes: Map<string, TreeNode>,
): SpanningTreeNode {
  const pathStack = new Set<string>();
  const globalVisited = new Set<string>();

  function build(id: string, depth: number): SpanningTreeNode | null {
    if (pathStack.has(id)) return null;
    if (globalVisited.has(id)) return null;
    pathStack.add(id);
    globalVisited.add(id);
    const node = allNodes.get(id);
    const children = edges
      .filter((e) => e.from === id)
      .map((e) => build(e.to, depth + 1))
      .filter((c): c is SpanningTreeNode => c !== null);
    pathStack.delete(id);
    return { id, filePath: node?.filePath ?? "", depth, children };
  }
  const tree = build(rootId, 0);
  if (!tree) throw new Error("Root not found or self-loop");
  return tree;
}

function hasCycleInTree(
  node: SpanningTreeNode,
  visited: Set<string> = new Set(),
): boolean {
  if (visited.has(node.id)) return true;
  visited.add(node.id);
  for (const child of node.children) {
    if (hasCycleInTree(child, new Set(visited))) return true;
  }
  return false;
}

function hasDuplicateNodes(tree: SpanningTreeNode): boolean {
  const seen = new Set<string>();
  const flat = flattenTree(tree);
  for (const n of flat) {
    if (seen.has(n.id)) return true;
    seen.add(n.id);
  }
  return false;
}

function flattenTree(
  node: SpanningTreeNode,
  acc: SpanningTreeNode[] = [],
): SpanningTreeNode[] {
  acc.push(node);
  for (const child of node.children) {
    flattenTree(child, acc);
  }
  return acc;
}

function maxTreeDepth(node: SpanningTreeNode): number {
  if (node.children.length === 0) return node.depth;
  return Math.max(...node.children.map(maxTreeDepth));
}

describe("DepthTracker", () => {
  let tracker: DepthTracker;

  beforeEach(() => {
    tracker = new DepthTracker({ max_depth: 5, max_files_per_cascade: 10 });
  });

  test("startCascade initializes a new cascade with depth 0", () => {
    tracker.startCascade("test-1");
    const state = tracker.getState();
    expect(state).not.toBeNull();
    expect(state!.cascade_id).toBe("test-1");
    expect(state!.current_depth).toBe(0);
    expect(state!.files_changed).toBe(0);
    expect(state!.started_at).toBeInstanceOf(Date);
    expect(state!.depth_history).toEqual([]);
  });

  test("increment increases depth and files_changed", () => {
    tracker.startCascade("test-1");
    const result = tracker.increment("file-a.ts", "agent-1");
    expect(result.depth).toBe(1);
    expect(result.files_changed).toBe(1);
    const state = tracker.getState();
    expect(state!.current_depth).toBe(1);
    expect(state!.files_changed).toBe(1);
    expect(state!.depth_history).toHaveLength(1);
    expect(state!.depth_history[0].file).toBe("file-a.ts");
    expect(state!.depth_history[0].agent).toBe("agent-1");
    expect(state!.depth_history[0].depth).toBe(1);
  });

  test("increment throws if no active cascade", () => {
    expect(() => tracker.increment("f.ts", "a")).toThrow("No active cascade");
  });

  test("getDepth returns current depth via state", () => {
    tracker.startCascade("test-1");
    expect(tracker.getState()!.current_depth).toBe(0);
    tracker.increment("a.ts", "a1");
    expect(tracker.getState()!.current_depth).toBe(1);
    tracker.increment("b.ts", "a1");
    expect(tracker.getState()!.current_depth).toBe(2);
  });

  test("shouldPause when depth reaches max_depth", () => {
    const t = new DepthTracker({ max_depth: 3, max_files_per_cascade: 100 });
    t.startCascade("test-limit");
    let result = t.increment("a.ts", "a");
    expect(result.shouldPause).toBe(false);
    result = t.increment("b.ts", "a");
    expect(result.shouldPause).toBe(false);
    result = t.increment("c.ts", "a");
    expect(result.shouldPause).toBe(true);
    expect(result.warnings).toContain("Max depth reached: 3");
  });

  test("shouldPause when files_changed reaches max_files_per_cascade", () => {
    const t = new DepthTracker({ max_depth: 100, max_files_per_cascade: 3 });
    t.startCascade("test-files");
    t.increment("a.ts", "a");
    t.increment("b.ts", "a");
    let result = t.increment("c.ts", "a");
    expect(result.shouldPause).toBe(true);
    expect(result.warnings).toContain("Max files changed: 3");
  });

  test("shouldAbort when cycle checker reports true", () => {
    const t = new DepthTracker({ max_depth: 100, max_files_per_cascade: 100 });
    t.setCycleChecker(() => true);
    t.startCascade("test-cycle");
    const result = t.increment("a.ts", "a");
    expect(result.shouldAbort).toBe(true);
  });

  test("shouldAbort is false when no cycle checker is set", () => {
    tracker.startCascade("test-1");
    const result = tracker.increment("a.ts", "a");
    expect(result.shouldAbort).toBe(false);
  });

  test("reset clears state", () => {
    tracker.startCascade("test-1");
    tracker.increment("a.ts", "a");
    tracker.reset();
    expect(tracker.getState()).toBeNull();
    expect(() => tracker.increment("a.ts", "a")).toThrow("No active cascade");
  });

  test("isActive returns true after startCascade, false after reset", () => {
    expect(tracker.isActive()).toBe(false);
    tracker.startCascade("test-1");
    expect(tracker.isActive()).toBe(true);
    tracker.reset();
    expect(tracker.isActive()).toBe(false);
  });

  test("multiple increments accumulate depth and files", () => {
    tracker.startCascade("multi");
    for (let i = 1; i <= 4; i++) {
      const result = tracker.increment(`file-${i}.ts`, "agent");
      expect(result.depth).toBe(i);
      expect(result.files_changed).toBe(i);
    }
    const state = tracker.getState()!;
    expect(state.current_depth).toBe(4);
    expect(state.files_changed).toBe(4);
    expect(state.depth_history).toHaveLength(4);
  });

  test("elapsed_ms is tracked in result", () => {
    tracker.startCascade("time");
    const result = tracker.increment("a.ts", "a");
    expect(result.elapsed_ms).toBeGreaterThanOrEqual(0);
  });
});

describe("CycleDetector", () => {
  let CycleDetectorCtor: any;
  let detector: any;

  beforeEach(async () => {
    const mod = await import("../../src/cascade/depth/cycle-detection.js");
    CycleDetectorCtor = mod.CycleDetector;
    detector = new CycleDetectorCtor({ max_repeats: 3, max_pattern_length: 5 });
  });

  test("recordEdit tracks file edit counts", () => {
    detector.recordEdit("a.ts");
    expect(detector.getEditCount("a.ts")).toBe(1);
    detector.recordEdit("a.ts");
    expect(detector.getEditCount("a.ts")).toBe(2);
  });

  test("detectCycle returns hasCycle=false with no edits", () => {
    const result = detector.detectCycle();
    expect(result.hasCycle).toBe(false);
    expect(result.cycleFile).toBeNull();
    expect(result.reasons).toEqual([]);
  });

  test("detectCycle returns hasCycle=true after max_repeats edits to same file", () => {
    detector.recordEdit("a.ts");
    detector.recordEdit("a.ts");
    let result = detector.recordEdit("a.ts");
    expect(result.hasCycle).toBe(true);
    expect(result.reasons).toContain("File a.ts edited 3 times");
  });

  test("detectCycle identifies the most-edited file as cycleFile", () => {
    detector.recordEdit("a.ts");
    detector.recordEdit("b.ts");
    detector.recordEdit("a.ts");
    detector.recordEdit("b.ts");
    detector.recordEdit("a.ts");
    const result = detector.recordEdit("b.ts");
    expect(result.hasCycle).toBe(true);
    expect(result.cycleFile).toBe("a.ts");
  });

  test("findRepeatingPattern detects ABAB pattern", () => {
    const d = new CycleDetectorCtor({ max_repeats: 10, max_pattern_length: 5 });
    d.recordEdit("a.ts");
    d.recordEdit("b.ts");
    d.recordEdit("a.ts");
    d.recordEdit("b.ts");
    const result = d.recordEdit("a.ts");
    expect(result.hasCycle).toBe(true);
    expect(result.reasons.some((r) => r.startsWith("Pattern detected:"))).toBe(
      true,
    );
  });

  test("findRepeatingPattern detects longer ABCABC pattern", () => {
    const d = new CycleDetectorCtor({ max_repeats: 10, max_pattern_length: 5 });
    d.recordEdit("a.ts");
    d.recordEdit("b.ts");
    d.recordEdit("c.ts");
    d.recordEdit("a.ts");
    d.recordEdit("b.ts");
    d.recordEdit("c.ts");
    const result = d.recordEdit("a.ts");
    expect(result.hasCycle).toBe(true);
  });

  test("no false positive with similar but not repeating pattern", () => {
    const d = new CycleDetectorCtor({ max_repeats: 10, max_pattern_length: 5 });
    d.recordEdit("a.ts");
    d.recordEdit("b.ts");
    d.recordEdit("c.ts");
    d.recordEdit("d.ts");
    const result = d.recordEdit("e.ts");
    expect(result.hasCycle).toBe(false);
  });

  test("reset clears all state", () => {
    detector.recordEdit("a.ts");
    detector.recordEdit("a.ts");
    detector.recordEdit("a.ts");
    expect(detector.detectCycle().hasCycle).toBe(true);
    detector.reset();
    expect(detector.detectCycle().hasCycle).toBe(false);
    expect(detector.getEditCount("a.ts")).toBe(0);
    expect(detector.getAllEditCounts().size).toBe(0);
    expect(detector.getRecentFiles()).toEqual([]);
  });

  test("getAllEditCounts returns a copy of the map", () => {
    detector.recordEdit("a.ts");
    detector.recordEdit("b.ts");
    const counts = detector.getAllEditCounts();
    expect(counts.get("a.ts")).toBe(1);
    expect(counts.get("b.ts")).toBe(1);
    counts.set("c.ts", 99);
    expect(detector.getEditCount("c.ts")).toBe(0);
  });

  test("getRecentFiles returns files in order", () => {
    detector.recordEdit("a.ts");
    detector.recordEdit("b.ts");
    detector.recordEdit("c.ts");
    expect(detector.getRecentFiles()).toEqual(["a.ts", "b.ts", "c.ts"]);
  });

  test("checkForCycles is an alias for detectCycle", () => {
    detector.recordEdit("a.ts");
    detector.recordEdit("a.ts");
    detector.recordEdit("a.ts");
    const direct = detector.detectCycle();
    const aliased = detector.checkForCycles();
    expect(aliased.hasCycle).toBe(direct.hasCycle);
    expect(aliased.cycleFile).toBe(direct.cycleFile);
  });
});

describe("ConvergenceDetector", () => {
  let ConvergenceDetectorCtor: any;
  let convergence: any;

  beforeEach(async () => {
    vi.useFakeTimers();
    const mod = await import("../../src/cascade/depth/convergence.js");
    ConvergenceDetectorCtor = mod.ConvergenceDetector;
    convergence = new ConvergenceDetectorCtor(5000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("checkConvergence returns not converged with no activity", () => {
    const status = convergence.checkConvergence();
    expect(status.converged).toBe(false);
    expect(status.reason).toBe("no_activity");
  });

  test("checkConvergence returns not converged immediately after activity", () => {
    convergence.recordActivity();
    const status = convergence.checkConvergence();
    expect(status.converged).toBe(false);
    expect(status.reason).toBe("still_active");
  });

  test("checkConvergence returns converged after quiet period elapsed", () => {
    convergence.recordActivity();
    vi.advanceTimersByTime(5000);
    const status = convergence.checkConvergence();
    expect(status.converged).toBe(true);
    expect(status.reason).toBe("quiet_period_elapsed");
  });

  test("recordActivity resets the quiet timer", () => {
    convergence.recordActivity();
    vi.advanceTimersByTime(3000);
    convergence.recordActivity();
    vi.advanceTimersByTime(3000);
    const status = convergence.checkConvergence();
    expect(status.converged).toBe(false);
    expect(status.reason).toBe("still_active");
  });

  test("getTimeSinceLastActivity returns 0 with no activity", () => {
    expect(convergence.getTimeSinceLastActivity()).toBe(0);
  });

  test("hasActivity returns true after recordActivity", () => {
    expect(convergence.hasActivity()).toBe(false);
    convergence.recordActivity();
    expect(convergence.hasActivity()).toBe(true);
  });

  test("reset clears activity state", () => {
    convergence.recordActivity();
    convergence.reset();
    expect(convergence.hasActivity()).toBe(false);
    expect(convergence.checkConvergence().reason).toBe("no_activity");
  });

  test("setQuietPeriod changes the quiet period", () => {
    convergence.setQuietPeriod(1000);
    expect(convergence.getQuietPeriod()).toBe(1000);
    convergence.recordActivity();
    vi.advanceTimersByTime(1000);
    expect(convergence.checkConvergence().converged).toBe(true);
  });

  test("onConvergeCallback fires when convergence timer elapses", () => {
    const callback = vi.fn();
    convergence.onConvergeCallback(callback);
    convergence.recordActivity();
    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("onConvergeCallback does not fire after reset", () => {
    const callback = vi.fn();
    convergence.onConvergeCallback(callback);
    convergence.recordActivity();
    convergence.reset();
    vi.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });
});

describe("CascadeDepthManager (integration)", () => {
  let manager: CascadeDepthManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new CascadeDepthManager({
      max_depth: 5,
      max_files_per_cascade: 10,
      quiet_period_ms: 5000,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("startCascade initializes a new cascade", () => {
    manager.startCascade("cascade-1");
    const status = manager.getStatus();
    expect(status.active).toBe(true);
    expect(status.state).not.toBeNull();
    expect(status.state!.cascade_id).toBe("cascade-1");
  });

  test("onFileChange increments depth and allows changes", () => {
    manager.startCascade("cascade-1");
    const result = manager.onFileChange("file-a.ts", "agent-1");
    expect(result.allowed).toBe(true);
    expect(result.current_depth).toBe(1);
    expect(result.files_changed).toBe(1);
  });

  test("onFileChange blocks after max depth reached (depth 5, file 5 blocked)", () => {
    const m = new CascadeDepthManager({
      max_depth: 5,
      max_files_per_cascade: 100,
      quiet_period_ms: 5000,
    });
    m.startCascade("cascade-1");
    for (let i = 1; i <= 4; i++) {
      expect(m.onFileChange(`file-${i}.ts`, "a").allowed).toBe(true);
    }
    const result = m.onFileChange("file-5.ts", "a");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("limit_reached");
    expect(result.current_depth).toBe(5);
  });

  test("onFileChange detects cycles from repeated file edits", () => {
    const m = new CascadeDepthManager({
      max_depth: 100,
      max_files_per_cascade: 100,
      quiet_period_ms: 5000,
    });
    m.startCascade("cascade-1");
    expect(m.onFileChange("a.ts", "a").allowed).toBe(true);
    expect(m.onFileChange("a.ts", "a").allowed).toBe(true);
    const result = m.onFileChange("a.ts", "a");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("cycle_detected");
  });

  test("getStatus returns active=false after cascade completes", () => {
    manager.startCascade("cascade-1");
    expect(manager.getStatus().active).toBe(true);
    manager.reset();
    expect(manager.getStatus().active).toBe(false);
  });

  test("isActive reflects cascade state", () => {
    expect(manager.isActive()).toBe(false);
    manager.startCascade("cascade-1");
    expect(manager.isActive()).toBe(true);
    manager.reset();
    expect(manager.isActive()).toBe(false);
  });

  test("getCycleDetector returns the internal cycle detector", () => {
    const cd = manager.getCycleDetector();
    expect(typeof cd.recordEdit).toBe("function");
    expect(typeof cd.getEditCount).toBe("function");
    expect(typeof cd.reset).toBe("function");
    cd.recordEdit("x.ts");
    expect(cd.getEditCount("x.ts")).toBe(1);
  });

  test("getConvergenceDetector returns the internal convergence detector", () => {
    const cd = manager.getConvergenceDetector();
    expect(typeof cd.recordActivity).toBe("function");
    expect(typeof cd.checkConvergence).toBe("function");
    expect(typeof cd.reset).toBe("function");
  });

  test("setStateDir changes state persistence directory", () => {
    manager.setStateDir(path.join(os.tmpdir(), "test-speclang"));
  });

  test("reset clears all internal state", () => {
    manager.startCascade("cascade-1");
    manager.onFileChange("a.ts", "a");
    manager.reset();
    expect(manager.isActive()).toBe(false);
    const cd = manager.getCycleDetector();
    expect(cd.getRecentFiles()).toEqual([]);
  });

  test("multiple file changes across different agents work", () => {
    manager.startCascade("multi-agent");
    expect(manager.onFileChange("a.ts", "agent-alpha").allowed).toBe(true);
    expect(manager.onFileChange("b.ts", "agent-beta").allowed).toBe(true);
    expect(manager.onFileChange("c.ts", "agent-alpha").allowed).toBe(true);
    expect(manager.getStatus().state!.current_depth).toBe(3);
    expect(manager.getStatus().state!.files_changed).toBe(3);
  });

  test("convergence detection works through manager", () => {
    manager.startCascade("converge");
    manager.onFileChange("a.ts", "a");
    vi.advanceTimersByTime(5000);
    const status = manager.getStatus();
    expect(status.convergence.converged).toBe(true);
  });
});

describe("Spanning Tree Construction", () => {
  function makeNode(id: string, filePath: string): TreeNode {
    return {
      id,
      layer: 0,
      type: "spec" as const,
      filePath,
      dependencies: [],
      children: [],
    };
  }

  test("builds a tree with root as the changed file", () => {
    const nodes = new Map<string, TreeNode>();
    nodes.set("A", makeNode("A", "specs/a.spec.md"));
    nodes.set("B", makeNode("B", "specs/b.spec.md"));

    const edges: DependencyEdge[] = [{ from: "A", to: "B" }];
    const tree = buildSpanningTree("A", edges, nodes);

    expect(tree.id).toBe("A");
    expect(tree.depth).toBe(0);
    expect(tree.filePath).toBe("specs/a.spec.md");
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].id).toBe("B");
  });

  test("children are direct dependents of root", () => {
    const nodes = new Map<string, TreeNode>();
    nodes.set("A", makeNode("A", "specs/a.spec.md"));
    nodes.set("B", makeNode("B", "specs/b.spec.md"));
    nodes.set("C", makeNode("C", "specs/c.spec.md"));

    const edges: DependencyEdge[] = [
      { from: "A", to: "B" },
      { from: "A", to: "C" },
    ];
    const tree = buildSpanningTree("A", edges, nodes);

    expect(tree.children).toHaveLength(2);
    const childIds = tree.children.map((c) => c.id).sort();
    expect(childIds).toEqual(["B", "C"]);
  });

  test("depth matches tree depth from root", () => {
    const nodes = new Map<string, TreeNode>();
    nodes.set("A", makeNode("A", "specs/a.spec.md"));
    nodes.set("B", makeNode("B", "specs/b.spec.md"));
    nodes.set("C", makeNode("C", "specs/c.spec.md"));

    const edges: DependencyEdge[] = [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
    ];
    const tree = buildSpanningTree("A", edges, nodes);
    const flat = flattenTree(tree);

    expect(flat.find((n) => n.id === "A")!.depth).toBe(0);
    expect(flat.find((n) => n.id === "B")!.depth).toBe(1);
    expect(flat.find((n) => n.id === "C")!.depth).toBe(2);
    expect(maxTreeDepth(tree)).toBe(2);
  });

  test("cycle in dependency graph is detected via hasGraphCycle", () => {
    const nodes = new Map<string, TreeNode>();
    nodes.set("A", makeNode("A", "specs/a.spec.md"));
    nodes.set("B", makeNode("B", "specs/b.spec.md"));

    const edges: DependencyEdge[] = [
      { from: "A", to: "B" },
      { from: "B", to: "A" },
    ];
    const tree = buildSpanningTree("A", edges, nodes);
    expect(hasGraphCycle(edges)).toBe(true);
    expect(hasCycleInTree(tree)).toBe(false);
  });

  test("no cycle in linear dependency chain", () => {
    const nodes = new Map<string, TreeNode>();
    nodes.set("A", makeNode("A", "specs/a.spec.md"));
    nodes.set("B", makeNode("B", "specs/b.spec.md"));
    nodes.set("C", makeNode("C", "specs/c.spec.md"));

    const edges: DependencyEdge[] = [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
    ];
    const tree = buildSpanningTree("A", edges, nodes);
    expect(hasGraphCycle(edges)).toBe(false);
    expect(hasCycleInTree(tree)).toBe(false);
  });

  test("no cycle in diamond dependency graph", () => {
    const nodes = new Map<string, TreeNode>();
    nodes.set("A", makeNode("A", "specs/a.spec.md"));
    nodes.set("B", makeNode("B", "specs/b.spec.md"));
    nodes.set("C", makeNode("C", "specs/c.spec.md"));
    nodes.set("D", makeNode("D", "specs/d.spec.md"));

    const edges: DependencyEdge[] = [
      { from: "A", to: "B" },
      { from: "A", to: "C" },
      { from: "B", to: "D" },
      { from: "C", to: "D" },
    ];
    const tree = buildSpanningTree("A", edges, nodes);
    expect(hasGraphCycle(edges)).toBe(false);
    expect(hasCycleInTree(tree)).toBe(false);
    expect(hasDuplicateNodes(tree)).toBe(false);

    const flat = flattenTree(tree);
    expect(flat.map((n) => n.id)).toContain("A");
    expect(flat.map((n) => n.id)).toContain("D");
  });

  test("self-loop is detected as cycle via hasGraphCycle", () => {
    const nodes = new Map<string, TreeNode>();
    nodes.set("A", makeNode("A", "specs/a.spec.md"));

    const edges: DependencyEdge[] = [{ from: "A", to: "A" }];
    const tree = buildSpanningTree("A", edges, nodes);
    expect(hasGraphCycle(edges)).toBe(true);
    expect(hasCycleInTree(tree)).toBe(false);
  });

  test("single node tree (no edges) has depth 0 and no children", () => {
    const nodes = new Map<string, TreeNode>();
    nodes.set("A", makeNode("A", "specs/a.spec.md"));

    const tree = buildSpanningTree("A", [], nodes);
    expect(tree.id).toBe("A");
    expect(tree.depth).toBe(0);
    expect(tree.children).toEqual([]);
    expect(hasCycleInTree(tree)).toBe(false);
    expect(hasGraphCycle([])).toBe(false);
  });

  test("transitive tree: A->B->C->D has correct depths", () => {
    const nodes = new Map<string, TreeNode>();
    nodes.set("A", makeNode("A", "specs/a.spec.md"));
    nodes.set("B", makeNode("B", "specs/b.spec.md"));
    nodes.set("C", makeNode("C", "specs/c.spec.md"));
    nodes.set("D", makeNode("D", "specs/d.spec.md"));

    const edges: DependencyEdge[] = [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "D" },
    ];
    const tree = buildSpanningTree("A", edges, nodes);
    expect(maxTreeDepth(tree)).toBe(3);

    const flat = flattenTree(tree);
    expect(flat.find((n) => n.id === "A")!.depth).toBe(0);
    expect(flat.find((n) => n.id === "B")!.depth).toBe(1);
    expect(flat.find((n) => n.id === "C")!.depth).toBe(2);
    expect(flat.find((n) => n.id === "D")!.depth).toBe(3);
  });

  test("cycle detection works with depth tracker integration", async () => {
    const tracker = new DepthTracker({
      max_depth: 100,
      max_files_per_cascade: 100,
    });
    const CycleDetectorCtor = (
      await import("../../src/cascade/depth/cycle-detection.js")
    ).CycleDetector;
    const detector = new CycleDetectorCtor({
      max_repeats: 3,
      max_pattern_length: 5,
    });

    tracker.setCycleChecker(() => {
      return detector.checkForCycles().hasCycle;
    });

    tracker.startCascade("cycle-test");
    const result1 = tracker.increment("a.ts", "agent");
    expect(result1.shouldAbort).toBe(false);

    detector.recordEdit("a.ts");
    detector.recordEdit("a.ts");
    detector.recordEdit("a.ts");

    const result2 = tracker.increment("b.ts", "agent");
    expect(result2.shouldAbort).toBe(true);
  });

  test("flattenTree returns all nodes in spanning tree", () => {
    const nodes = new Map<string, TreeNode>();
    nodes.set("A", makeNode("A", "specs/a.spec.md"));
    nodes.set("B", makeNode("B", "specs/b.spec.md"));
    nodes.set("C", makeNode("C", "specs/c.spec.md"));

    const edges: DependencyEdge[] = [
      { from: "A", to: "B" },
      { from: "A", to: "C" },
    ];
    const tree = buildSpanningTree("A", edges, nodes);
    const flat = flattenTree(tree);
    expect(flat).toHaveLength(3);
    expect(flat.map((n) => n.id).sort()).toEqual(["A", "B", "C"]);
  });
});
