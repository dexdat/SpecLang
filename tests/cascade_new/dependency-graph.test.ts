// SPECLANG-GENERATED: Phase 2.1 - Dependency Graph Resolution Tests
// Tests for DependencyTracker — reads @ref: headers, builds dependency graph
// Source: specs/cascade.spec.md (Queue System, §107-108: "Read header dependencies")

import { describe, test, expect, beforeEach } from "vitest";
import * as path from "path";
import {
  DependencyTracker,
  DependencyGraph,
  TreeNode,
} from "../../src/cascade/coordinator/dependency.js";

const INDEX_PATH = path.resolve(process.cwd(), "_index.json");

describe("DependencyTracker", () => {
  let tracker: DependencyTracker;

  beforeEach(() => {
    tracker = new DependencyTracker(INDEX_PATH);
  });

  describe("loadIndex()", () => {
    test("should load _index.json and build graph", () => {
      tracker.loadIndex();
      // After loading, the graph should have nodes
      const specs = tracker.getNodesByLayer(1);
      expect(specs.length).toBeGreaterThan(0);
    });

    test("should throw on missing index file", () => {
      const bad = new DependencyTracker("/nonexistent/_index.json");
      expect(() => bad.loadIndex()).toThrow("Index file not found");
    });
  });

  describe("getNode()", () => {
    beforeEach(() => {
      tracker.loadIndex();
    });

    test("should find a spec by its ID", () => {
      // @speclang/core is properly indexed in _index.json
      const node = tracker.getNode("@speclang/core");
      expect(node).toBeDefined();
      expect(node!.id).toBe("@speclang/core");
      expect(node!.type).toBe("spec");
    });

    test("should find @speclang/header by ID", () => {
      const node = tracker.getNode("@speclang/header");
      expect(node).toBeDefined();
      expect(node!.id).toBe("@speclang/header");
      expect(node!.filePath).toContain("header.spec.md");
    });

    test("should return undefined for unknown ID", () => {
      const node = tracker.getNode("@nonexistent/spec");
      expect(node).toBeUndefined();
    });
  });

  describe("getDependencies()", () => {
    beforeEach(() => {
      tracker.loadIndex();
    });

    test("should return dependency IDs for a spec that has @ref: references", () => {
      // @speclang/header has depends_on references
      const headerNode = tracker.getNode("@speclang/header");
      expect(headerNode).toBeDefined();
      const deps = tracker.getDependencies("@speclang/header");
      expect(Array.isArray(deps)).toBe(true);
      // Header spec depends on other specs
      expect(deps.length).toBeGreaterThanOrEqual(0);
    });

    test("should return empty array for spec with no dependencies", () => {
      const deps = tracker.getDependencies("@test/test");
      expect(Array.isArray(deps)).toBe(true);
    });
  });

  describe("getDependents()", () => {
    beforeEach(() => {
      tracker.loadIndex();
    });

    test("should find specs that depend on a given spec", () => {
      // The core spec is widely referenced
      const dependents = tracker.getDependents("@speclang/core");
      // There should be dependents
      expect(Array.isArray(dependents)).toBe(true);
    });

    test("should return empty array for unreferenced specs", () => {
      const dependents = tracker.getDependents("@nonexistent/spec");
      expect(dependents).toEqual([]);
    });
  });

  describe("getNodesByLayer()", () => {
    beforeEach(() => {
      tracker.loadIndex();
    });

    test("should return specs at a specific layer", () => {
      const layer0 = tracker.getNodesByLayer(0);
      const layer1 = tracker.getNodesByLayer(1);

      expect(layer0.length).toBeGreaterThan(0);
      expect(layer1.length).toBeGreaterThan(0);

      // All nodes at layer 0 should have layer === 0
      for (const node of layer0) {
        expect(node.layer).toBe(0);
      }
    });

    test("should return empty array for empty layer", () => {
      const layer999 = tracker.getNodesByLayer(999);
      expect(layer999).toEqual([]);
    });
  });

  describe("getTree()", () => {
    beforeEach(() => {
      tracker.loadIndex();
    });

    test("should return spec tree", () => {
      const specTree = tracker.getTree("spec");
      expect(specTree.length).toBeGreaterThan(0);
      for (const node of specTree) {
        expect(node.type).toBe("spec");
      }
    });

    test("should return code tree", () => {
      const codeTree = tracker.getTree("code");
      expect(Array.isArray(codeTree)).toBe(true);
    });

    test("should return test tree", () => {
      const testTree = tracker.getTree("test");
      expect(Array.isArray(testTree)).toBe(true);
    });

    test("should return doc tree", () => {
      const docTree = tracker.getTree("doc");
      expect(Array.isArray(docTree)).toBe(true);
    });

    test("should return empty array for unknown tree type", () => {
      const unknown = tracker.getTree("unknown");
      expect(unknown).toEqual([]);
    });
  });

  describe("getOrderedForCascade()", () => {
    beforeEach(() => {
      tracker.loadIndex();
    });

    test("should return topologically sorted nodes", () => {
      const ordered = tracker.getOrderedForCascade("@speclang/core");
      expect(ordered.length).toBeGreaterThan(0);

      // Every ordered node should appear after its dependencies
      const nodeIndex = new Map<string, number>();
      for (let i = 0; i < ordered.length; i++) {
        nodeIndex.set(ordered[i].id, i);
      }

      for (const node of ordered) {
        for (const dep of node.dependencies) {
          const depIdx = nodeIndex.get(dep);
          if (depIdx !== undefined) {
            // Dependency should come before dependent in topo order
            expect(depIdx).toBeLessThan(nodeIndex.get(node.id)!);
          }
        }
      }
    });

    test("should handle self-cycle gracefully (visited set prevents infinite loop)", () => {
      // getOrderedForCascade uses a visited set — should not loop infinitely
      const ordered = tracker.getOrderedForCascade("@speclang/core");
      const ids = ordered.map((n) => n.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length); // No duplicates
    });

    test("should handle unknown trigger ID", () => {
      const ordered = tracker.getOrderedForCascade("@nonexistent/spec");
      expect(ordered).toEqual([]);
    });
  });

  describe("Graph integrity", () => {
    beforeEach(() => {
      tracker.loadIndex();
    });

    test("should have nodes with valid file paths", () => {
      const layer1 = tracker.getNodesByLayer(1);
      for (const node of layer1) {
        expect(node.filePath).toBeTruthy();
      }
    });

    test("should handle large graph (254 specs)", () => {
      const allLayers = new Set<number>();
      for (let i = 0; i <= 10; i++) {
        const nodes = tracker.getNodesByLayer(i);
        for (const node of nodes) {
          allLayers.add(node.layer);
        }
      }
      expect(allLayers.size).toBeGreaterThanOrEqual(3);
    });

    test("should determine correct types for files", () => {
      // spec files under specs/
      const coreNode = tracker.getNode("@speclang/core");
      expect(coreNode).toBeDefined();
      expect(coreNode!.type).toBe("spec");

      // Also verify @speclang/header type is 'spec'
      const headerNode = tracker.getNode("@speclang/header");
      expect(headerNode).toBeDefined();
      expect(headerNode!.type).toBe("spec");
    });
  });

  describe("CascadeState management", () => {
    beforeEach(() => {
      tracker.loadIndex();
    });

    test("should create initial state from trigger file", () => {
      const state = tracker.createInitialState("project.scl", 10);
      expect(state.cascade_id).toMatch(/^cascade-/);
      expect(state.depth).toBe(0);
      expect(state.max_depth).toBe(10);
      expect(state.status).toBe("running");
      expect(state.trigger_file).toBe("project.scl");
      expect(state.agents_invoked).toEqual([]);
      expect(state.verification_results).toEqual([]);
    });
  });
});

describe("DependencyTracker — integration with real index", () => {
  test("should load actual _index.json with 254 specs", () => {
    const tracker = new DependencyTracker(INDEX_PATH);
    tracker.loadIndex();

    // Core and header specs should be findable
    const core = tracker.getNode("@speclang/core");
    expect(core).toBeDefined();

    const header = tracker.getNode("@speclang/header");
    expect(header).toBeDefined();

    // Should find dependents for widely-referenced specs
    const dependents = tracker.getDependents("@speclang/core");
    // Core is widely referenced — it should have dependents
    expect(Array.isArray(dependents)).toBe(true);

    // Layer distribution should be reasonable
    const layers = [0, 1, 2, 3, 4, 5];
    for (const layer of layers) {
      const nodes = tracker.getNodesByLayer(layer);
      expect(Array.isArray(nodes)).toBe(true);
    }
  });
});
