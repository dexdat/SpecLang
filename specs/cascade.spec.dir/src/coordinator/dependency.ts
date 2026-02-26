/**
speclang-header lines:5
id: @specs/cascade
version: 1.0.0
layer: 5
 */

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
      const refs = spec.refs as string[] || [];

      const type = this.determineType(specPath);
      
      const node: TreeNode = {
        id,
        layer,
        type,
        filePath: specPath,
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
