import * as fs from 'fs';
import * as path from 'path';

export interface TreeNode {
  id: string;
  layer: number;
  type: 'spec' | 'code' | 'test' | 'doc';
  filePath: string;
  dependencies: string[];
  children: TreeNode[];
}

export interface DependencyGraph {
  nodes: Map<string, TreeNode>;
  trees: Map<string, TreeNode[]>;
}

export interface CascadeState {
  cascade_id: string;
  depth: number;
  max_depth: number;
  status: 'running' | 'paused' | 'completed' | 'failed';
  trigger_file: string;
  current_agent: string;
  agents_invoked: AgentInvocation[];
  verification_results: VerificationResult[];
  depth_by_tree: Record<string, number>;
}

export interface AgentInvocation {
  agent: string;
  timestamp: string;
  result: 'success' | 'failure';
  files_modified: string[];
}

export interface VerificationResult {
  step: number;
  timestamp: string;
  checks: {
    compilation: { status: string; files_checked: number };
    references: { status: string; broken_refs: number };
    tests: { status: string; passed: number; failed: number };
  };
}

export class DependencyTracker {
  private graph: DependencyGraph;
  private indexPath: string;

  constructor(indexPath: string = '_index.json') {
    this.indexPath = indexPath;
    this.graph = { nodes: new Map(), trees: new Map() };
  }

  loadIndex(): void {
    if (!fs.existsSync(this.indexPath)) {
      throw new Error(`Index file not found: ${this.indexPath}`);
    }

    const indexData = JSON.parse(fs.readFileSync(this.indexPath, 'utf-8'));
    this.buildGraph(indexData);
  }

  private buildGraph(indexData: Record<string, unknown>): void {
    const specs = indexData.specs as Record<string, unknown> || {};
    
    for (const [specPath, specData] of Object.entries(specs)) {
      const spec = specData as Record<string, unknown>;
      const id = spec.id as string;
      const layer = spec.layer as number || 0;
      const refs = spec.depends_on as string[] || spec.refs as string[] || [];

      const type = this.determineType((spec.file as string) || specPath);
      
      const node: TreeNode = {
        id,
        layer,
        type,
        filePath: (spec.file as string) || specPath,
        dependencies: refs.map(r => r.replace('@ref:', '')),
        children: []
      };

      this.graph.nodes.set(id, node);
    }

    this.organizeIntoTrees();
  }

  private determineType(filePath: string): 'spec' | 'code' | 'test' | 'doc' {
    if (filePath.startsWith('specs/')) return 'spec';
    if (filePath.startsWith('src/')) return 'code';
    if (filePath.startsWith('tests/')) return 'test';
    if (filePath.startsWith('docs/')) return 'doc';
    return 'spec';
  }

  private organizeIntoTrees(): void {
    const treeTypes = ['spec', 'code', 'test', 'doc'];
    
    for (const type of treeTypes) {
      const nodes = Array.from(this.graph.nodes.values())
        .filter(n => n.type === type)
        .sort((a, b) => a.layer - b.layer);
      
      this.graph.trees.set(type, nodes);
    }
  }

  getDependents(specId: string): TreeNode[] {
    return Array.from(this.graph.nodes.values())
      .filter(node => node.dependencies.includes(specId));
  }

  getDependencies(specId: string): string[] {
    return this.graph.nodes.get(specId)?.dependencies || [];
  }

  getTree(type: string): TreeNode[] {
    return this.graph.trees.get(type) || [];
  }

  getNode(specId: string): TreeNode | undefined {
    return this.graph.nodes.get(specId);
  }

  getNodesByLayer(layer: number): TreeNode[] {
    return Array.from(this.graph.nodes.values())
      .filter(n => n.layer === layer);
  }

  getOrderedForCascade(triggerId: string): TreeNode[] {
    const result: TreeNode[] = [];
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const node = this.graph.nodes.get(id);
      if (!node) return;

      for (const dep of node.dependencies) {
        traverse(dep);
      }

      result.push(node);
    };

    traverse(triggerId);
    return result;
  }

  /**
   * ARCH-003: Get all nodes that depend (directly or transitively) on the
   * given triggerId. Used by the swarm to fan out from a trigger file to
   * its full dependent tree (codegen, tests, docs).
   *
   * Distinct from `getOrderedForCascade()` which walks the dependency
   * list (downstream), not the dependent list (upstream). For "a spec
   * changed — what files must regenerate?" we need dependents.
   */
  getDependentsTree(triggerId: string): TreeNode[] {
    const result: TreeNode[] = [];
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const node = this.graph.nodes.get(id);
      if (!node) return;

      // Down: follow dependencies (must be done before the trigger).
      for (const dep of node.dependencies) {
        traverse(dep);
      }

      // Up: follow dependents (the trigger's downstream cascade targets).
      const dependents = this.getDependents(id);
      for (const dep of dependents) {
        traverse(dep.id);
      }

      result.push(node);
    };

    traverse(triggerId);
    return result;
  }

  /**
   * ARCH-003: Partition an ordered node list into parallel "waves".
   *
   * Wave 0 contains all nodes whose `layer` is the minimum layer in the
   * input. Wave 1 contains the next layer up, etc. Nodes in the same wave
   * have no inter-dependencies at the layer level — they can be invoked
   * concurrently by `AgentInvoker.invokeMany()`.
   *
   * Example:
   *   Input:  [a(0), b(0), c(1), d(1), e(2)]
   *   Output: [[a, b], [c, d], [e]]
   *
   * Within a layer, original ordering is preserved (stable partition by
   * occurrence order).
   */
  partitionByDepth(nodes: TreeNode[]): TreeNode[][] {
    if (nodes.length === 0) return [];

    // Group by layer, preserving input order within each layer.
    const layerOrder: number[] = [];
    const layerMap = new Map<number, TreeNode[]>();

    for (const node of nodes) {
      if (!layerMap.has(node.layer)) {
        layerMap.set(node.layer, []);
        layerOrder.push(node.layer);
      }
      layerMap.get(node.layer)!.push(node);
    }

    // Return waves in ascending layer order (root → leaves).
    layerOrder.sort((a, b) => a - b);
    return layerOrder.map((layer) => layerMap.get(layer)!);
  }

  saveState(state: CascadeState): void {
    const stateDir = '.speclang';
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(stateDir, 'cascade_state.json'),
      JSON.stringify(state, null, 2)
    );
  }

  loadState(): CascadeState | null {
    const statePath = '.speclang/cascade_state.json';
    if (!fs.existsSync(statePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  }

  createInitialState(triggerFile: string, maxDepth: number = 5): CascadeState {
    return {
      cascade_id: `cascade-${Date.now()}`,
      depth: 0,
      max_depth: maxDepth,
      status: 'running',
      trigger_file: triggerFile,
      current_agent: '',
      agents_invoked: [],
      verification_results: [],
      depth_by_tree: { specs: 0, src: 0, tests: 0, docs: 0 }
    };
  }
}
