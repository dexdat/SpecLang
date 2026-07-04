"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyTracker = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DependencyTracker {
    graph;
    indexPath;
    constructor(indexPath = '_index.json') {
        this.indexPath = indexPath;
        this.graph = { nodes: new Map(), trees: new Map() };
    }
    loadIndex() {
        if (!fs.existsSync(this.indexPath)) {
            throw new Error(`Index file not found: ${this.indexPath}`);
        }
        const indexData = JSON.parse(fs.readFileSync(this.indexPath, 'utf-8'));
        this.buildGraph(indexData);
    }
    buildGraph(indexData) {
        const specs = indexData.specs || {};
        for (const [specPath, specData] of Object.entries(specs)) {
            const spec = specData;
            const id = spec.id;
            const layer = spec.layer || 0;
            const refs = spec.depends_on || spec.refs || [];
            const type = this.determineType(spec.file || specPath);
            const node = {
                id,
                layer,
                type,
                filePath: spec.file || specPath,
                dependencies: refs.map(r => r.replace('@ref:', '')),
                children: []
            };
            this.graph.nodes.set(id, node);
        }
        this.organizeIntoTrees();
    }
    determineType(filePath) {
        if (filePath.startsWith('specs/'))
            return 'spec';
        if (filePath.startsWith('src/'))
            return 'code';
        if (filePath.startsWith('tests/'))
            return 'test';
        if (filePath.startsWith('docs/'))
            return 'doc';
        return 'spec';
    }
    organizeIntoTrees() {
        const treeTypes = ['spec', 'code', 'test', 'doc'];
        for (const type of treeTypes) {
            const nodes = Array.from(this.graph.nodes.values())
                .filter(n => n.type === type)
                .sort((a, b) => a.layer - b.layer);
            this.graph.trees.set(type, nodes);
        }
    }
    getDependents(specId) {
        return Array.from(this.graph.nodes.values())
            .filter(node => node.dependencies.includes(specId));
    }
    getDependencies(specId) {
        return this.graph.nodes.get(specId)?.dependencies || [];
    }
    getTree(type) {
        return this.graph.trees.get(type) || [];
    }
    getNode(specId) {
        return this.graph.nodes.get(specId);
    }
    getNodesByLayer(layer) {
        return Array.from(this.graph.nodes.values())
            .filter(n => n.layer === layer);
    }
    getOrderedForCascade(triggerId) {
        const result = [];
        const visited = new Set();
        const traverse = (id) => {
            if (visited.has(id))
                return;
            visited.add(id);
            const node = this.graph.nodes.get(id);
            if (!node)
                return;
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
    getDependentsTree(triggerId) {
        const result = [];
        const visited = new Set();
        const traverse = (id) => {
            if (visited.has(id))
                return;
            visited.add(id);
            const node = this.graph.nodes.get(id);
            if (!node)
                return;
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
    partitionByDepth(nodes) {
        if (nodes.length === 0)
            return [];
        // Group by layer, preserving input order within each layer.
        const layerOrder = [];
        const layerMap = new Map();
        for (const node of nodes) {
            if (!layerMap.has(node.layer)) {
                layerMap.set(node.layer, []);
                layerOrder.push(node.layer);
            }
            layerMap.get(node.layer).push(node);
        }
        // Return waves in ascending layer order (root → leaves).
        layerOrder.sort((a, b) => a - b);
        return layerOrder.map((layer) => layerMap.get(layer));
    }
    saveState(state) {
        const stateDir = '.speclang';
        if (!fs.existsSync(stateDir)) {
            fs.mkdirSync(stateDir, { recursive: true });
        }
        fs.writeFileSync(path.join(stateDir, 'cascade_state.json'), JSON.stringify(state, null, 2));
    }
    loadState() {
        const statePath = '.speclang/cascade_state.json';
        if (!fs.existsSync(statePath)) {
            return null;
        }
        return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    }
    createInitialState(triggerFile, maxDepth = 5) {
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
exports.DependencyTracker = DependencyTracker;
